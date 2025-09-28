"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Auth.module.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const identifier = formData.get('identifier');
    const password = formData.get('password');

    if (isLogin) {
      // Example: Call your backend API to verify credentials
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ identifier, password }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        // Show error message
        alert('Invalid email or password');
        return;
      }
      // Save token/session info (example: localStorage)
      const { token } = await res.json();
      localStorage.setItem('token', token);
      router.push('/'); // Redirect to home
    } else {
      // Registration successful, redirect to onboarding
      router.push('/onboarding');
    }
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>{isLogin ? 'Login' : 'Register'}</h1>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label>
            Email or Username:
            <input type="text" name="identifier" required className={styles.input} />
          </label>
          <label>
            Password:
            <input type="password" name="password" required className={styles.input} />
          </label>
          <button type="submit" className={styles.button}>
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        <button
          className={styles.toggle}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
}