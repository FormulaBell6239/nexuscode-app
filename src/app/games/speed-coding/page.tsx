'use client';
import { useState, useRef } from 'react';

const challenges = [
  {
    prompt: "Write a function that returns the square of a number.",
    answer: "function square(n) {\n  return n * n;\n}"
  },
  {
    prompt: "Write a function that returns true if a number is even.",
    answer: "function isEven(n) {\n  return n % 2 === 0;\n}"
  }
];

export default function SpeedCoding() {
  const [current, setCurrent] = useState(0);
  const [userCode, setUserCode] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleStart = () => {
    setStartTime(Date.now());
    setUserCode("");
    setFeedback("");
    if (inputRef.current) inputRef.current.focus();
  };

  const handleCheck = () => {
    if (userCode.trim() === challenges[current].answer.trim()) {
      setEndTime(Date.now());
      setFeedback("✅ Correct!");
      setTimeout(() => {
        if (current + 1 < challenges.length) {
          setCurrent(current + 1);
          setUserCode("");
          setFeedback("");
          setStartTime(Date.now());
          setEndTime(null);
        } else {
          setShowResult(true);
        }
      }, 1200);
    } else {
      setFeedback("❌ Not quite right. Try again!");
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setUserCode("");
    setFeedback("");
    setShowResult(false);
    setStartTime(null);
    setEndTime(null);
  };

  const timeTaken = startTime && endTime ? ((endTime - startTime) / 1000).toFixed(2) : null;

  return (
    <main style={{
      maxWidth: 600,
      margin: "2rem auto",
      background: "#232b3e",
      color: "#e3eafc",
      borderRadius: 18,
      boxShadow: "0 8px 32px rgba(44,62,80,0.28)",
      padding: "2rem"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Speed Coding</h1>
      {showResult ? (
        <div style={{ textAlign: "center" }}>
          <h2>All challenges complete!</h2>
          <button
            onClick={handleRestart}
            style={{
              marginTop: "1rem",
              background: "linear-gradient(90deg, #0070f3 60%, #00bcd4 100%)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "0.7rem 2rem",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer"
            }}
          >
            Try Again
          </button>
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>
            Challenge {current + 1} of {challenges.length}
          </h2>
          <div style={{
            marginBottom: "1.2rem",
            fontSize: "1.15rem",
            fontWeight: 600
          }}>
            {challenges[current].prompt}
          </div>
          <textarea
            ref={inputRef}
            value={userCode}
            onChange={e => setUserCode(e.target.value)}
            rows={6}
            style={{
              width: "100%",
              fontFamily: "monospace",
              fontSize: "1rem",
              background: "#1a2541",
              color: "#e3eafc",
              border: "1.5px solid #0070f3",
              borderRadius: "8px",
              padding: "0.7rem",
              marginBottom: "1rem",
              boxSizing: "border-box"
            }}
            disabled={startTime === null}
          />
          {startTime === null ? (
            <button
              onClick={handleStart}
              style={{
                background: "linear-gradient(90deg, #ffd200 0%, #f7971e 100%)",
                color: "#232b3e",
                border: "none",
                borderRadius: "8px",
                padding: "0.7rem 2rem",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: "1rem"
              }}
            >
              Start Challenge
            </button>
          ) : (
            <button
              onClick={handleCheck}
              style={{
                background: "linear-gradient(90deg, #43e97b 0%, #38f9d7 100%)",
                color: "#232b3e",
                border: "none",
                borderRadius: "8px",
                padding: "0.7rem 2rem",
                fontSize: "1rem",
                fontWeight: "bold",
                cursor: "pointer",
                marginBottom: "1rem"
              }}
            >
              Check Answer
            </button>
          )}
          {feedback && (
            <div style={{
              marginTop: "0.7rem",
              fontWeight: "bold",
              color: feedback.startsWith("✅") ? "#43e97b" : "#ffd200"
            }}>
              {feedback}
              {timeTaken && feedback.startsWith("✅") && (
                <div style={{ marginTop: "0.5rem", color: "#00bcd4" }}>
                  Time taken: {timeTaken} seconds
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </main>
  );
}