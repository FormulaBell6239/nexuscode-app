"use client";
import React, { useState, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import styles from "./Curriculum.module.css";

// ---------------------------------------------
// Checker Functions for Lesson Validation
// ---------------------------------------------
const checkers: {
  [key: string]: (code: string, log?: any) => boolean;
} = {
  "html-headings": (code: string) => /<h1>\s*Welcome to NexusCode\s*<\/h1>/i.test(code),
  "css-selectors": (code: string) => /h1\s*{[^}]*color\s*:\s*blue\s*;?[^}]*}/i.test(code),
  "js-variables": (code: string, log?: any) => /let|const|var\s+name\s*=/.test(code),
  // ...add more checkers as needed
};

export default function CurriculumPage() {
  // ---------------------------------------------
  // State Variables
  // ---------------------------------------------
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

  // ---------------------------------------------
  // Refs for Split Layout and Divider
  // ---------------------------------------------
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------
  // Fetch Curriculum Data
  // ---------------------------------------------
  useEffect(() => {
    fetch("/curriculum.json")
      .then(res => res.json())
      .then(data => setCurriculum(data));
  }, []);

  // ---------------------------------------------
  // Reset Lesson State on Change
  // ---------------------------------------------
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

  // ---------------------------------------------
  // Split Pane Drag Logic
  // ---------------------------------------------
  useEffect(() => {
    const divider = dividerRef.current;
    let isDragging = false;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      document.body.style.cursor = "ew-resize";
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !leftPaneRef.current) return;
      const containerRect = leftPaneRef.current.parentElement!.getBoundingClientRect();
      let newWidth = e.clientX - containerRect.left;
      newWidth = Math.max(250, Math.min(newWidth, 600)); // min/max width
      leftPaneRef.current.style.flex = `0 0 ${newWidth}px`;
      leftPaneRef.current.style.maxWidth = `${newWidth}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
      document.body.style.cursor = "";
    };

    divider?.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      divider?.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  // ---------------------------------------------
  // Loading State
  // ---------------------------------------------
  if (!curriculum) {
    return <div>Loading curriculum...</div>;
  }

  // ---------------------------------------------
  // Lesson Data
  // ---------------------------------------------
  const lessons = curriculum[category];
  const currentLesson = lessons[sectionIndex];

  // ---------------------------------------------
  // Editor Handlers
  // ---------------------------------------------
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

  // ---------------------------------------------
  // Lesson Checker Handler
  // ---------------------------------------------
  const handleCheckAnswer = () => {
    const checkerKey = currentLesson.key;
    let code = "";
    if (currentLesson.language === "html") code = htmlCode;
    if (currentLesson.language === "css") code = cssCode;
    if (currentLesson.language === "javascript") code = jsCode;
    const isCorrect = checkers[checkerKey]?.(code);
    setFeedback(isCorrect ? "✅ Correct! Great job!" : "❌ Not quite right. Try again or get a hint.");
  };

  // ---------------------------------------------
  // Main Render
  // ---------------------------------------------
  return (
    <main className={styles.main}>
      {/* Split Layout Container */}
      <div className={styles.splitContainer}>
        {/* ------------------ Left Pane: Lessons ------------------ */}
        <section className={styles.leftPane} ref={leftPaneRef}>
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
          </div>

          {/* Lesson Navigation */}
          <div className={styles.lessonToggleCard}>
            <div className={styles.lessonToggleRow}>
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

          {/* Lesson Content Card */}
          <div className={styles.learningCard}>
            <h1 className={styles.title}>{currentLesson.lesson.title}</h1>
            <span className={styles.lessonNumber}>
              Lesson {sectionIndex + 1} of {lessons.length}
            </span>
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
            {/* Lesson Actions */}
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
            {/* Feedback Section */}
            {feedback && (
              <div className={styles.feedback}>
                {feedback}
              </div>
            )}
          </div>
        </section>

        {/* ------------------ Divider (Draggable) ------------------ */}
        <div className={styles.divider} id="drag-divider" ref={dividerRef} />

        {/* ------------------ Right Pane: Editor ------------------ */}
        <section className={styles.rightPane}>
          {/* Editor Tabs */}
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
          {/* Editor/Browser Preview */}
          <div className={styles.editorContainer}>
            {activeTab === "html" && (
              <CodeMirror
                value={htmlCode}
                height="100%"
                className={styles.codeEditor}
                theme={oneDark}
                extensions={[html()]}
                onChange={value => setHtmlCode(value)}
                onFocus={handleEditorFocus}
              />
            )}
            {activeTab === "css" && (
              <CodeMirror
                value={cssCode}
                height="100%"
                className={styles.codeEditor}
                theme={oneDark}
                extensions={[css()]}
                onChange={value => setCssCode(value)}
              />
            )}
            {activeTab === "js" && (
              <CodeMirror
                value={jsCode}
                height="100%"
                className={styles.codeEditor}
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
          {/* Sample Output (Hint) */}
          {showHint && currentLesson.lesson.sampleOutput && (
            <div className={styles.sampleOutput}>
              <strong>Sample Output:</strong>
              <div>{currentLesson.lesson.sampleOutput}</div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}