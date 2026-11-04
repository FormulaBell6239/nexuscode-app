import Link from 'next/link';
import styles from './LegalPage.module.css';

export type LegalSection = { heading: string; paras?: string[]; items?: string[] };

export default function LegalPage({ title, updated, sections }: { title: string; updated: string; sections: LegalSection[] }) {
  return (
    <main className={styles.main}>
      <div className={styles.wrap}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>Last updated: {updated}</p>
        <div className={styles.notice}>
          Beta draft: this document describes how NexusCode works today and is being finalised. It is not a substitute for legal review.
        </div>
        {sections.map((s) => (
          <section key={s.heading}>
            <h2 className={styles.h2}>{s.heading}</h2>
            {s.paras?.map((t) => <p key={t} className={styles.p}>{t}</p>)}
            {s.items && (
              <ul className={styles.ul}>
                {s.items.map((t) => <li key={t} className={styles.li}>{t}</li>)}
              </ul>
            )}
          </section>
        ))}
        <p className={styles.footer}>
          <Link href="/terms">Terms of Service</Link> · <Link href="/privacy">Privacy Policy</Link> · <Link href="/contact">Contact us</Link>
        </p>
      </div>
    </main>
  );
}
