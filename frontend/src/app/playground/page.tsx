"use client";
import React, { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import styles from "./Playground.module.css";
import StructureGuide from "./StructureGuide";

const PlaygroundEditor = dynamic(() => import('./PlaygroundEditor'), { ssr: false });

// Module-level guard: prevents Pyodide from being loaded twice in StrictMode
let _pyodideInjected = false;

type Mode = null | "web" | "python";

export default function PlaygroundPage() {
  const [mode, setMode] = useState<Mode>(null);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "browser">("html");
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [output, setOutput] = useState("");
  // Per-tab file names ('' = no file created yet)
  const [htmlFileName, setHtmlFileName] = useState("");
  const [cssFileName, setCssFileName] = useState("");
  const [jsFileName, setJsFileName] = useState("");
  const [projects, setProjects] = useState<{htmlName: string, cssName: string, jsName: string, html: string, css: string, js: string}[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [showPyStructure, setShowPyStructure] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [fade, setFade] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  // Naming input state — starts in naming mode so form shows immediately
  const [namingMode, setNamingMode] = useState(true);
  const [namingValue, setNamingValue] = useState("");
  const newFileInputRef = useRef<HTMLInputElement>(null);

  // ── Python state ──
  const [pyCode, setPyCode] = useState("# Write your Python here\nprint('Hello, NexusCode!')\n");
  const [pyOutput, setPyOutput] = useState("");
  const [pyRunning, setPyRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef<any>(null);
  const [pyFileName, setPyFileName] = useState("");

  // ── Python projects state ──
  const [pyProjects, setPyProjects] = useState<{name: string, code: string}[]>([]);
  const [showPyProjects, setShowPyProjects] = useState(false);
  const [pySearchTerm, setPySearchTerm] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("playgroundProjects");
      if (saved) setProjects(JSON.parse(saved));
    } catch {}
    try {
      const savedPy = localStorage.getItem("playgroundPyProjects");
      if (savedPy) setPyProjects(JSON.parse(savedPy));
    } catch {}
    // Always start fresh; earlier work is reopened from Files
    try {
      localStorage.removeItem("playgroundWebDraft");
      localStorage.removeItem("playgroundPyDraft");
      localStorage.removeItem("playgroundLastMode");
    } catch {}
    setDraftLoaded(true);
  }, []);

  // ── Autosave: drafts always, and the saved project too once it has a file name ──
  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        if (mode === "web" && (htmlFileName || cssFileName || jsFileName)) handleSaveProject(true);
        if (mode === "python" && pyFileName) handleSavePyProject(true);
        setSavedAt(Date.now());
      } catch {}
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftLoaded, mode, htmlCode, cssCode, jsCode, htmlFileName, cssFileName, jsFileName, pyCode, pyFileName]);

  // ── Load Pyodide when Python mode is selected ──
  useEffect(() => {
    if (mode !== "python") return;
    if (pyodideRef.current || pyodideReady) return;
    if (_pyodideInjected) return;
    _pyodideInjected = true;
    let cancelled = false;
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/pyodide/v0.27.4/full/pyodide.js";
    script.onload = async () => {
      if (cancelled) return;
      const py = await (window as any).loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.27.4/full/",
      });
      if (cancelled) return;
      pyodideRef.current = py;
      setPyodideReady(true);
    };
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [mode, pyodideReady]);

  const handleRunPython = async () => {
    if (!pyodideRef.current || pyRunning) return;
    setPyRunning(true);
    setPyOutput("");
    try {
      let captured = "";
      pyodideRef.current.setStdout({ batched: (s: string) => { captured += s + "\n"; } });
      pyodideRef.current.setStderr({ batched: (s: string) => { captured += s + "\n"; } });
      await pyodideRef.current.runPythonAsync(pyCode);
      setPyOutput(captured || "(no output)");
    } catch (e: any) {
      setPyOutput(e.message ?? String(e));
    } finally {
      setPyRunning(false);
    }
  };

  const handleRun = () => {
    const css = `<style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>`;
    const js = `<script>${jsCode.replace(/<\/script>/gi, '<\\/script>')}<\/script>`;
    let doc = htmlCode;
    // Keep <!DOCTYPE> first so the preview renders in standards mode, not quirks mode
    if (/<\/head>/i.test(doc)) doc = doc.replace(/<\/head>/i, () => `${css}</head>`);
    else if (/<body[\s>]/i.test(doc)) doc = doc.replace(/<body[\s>]/i, m => `${css}${m}`);
    else doc = `<!DOCTYPE html><html><head><meta charset="UTF-8">${css}</head><body>${doc}</body></html>`;
    doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, () => `${js}</body>`) : doc + js;
    setOutput(doc);
  };

  const handleTabClick = (tab: "html" | "css" | "js" | "browser") => {
    if (tab === "browser") handleRun();
    setActiveTab(tab);
    setNamingMode(false);
  };

  const handleSavePyProject = (silent = false) => {
    if (!pyFileName) return;
    const existingIdx = pyProjects.findIndex(p => p.name === pyFileName);
    const updated = existingIdx >= 0
      ? pyProjects.map((p, i) => i === existingIdx ? { ...p, code: pyCode } : p)
      : [...pyProjects, { name: pyFileName, code: pyCode }];
    setPyProjects(updated);
    localStorage.setItem('playgroundPyProjects', JSON.stringify(updated));
  };

  const handleNewPyProject = () => {
    setPyCode("");
    setPyFileName("");
    setPyOutput("");
    setNamingValue("");
    setNamingMode(true);
    setShowPyProjects(false);
  };

  const handleNewProject = () => {
    setHtmlCode(""); setCssCode(""); setJsCode("");
    setHtmlFileName(""); setCssFileName(""); setJsFileName("");
    setOutput("");
    setActiveTab("html");
    setNamingValue("");
    setNamingMode(true);
    setShowProjects(false);
  };

  const handleDeletePyProject = (idx: number) => {
    const updated = pyProjects.filter((_, i) => i !== idx);
    setPyProjects(updated);
    localStorage.setItem("playgroundPyProjects", JSON.stringify(updated));
  };

  const filteredPyProjects = pySearchTerm
    ? pyProjects.filter(p => p.name.toLowerCase().includes(pySearchTerm.toLowerCase()))
    : pyProjects;

  const handleSaveProject = (silent = false) => {
    const primaryName = htmlFileName || cssFileName || jsFileName;
    if (!primaryName) return;
    const newProj = { htmlName: htmlFileName, cssName: cssFileName, jsName: jsFileName, html: htmlCode, css: cssCode, js: jsCode };
    const existingIdx = projects.findIndex(p => (p.htmlName || p.cssName || p.jsName) === primaryName);
    const updated = existingIdx >= 0
      ? projects.map((p, i) => i === existingIdx ? newProj : p)
      : [...projects, newProj];
    setProjects(updated);
    localStorage.setItem('playgroundProjects', JSON.stringify(updated));
  };

  const handleDeleteProject = (idx: number) => {
    const updated = projects.filter((_, i) => i !== idx);
    setProjects(updated);
    localStorage.setItem("playgroundProjects", JSON.stringify(updated));
  };

  // Filter projects by search term
  const filteredProjects = searchTerm
    ? projects.filter(proj =>
        (proj.htmlName || proj.cssName || proj.jsName || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projects;

  // ── Language config ──
  const LANG_COLORS: Record<string, string> = { html: '#f97316', css: '#06b6d4', js: '#f59e0b' };
  const LANG_EXT: Record<string, string> = { html: '.html', css: '.css', js: '.js' };

  const currentTabFileName =
    activeTab === 'html' ? htmlFileName :
    activeTab === 'css'  ? cssFileName  :
    activeTab === 'js'   ? jsFileName   : '';

  const handleCreateFile = (e?: React.FormEvent) => {
    e?.preventDefault();
    const raw = namingValue.trim();
    if (!raw) return;
    if (mode === 'python') {
      setPyFileName(raw.endsWith('.py') ? raw : `${raw}.py`);
    } else {
      const ext = LANG_EXT[activeTab] ?? '';
      const name = (ext && !raw.endsWith(ext)) ? `${raw}${ext}` : raw;
      if (activeTab === 'html') setHtmlFileName(name);
      else if (activeTab === 'css') setCssFileName(name);
      else if (activeTab === 'js') setJsFileName(name);
    }
    setNamingValue('');
    setNamingMode(false);
  };

  // Auto-focus naming input
  useEffect(() => {
    if (namingMode) newFileInputRef.current?.focus();
  }, [namingMode]);

  // ── Categorised tips ──
  const WEB_TIPS: { type: 'web'; text: string }[] = [
    { type: 'web', text: 'Wrap everything in a <div> to group elements and apply shared styles.' },
    { type: 'web', text: 'Use CSS custom properties (--color: red) to reuse values across your stylesheet.' },
    { type: 'web', text: 'Flexbox tip: add display:flex + gap:1rem to space children evenly without margins.' },
    { type: 'web', text: 'Always give <img> an alt attribute — it helps accessibility and SEO.' },
    { type: 'web', text: 'console.log() is your best friend — print values to debug your JS.' },
    { type: 'web', text: 'Use rem units instead of px so text scales with the user\'s browser settings.' },
    { type: 'web', text: 'The :hover pseudo-class lets you style an element when the mouse is over it.' },
    { type: 'web', text: 'Use addEventListener(\'click\', fn) to react to user interactions.' },
    { type: 'web', text: 'CSS Grid is great for 2D layouts; Flexbox is better for 1D rows or columns.' },
    { type: 'web', text: 'document.querySelector() grabs the first element matching your CSS selector.' },
    { type: 'web', text: 'Template literals (`Hello ${name}`) keep string concatenation readable.' },
    { type: 'web', text: 'border-box box-sizing means padding is included in width — far more predictable.' },
  ];

  const PYTHON_TIPS: { type: 'python'; text: string }[] = [
    { type: 'python', text: 'Use f-strings (f"Hello {name}") for clean string formatting.' },
    { type: 'python', text: 'List comprehensions are Pythonic: [x*2 for x in range(10)].' },
    { type: 'python', text: 'print() accepts multiple args: print("a", "b") prints them space-separated.' },
    { type: 'python', text: 'Use len() to get the length of a list, string, or dict.' },
    { type: 'python', text: 'range(start, stop, step) — the stop value is exclusive.' },
    { type: 'python', text: 'Indent with 4 spaces — Python uses indentation as syntax, not style.' },
    { type: 'python', text: 'Use type() to check what type a variable is: type(42) returns <class \'int\'>.' },
    { type: 'python', text: 'Dictionaries let you map keys to values: {"name": "Alex", "age": 20}.' },
    { type: 'python', text: 'Use try/except to handle errors gracefully without crashing.' },
    { type: 'python', text: 'Functions defined with def can return values using return.' },
    { type: 'python', text: 'Strings are immutable — s.upper() returns a new string, it doesn\'t change s.' },
    { type: 'python', text: 'enumerate() gives you both index and value: for i, v in enumerate(lst).' },
  ];

  const GENERAL_TIPS: { type: 'general'; text: string }[] = [
    { type: 'general', text: 'Save your work often — use the 💾 button to keep your files.' },
    { type: 'general', text: 'Click the Files drawer to reload any previously saved project.' },
    { type: 'general', text: 'Complete lessons in the Learn tab to unlock XP and achievements.' },
    { type: 'general', text: 'The Nexus Path shows your full learning roadmap at a glance.' },
    { type: 'general', text: 'Head to the Store to spend your credits on themes and boosts.' },
    { type: 'general', text: 'Your streak resets if you miss a day — keep the chain going!' },
  ];

  const activeTips = mode === 'python'
    ? [...PYTHON_TIPS, ...GENERAL_TIPS]
    : [...WEB_TIPS, ...GENERAL_TIPS];

  const TIP_COLORS = { web: '#f97316', python: '#10b981', general: '#818cf8' };

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setTipIndex(prev => (prev + 1) % activeTips.length);
        setFade(true);
      }, 700);
    }, 12000);
    return () => clearInterval(interval);
  }, [activeTips.length]);

  const displayedTip = activeTips[tipIndex % activeTips.length];

  // ── Mode picker ──
  if (mode === null) {
    return (
      <main className={styles.pickerMain}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.dotGrid} />
        <div className={styles.pickerContainer}>
          <div className={styles.pickerHeader}>
            <span className={styles.pickerBadge}>PLAYGROUND</span>
            <h1 className={styles.pickerTitle}>What are you building?</h1>
            <p className={styles.pickerSubtitle}>Choose a project type to get started.</p>
          </div>
          <div className={styles.pickerGrid}>
            <button className={`${styles.pickerCard} ${styles.pickerCardWeb}`} onClick={() => setMode("web")}>
              <div className={styles.pickerCardBody}>
                <span className={`${styles.pickerMicroLabel} ${styles.pickerMicroLabelWeb}`}>Web / Browser</span>
                <p className={styles.pickerCardTitle}>HTML</p>
                <p className={styles.pickerCardSubtitle}>Fundamentals</p>
                <p className={styles.pickerCardDesc}>Build web pages, layouts, and interactive UI with a live preview.</p>
              </div>
              <span className={styles.pickerArrow}>→</span>
            </button>
            <button className={`${styles.pickerCard} ${styles.pickerCardPython}`} onClick={() => setMode("python")}>
              <div className={styles.pickerCardBody}>
                <span className={styles.pickerMicroLabel}>Runtime / browser</span>
                <p className={styles.pickerCardTitle}>Python</p>
                <p className={styles.pickerCardDesc}>Scripts, algorithms, data — run Python right in the browser.</p>
              </div>
              <span className={styles.pickerArrow}>→</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Python editor ──
  if (mode === "python") {
    return (
      <main className={styles.main}>
        <div className={`${styles.tipsBox} ${fade ? styles.fadeIn : styles.fadeOut}`}>
          <strong style={{ color: TIP_COLORS[displayedTip.type] }}>Tip</strong>{displayedTip.text}
        </div>
        <div className={styles.topBar}>
          <button onClick={() => setMode(null)} className={styles.backBtn} aria-label="Back">←</button>
          {namingMode ? (
            <form className={styles.fileArea} onSubmit={handleCreateFile}>
              <span className={styles.extBadge} style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>.py</span>
              <input
                ref={newFileInputRef}
                type="text"
                placeholder="script.py"
                value={namingValue}
                onChange={e => setNamingValue(e.target.value)}
                className={styles.fileNameInput}
              />
              <button type="submit" className={styles.createBtn}>Create</button>
              <button type="button" className={styles.cancelNaming} onClick={() => { setNamingMode(false); setNamingValue(''); }}>✕</button>
            </form>
          ) : pyFileName ? (
            <div className={styles.fileArea}>
              <span className={styles.extBadge} style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>.py</span>
              <span className={styles.fileNamePill} style={{ color: '#10b981' }}>{pyFileName}</span>
              <button onClick={() => handleSavePyProject()} className={styles.saveIconBtn} title="Save">💾</button>
            </div>
          ) : null}
          <div className={styles.topBarActions}>
                        <span className={styles.autoSaved}>{savedAt ? "Autosaved ✓" : ""}</span>
            <button onClick={() => setShowPyStructure(v => !v)} className={styles.toggleButton}>Cheat Sheet</button>
            <button onClick={() => setShowPyProjects(v => !v)} className={styles.toggleButton}>Files</button>
            <button
              onClick={handleRunPython}
              disabled={pyRunning || !pyodideReady}
              className={styles.runBtn}
            >
              {!pyodideReady ? "Loading…" : pyRunning ? "Running…" : "▶ Run"}
            </button>
          </div>
        </div>

        {showPyStructure && (
          <StructureGuide
            language="py"
            onClose={() => setShowPyStructure(false)}
            onInsert={code => setPyCode(prev => prev.trim() ? `${prev.replace(/\s+$/, '')}\n\n${code}` : code)}
          />
        )}

        {/* ── Python Projects drawer ── */}
        {showPyProjects && (
          <div className={styles.drawerOverlay} onClick={() => setShowPyProjects(false)}>
            <div className={styles.drawer} onClick={e => e.stopPropagation()}>
              <div className={styles.drawerHeader}>
                <span className={styles.drawerTitle}>🐍 Python Files</span>
                <button className={styles.drawerClose} onClick={() => setShowPyProjects(false)} aria-label="Close">✕</button>
              </div>
              <button className={styles.drawerNew} onClick={handleNewPyProject}>＋ New file</button>
              <input
                type="text"
                placeholder="Search files…"
                value={pySearchTerm}
                onChange={e => setPySearchTerm(e.target.value)}
                className={styles.drawerSearch}
              />
              <div className={styles.drawerList}>
                {filteredPyProjects.length === 0 ? (
                  <div className={styles.drawerEmpty}>
                    <span className={styles.drawerEmptyIcon}>📂</span>
                    <p>No saved Python files yet.</p>
                    <p className={styles.drawerEmptyHint}>Save a file to see it here.</p>
                  </div>
                ) : filteredPyProjects.map((proj, idx) => (
                  <div key={idx} className={styles.drawerFile}>
                    <span className={styles.drawerFileIcon}>🐍</span>
                    <div className={styles.drawerFileInfo}>
                      <span className={styles.drawerFileName}>{proj.name}</span>
                      <span className={styles.drawerFilePreview}>{proj.code?.split('\n')[0]?.slice(0, 50) || ''}</span>
                    </div>
                    <div className={styles.drawerFileBtns}>
                      <button className={styles.drawerLoad} onClick={() => { setPyCode(proj.code); setPyFileName(proj.name); setShowPyProjects(false); }}>Open</button>
                      <button className={styles.drawerDelete} onClick={() => handleDeletePyProject(pyProjects.indexOf(proj))}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={styles.pyLayout}>
          <div className={styles.pyEditorPane}>
            <PlaygroundEditor
              value={pyCode}
              language="python"
              onChange={v => setPyCode(v)}
              className={styles.codeEditor}
            />
          </div>
          <div className={styles.pyOutputPane}>
            <div className={styles.pyOutputHeader}>OUTPUT</div>
            <pre className={styles.pyOutputBody}>{pyOutput || (pyodideReady ? "Click ▶ Run to execute your code." : "Loading Python runtime…")}</pre>
          </div>
        </div>
      </main>
    );
  }

  // ── Web editor ──
  return (
    <main className={styles.main}>
      {/* ── Top bar ── */}
      <div className={styles.topBar}>
        <button onClick={() => setMode(null)} className={styles.backBtn} aria-label="Back">←</button>
        {namingMode ? (
          <form className={styles.fileArea} onSubmit={handleCreateFile}>
            <span className={styles.extBadge} style={{ color: LANG_COLORS[activeTab] || '#94a3b8', borderColor: (LANG_COLORS[activeTab] || '#334155') + '44' }}>
              {LANG_EXT[activeTab] || '.html'}
            </span>
            <input
              ref={newFileInputRef}
              type="text"
              placeholder={activeTab === 'css' ? 'style.css' : activeTab === 'js' ? 'app.js' : 'index.html'}
              value={namingValue}
              onChange={e => setNamingValue(e.target.value)}
              className={styles.fileNameInput}
            />
            <button type="submit" className={styles.createBtn}>Create</button>
            <button type="button" className={styles.cancelNaming} onClick={() => { setNamingMode(false); setNamingValue(''); }}>✕</button>
          </form>
        ) : currentTabFileName ? (
          <div className={styles.fileArea}>
            <span className={styles.extBadge} style={{ color: LANG_COLORS[activeTab], borderColor: (LANG_COLORS[activeTab]) + '44' }}>
              {LANG_EXT[activeTab]}
            </span>
            <span className={styles.fileNamePill} style={{ color: LANG_COLORS[activeTab] }}>{currentTabFileName}</span>
            <button onClick={() => handleSaveProject()} className={styles.saveIconBtn} title="Save">💾</button>
          </div>
        ) : null}
        <div className={styles.topBarActions}>
                    <span className={styles.autoSaved}>{savedAt ? "Autosaved ✓" : ""}</span>
          <button onClick={() => setShowStructure(v => !v)} className={styles.toggleButton}>Cheat Sheet</button>
          <button onClick={() => setShowProjects(!showProjects)} className={styles.toggleButton}>Files</button>
        </div>
      </div>

      {/* ── Editor tabs ── */}
      <div className={styles.editorTabs}>
        <button className={activeTab === "html" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("html")}>HTML</button>
        <button className={activeTab === "css" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("css")}>CSS</button>
        <button className={activeTab === "js" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("js")}>JavaScript</button>
        <button className={activeTab === "browser" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("browser")}>Preview</button>
      </div>

      {/* ── Editor / Preview ── */}
      <div className={styles.editorContainer}>
        {activeTab === "html" && (
          <PlaygroundEditor value={htmlCode} language="html" onChange={value => setHtmlCode(value)} className={styles.codeEditor} />
        )}
        {activeTab === "css" && (
          <PlaygroundEditor value={cssCode} language="css" onChange={value => setCssCode(value)} className={styles.codeEditor} />
        )}
        {activeTab === "js" && (
          <PlaygroundEditor value={jsCode} language="js" onChange={value => setJsCode(value)} className={styles.codeEditor} />
        )}
        {activeTab === "browser" && (
          <iframe title="output" srcDoc={output} className={styles.browserFrame} />
        )}
      </div>

      {showStructure && activeTab !== 'browser' && (
        <StructureGuide
          language={activeTab}
          onClose={() => setShowStructure(false)}
          onInsert={code => {
            const append = (prev: string) => prev.trim() ? `${prev.replace(/\s+$/, '')}\n\n${code}` : code;
            if (activeTab === 'css') setCssCode(append);
            else if (activeTab === 'js') setJsCode(append);
            else setHtmlCode(append);
          }}
        />
      )}

      {/* ── Web Projects drawer ── */}
      {showProjects && (
        <div className={styles.drawerOverlay} onClick={() => setShowProjects(false)}>
          <div className={styles.drawer} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>🌐 Web Files</span>
              <button className={styles.drawerClose} onClick={() => setShowProjects(false)} aria-label="Close">✕</button>
            </div>
            <button className={styles.drawerNew} onClick={handleNewProject}>＋ New project</button>
            <input
              type="text"
              placeholder="Search files…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className={styles.drawerSearch}
            />
            <div className={styles.drawerList}>
              {filteredProjects.length === 0 ? (
                <div className={styles.drawerEmpty}>
                  <span className={styles.drawerEmptyIcon}>📂</span>
                  <p>No saved web files yet.</p>
                  <p className={styles.drawerEmptyHint}>Save a file to see it here.</p>
                </div>
              ) : filteredProjects.map((proj, idx) => (
                <div key={idx} className={styles.drawerFile}>
                  <span className={styles.drawerFileIcon}>🌐</span>
                  <div className={styles.drawerFileInfo}>
                    <span className={styles.drawerFileName}>{proj.htmlName || proj.cssName || proj.jsName || 'untitled'}</span>
                    <span className={styles.drawerFilePreview}>{proj.html?.split('\n')[0]?.slice(0, 50) || ''}</span>
                  </div>
                  <div className={styles.drawerFileBtns}>
                    <button className={styles.drawerLoad} onClick={() => { setHtmlCode(proj.html); setCssCode(proj.css); setJsCode(proj.js); setHtmlFileName(proj.htmlName || ''); setCssFileName(proj.cssName || ''); setJsFileName(proj.jsName || ''); setShowProjects(false); }}>Open</button>
                    <button className={styles.drawerDelete} onClick={() => handleDeleteProject(projects.indexOf(proj))}>✕</button>
                  </div>
                </div>
              ))}
            </div> 
          </div>
        </div>
      )}

      {/* ── Tips bar ── */}
      <div className={`${styles.tipsBox} ${fade ? styles.fadeIn : styles.fadeOut}`}>
        <strong style={{ color: TIP_COLORS[displayedTip.type] }}>Tip</strong>{displayedTip.text}
      </div>
    </main>
  );
}