import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../guards/jwt-auth.guard';
import { CommunityService } from './community.service';
import {
  BanUserDto,
  CreatePostDto,
  CreateReplyDto,
  ListPostsQuery,
  ReportDto,
  ResolveReportDto,
} from './community.dto';

const uid = (req: Request) => Number((req as any).user.sub);
const optionalUid = (req: Request) => {
  const sub = (req as any).user?.sub;
  return sub ? Number(sub) : undefined;
};

@Controller('community')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { ttl: 60000, limit: 120 } })
export class CommunityController {
  constructor(private readonly community: CommunityService) {}

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  notifications(@Req() req: Request) {
    return this.community.listNotifications(uid(req));
  }

  @Post('notifications/read')
  @UseGuards(JwtAuthGuard)
  readNotifications(@Req() req: Request) {
    return this.community.markNotificationsRead(uid(req));
  }

  @Get('users/:username')
  profile(@Param('username') username: string) {
    return this.community.getProfile(username);
  }

  @Get('posts')
  @UseGuards(OptionalJwtAuthGuard)
  list(@Query() query: ListPostsQuery, @Req() req: Request) {
    return this.community.listPosts(query, optionalUid(req));
  }

  @Get('posts/:id')
  @UseGuards(OptionalJwtAuthGuard)
  get(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.community.getPost(id, optionalUid(req));
  }

  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  create(@Body() dto: CreatePostDto, @Req() req: Request) {
    return this.community.createPost(uid(req), dto);
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  removePost(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.community.deletePost(uid(req), id);
  }

  @Post('posts/:id/replies')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  reply(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateReplyDto, @Req() req: Request) {
    return this.community.createReply(uid(req), id, dto);
  }

  @Delete('replies/:id')
  @UseGuards(JwtAuthGuard)
  removeReply(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.community.deleteReply(uid(req), id);
  }

  @Post('replies/:id/accept')
  @UseGuards(JwtAuthGuard)
  accept(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.community.acceptReply(uid(req), id);
  }

  @Post('posts/:id/vote')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  votePost(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.community.toggleVote(uid(req), 'post', id);
  }

  @Post('replies/:id/vote')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 30 } })
  voteReply(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.community.toggleVote(uid(req), 'reply', id);
  }

  @Post('report')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  report(@Body() dto: ReportDto, @Req() req: Request) {
    return this.community.report(uid(req), dto);
  }

  @Get('moderation/reports')
  @UseGuards(JwtAuthGuard)
  reports(@Req() req: Request) {
    return this.community.listReports(uid(req));
  }

  @Post('moderation/:type/:id/resolve')
  @UseGuards(JwtAuthGuard)
  resolve(
    @Param('type') type: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolveReportDto,
    @Req() req: Request,
  ) {
    const targetType = type === 'reply' ? 'reply' : 'post';
    return this.community.resolveReports(uid(req), targetType, id, dto);
  }

  @Post('moderation/users/:id/ban')
  @UseGuards(JwtAuthGuard)
  ban(@Param('id', ParseIntPipe) id: number, @Body() dto: BanUserDto, @Req() req: Request) {
    return this.community.banUser(uid(req), id, dto);
  }
}
