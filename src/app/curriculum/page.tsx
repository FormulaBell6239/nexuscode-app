"use client";
import React, { useState, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import styles from "./Curriculum.module.css";

const checkers: {
  [key: string]: (code: string, log?: any) => boolean;
} = {
  "html-headings": (code: string) => /<h1>\s*Welcome to NexusCode\s*<\/h1>/i.test(code),
  "css-selectors": (code: string) => /h1\s*{[^}]*color\s*:\s*blue\s*;?[^}]*}/i.test(code),
  "js-variables": (code: string, log?: any) => /let|const|var\s+name\s*=/.test(code),
  // ...add more checkers as needed
};

export default function CurriculumPage() {
  const [curriculum, setCurriculum] = useState<any>(null);
  const [category, setCategory] = useState("html");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "browser">("html");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [output, setOutput] = useState("");
  const [hasFocused, setHasFocused] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showHint, setShowHint] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    fetch("/curriculum.json")
      .then(res => res.json())
      .then(data => setCurriculum(data));
  }, []);

  useEffect(() => {
    if (curriculum) {
      const lessons = curriculum[category];
      const currentLesson = lessons[sectionIndex];
      if (currentLesson.language === "html") setHtmlCode(currentLesson.lesson.starterCode || "");
      if (currentLesson.language === "css") setCssCode(currentLesson.lesson.starterCode || "");
      if (currentLesson.language === "javascript") setJsCode(currentLesson.lesson.starterCode || "");
      setOutput("");
      setHasFocused(false);
      setFeedback("");
      setShowHint(false);
    }
  }, [curriculum, category, sectionIndex]);

  if (!curriculum) {
    return <div>Loading curriculum...</div>;
  }

  const lessons = curriculum[category];
  const currentLesson = lessons[sectionIndex];

  const handleEditorFocus = () => {
    if (!hasFocused && htmlCode === currentLesson.lesson.starterCode) {
      setHtmlCode("");
      setHasFocused(true);
    }
  };

  const handleRun = () => {
    const html = htmlCode;
    const css = `<style>${cssCode}</style>`;
    const js = `<script>${jsCode}</script>`;
    setOutput(`${css}${html}${js}`);
  };

  const handleTabClick = (tab: "html" | "css" | "js" | "browser") => {
    if (tab === "browser") {
      handleRun();
    }
    setActiveTab(tab);
  };

  const handleCheckAnswer = () => {
    const checkerKey = currentLesson.key;
    let code = "";
    if (currentLesson.language === "html") code = htmlCode;
    if (currentLesson.language === "css") code = cssCode;
    if (currentLesson.language === "javascript") code = jsCode;
    const isCorrect = checkers[checkerKey]?.(code);
    setFeedback(isCorrect ? "✅ Correct! Great job!" : "❌ Not quite right. Try again or get a hint.");
  };

  console.log('sectionIndex:', sectionIndex, 'lessons:', lessons);

  return (
    <main className={styles.main}>
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <span>
          <strong>Lesson {sectionIndex + 1} of {lessons.length}</strong>
        </span>
        <div className={styles.progressTrack}>
          <div
            className={styles.progressFill}
            style={{
              width: `${((sectionIndex + 1) / lessons.length) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Category Navigation */}
      <div className={styles.topNavCard}>
        <nav className={styles.sectionToggleCard}>
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
        </nav>
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
      </div>

      {/* Lesson Card */}
      <div className={styles.lessonCard}>
        <h1 className={styles.title}>{currentLesson.lesson.title}</h1>
        <ul className={styles.instructionsList}>
          {currentLesson.lesson.instructions.split('\n').map((step: string, i: number) => (
            <li key={i} className={styles.instructionStep}>{step}</li>
          ))}
        </ul>
        {/* Hint Section */}
        {showHint && currentLesson.lesson.hint && (
          <div className={styles.hintBox}>
            <strong>Hint:</strong> {currentLesson.lesson.hint}
          </div>
        )}
      </div>

      {/* Code Editor */}
      <div className={styles.editorSection}>
        <h2 className={styles.editorHeader}>Your Solution</h2>
        <div className={styles.editorTabs}>
          <button
            className={activeTab === "html" ? styles.activeTab : styles.tab}
            onClick={() => handleTabClick("html")}
          >HTML</button>
          <button
            className={activeTab === "css" ? styles.activeTab : styles.tab}
            onClick={() => handleTabClick("css")}
          >CSS</button>
          <button
            className={activeTab === "js" ? styles.activeTab : styles.tab}
            onClick={() => handleTabClick("js")}
          >JavaScript</button>
          <button
            className={activeTab === "browser" ? styles.activeTab : styles.tab}
            onClick={() => handleTabClick("browser")}
          >Browser</button>
        </div>
        <div className={styles.editorContainer}>
          {activeTab === "html" && (
            <CodeMirror
              value={htmlCode}
              height="400px"
              theme={oneDark}
              extensions={[html()]}
              onChange={value => setHtmlCode(value)}
              onFocus={handleEditorFocus}
            />
          )}
          {activeTab === "css" && (
            <CodeMirror
              value={cssCode}
              height="400px"
              theme={oneDark}
              extensions={[css()]}
              onChange={value => setCssCode(value)}
            />
          )}
          {activeTab === "js" && (
            <CodeMirror
              value={jsCode}
              height="400px"
              theme={oneDark}
              extensions={[]} // Add JS extensions if needed
              onChange={value => setJsCode(value)}
            />
          )}
          {activeTab === "browser" && (
            <iframe
              title="output"
              style={{
                width: "100%",
                minHeight: "400px",
                border: "1px solid #eee",
                borderRadius: "8px",
                background: "#fff"
              }}
              srcDoc={output}
              ref={iframeRef}
            />
          )}
        </div>
      </div>

      {/* Show Sample Output only when hint is shown */}
      {showHint && currentLesson.lesson.sampleOutput && (
        <div className={styles.sampleOutput}>
          <strong>Sample Output:</strong>
          <div>{currentLesson.lesson.sampleOutput}</div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button onClick={handleCheckAnswer} className={styles.checkButton}>Check Answer</button>
        <button onClick={() => setShowHint(true)} className={styles.hintButton}>Get Hint</button>
        <button
          onClick={() => {
            if (sectionIndex < lessons.length - 1) setSectionIndex(sectionIndex + 1);
          }}
          className={styles.nextButton}
        >
          Next Lesson
        </button>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={styles.feedback}>
          {feedback}
        </div>
      )}
    </main>
  );
}