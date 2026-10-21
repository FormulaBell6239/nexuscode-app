import React from "react";
import styles from "./RewardPopup.module.css";

interface RewardPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
  eyebrow?: string;
  reward?: string;
  tone?: 'web' | 'python' | 'sql' | 'typescript';
  closeBtnLabel?: string;
}

const RewardPopup: React.FC<RewardPopupProps> = ({ open, onClose, title, description, icon, eyebrow, reward, tone = 'web', closeBtnLabel = "Next Level →" }) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={`${styles.popup} ${styles[tone]}`} role="dialog" aria-modal="true" aria-labelledby="reward-title">
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <div className={styles.icon}>{icon}</div>
        <h2 id="reward-title" className={styles.title}>{title}</h2>
        {reward && <div className={styles.reward}>{reward}</div>}
        <p className={styles.description}>{description}</p>
        <button className={styles.closeBtn} onClick={onClose}>{closeBtnLabel}</button>
      </div>
    </div>
  );
};

export default RewardPopup;