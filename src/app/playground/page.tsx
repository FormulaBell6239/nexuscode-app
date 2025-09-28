"use client";
import React, { useState, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { oneDark } from "@codemirror/theme-one-dark";
import { autocompletion, completeFromList } from "@codemirror/autocomplete";
import { indentOnInput } from "@codemirror/language";
import { highlightActiveLineGutter } from "@codemirror/view";
import styles from "../curriculum/Curriculum.module.css"; // reuse styles for consistency

// --- COPY COMPLETIONS AND EXTENSIONS FROM CURRICULUM PAGE ---
const htmlCompletions = [
  { label: "<!DOCTYPE html>", type: "keyword", apply: "<!DOCTYPE html>\n", filterText: "<doc" },
  { label: "<html lang=\"en\"></html>", type: "keyword", apply: "<html lang=\"en\">\n</html>", filterText: "<html" },
  { label: "<head>", type: "keyword", apply: "<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Title</title>\n</head>", filterText: "<head" },
  { label: "<body>", type: "keyword", apply: "<body>\n  \n</body>", filterText: "<body" },
  { label: "<header>", type: "keyword", apply: "<header>\n  <h1>Site Title</h1>\n</header>", filterText: "<header" },
  { label: "<nav>", type: "keyword", apply: "<nav>\n  <ul>\n    <li><a href=\"#\">Home</a></li>\n    <li><a href=\"#\">About</a></li>\n  </ul>\n</nav>", filterText: "<nav" },
  { label: "<main>", type: "keyword", apply: "<main>\n  \n</main>", filterText: "<main" },
  { label: "<section>", type: "keyword", apply: "<section>\n  <h2>Section Title</h2>\n</section>", filterText: "<section" },
  { label: "<article>", type: "keyword", apply: "<article>\n  <h2>Article Title</h2>\n  <p>Article content...</p>\n</article>", filterText: "<article" },
  { label: "<aside>", type: "keyword", apply: "<aside>\n  <p>Sidebar content...</p>\n</aside>", filterText: "<aside" },
  { label: "<footer>", type: "keyword", apply: "<footer>\n  <p>&copy; 2025</p>\n</footer>", filterText: "<footer" },
  { label: "<h1>", type: "keyword", apply: "<h1>Heading 1</h1>", filterText: "<h1" },
  { label: "<h2>", type: "keyword", apply: "<h2>Heading 2</h2>", filterText: "<h2" },
  { label: "<h3>", type: "keyword", apply: "<h3>Heading 3</h3>", filterText: "<h3" },
  { label: "<p>", type: "keyword", apply: "<p>This is a basic paragraph.</p>", filterText: "<p" },
  { label: "<a>", type: "keyword", apply: "<a href=\"https://\">Link</a>", filterText: "<a" },
  { label: "<img>", type: "keyword", apply: "<img src=\"image.jpg\" alt=\"Description\">", filterText: "<img" },
  { label: "<ul>", type: "keyword", apply: "<ul>\n  <li>Item 1</li>\n  <li>Item 2</li>\n</ul>", filterText: "<ul" },
  { label: "<ol>", type: "keyword", apply: "<ol>\n  <li>First</li>\n  <li>Second</li>\n</ol>", filterText: "<ol" },
  { label: "<li>", type: "keyword", apply: "<li>List item</li>", filterText: "<li" },
  { label: "<form>", type: "keyword", apply: "<form>\n  <input type=\"text\" placeholder=\"Your name\">\n  <button type=\"submit\">Submit</button>\n</form>", filterText: "<form" },
  { label: "<input>", type: "keyword", apply: "<input type=\"text\" placeholder=\"Type here\">", filterText: "<input" },
  { label: "<button>", type: "keyword", apply: "<button>Click me</button>", filterText: "<button" },
  { label: "<table>", type: "keyword", apply: "<table>\n  <tr>\n    <th>Header</th>\n  </tr>\n  <tr>\n    <td>Data</td>\n  </tr>\n</table>", filterText: "<table" },
  { label: "<tr>", type: "keyword", apply: "<tr>\n  <td>Row data</td>\n</tr>", filterText: "<tr" },
  { label: "<td>", type: "keyword", apply: "<td>Cell</td>", filterText: "<td" },
  { label: "<th>", type: "keyword", apply: "<th>Header</th>", filterText: "<th" },
  { label: "<iframe>", type: "keyword", apply: "<iframe src=\"https://\"></iframe>", filterText: "<iframe" },
  { label: "<script>", type: "keyword", apply: "<script>\n  // JS here\n</script>", filterText: "<script" },
  { label: "<style>", type: "keyword", apply: "<style>\n  /* CSS here */\n</style>", filterText: "<style" },
  { label: "<meta>", type: "keyword", apply: "<meta charset=\"UTF-8\">", filterText: "<meta" },
  { label: "<link>", type: "keyword", apply: "<link rel=\"stylesheet\" href=\"style.css\">", filterText: "<link" },
  { label: "<span>", type: "keyword", apply: "<span>Text</span>", filterText: "<span" },
  { label: "<div>", type: "keyword", apply: "<div>\n  \n</div>", filterText: "<div" },
  { label: "<br>", type: "keyword", apply: "<br>", filterText: "<br" },
  { label: "<hr>", type: "keyword", apply: "<hr>", filterText: "<hr" },
  { label: "<strong>", type: "keyword", apply: "<strong>Bold text</strong>", filterText: "<strong" },
  { label: "<em>", type: "keyword", apply: "<em>Italic text</em>", filterText: "<em" },
  { label: "<blockquote>", type: "keyword", apply: "<blockquote>Quote</blockquote>", filterText: "<blockquote" },
  { label: "<pre>", type: "keyword", apply: "<pre>Preformatted text</pre>", filterText: "<pre" },
  { label: "<code>", type: "keyword", apply: "<code>let x = 1;</code>", filterText: "<code" },
  { label: "<details>", type: "keyword", apply: "<details>\n  <summary>More info</summary>\n  <p>Details here.</p>\n</details>", filterText: "<details" },
  { label: "<summary>", type: "keyword", apply: "<summary>Summary</summary>", filterText: "<summary" },
  { label: "<canvas>", type: "keyword", apply: "<canvas width=\"300\" height=\"150\"></canvas>", filterText: "<canvas" },
  { label: "<audio>", type: "keyword", apply: "<audio controls src=\"audio.mp3\"></audio>", filterText: "<audio" },
  { label: "<video>", type: "keyword", apply: "<video controls src=\"video.mp4\"></video>", filterText: "<video" },
  { label: "<select>", type: "keyword", apply: "<select>\n  <option>Option 1</option>\n  <option>Option 2</option>\n</select>", filterText: "<select" },
  { label: "<option>", type: "keyword", apply: "<option>Option</option>", filterText: "<option" },
  { label: "<label>", type: "keyword", apply: "<label for=\"input\">Label</label>", filterText: "<label" },
  { label: "<fieldset>", type: "keyword", apply: "<fieldset>\n  <legend>Legend</legend>\n  <input type=\"text\">\n</fieldset>", filterText: "<fieldset" },
  { label: "<legend>", type: "keyword", apply: "<legend>Legend</legend>", filterText: "<legend" },
  { label: "<mark>", type: "keyword", apply: "<mark>Highlighted</mark>", filterText: "<mark" },
  { label: "<time>", type: "keyword", apply: "<time datetime=\"2025-09-26\">September 26, 2025</time>", filterText: "<time" },
];

const cssCompletions = [
  { label: "center text", type: "keyword", apply: "text-align: center;", filterText: "center" },
  { label: "flexbox", type: "keyword", apply: "display: flex;\njustify-content: center;\nalign-items: center;", filterText: "flex" },
  // Add more as needed
];

const jsCompletions = [
  { label: "console.log", type: "keyword", apply: "console.log('');", filterText: "log" },
  { label: "for loop", type: "keyword", apply: "for (let i = 0; i < 10; i++) {\n  \n}", filterText: "for" },
  // Add more as needed
];

const getHtmlExtensions = () => [
  html(),
  indentOnInput(),
  highlightActiveLineGutter(),
  autocompletion({ override: [completeFromList(htmlCompletions)], activateOnTyping: true }),
];

const getCssExtensions = () => [
  css(),
  autocompletion({ override: [completeFromList(cssCompletions)], activateOnTyping: true }),
];

const getJsExtensions = () => [
  autocompletion({ override: [completeFromList(jsCompletions)], activateOnTyping: true }),
];

// --- PLAYGROUND PAGE LOGIC ---
export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "browser">("html");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [output, setOutput] = useState("");
  const [projects, setProjects] = useState<{name: string, html: string, css: string, js: string}[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [projectName, setProjectName] = useState("");

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
    setProjectName("");
  };

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
            height="400px"
            theme={oneDark}
            extensions={getHtmlExtensions()}
            onChange={value => setHtmlCode(value)}
          />
        )}
        {activeTab === "css" && (
          <CodeMirror
            value={cssCode}
            height="400px"
            theme={oneDark}
            extensions={getCssExtensions()}
            onChange={value => setCssCode(value)}
          />
        )}
        {activeTab === "js" && (
          <CodeMirror
            value={jsCode}
            height="400px"
            theme={oneDark}
            extensions={getJsExtensions()}
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
          />
        )}
      </div>
      <div className={styles.playgroundActionsWrapper}>
        <div className={styles.playgroundActions}>
          <input
            type="text"
            placeholder="Project name"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className={styles.projectInput}
          />
          <button onClick={handleSaveProject} className={styles.toggleButton}>
            Save Project
          </button>
          <button onClick={() => setShowProjects(true)} className={styles.toggleButton}>
            My Projects
          </button>
        </div>
      </div>
      {showProjects && (
        <div className={styles.projectsModal}>
          <h2>My Projects</h2>
          <ul>
            {projects.map((proj, idx) => (
              <li key={idx} className={styles.projectListItem}>
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
                    setShowProjects(false);
                  }}
                >
                  Load Project
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setShowProjects(false)}>Close</button>
        </div>
      )}
    </main>
  );
}