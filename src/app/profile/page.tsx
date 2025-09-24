'use client';
import { useState } from 'react';
import styles from './Profile.module.css';

const avatarOptions = ["🧑‍🚀", "🦸‍♂️", "🧑‍💻", "🦄", "🐱"];
const callingCardOptions = [
  { name: "Blue Dream", value: "blue", preview: "🌌" },
  { name: "Peach Sunrise", value: "peach", preview: "🌅" },
  { name: "Sky Fade", value: "sky", preview: "☁️" },
  { name: "Pixel Grid", value: "pixel", preview: "🟦" },
];

export default function ProfileEdit() {
  const [avatar, setAvatar] = useState(avatarOptions[0]);
  const [name, setName] = useState("Your Name");
  const [username, setUsername] = useState("username123");
  const [callingCard, setCallingCard] = useState(callingCardOptions[0].value);

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Edit Your Profile</h1>
      <p className={styles.subtitle}>Update your info and personalize your NexusCode experience!</p>
      <ul className={styles.list}>
        <li className={styles.item}>
          <span className={styles.icon}>
            <select
              value={avatar}
              onChange={e => setAvatar(e.target.value)}
              className={styles.avatarPicker}
              aria-label="Choose avatar"
            >
              {avatarOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </span>
          <span className={styles.name}>
            <input
              className={styles.nameInput}
              value={name}
              onChange={e => setName(e.target.value)}
              aria-label="Edit name"
              placeholder="Name"
            />
          </span>
          <span className={styles.username}>
            <input
              className={styles.usernameInput}
              value={username}
              onChange={e => setUsername(e.target.value)}
              aria-label="Edit username"
              placeholder="Username"
            />
          </span>
        </li>
        <li className={styles.item}>
          <span className={styles.icon}>
            {callingCardOptions.find(opt => opt.value === callingCard)?.preview}
          </span>
          <span className={styles.callingCardLabel}>Calling Card</span>
          <span>
            <select
              className={styles.callingCardPicker}
              value={callingCard}
              onChange={e => setCallingCard(e.target.value)}
              aria-label="Choose Calling Card"
            >
              {callingCardOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.name}</option>
              ))}
            </select>
          </span>
        </li>
        <li className={styles.item}>
          <span className={styles.icon}>🔥</span>
          <span className={styles.streak}>Streak</span>
          <span><strong>7 days</strong></span>
        </li>
        <li className={styles.item}>
          <span className={styles.icon}>📊</span>
          <span className={styles.stats}>Level</span>
          <span><strong>3</strong></span>
        </li>
        <li className={styles.item}>
          <span className={styles.icon}>🏅</span>
          <span className={styles.stats}>Badges</span>
          <span><strong>5</strong></span>
        </li>
        <li className={styles.item}>
          <span className={styles.icon}>🎉</span>
          <span className={styles.stats}>Achievements</span>
          <span>
            <span className={styles.badge} title="Gold Medal">🏅</span>
            <span className={styles.badge} title="Target">🎯</span>
            <span className={styles.badge} title="Rocket">🚀</span>
            <span className={styles.badge} title="Puzzle">🧩</span>
          </span>
        </li>
      </ul>
      <div className={styles.profileActions}>
        <button className={styles.editBtn}>
          Save Changes
        </button>
        <label className={styles.privacyToggle}>
          <input type="checkbox" checked readOnly />
          Public Profile
        </label>
      </div>
      <blockquote className={styles.quote}>
        "Keep pushing your limits. 🚀"
      </blockquote>
    </main>
  );
}