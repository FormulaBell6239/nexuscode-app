import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, MoreThan, Repository } from 'typeorm';
import { CommunityNotification, NotificationType } from '../entities/CommunityNotification';
import { User } from '../entities/user.entity';
import { CommunityPost } from '../entities/CommunityPost';
import { CommunityReply } from '../entities/CommunityReply';
import { CommunityVote, TargetType } from '../entities/CommunityVote';
import { CommunityReport } from '../entities/CommunityReport';
import {
  BanUserDto,
  CreatePostDto,
  CreateReplyDto,
  ListPostsQuery,
  ReportDto,
  ResolveReportDto,
} from './community.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_POSTS_PER_DAY = 10;
const MAX_REPLIES_PER_DAY = 60;
const AUTO_HIDE_REPORT_THRESHOLD = 3;
const MIN_REPORTER_AGE_MS = 7 * DAY_MS;
const LINK_PATTERN = /(https?:\/\/|www\.)/i;

/* Strips control characters and normalises whitespace; content is always rendered as plain text. */
function clean(text: string): string {
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n/g, '\n')
    .trim();
}

function normaliseTags(tags: string[] = []): string[] {
  const seen = new Set<string>();
  for (const raw of tags) {
    const tag = clean(raw).toLowerCase().replace(/[^a-z0-9+#.\-]/g, '');
    if (tag) seen.add(tag.slice(0, 24));
  }
  return Array.from(seen).slice(0, 5);
}

function publicAuthor(user: User | undefined) {
  return {
    id: user?.id ?? 0,
    username: user?.username ?? 'deleted',
    displayName: user?.displayName || user?.username || 'deleted',
    avatar: user?.avatar ?? '👾',
  };
}

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(CommunityPost) private readonly posts: Repository<CommunityPost>,
    @InjectRepository(CommunityReply) private readonly replies: Repository<CommunityReply>,
    @InjectRepository(CommunityVote) private readonly votes: Repository<CommunityVote>,
    @InjectRepository(CommunityReport) private readonly reports: Repository<CommunityReport>,
    @InjectRepository(CommunityNotification) private readonly notifications: Repository<CommunityNotification>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Safety helpers ─────────────────────────────────────────────────────────

  private async getUser(userId: number): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user || !user.isActive) throw new ForbiddenException('Account unavailable.');
    return user;
  }

  private assertNotBanned(user: User) {
    if (user.communityBannedUntil && user.communityBannedUntil > new Date()) {
      throw new ForbiddenException('Your community access is temporarily suspended.');
    }
  }

  private isModerator(user: User | null | undefined): boolean {
    return user?.role === 'moderator' || user?.role === 'admin';
  }

  private async requireModerator(userId: number): Promise<User> {
    const user = await this.getUser(userId);
    if (!this.isModerator(user)) throw new ForbiddenException('Moderator access required.');
    return user;
  }

  /* New accounts cannot post links (spam control). */
  private assertLinkPolicy(user: User, ...texts: Array<string | undefined | null>) {
    const isNew = Date.now() - user.createdAt.getTime() < DAY_MS;
    if (isNew && texts.some((t) => t && LINK_PATTERN.test(t))) {
      throw new ForbiddenException('New accounts can post links after 24 hours.');
    }
  }

  private tooMany(message: string): never {
    throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
  }

  // ── Posts ──────────────────────────────────────────────────────────────────

  private serializePost(post: CommunityPost, myVote: boolean) {
    return {
      id: post.id,
      type: post.type,
      title: post.title,
      body: post.body,
      tags: post.tags,
      projectUrl: post.projectUrl,
      votes: post.votes,
      replyCount: post.replyCount,
      acceptedReplyId: post.acceptedReplyId,
      status: post.status,
      createdAt: post.createdAt,
      author: publicAuthor(post.author),
      myVote,
    };
  }

  private async votedIds(userId: number | undefined, type: TargetType, ids: number[]) {
    if (!userId || ids.length === 0) return new Set<number>();
    const rows = await this.votes
      .createQueryBuilder('v')
      .where('v.userId = :userId AND v.targetType = :type AND v.targetId IN (:...ids)', {
        userId,
        type,
        ids,
      })
      .getMany();
    return new Set(rows.map((r) => r.targetId));
  }

  async listPosts(query: ListPostsQuery, userId?: number) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.posts
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author')
      .where("p.status = 'visible'");

    switch (query.filter) {
      case 'questions':
        qb.andWhere("p.type = 'question'");
        break;
      case 'discussions':
        qb.andWhere("p.type = 'discussion'");
        break;
      case 'projects':
        qb.andWhere("p.type = 'project'");
        break;
      case 'unanswered':
        qb.andWhere("p.type = 'question' AND p.replyCount = 0");
        break;
    }

    const search = query.search?.trim();
    if (search) {
      qb.andWhere(
        "(p.title ILIKE :q OR p.body ILIKE :q OR array_to_string(p.tags, ' ') ILIKE :q)",
        { q: `%${search.replace(/[%_\\]/g, '\\$&')}%` },
      );
    }

    if (query.tag) {
      qb.andWhere(':tag = ANY(p.tags)', { tag: query.tag.toLowerCase() });
    }

    if (query.sort === 'popular') qb.orderBy('p.votes', 'DESC').addOrderBy('p.createdAt', 'DESC');
    else qb.orderBy('p.createdAt', 'DESC');

    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    const voted = await this.votedIds(userId, 'post', items.map((i) => i.id));

    return {
      items: items.map((p) => this.serializePost(p, voted.has(p.id))),
      total,
      page,
      limit,
    };
  }

  async getPost(id: number, userId?: number) {
    const post = await this.posts.findOne({ where: { id }, relations: ['author'] });
    if (!post || post.status === 'removed') throw new NotFoundException('Post not found.');

    if (post.status === 'hidden') {
      const viewer = userId ? await this.users.findOne({ where: { id: userId } }) : null;
      if (post.authorId !== userId && !this.isModerator(viewer)) {
        throw new NotFoundException('Post not found.');
      }
    }

    const replies = await this.replies.find({
      where: { postId: id, status: 'visible' },
      relations: ['author'],
      order: { isAccepted: 'DESC', votes: 'DESC', createdAt: 'ASC' },
    });
    const postVoted = await this.votedIds(userId, 'post', [id]);
    const replyVoted = await this.votedIds(userId, 'reply', replies.map((r) => r.id));

    return {
      ...this.serializePost(post, postVoted.has(id)),
      replies: replies.map((r) => ({
        id: r.id,
        parentId: r.parentId,
        body: r.body,
        votes: r.votes,
        isAccepted: r.isAccepted,
        createdAt: r.createdAt,
        author: publicAuthor(r.author),
        myVote: replyVoted.has(r.id),
      })),
    };
  }

  async createPost(userId: number, dto: CreatePostDto) {
    const user = await this.getUser(userId);
    this.assertNotBanned(user);

    const title = clean(dto.title);
    const body = clean(dto.body);
    if (title.length < 5 || body.length < 10) {
      throw new BadRequestException('Title or body is too short.');
    }
    this.assertLinkPolicy(user, title, body);

    const since = new Date(Date.now() - DAY_MS);
    const recent = await this.posts.count({ where: { authorId: userId, createdAt: MoreThan(since) } });
    if (recent >= MAX_POSTS_PER_DAY) this.tooMany('Daily post limit reached. Try again tomorrow.');

    const duplicate = await this.posts.findOne({
      where: { authorId: userId, title, createdAt: MoreThan(since) },
    });
    if (duplicate) throw new ConflictException('You already posted this recently.');

    const saved = await this.posts.save(
      this.posts.create({
        authorId: userId,
        type: dto.type,
        title,
        body,
        tags: normaliseTags(dto.tags),
        projectUrl: dto.type === 'project' ? dto.projectUrl ?? null : null,
      }),
    );
    return this.getPost(saved.id, userId);
  }

  async deletePost(userId: number, id: number) {
    const user = await this.getUser(userId);
    const post = await this.posts.findOne({ where: { id } });
    if (!post || post.status === 'removed') throw new NotFoundException('Post not found.');
    if (post.authorId !== userId && !this.isModerator(user)) {
      throw new ForbiddenException('You can only delete your own posts.');
    }
    await this.posts.update(id, { status: 'removed' });
    return { ok: true };
  }

  // ── Replies ────────────────────────────────────────────────────────────────

  async createReply(userId: number, postId: number, dto: CreateReplyDto) {
    const user = await this.getUser(userId);
    this.assertNotBanned(user);

    const post = await this.posts.findOne({ where: { id: postId } });
    if (!post || post.status !== 'visible') throw new NotFoundException('Post not found.');

    const body = clean(dto.body);
    if (body.length < 2) throw new BadRequestException('Reply is too short.');
    this.assertLinkPolicy(user, body);

    if (dto.parentId) {
      const parent = await this.replies.findOne({ where: { id: dto.parentId, postId } });
      if (!parent || parent.status !== 'visible') throw new NotFoundException('Parent reply not found.');
      if (parent.parentId) throw new BadRequestException('Replies can only be nested one level deep.');
    }

    const since = new Date(Date.now() - DAY_MS);
    const recent = await this.replies.count({ where: { authorId: userId, createdAt: MoreThan(since) } });
    if (recent >= MAX_REPLIES_PER_DAY) this.tooMany('Daily reply limit reached. Try again tomorrow.');

    const duplicate = await this.replies.findOne({
      where: { authorId: userId, postId, body, createdAt: MoreThan(since) },
    });
    if (duplicate) throw new ConflictException('You already posted this reply.');

    await this.dataSource.transaction(async (m) => {
      await m.save(
        m.create(CommunityReply, { postId, authorId: userId, parentId: dto.parentId ?? null, body }),
      );
      await m.increment(CommunityPost, { id: postId }, 'replyCount', 1);
    });
    await this.notify(post.authorId, 'reply', userId, postId);
    return this.getPost(postId, userId);
  }

  async deleteReply(userId: number, id: number) {
    const user = await this.getUser(userId);
    const reply = await this.replies.findOne({ where: { id } });
    if (!reply || reply.status === 'removed') throw new NotFoundException('Reply not found.');
    if (reply.authorId !== userId && !this.isModerator(user)) {
      throw new ForbiddenException('You can only delete your own replies.');
    }
    await this.removeReply(reply);
    return { ok: true };
  }

  private async removeReply(reply: CommunityReply) {
    await this.dataSource.transaction(async (m) => {
      await m.update(CommunityReply, reply.id, { status: 'removed', isAccepted: false });
      if (reply.status !== 'removed') await m.decrement(CommunityPost, { id: reply.postId }, 'replyCount', 1);
      await m.update(CommunityPost, { id: reply.postId, acceptedReplyId: reply.id }, { acceptedReplyId: null });
    });
  }

  async acceptReply(userId: number, replyId: number) {
    const reply = await this.replies.findOne({ where: { id: replyId } });
    if (!reply || reply.status !== 'visible') throw new NotFoundException('Reply not found.');
    const post = await this.posts.findOne({ where: { id: reply.postId } });
    if (!post || post.status !== 'visible') throw new NotFoundException('Post not found.');
    if (post.authorId !== userId) throw new ForbiddenException('Only the asker can accept an answer.');
    if (post.type !== 'question') throw new BadRequestException('Only questions have accepted answers.');

    const unaccept = post.acceptedReplyId === reply.id;
    await this.dataSource.transaction(async (m) => {
      await m.update(CommunityReply, { postId: post.id }, { isAccepted: false });
      if (!unaccept) await m.update(CommunityReply, reply.id, { isAccepted: true });
      await m.update(CommunityPost, post.id, { acceptedReplyId: unaccept ? null : reply.id });
    });
    if (!unaccept) await this.notify(reply.authorId, 'accepted', userId, post.id);
    return this.getPost(post.id, userId);
  }

  // ── Votes ──────────────────────────────────────────────────────────────────

  async toggleVote(userId: number, targetType: TargetType, targetId: number) {
    const user = await this.getUser(userId);
    this.assertNotBanned(user);

    const target =
      targetType === 'post'
        ? await this.posts.findOne({ where: { id: targetId } })
        : await this.replies.findOne({ where: { id: targetId } });
    if (!target || target.status !== 'visible') throw new NotFoundException('Not found.');
    if (target.authorId === userId) throw new ForbiddenException('You cannot vote on your own content.');

    const entity = targetType === 'post' ? CommunityPost : CommunityReply;

    const voted = await this.dataSource.transaction(async (m) => {
      const existing = await m.findOne(CommunityVote, { where: { userId, targetType, targetId } });
      if (existing) {
        await m.delete(CommunityVote, existing.id);
        await m.decrement(entity, { id: targetId }, 'votes', 1);
        return false;
      }
      await m.insert(CommunityVote, { userId, targetType, targetId });
      await m.increment(entity, { id: targetId }, 'votes', 1);
      return true;
    }).catch((err: { code?: string }) => {
      // Concurrent duplicate vote: the unique constraint already guarantees one vote per user.
      if (err.code === '23505') throw new ConflictException('Vote already recorded.');
      throw err;
    });

    const fresh = await (targetType === 'post'
      ? this.posts.findOneByOrFail({ id: targetId })
      : this.replies.findOneByOrFail({ id: targetId }));
    return { voted, votes: fresh.votes };
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  private async notify(userId: number, type: NotificationType, actorId: number, postId: number) {
    if (userId === actorId) return;
    await this.notifications.save(this.notifications.create({ userId, type, actorId, postId, readAt: null }));
  }

  async listNotifications(userId: number) {
    const rows = await this.notifications.find({ where: { userId }, order: { createdAt: 'DESC' }, take: 30 });
    const actors = rows.length ? await this.users.find({ where: { id: In([...new Set(rows.map((r) => r.actorId))]) } }) : [];
    const posts = rows.length ? await this.posts.find({ where: { id: In([...new Set(rows.map((r) => r.postId))]) } }) : [];
    const actorMap = new Map(actors.map((a) => [a.id, a]));
    const postMap = new Map(posts.map((p) => [p.id, p]));
    const items = rows
      .filter((r) => postMap.get(r.postId)?.status === 'visible')
      .map((r) => ({
        id: r.id,
        type: r.type,
        postId: r.postId,
        postTitle: postMap.get(r.postId)!.title,
        actor: publicAuthor(actorMap.get(r.actorId)),
        read: !!r.readAt,
        createdAt: r.createdAt,
      }));
    return { items, unread: items.filter((i) => !i.read).length };
  }

  async markNotificationsRead(userId: number) {
    await this.notifications.update({ userId, readAt: IsNull() }, { readAt: new Date() });
    return { ok: true };
  }

  // ── Reputation & profiles ──────────────────────────────────────────────────

  async getProfile(username: string) {
    const user = await this.users.findOne({ where: { username } });
    if (!user || !user.isActive) throw new NotFoundException('User not found.');

    const sum = async (repo: Repository<CommunityPost> | Repository<CommunityReply>, alias: string) => {
      const row = await (repo as Repository<any>)
        .createQueryBuilder(alias)
        .select(`COALESCE(SUM(${alias}.votes), 0)`, 'total')
        .where(`${alias}.authorId = :id AND ${alias}.status = 'visible'`, { id: user.id })
        .getRawOne();
      return Number(row?.total ?? 0);
    };
    const [postVotes, replyVotes, postCount, answerCount, acceptedCount] = await Promise.all([
      sum(this.posts, 'p'),
      sum(this.replies, 'r'),
      this.posts.count({ where: { authorId: user.id, status: 'visible' } }),
      this.replies.count({ where: { authorId: user.id, status: 'visible' } }),
      this.replies.count({ where: { authorId: user.id, status: 'visible', isAccepted: true } }),
    ]);
    const reputation = Math.max(0, postVotes * 5 + replyVotes * 10 + acceptedCount * 25);

    const recent = await this.posts.find({
      where: { authorId: user.id, status: 'visible' },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return {
      author: publicAuthor(user),
      joinedAt: user.createdAt,
      reputation,
      postCount,
      answerCount,
      acceptedCount,
      recentPosts: recent.map((p) => this.serializePost(p, false)),
    };
  }

  // ── Reports & moderation ───────────────────────────────────────────────────

  async report(userId: number, dto: ReportDto) {
    const user = await this.getUser(userId);
    this.assertNotBanned(user);

    const target =
      dto.targetType === 'post'
        ? await this.posts.findOne({ where: { id: dto.targetId } })
        : await this.replies.findOne({ where: { id: dto.targetId } });
    if (!target || target.status === 'removed') throw new NotFoundException('Not found.');
    if (target.authorId === userId) throw new BadRequestException('You cannot report your own content.');

    const existing = await this.reports.findOne({
      where: { reporterId: userId, targetType: dto.targetType, targetId: dto.targetId },
    });
    if (existing) throw new ConflictException('You already reported this.');

    await this.reports.save(
      this.reports.create({
        reporterId: userId,
        targetType: dto.targetType,
        targetId: dto.targetId,
        reason: dto.reason,
        details: dto.details ? clean(dto.details) : null,
      }),
    );

    // Enough independent reports hide the content until a moderator reviews it.
    // Only reporters with established accounts count, so throwaway accounts cannot hide content.
    const openReports = await this.reports.find({
      where: { targetType: dto.targetType, targetId: dto.targetId, status: 'open' },
    });
    const reporters = openReports.length
      ? await this.users.find({ where: { id: In(openReports.map((r) => r.reporterId)) } })
      : [];
    const cutoff = Date.now() - MIN_REPORTER_AGE_MS;
    const openCount = reporters.filter((u) => u.createdAt.getTime() <= cutoff).length;
    if (openCount >= AUTO_HIDE_REPORT_THRESHOLD && target.status === 'visible') {
      await this.setStatus(dto.targetType, dto.targetId, 'hidden');
    }
    return { ok: true };
  }

  private async setStatus(type: TargetType, id: number, status: 'visible' | 'hidden' | 'removed') {
    if (type === 'post') {
      await this.posts.update(id, { status });
      return;
    }
    const reply = await this.replies.findOne({ where: { id } });
    if (!reply) return;
    if (status === 'removed') await this.removeReply(reply);
    else await this.replies.update(id, { status });
  }

  async listReports(userId: number) {
    await this.requireModerator(userId);
    const open = await this.reports.find({ where: { status: 'open' }, order: { createdAt: 'ASC' }, take: 200 });

    const grouped = new Map<string, CommunityReport[]>();
    for (const r of open) {
      const key = `${r.targetType}:${r.targetId}`;
      grouped.set(key, [...(grouped.get(key) ?? []), r]);
    }

    const result = [];
    for (const [key, items] of grouped) {
      const [type, rawId] = key.split(':');
      const id = Number(rawId);
      const target =
        type === 'post'
          ? await this.posts.findOne({ where: { id }, relations: ['author'] })
          : await this.replies.findOne({ where: { id }, relations: ['author'] });
      result.push({
        targetType: type,
        targetId: id,
        reportCount: items.length,
        reasons: Array.from(new Set(items.map((i) => i.reason))),
        status: target?.status ?? 'removed',
        author: publicAuthor(target?.author),
        excerpt: target ? ('title' in target ? target.title : target.body).slice(0, 200) : '',
      });
    }
    return result;
  }

  async resolveReports(userId: number, type: TargetType, id: number, dto: ResolveReportDto) {
    await this.requireModerator(userId);
    const target =
      type === 'post'
        ? await this.posts.findOne({ where: { id } })
        : await this.replies.findOne({ where: { id } });
    if (!target) throw new NotFoundException('Not found.');
    if (dto.action === 'remove') {
      if (target.status !== 'removed') await this.setStatus(type, id, 'removed');
    } else if (target.status === 'hidden') {
      // Dismissing only restores auto-hidden content; removed content stays removed.
      await this.setStatus(type, id, 'visible');
    }

    await this.reports.update(
      { targetType: type, targetId: id, status: 'open' },
      { status: dto.action === 'remove' ? 'actioned' : 'dismissed' },
    );
    return { ok: true };
  }

  async banUser(moderatorId: number, targetUserId: number, dto: BanUserDto) {
    await this.requireModerator(moderatorId);
    const target = await this.users.findOne({ where: { id: targetUserId } });
    if (!target) throw new NotFoundException('User not found.');
    if (this.isModerator(target)) throw new ForbiddenException('Cannot ban a moderator.');
    await this.users.update(targetUserId, {
      communityBannedUntil: dto.days === 0 ? null : new Date(Date.now() + dto.days * DAY_MS),
    });
    return { ok: true };
  }
}
