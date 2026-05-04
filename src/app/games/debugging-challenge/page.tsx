'use client';
import { useState } from 'react';

const challenges = [
  {
    buggyCode: `function add(a, b) {
  return a - b;
}`,
    question: "Fix the function so it correctly adds two numbers.",
    correctCode: `function add(a, b) {
  return a + b;
}`,
    test: (code: string) => /return\s+a\s*\+\s*b\s*;/.test(code)
  },
  {
    buggyCode: `for(let i = 0; i < 5; i++) {
  console.log(i)
}`,
    question: "Add a semicolon after console.log(i) to fix the syntax.",
    correctCode: `for(let i = 0; i < 5; i++) {
  console.log(i);
}`,
    test: (code: string) => /console\.log\(i\);/.test(code)
  }
];

export default function DebuggingChallenge() {
  const [current, setCurrent] = useState(0);
  const [userCode, setUserCode] = useState(challenges[0].buggyCode);
  const [feedback, setFeedback] = useState("");
  const [showResult, setShowResult] = useState(false);

  const handleCheck = () => {
    if (challenges[current].test(userCode)) {
      setFeedback("✅ Correct! You fixed the bug.");
      setTimeout(() => {
        if (current + 1 < challenges.length) {
          setCurrent(current + 1);
          setUserCode(challenges[current + 1].buggyCode);
          setFeedback("");
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
    setUserCode(challenges[0].buggyCode);
    setFeedback("");
    setShowResult(false);
  };

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
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Debugging Challenge</h1>
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
            {challenges[current].question}
          </div>
          <textarea
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
          />
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
          {feedback && (
            <div style={{
              marginTop: "0.7rem",
              fontWeight: "bold",
              color: feedback.startsWith("✅") ? "#43e97b" : "#ffd200"
            }}>
              {feedback}
            </div>
          )}
        </div>
      )}
    </main>
  );
}