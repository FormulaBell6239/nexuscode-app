"use client";
import React, { useState, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import styles from "./Curriculum.module.css";

const checkers: {
  [key: string]: (code: string, log?: any) => boolean;
} = {
  "html-headings": (code: string) => /<h1>\s*Welcome to NexusCode\s*<\/h1>/i.test(code),
  "css-selectors": (code: string) => /h1\s*{[^}]*color\s*:\s*blue\s*;?[^}]*}/i.test(code),
  "js-variables": (code: string, log?: any) => /let|const|var\s+name\s*=/.test(code),
  // ...etc
};

export default function CurriculumPage() {
  const [curriculum, setCurriculum] = useState<any>(null);
  const [category, setCategory] = useState("html");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [hasFocused, setHasFocused] = useState(false);
  const [feedback, setFeedback] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch("/curriculum.json")
      .then(res => res.json())
      .then(data => setCurriculum(data));
  }, []);

  // Only run this effect when curriculum and lesson are available
  useEffect(() => {
    if (curriculum) {
      const lessons = curriculum[category];
      const currentLesson = lessons[sectionIndex];
      setCode(currentLesson.lesson.starterCode);
      setOutput("");
      setHasFocused(false);
    }
  }, [curriculum, category, sectionIndex]);

  if (!curriculum) {
    return <div>Loading curriculum...</div>;
  }

  const lessons = curriculum[category];
  const currentLesson = lessons[sectionIndex];

  const handleEditorFocus = () => {
    if (!hasFocused && code === currentLesson.lesson.starterCode) {
      setCode("");
      setHasFocused(true);
    }
  };

  const handleRun = () => {
    let isCorrect = false;
    if (currentLesson.language === "html") {
      setOutput(code);
      if (currentLesson.lesson.check) {
        isCorrect = currentLesson.lesson.check(code);
      }
    } else if (currentLesson.language === "css") {
      setOutput(`<style>${code}</style><h1>Welcome to NexusCode</h1>`);
      if (currentLesson.lesson.check) {
        isCorrect = currentLesson.lesson.check(code);
      }
    } else if (currentLesson.language === "javascript") {
      try {
        let log = "";
        const customConsole = { log: (msg: any) => (log += msg + "\n") };
        // eslint-disable-next-line no-new-func
        new Function("console", code)(customConsole);
        setOutput(log || "No output.");
        if (currentLesson.lesson.check) {
          isCorrect = currentLesson.lesson.check(code, log);
        }
      } catch (err: any) {
        setOutput("Error: " + err.message);
      }
    }
    const checker = checkers[currentLesson.key];
    if (checker) isCorrect = checker(code, output);
    setFeedback(isCorrect ? "✅ Correct!" : "❌ Try again.");
  };

  const getExtensions = () => {
    if (currentLesson.language === "html") return [html()];
    // Add CSS/JS extensions here if needed
    return [];
  };

  return (
    <main className={styles.main}>
      {/* Section Toggle Card (top, its own box) */}
      <div className={styles.sectionToggleCard}>
        {Object.keys(curriculum).map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setSectionIndex(0);
            }}
            className={
              category === cat
                ? `${styles.toggleButton} ${styles.toggleButtonActive}`
                : styles.toggleButton
            }
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Lesson Toggle Card (separate box below) */}
      <div className={styles.lessonToggleCard}>
        {lessons.map((s: any, i: number) => (
          <button
            key={s.key}
            onClick={() => setSectionIndex(i)}
            className={
              sectionIndex === i
                ? `${styles.toggleButton} ${styles.toggleButtonActive}`
                : styles.toggleButton
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      <h1 className={styles.title}>{currentLesson.lesson.title}</h1>
      <p className={styles.instructions}>{currentLesson.lesson.instructions}</p>
      <div className={styles.editorContainer}>
        <CodeMirror
          value={code}
          height="200px"
          theme={oneDark}
          extensions={getExtensions()}
          onFocus={handleEditorFocus}
          onChange={value => setCode(value)}
        />
      </div>
      <button
        style={{
          marginTop: "1rem",
          padding: "0.5rem 1.2rem",
          borderRadius: "8px",
          background: "#00bcd4",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontWeight: "bold"
        }}
        onClick={handleRun}
      >
        Run
      </button>
      {feedback && (
        <div style={{ margin: "1rem 0", fontWeight: "bold", color: feedback.includes("Correct") ? "green" : "red" }}>
          {feedback}
        </div>
      )}
      <div style={{ marginTop: "2rem" }}>
        {currentLesson.language === "javascript" ? (
          <pre style={{ background: "#222", color: "#fff", padding: "1rem", borderRadius: "8px" }}>
            {output}
          </pre>
        ) : (
          <iframe
            ref={iframeRef}
            title="output"
            style={{
              width: "100%",
              minHeight: "120px",
              border: "1px solid #eee",
              borderRadius: "8px",
              background: "#fff"
            }}
            srcDoc={output}
          />
        )}
      </div>
    </main>
  );
}