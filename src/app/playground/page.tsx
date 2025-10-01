"use client";
import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@uiw/react-codemirror";
import styles from "./Playground.module.css";

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "browser">("html");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [output, setOutput] = useState("");
  const [projects, setProjects] = useState<{name: string, html: string, css: string, js: string}[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectName, setProjectName] = useState("");
  const [fade, setFade] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("playgroundProjects");
    if (saved) setProjects(JSON.parse(saved));
  }, []);

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

  const handleSaveProject = () => {
    if (!projectName.trim()) return;
    const newProjects = [
      ...projects,
      { name: projectName, html: htmlCode, css: cssCode, js: jsCode }
    ];
    setProjects(newProjects);
    localStorage.setItem("playgroundProjects", JSON.stringify(newProjects));
  };

  // Filter projects by search term
  const filteredProjects = searchTerm
    ? projects.filter(proj =>
        proj.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projects;

  // Preview first matching project
  const previewProject = filteredProjects[0];

  const tips = [
    "Use Ctrl+Space for autocomplete.",
    "Click 'Browser' to preview your code.",
    "Save your favorite projects for quick access.",
    "Use the 'New Project' button to start fresh.",
    "You can load any saved project instantly."
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false); // Start fade out
      setTimeout(() => {
        setTipIndex(prev => (prev + 1) % tips.length);
        setFade(true); // Fade in new tip
      }, 700); // Duration matches CSS transition
    }, 10000);
    return () => clearInterval(interval);
  }, [tips.length]);

  // Get the currently displayed tip
  const displayedTip = tips[tipIndex];
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Playground</h1>
      <p className={styles.instructions}>Freely experiment with HTML, CSS, and JavaScript!</p>
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
            height="100%"
            theme={oneDark}
            extensions={[html()]}
            onChange={value => setHtmlCode(value)}
            className={styles.codeEditor}
          />
        )}
        {activeTab === "css" && (
          <CodeMirror
            value={cssCode}
            height="100%"
            theme={oneDark}
            extensions={[css()]}
            onChange={value => setCssCode(value)}
            className={styles.codeEditor}
          />
        )}
        {activeTab === "js" && (
          <CodeMirror
            value={jsCode}
            height="100%"
            theme={oneDark}
            extensions={[]} // Add JS extensions if needed
            onChange={value => setJsCode(value)}
            className={styles.codeEditor}
          />
        )}
        {activeTab === "browser" && (
          <iframe
            title="output"
            srcDoc={output}
            className={styles.browserFrame}
          />
        )}
      </div>
      <div className={styles.playgroundActionsWrapper}>
        <div className={styles.PlaygroundActions}>
          <button onClick={handleSaveProject} className={styles.toggleButton}>
            Save
          </button>
          <button
            onClick={() => {
              setProjectName("");
              setHtmlCode("");
              setCssCode("");
              setJsCode("");
            }}
            className={styles.toggleButton}
          >
            New Project
          </button>
          <button
            onClick={() => setShowProjects(!showProjects)}
            className={styles.toggleButton}
          >
            {showProjects ? "Close Projects" : "Open Projects"}
          </button>
        </div>
        {/* Show Project Name input ONLY when projects are open */}
        {showProjects && (
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className={styles.projectInput}
            style={{ marginTop: "1rem" }}
          />
        )}
      </div>
      {/* Preview first matching project */}
      {searchTerm && previewProject && (
        <div className={styles.projectCard}>
          <div className={styles.projectPreview}>
            <strong>{previewProject.name}</strong>
            <pre className={styles.projectCodePreview}>
              {previewProject.html?.slice(0, 120) || ""}
              {previewProject.html && previewProject.html.length > 120 ? "..." : ""}
            </pre>
            <pre className={styles.projectCodePreview}>
              {previewProject.css?.slice(0, 80) || ""}
              {previewProject.css && previewProject.css.length > 80 ? "..." : ""}
            </pre>
            <pre className={styles.projectCodePreview}>
              {previewProject.js?.slice(0, 80) || ""}
              {previewProject.js && previewProject.js.length > 80 ? "..." : ""}
            </pre>
          </div>
          <button
            className={styles.toggleButton}
            onClick={() => {
              setHtmlCode(previewProject.html);
              setCssCode(previewProject.css);
              setJsCode(previewProject.js);
            }}
          >
            Load Project
          </button>
        </div>
      )}
      {/* Show all projects only when Open Projects is clicked and no search term */}
      {showProjects && !searchTerm && (
        <div className={styles.projectsList}>
          {projects.map((proj, idx) => (
            <div key={idx} className={styles.projectCard}>
              <div className={styles.projectPreview}>
                <strong>{proj.name}</strong>
                <pre className={styles.projectCodePreview}>
                  {proj.html?.slice(0, 120) || ""}
                  {proj.html && proj.html.length > 120 ? "..." : ""}
                </pre>
                <pre className={styles.projectCodePreview}>
                  {proj.css?.slice(0, 80) || ""}
                  {proj.css && proj.css.length > 80 ? "..." : ""}
                </pre>
                <pre className={styles.projectCodePreview}>
                  {proj.js?.slice(0, 80) || ""}
                  {proj.js && proj.js.length > 80 ? "..." : ""}
                </pre>
              </div>
              <button
                className={styles.toggleButton}
                onClick={() => {
                  setHtmlCode(proj.html);
                  setCssCode(proj.css);
                  setJsCode(proj.js);
                }}
              >
                Load Project
              </button>
            </div>
          ))}
        </div>
      )}
      <div className={`${styles.tipsBox} ${fade ? styles.fadeIn : styles.fadeOut}`}>
        <strong>Tips:</strong> {tips[tipIndex]}
      </div>
      <textarea
        className={styles.feedbackBox}
        placeholder="Have a suggestion or found a bug? Let us know!"
      />
      <button className={styles.sendFeedbackButton + " " + styles.toggleButton}>
        Send Feedback
      </button>
    </main>
  );
}