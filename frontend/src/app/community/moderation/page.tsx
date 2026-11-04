"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import PageShell from "@/components/PageShell";
import styles from "../u/[username]/Profile.module.css";
import mod from "./Moderation.module.css";

type Author = { id: number; username: string; displayName: string };
type Report = {
  targetType: "post" | "reply";
  targetId: number;
  reportCount: number;
  reasons: string[];
  status: "visible" | "hidden" | "removed";
  author: Author;
  excerpt: string;
};

export default function ModerationPage() {
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async () => {
    try {
      setReports(await api.get<Report[]>("/api/community/moderation/reports"));
      setError("");
    } catch (e) {
      setReports(null);
      setError(e instanceof Error ? e.message : "Could not load reports.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function resolve(r: Report, action: "remove" | "dismiss") {
    setBusy(`${r.targetType}:${r.targetId}`);
    try {
      await api.post(`/api/community/moderation/${r.targetType}/${r.targetId}/resolve`, { action });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy("");
    }
  }

  async function ban(r: Report) {
    const input = window.prompt(`Ban @${r.author.username} from Community for how many days? (0 = lift ban, max 365)`, "7");
    if (input === null) return;
    const days = Number(input);
    if (!Number.isInteger(days) || days < 0 || days > 365) {
      setError("Enter a whole number of days between 0 and 365.");
      return;
    }
    try {
      await api.post(`/api/community/moderation/users/${r.author.id}/ban`, { days });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ban failed.");
    }
  }

  return (
    <main className={styles.main}>
      <PageShell />
      <div className={styles.ambient} aria-hidden="true" />
      <div className={styles.container}>
        <Link href="/community" className={styles.back}>← Community</Link>
        <div>
          <div className={styles.eyebrow}><span className={styles.dot} /> MODERATORS ONLY</div>
          <h1 className={styles.name}>Report queue</h1>
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {!error && reports === null && <p className={styles.muted}>Loading…</p>}
        {reports && reports.length === 0 && <p className={styles.muted}>All clear. No open reports.</p>}

        {reports?.map((r) => {
          const key = `${r.targetType}:${r.targetId}`;
          return (
            <section key={key} className={styles.panel}>
              <div className={mod.row}>
                <span className={styles.postType}>{r.targetType}</span>
                <span className={mod.count}>{r.reportCount} report{r.reportCount === 1 ? "" : "s"}</span>
                <span className={`${mod.status} ${mod[r.status]}`}>{r.status}</span>
                <span className={mod.reasons}>{r.reasons.join(" · ")}</span>
              </div>
              <p className={mod.excerpt}>{r.excerpt || "(content unavailable)"}</p>
              <p className={styles.muted}>
                by <Link href={`/community/u/${r.author.username}`} className={mod.link}>@{r.author.username}</Link>
              </p>
              <div className={mod.actions}>
                <button className={mod.danger} disabled={busy === key} onClick={() => void resolve(r, "remove")}>Remove</button>
                <button className={mod.ghost} disabled={busy === key} onClick={() => void resolve(r, "dismiss")}>Dismiss</button>
                <button className={mod.ghost} onClick={() => void ban(r)}>Ban author…</button>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
