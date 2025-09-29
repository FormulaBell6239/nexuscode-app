import React from "react";
import styles from "./RewardPopup.module.css";

interface RewardPopupProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

const RewardPopup: React.FC<RewardPopupProps> = ({ open, onClose, title, description, icon }) => {
  if (!open) return null;
  return (
    <div className={styles.overlay}>
      <div className={styles.popup}>
        <div className={styles.icon}>{icon}</div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.description}>{description}</p>
        <button className={styles.closeBtn} onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default RewardPopup;