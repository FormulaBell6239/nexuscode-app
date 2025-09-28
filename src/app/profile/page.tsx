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

export default function ProfilePage() {
  // Saved profile data
  const [profile, setProfile] = useState({
    avatar: avatarOptions[0],
    name: "Your Name",
    username: "username123",
    bio: "",
    callingCard: callingCardOptions[0].value,
  });
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  // Form fields for editing
  const [editFields, setEditFields] = useState(profile);

  // Start editing
  const handleEdit = () => {
    setEditFields(profile);
    setIsEditing(true);
  };

  // Save changes
  const handleSave = () => {
    setProfile(editFields);
    setIsEditing(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.cover}>
          <span className={styles.coverIcon}>
            {callingCardOptions.find(opt => opt.value === (isEditing ? editFields.callingCard : profile.callingCard))?.preview}
          </span>
        </div>
        <div className={styles.avatarSection}>
          <span className={styles.avatar}>{isEditing ? editFields.avatar : profile.avatar}</span>
          {isEditing && (
            <select
              value={editFields.avatar}
              onChange={e => setEditFields({ ...editFields, avatar: e.target.value })}
              className={styles.avatarPicker}
              aria-label="Choose avatar"
            >
              {avatarOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </div>
        <h1 className={styles.title}>My Profile</h1>
        <p className={styles.subtitle}>Personalize your NexusCode experience!</p>
        <div className={styles.formSection}>
          <label>
            <span className={styles.label}>Name</span>
            {isEditing ? (
              <input
                className={styles.nameInput}
                value={editFields.name}
                onChange={e => setEditFields({ ...editFields, name: e.target.value })}
                aria-label="Edit name"
                placeholder="Name"
              />
            ) : (
              <div className={styles.profileText}>{profile.name}</div>
            )}
          </label>
          <label>
            <span className={styles.label}>Username</span>
            {isEditing ? (
              <input
                className={styles.usernameInput}
                value={editFields.username}
                onChange={e => setEditFields({ ...editFields, username: e.target.value })}
                aria-label="Edit username"
                placeholder="Username"
              />
            ) : (
              <div className={styles.profileText}>{profile.username}</div>
            )}
          </label>
          <label>
            <span className={styles.label}>Bio</span>
            {isEditing ? (
              <textarea
                className={styles.bioInput}
                value={editFields.bio}
                onChange={e => setEditFields({ ...editFields, bio: e.target.value })}
                aria-label="Edit bio"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            ) : (
              <div className={styles.profileText}>{profile.bio || <span style={{opacity:0.6}}>No bio yet.</span>}</div>
            )}
          </label>
          <label>
            <span className={styles.label}>Calling Card</span>
            {isEditing ? (
              <select
                className={styles.callingCardPicker}
                value={editFields.callingCard}
                onChange={e => setEditFields({ ...editFields, callingCard: e.target.value })}
                aria-label="Choose Calling Card"
              >
                {callingCardOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.name}</option>
                ))}
              </select>
            ) : (
              <div className={styles.profileText}>
                {callingCardOptions.find(opt => opt.value === profile.callingCard)?.name}
              </div>
            )}
          </label>
        </div>
        <div className={styles.profileActions}>
          {isEditing ? (
            <button className={styles.editBtn} onClick={handleSave}>Save Changes</button>
          ) : (
            <button className={styles.editBtn} onClick={handleEdit}>Edit Profile</button>
          )}
          <label className={styles.privacyToggle}>
            <input type="checkbox" checked readOnly />
            Public Profile
          </label>
        </div>
      </div>
      <blockquote className={styles.quote}>
        "Keep pushing your limits. 🚀"
      </blockquote>
    </main>
  );
}