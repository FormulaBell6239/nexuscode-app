"use client";

import { useEffect, useState } from "react";
import styles from "./Playground.module.css";

export default function AutosaveIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 5400);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <span className={styles.autoSaved}>
      <i className={styles.autoDot} />Autosaving
    </span>
  );
}
