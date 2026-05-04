'use client';
import { useState } from 'react';

const questions = [
  {
    question: "What does HTML stand for?",
    options: [
      "HyperText Markup Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language"
    ],
    answer: 0
  },
  {
    question: "Which tag is used to create a link in HTML?",
    options: [
      "<link>",
      "<a>",
      "<href>"
    ],
    answer: 1
  },
  {
    question: "Which symbol is used for single-line comments in JavaScript?",
    options: [
      "//",
      "/* */",
      "#"
    ],
    answer: 0
  },
  {
    question: "Which CSS property changes the text color?",
    options: [
      "font-color",
      "color",
      "text-color"
    ],
    answer: 1
  }
];

export default function CodeQuiz() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (idx: number) => {
    if (idx === questions[current].answer) setScore(score + 1);
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setScore(0);
    setShowResult(false);
  };

  return (
    <main style={{
      maxWidth: 500,
      margin: "2rem auto",
      background: "#232b3e",
      color: "#e3eafc",
      borderRadius: 18,
      boxShadow: "0 8px 32px rgba(44,62,80,0.28)",
      padding: "2rem"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Code Quiz</h1>
      {showResult ? (
        <div style={{ textAlign: "center" }}>
          <h2>Your Score: {score} / {questions.length}</h2>
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
            Restart Quiz
          </button>
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: "1rem" }}>
            Question {current + 1} of {questions.length}
          </h2>
          <div style={{
            marginBottom: "1.2rem",
            fontSize: "1.15rem",
            fontWeight: 600
          }}>
            {questions[current].question}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {questions[current].options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                style={{
                  background: "#42537d",
                  color: "#e3eafc",
                  border: "none",
                  borderRadius: "8px",
                  padding: "0.7rem 1rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseOver={e => e.currentTarget.style.background = "#0070f3"}
                onMouseOut={e => e.currentTarget.style.background = "#42537d"}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}