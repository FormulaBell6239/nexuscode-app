"use client";

import { useState } from 'react';
import styles from './Auth.module.css';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <h1 className={styles.title}>{isLogin ? 'Login' : 'Register'}</h1>
        <form className={styles.form}>
          {!isLogin && (
            <label>
              Username:
              <input type="text" name="username" required className={styles.input} />
            </label>
          )}
          <label>
            Email:
            <input type="email" name="email" required className={styles.input} />
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