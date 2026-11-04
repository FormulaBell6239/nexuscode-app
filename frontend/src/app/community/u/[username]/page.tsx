"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageShell from "@/components/PageShell";
import styles from "./Profile.module.css";

type Author = { id: number; username: string; displayName: string; avatar: string };
type RecentPost = {
  id: number;
  type: "question" | "discussion" | "project";
  title: string;
  votes: number;
  replyCount: number;
  createdAt: string;
};
type CommunityProfile = {
  author: Author;
  joinedAt: string;
  reputation: number;
  postCount: number;
  answerCount: number;
  acceptedCount: number;
  recentPosts: RecentPost[];
};

function level(rep: number) {
  if (rep >= 1000) return "Expert";
  if (rep >= 300) return "Contributor";
  if (rep >= 50) return "Regular";
  return "Newcomer";
}

export default function CommunityProfilePage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username);
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile(null);
    setError("");
    api
      .get<CommunityProfile>(`/api/community/users/${encodeURIComponent(username)}`)
      .then(setProfile)
      .catch(() => setError("This developer could not be found."));
  }, [username]);

  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.container}>
        <Link href="/community" className={styles.back}>← Community</Link>

        {error && <p className={styles.error}>{error}</p>}
        {!error && !profile && <p className={styles.muted}>Loading…</p>}

        {profile && (
          <>
            <section className={styles.hero}>
              <div className={styles.avatar}>{profile.author.displayName.slice(0, 2).toUpperCase()}</div>
              <div>
                <div className={styles.eyebrow}><span className={styles.dot} /> {level(profile.reputation).toUpperCase()}</div>
                <h1 className={styles.name}>{profile.author.displayName}</h1>
                <p className={styles.handle}>@{profile.author.username} · joined {new Date(profile.joinedAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</p>
              </div>
            </section>

            <div className={styles.stats}>
              <div className={styles.stat}><span>{profile.reputation.toLocaleString()}</span>Reputation</div>
              <div className={styles.stat}><span>{profile.postCount}</span>Posts</div>
              <div className={styles.stat}><span>{profile.answerCount}</span>Replies</div>
              <div className={styles.stat}><span>{profile.acceptedCount}</span>Accepted answers</div>
            </div>

            <section className={styles.panel}>
              <p className={styles.label}>RECENT POSTS</p>
              {profile.recentPosts.length === 0 ? (
                <p className={styles.muted}>No posts yet.</p>
              ) : (
                profile.recentPosts.map((p) => (
                  <Link key={p.id} href="/community" className={styles.postRow}>
                    <span className={styles.postType}>{p.type}</span>
                    <span className={styles.postTitle}>{p.title}</span>
                    <span className={styles.postMeta}>▲ {p.votes} · {p.replyCount} replies</span>
                  </Link>
                ))
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
