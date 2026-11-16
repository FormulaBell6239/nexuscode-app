"use client";
import React, { useState, useEffect, useRef } from "react";
import StatIcon from "@/components/StatIcon";
import dynamic from "next/dynamic";
import styles from "./Playground.module.css";
import HtmlCheatSheet from './HtmlCheatSheet';
import ColorTable from './ColorTable';
import AutosaveIndicator from './AutosaveIndicator';
import { setProjectContext } from '../../lib/ghostLocal';
import PlaygroundTour from './PlaygroundTour';
import StructureGuide from "./StructureGuide";
import { usePreviewMode, previewBaseStyle, PreviewModeToggle } from "../curriculum/LivePreview";
import PlaygroundNameKeyboard from "./PlaygroundNameKeyboard";

const PlaygroundEditor = dynamic(() => import('./PlaygroundEditor'), { ssr: false });

// Module-level guard: prevents Pyodide from being loaded twice in StrictMode
let _pyodideInjected = false;

type Mode = null | "web" | "python";
type WebLanguage = "html" | "css" | "js";
type MobileMenu = "files" | "more" | null;

export default function PlaygroundPage() {
  const [mode, setMode] = useState<Mode>(null);
  const [activeTab, setActiveTab] = useState<"html" | "css" | "js" | "browser">("html");
  const [lastWebTab, setLastWebTab] = useState<WebLanguage>("html");
  const [mobileMenu, setMobileMenu] = useState<MobileMenu>(null);
  const [mobileLayout, setMobileLayout] = useState(false);
  const mobileHeaderRef = useRef<HTMLDivElement>(null);
  const mobileFilesButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMoreButtonRef = useRef<HTMLButtonElement>(null);
  const [htmlCode, setHtmlCode] = useState("");
  const [cssCode, setCssCode] = useState("");
  const [jsCode, setJsCode] = useState("");
  const [output, setOutput] = useState("");
  // Per-tab file names ('' = no file created yet)
  const [webFolder, setWebFolder] = useState("");
  const [folderInput, setFolderInput] = useState("");
  const [htmlFileName, setHtmlFileName] = useState("");
  const [cssFileName, setCssFileName] = useState("");
  const [jsFileName, setJsFileName] = useState("");
  const [projects, setProjects] = useState<{folder?: string, htmlName: string, cssName: string, jsName: string, html: string, css: string, js: string}[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [showStructure, setShowStructure] = useState(false);
  const [showPyStructure, setShowPyStructure] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [ghostTextEnabled, setGhostTextEnabled] = useState(true);
  useEffect(() => { setProjectContext({ html: htmlCode, css: cssCode, js: jsCode }); }, [htmlCode, cssCode, jsCode]);
  const [showAutosaveNote, setShowAutosaveNote] = useState(false);
  const [introState, setIntroState] = useState<'hidden' | 'ask'>('hidden');
  const [tourOn, setTourOn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [fade, setFade] = useState(true);
  const [tipIndex, setTipIndex] = useState(0);
  // Naming input state — starts in naming mode so form shows immediately
  const [namingMode, setNamingMode] = useState(true);
  const [namingValue, setNamingValue] = useState("");
  const newFileInputRef = useRef<HTMLInputElement>(null);
  const activeNameInputRef = useRef<HTMLInputElement | null>(null);
  const nameKeyboardRef = useRef<HTMLDivElement | null>(null);
  const activeNameChangeRef = useRef<(value: string) => void>(() => {});
  const [nameKeyboardOpen, setNameKeyboardOpen] = useState(false);
  const [touchInput, setTouchInput] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setMobileLayout(media.matches);
      if (!media.matches) setMobileMenu(null);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(pointer: coarse)");
    const update = () => setTouchInput(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!nameKeyboardOpen) return;
    const dismiss = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && !activeNameInputRef.current?.contains(target) && !nameKeyboardRef.current?.contains(target)) {
        setNameKeyboardOpen(false);
      }
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [nameKeyboardOpen]);

  useEffect(() => {
    if (!mobileMenu) return;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !mobileHeaderRef.current?.contains(event.target) &&
        !nameKeyboardRef.current?.contains(event.target)
      ) {
        setMobileMenu(null);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileMenu(null);
      (mobileMenu === "files" ? mobileFilesButtonRef : mobileMoreButtonRef).current?.focus();
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [mobileMenu]);

  // ── Python state ──
  const [pyCode, setPyCode] = useState("# Write your Python here\nprint('Hello, NexusCode!')\n");
  const [pyOutput, setPyOutput] = useState("");
  const [pyRunning, setPyRunning] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const pyodideRef = useRef<any>(null);
  const [pyFileName, setPyFileName] = useState("");
  const [pyFolder, setPyFolder] = useState("");

  // ── Python projects state ──
  const [pyProjects, setPyProjects] = useState<{folder?: string, name: string, code: string}[]>([]);
  const [showPyProjects, setShowPyProjects] = useState(false);
  const [pySearchTerm, setPySearchTerm] = useState("");

  useEffect(() => {
    try {
      setGhostTextEnabled(localStorage.getItem("playgroundGhostText") !== "off");
    } catch (error) {
      console.warn("Could not load the ghost text preference.", error);
    }
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
    try {
      if (!localStorage.getItem("playgroundIntroSeen")) setIntroState('ask');
    } catch {}
    setDraftLoaded(true);
  }, []);

  const toggleGhostText = () => {
    const enabled = !ghostTextEnabled;
    setGhostTextEnabled(enabled);
    try {
      localStorage.setItem("playgroundGhostText", enabled ? "on" : "off");
    } catch (error) {
      console.warn("Could not save the ghost text preference.", error);
    }
  };

  const ghostTextControl = (
    <button
      type="button"
      className={styles.ghostToggle}
      aria-pressed={ghostTextEnabled}
      onClick={toggleGhostText}
      title="Turn inline ghost text suggestions on or off"
    >
      Ghost text: {ghostTextEnabled ? "On" : "Off"}
    </button>
  );

  const closeIntro = () => {
    try { localStorage.setItem("playgroundIntroSeen", "1"); } catch {}
    setIntroState('hidden');
    setTourOn(false);
  };

  const startTour = () => {
    setIntroState('hidden');
    setTourOn(true);
  };

  // The autosave note is a one-time heads-up that disappears on its own
  useEffect(() => {
    if (!showAutosaveNote) return;
    const t = setTimeout(() => setShowAutosaveNote(false), 6000);
    return () => clearTimeout(t);
  }, [showAutosaveNote]);

  // ── Autosave: drafts always, and the saved project too once it has a file name ──
  useEffect(() => {
    if (!draftLoaded) return;
    const t = setTimeout(() => {
      try {
        if (mode === "web" && webFolder) handleSaveProject(true);
        if (mode === "python" && pyFolder) handleSavePyProject(true);
      } catch {}
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftLoaded, mode, htmlCode, cssCode, jsCode, htmlFileName, cssFileName, jsFileName, pyCode, pyFileName, webFolder, pyFolder]);

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

  const preview = usePreviewMode();

  const buildPreview = () => {
    const css = `${previewBaseStyle(preview.mode)}<style>${cssCode.replace(/<\/style>/gi, '<\\/style>')}</style>`;
    const js = `<script>${jsCode.replace(/<\/script>/gi, '<\\/script>')}<\/script>`;
    let doc = htmlCode;
    // Keep <!DOCTYPE> first so the preview renders in standards mode, not quirks mode
    if (/<\/head>/i.test(doc)) doc = doc.replace(/<\/head>/i, () => `${css}</head>`);
    else if (/<body[\s>]/i.test(doc)) doc = doc.replace(/<body[\s>]/i, m => `${css}${m}`);
    else doc = `<!DOCTYPE html><html><head><meta charset="UTF-8">${css}</head><body>${doc}</body></html>`;
    return /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, () => `${js}</body>`) : doc + js;
  };

  const handleRun = () => setOutput(buildPreview());

  // Keep the preview in sync with the code (debounced) so it never shows stale output
  useEffect(() => {
    if (mode !== "web") return;
    const t = setTimeout(() => setOutput(buildPreview()), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, htmlCode, cssCode, jsCode, preview.mode]);

  const handleTabClick = (tab: "html" | "css" | "js" | "browser") => {
    if (tab === "browser") handleRun();
    else setLastWebTab(tab);
    setActiveTab(tab);
    const nameForTab = tab === "html" ? htmlFileName : tab === "css" ? cssFileName : tab === "js" ? jsFileName : "x";
    setNamingMode(!nameForTab);
    setNamingValue("");
  };

  const handleSavePyProject = (silent = false) => {
    if (!pyFolder) return;
    const entry = { folder: pyFolder, name: pyFileName, code: pyCode };
    const existingIdx = pyProjects.findIndex(p => (p.folder ?? p.name) === pyFolder);
    const updated = existingIdx >= 0
      ? pyProjects.map((p, i) => i === existingIdx ? entry : p)
      : [...pyProjects, entry];
    setPyProjects(updated);
    localStorage.setItem('playgroundPyProjects', JSON.stringify(updated));
  };

  const handleNewPyProject = () => {
    setPyCode("");
    setPyFileName("");
    setPyFolder("");
    setFolderInput("");
    setPyOutput("");
    setNamingValue("");
    setNamingMode(true);
    setShowPyProjects(false);
  };

  const handleNewProject = () => {
    setHtmlCode(""); setCssCode(""); setJsCode("");
    setHtmlFileName(""); setCssFileName(""); setJsFileName("");
    setWebFolder(""); setFolderInput("");
    setOutput("");
    setActiveTab("html");
    setLastWebTab("html");
    setNamingValue("");
    setNamingMode(true);
    setShowProjects(false);
    if (mobileLayout) setMobileMenu("files");
  };

  const handleDeletePyProject = (idx: number) => {
    const p = pyProjects[idx];
    if (!p || !window.confirm(`Delete "${p.folder ?? p.name}"? This permanently removes the project and can't be undone.`)) return;
    const updated = pyProjects.filter((_, i) => i !== idx);
    setPyProjects(updated);
    localStorage.setItem("playgroundPyProjects", JSON.stringify(updated));
  };

  const filteredPyProjects = pySearchTerm
    ? pyProjects.filter(p => (p.folder ?? p.name).toLowerCase().includes(pySearchTerm.toLowerCase()))
    : pyProjects;

  const handleSaveProject = (silent = false) => {
    if (!webFolder) return;
    const newProj = { folder: webFolder, htmlName: htmlFileName, cssName: cssFileName, jsName: jsFileName, html: htmlCode, css: cssCode, js: jsCode };
    const existingIdx = projects.findIndex(p => (p.folder ?? (p.htmlName || p.cssName || p.jsName)) === webFolder);
    const updated = existingIdx >= 0
      ? projects.map((p, i) => i === existingIdx ? newProj : p)
      : [...projects, newProj];
    setProjects(updated);
    localStorage.setItem('playgroundProjects', JSON.stringify(updated));
  };

  const handleDeleteProject = (idx: number) => {
    const p = projects[idx];
    if (!p || !window.confirm(`Delete "${p.folder ?? (p.htmlName || p.cssName || p.jsName || 'this project')}"? This permanently removes the project and can't be undone.`)) return;
    const updated = projects.filter((_, i) => i !== idx);
    setProjects(updated);
    localStorage.setItem("playgroundProjects", JSON.stringify(updated));
  };

  // Filter projects by search term
  const filteredProjects = searchTerm
    ? projects.filter(proj =>
        (proj.folder ?? (proj.htmlName || proj.cssName || proj.jsName || '')).toLowerCase().includes(searchTerm.toLowerCase())
      )
    : projects;

  // ── Language config ──
  const LANG_COLORS: Record<string, string> = { html: '#f97316', css: '#06b6d4', js: '#f59e0b' };
  const LANG_EXT: Record<string, string> = { html: '.html', css: '.css', js: '.js' };

  const currentTabFileName =
    activeTab === 'html' ? htmlFileName :
    activeTab === 'css'  ? cssFileName  :
    activeTab === 'js'   ? jsFileName   : '';
  const mobileLanguage = activeTab === "browser" ? lastWebTab : activeTab;
  const webFiles: { language: WebLanguage; label: string; name: string }[] = [
    { language: "html", label: "HTML", name: htmlFileName },
    { language: "css", label: "CSS", name: cssFileName },
    { language: "js", label: "JS", name: jsFileName },
  ];
  const mobileFile = webFiles.find(file => file.language === mobileLanguage);

  const selectMobileLanguage = (language: WebLanguage) => {
    handleTabClick(language);
    setMobileMenu(webFiles.find(file => file.language === language)?.name ? null : "files");
  };

  const handleCreateFolder = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = folderInput.trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '-');
    if (!name) return;
    if (mode === 'python') setPyFolder(name); else setWebFolder(name);
    setFolderInput('');
    setNamingValue('');
    setNamingMode(true);
    setNameKeyboardOpen(false);
    setShowAutosaveNote(true);
  };

  const focusNameInput = (field: "folder" | "file", input: HTMLInputElement) => {
    activeNameInputRef.current = input;
    activeNameChangeRef.current = field === "folder" ? setFolderInput : setNamingValue;
    setNameKeyboardOpen(touchInput);
  };

  const handleNameKeyboardInput = (text: string) => {
    const input = activeNameInputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    activeNameChangeRef.current(`${input.value.slice(0, start)}${text}${input.value.slice(end)}`);
    requestAnimationFrame(() => input.setSelectionRange(start + text.length, start + text.length));
  };

  const handleNameKeyboardBackspace = () => {
    const input = activeNameInputRef.current;
    if (!input) return;
    let start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (start === end && start > 0) {
      const previousCharacter = [...input.value.slice(0, start)].pop();
      start -= previousCharacter?.length ?? 1;
    }
    activeNameChangeRef.current(`${input.value.slice(0, start)}${input.value.slice(end)}`);
    requestAnimationFrame(() => input.setSelectionRange(start, start));
  };

  const nameKeyboard = touchInput && nameKeyboardOpen ? (
    <PlaygroundNameKeyboard
      keyboardRef={element => { nameKeyboardRef.current = element; }}
      onInput={handleNameKeyboardInput}
      onBackspace={handleNameKeyboardBackspace}
      onEnter={() => activeNameInputRef.current?.form?.requestSubmit()}
    />
  ) : null;

  const folderForm = (
    <form className={styles.fileArea} onSubmit={handleCreateFolder}>
      <span className={styles.extBadge} style={{ color: '#a5b4fc', borderColor: 'rgba(129,140,248,0.35)' }}>folder</span>
      <input
        type="text"
        data-tour="folderName"
        placeholder="my-project"
        value={folderInput}
        readOnly={touchInput}
        onFocus={event => focusNameInput("folder", event.currentTarget)}
        onChange={e => setFolderInput(e.target.value)}
        className={styles.fileNameInput}
      />
      <button type="submit" className={styles.createBtn} data-tour="folderBtn">Create folder</button>
    </form>
  );

  const folderEmpty = (
    <div className={styles.folderEmpty}>
      <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
      <p className={styles.folderEmptyTitle}>Create a folder to get started</p>
      <p className={styles.folderEmptyHint}>Name your project folder using the file controls, then add files and start coding. Open past folders from Files.</p>
    </div>
  );

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
    setNameKeyboardOpen(false);
    if (mode === "web" && mobileLayout) setMobileMenu(null);
  };

  // Auto-focus naming input
  useEffect(() => {
    if (namingMode && !window.matchMedia("(pointer: coarse)").matches) newFileInputRef.current?.focus();
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

  // The current tour step follows what the user has done so far
  const hasFile = mode === 'python' ? !!pyFileName : !!currentTabFileName;
  const folderReady = mode === 'python' ? !!pyFolder : !!webFolder;
  const tourEl = !tourOn ? null : (() => {
    const skip = closeIntro;
    if (mode === null) return <PlaygroundTour key="pick" target="pick" title="1. Pick a project type" text="Click HTML for web pages with a live preview, or Python to run code in your browser." onSkip={skip} />;
    if (mode === "web" && mobileLayout && mobileMenu !== "files" && (!folderReady || !hasFile)) {
      return <PlaygroundTour key="fileMenu" target="fileMenu" title="Open the file menu" text="Open this menu to name your folder and file." onSkip={skip} />;
    }
    if (!folderReady) {
      return folderInput.trim()
        ? <PlaygroundTour key="folderBtn" target="folderBtn" title="3. Create the folder" text="Now click Create folder." onSkip={skip} />
        : <PlaygroundTour key="folderName" target="folderName" title="2. Name your folder" text="Type a name here, for example Nexus-Project." onSkip={skip} />;
    }
    if (!hasFile) {
      return namingValue.trim()
        ? <PlaygroundTour key="fileBtn" target="fileBtn" title="5. Create the file" text="Click Create to add the file." onSkip={skip} />
        : <PlaygroundTour key="fileName" target="fileName" title="4. Name your first file" text={mode === 'python' ? 'Type a file name, for example main.' : 'Type a file name, for example index.'} onSkip={skip} />;
    }
    return <PlaygroundTour key="editor" target="editor" title="6. Start coding!" text="Write your code here. Everything is autosaved now, and you can reopen past projects from Files." onSkip={skip} onDone={closeIntro} />;
  })();

  // ── Mode picker ──
  if (mode === null) {
    return (
      <main className={styles.pickerMain}>
        {tourEl}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.dotGrid} />
        {introState !== 'hidden' && (
          <div className={styles.introBackdrop} role="dialog" aria-modal="true" aria-label="Playground setup guide">
            <div className={styles.introCard}>
              <span className={styles.introKicker}>FIRST TIME HERE</span>
              <h2 className={styles.introTitle}>Want a quick walkthrough?</h2>
              <p className={styles.introText}>We&apos;ll point you to exactly where to click to set up your first playground project. You can skip it.</p>
              <div className={styles.introActions}>
                <button className={styles.introPrimary} onClick={startTour}>Show me how</button>
                <button className={styles.introGhost} onClick={closeIntro}>Skip</button>
              </div>
            </div>
          </div>
        )}
        <div className={styles.pickerContainer}>
          <div className={styles.pickerHeader}>
            <span className={styles.pickerBadge}><span className={styles.pickerDot} />PLAYGROUND</span>
            <h1 className={styles.pickerTitle}>What are you <span>building?</span></h1>
            <p className={styles.pickerSubtitle}>Choose a project type to get started.</p>
          </div>
          <div className={styles.pickerGrid} data-tour="pick">
            <button className={`${styles.pickerCard} ${styles.pickerCardWeb}`} onClick={() => { setMode("web"); if (mobileLayout) setMobileMenu("files"); }}>
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
        {tourEl}
        <div className={styles.topBar}>
          <button onClick={() => setMode(null)} className={styles.backBtn} aria-label="Back">←</button>
          {!pyFolder ? folderForm : (<span className={styles.folderPill}>{pyFolder}/</span>)}
          {!pyFolder ? null : namingMode ? (
            <form className={styles.fileArea} onSubmit={handleCreateFile}>
              <span className={styles.extBadge} style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>.py</span>
              <input
                ref={newFileInputRef}
                type="text"
                placeholder="script.py"
                value={namingValue}
                readOnly={touchInput}
                onFocus={event => focusNameInput("file", event.currentTarget)}
                onChange={e => setNamingValue(e.target.value)}
                className={styles.fileNameInput}
                data-tour="fileName"
              />
              <button type="submit" className={styles.createBtn} data-tour="fileBtn">Create</button>
              <button type="button" className={styles.cancelNaming} onClick={() => { setNamingMode(false); setNamingValue(''); setNameKeyboardOpen(false); }}>✕</button>
            </form>
          ) : pyFileName ? (
            <div className={styles.fileArea}>
              <span className={styles.extBadge} style={{ color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>.py</span>
              <span className={styles.fileNamePill} style={{ color: '#10b981' }}>{pyFileName}</span>
              <button onClick={() => handleSavePyProject()} className={styles.saveIconBtn} title="Save"><StatIcon name="save" size={15} /></button>
            </div>
          ) : null}
          <div className={styles.topBarActions}>
            {pyFolder && <AutosaveIndicator />}
            <button onClick={() => setShowPyStructure(v => !v)} className={styles.toggleButton}>Structures</button>
            <button onClick={() => setShowPyProjects(v => !v)} className={styles.toggleButton}>Files</button>
            <button
              onClick={handleRunPython}
              disabled={pyRunning || !pyodideReady}
              className={styles.runBtn}
            >
              {!pyodideReady ? "Loading…" : pyRunning ? "Running…" : "▶ Run"}
            </button>
            {pyFolder && ghostTextControl}
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
                <span className={styles.drawerTitle}><StatIcon name="python" size={14} /> Python Files</span>
                <button className={styles.drawerClose} onClick={() => setShowPyProjects(false)} aria-label="Close">✕</button>
              </div>
              <button className={styles.drawerNew} onClick={handleNewPyProject}>＋ New folder</button>
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
                    <span className={styles.drawerEmptyIcon}><StatIcon name="folder" size={28} /></span>
                    <p>No Python folders yet.</p>
                    <p className={styles.drawerEmptyHint}>Create a folder to see it here.</p>
                  </div>
                ) : filteredPyProjects.map((proj, idx) => (
                  <div key={idx} className={styles.drawerFile}>
                    <span className={styles.drawerFileIcon}><StatIcon name="python" size={15} /></span>
                    <div className={styles.drawerFileInfo}>
                      <span className={styles.drawerFileName}>{(proj.folder ?? proj.name.replace(/\.py$/, ''))}/</span>
                      <span className={styles.drawerFilePreview}>{proj.name || 'no files yet'}</span>
                    </div>
                    <div className={styles.drawerFileBtns}>
                      <button className={styles.drawerLoad} onClick={() => { setPyCode(proj.code); setPyFileName(proj.name); setPyFolder(proj.folder ?? proj.name.replace(/\.py$/, '')); setNamingMode(!proj.name); setShowPyProjects(false); }}>Open</button>
                      <button className={styles.drawerDelete} onClick={() => handleDeletePyProject(pyProjects.indexOf(proj))}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!pyFolder ? folderEmpty : (
        <div className={styles.pyLayout}>
          <div className={styles.pyEditorPane} data-tour="editor">
            <PlaygroundEditor
              value={pyCode}
              language="python"
              ghostTextEnabled={ghostTextEnabled}
              onChange={v => setPyCode(v)}
              className={styles.codeEditor}
            />
          </div>
          <div className={styles.pyOutputPane}>
            <div className={styles.pyOutputHeader}>OUTPUT</div>
            <pre className={styles.pyOutputBody}>{pyOutput || (pyodideReady ? "Click ▶ Run to execute your code." : "Loading Python runtime…")}</pre>
          </div>
        </div>
        )}
        <div className={`${styles.tipsBox} ${fade ? styles.fadeIn : styles.fadeOut}`}>
          <strong style={{ color: TIP_COLORS[displayedTip.type] }}>Tip</strong>{displayedTip.text}
        </div>
        {nameKeyboard}
      </main>
    );
  }

  // ── Web editor ──
  return (
    <main className={styles.main}>
      {tourEl}
      {showCheatSheet && <HtmlCheatSheet onClose={() => setShowCheatSheet(false)} />}
      {showColors && activeTab === "css" && <ColorTable onClose={() => setShowColors(false)} />}
      <div ref={mobileHeaderRef} className={styles.mobileHeader}>
        <button
          ref={mobileFilesButtonRef}
          type="button"
          className={styles.mobileFileButton}
          aria-label={`Files: ${webFolder ? mobileFile?.name || `New ${mobileFile?.label} file` : "choose a folder"}`}
          aria-expanded={mobileMenu === "files"}
          aria-controls="mobile-playground-files"
          data-tour="fileMenu"
          onClick={() => setMobileMenu(mobileMenu === "files" ? null : "files")}
        >
          <span className={styles.mobileFileLabel}>{webFolder ? mobileFile?.name || `New ${mobileFile?.label}` : "Files"}</span>
          <span aria-hidden="true">⌄</span>
        </button>
        <div className={styles.mobileLanguages} role="group" aria-label="Editor language">
          {webFiles.map(file => (
            <button
              key={file.language}
              type="button"
              className={mobileLanguage === file.language && activeTab !== "browser" ? styles.mobileLanguageActive : undefined}
              aria-pressed={mobileLanguage === file.language && activeTab !== "browser"}
              disabled={!webFolder}
              onClick={() => selectMobileLanguage(file.language)}
            >{file.label}</button>
          ))}
        </div>
        <div className={styles.mobileHeaderActions}>
          <button
            type="button"
            className={`${styles.mobileIconButton} ${activeTab === "browser" ? styles.mobileIconActive : ""}`}
            aria-label={activeTab === "browser" ? "Return to editor" : "Show preview"}
            aria-pressed={activeTab === "browser"}
            disabled={!webFolder}
            onClick={() => {
              if (activeTab === "browser") selectMobileLanguage(lastWebTab);
              else { handleTabClick("browser"); setMobileMenu(null); }
            }}
          >
            {activeTab === "browser" ? <span aria-hidden="true">‹/›</span> : <span aria-hidden="true">▶</span>}
          </button>
          <button
            ref={mobileMoreButtonRef}
            type="button"
            className={styles.mobileIconButton}
            aria-label="More playground tools"
            aria-expanded={mobileMenu === "more"}
            aria-controls="mobile-playground-tools"
            onClick={() => setMobileMenu(mobileMenu === "more" ? null : "more")}
          >⋯</button>
        </div>

        {mobileMenu === "files" && (
          <div id="mobile-playground-files" className={`${styles.mobileMenu} ${styles.mobileFilesMenu}`} role="region" aria-label="Project files">
            {!webFolder ? (
              <>
                <div className={styles.mobileMenuTitle}>Create a project folder</div>
                {folderForm}
              </>
            ) : (
              <>
                <div className={styles.mobileMenuTitle}>
                  <span className={styles.mobileFolderName}>{webFolder}/</span>
                  <AutosaveIndicator />
                </div>
                <div className={styles.mobileFileList} aria-label="Files in current project">
                  {webFiles.map(file => (
                    <button
                      key={file.language}
                      type="button"
                      className={mobileLanguage === file.language && activeTab !== "browser" ? styles.mobileFileActive : undefined}
                      onClick={() => selectMobileLanguage(file.language)}
                    >
                      <span className={styles.mobileFileType} style={{ color: LANG_COLORS[file.language] }}>{file.label}</span>
                      <span>{file.name || `New ${file.label} file`}</span>
                    </button>
                  ))}
                </div>
                {namingMode && activeTab !== "browser" && (
                  <form className={`${styles.fileArea} ${styles.mobileNamingForm}`} onSubmit={handleCreateFile}>
                    <span className={styles.extBadge} style={{ color: LANG_COLORS[activeTab], borderColor: `${LANG_COLORS[activeTab]}44` }}>
                      {LANG_EXT[activeTab]}
                    </span>
                    <input
                      type="text"
                      placeholder={activeTab === "css" ? "style.css" : activeTab === "js" ? "app.js" : "index.html"}
                      value={namingValue}
                      readOnly={touchInput}
                      onFocus={event => focusNameInput("file", event.currentTarget)}
                      onChange={event => setNamingValue(event.target.value)}
                      className={styles.fileNameInput}
                      data-tour="fileName"
                      aria-label="New file name"
                    />
                    <button type="submit" className={styles.createBtn} data-tour="fileBtn">Create</button>
                    <button type="button" className={styles.cancelNaming} aria-label="Cancel file naming" onClick={() => { setNamingMode(false); setNamingValue(""); setNameKeyboardOpen(false); }}>✕</button>
                  </form>
                )}
                <button type="button" className={styles.mobileMenuAction} onClick={() => { handleSaveProject(); setMobileMenu(null); }}>Save project</button>
                <button type="button" className={styles.mobileMenuAction} onClick={handleNewProject}>＋ New folder</button>
              </>
            )}
            <button type="button" className={styles.mobileMenuAction} onClick={() => { setShowProjects(true); setMobileMenu(null); }}>Open saved folders</button>
            <button type="button" className={styles.mobileMenuAction} onClick={() => { setMode(null); setMobileMenu(null); }}>← Project types</button>
          </div>
        )}

        {mobileMenu === "more" && (
          <div id="mobile-playground-tools" className={`${styles.mobileMenu} ${styles.mobileToolsMenu}`} role="region" aria-label="Playground tools">
            <button type="button" className={styles.mobileMenuAction} onClick={() => { setShowCheatSheet(true); setMobileMenu(null); }}>Cheat Sheet</button>
            <button type="button" className={styles.mobileMenuAction} disabled={!webFolder} aria-pressed={showStructure} onClick={() => {
              if (activeTab === "browser") handleTabClick(lastWebTab);
              setShowStructure(value => !value);
              setMobileMenu(null);
            }}>Structures</button>
            {mobileLanguage === "css" && (
              <button type="button" className={styles.mobileMenuAction} disabled={!webFolder} onClick={() => {
                if (activeTab === "browser") handleTabClick("css");
                setShowColors(true);
                setMobileMenu(null);
              }}>Colors</button>
            )}
            {webFolder && (
              <button type="button" className={styles.mobileMenuAction} aria-pressed={ghostTextEnabled} onClick={toggleGhostText}>
                Ghost text: {ghostTextEnabled ? "On" : "Off"}
              </button>
            )}
            <div className={styles.mobileTip}><strong>Tip</strong> {displayedTip.text}</div>
          </div>
        )}
      </div>
      {/* ── Top bar ── */}
      <div className={`${styles.topBar} ${styles.webDesktopBar}`}>
        <button onClick={() => setMode(null)} className={styles.backBtn} aria-label="Back">←</button>
        {!webFolder ? folderForm : (<span className={styles.folderPill}>{webFolder}/</span>)}
        {!webFolder ? null : namingMode ? (
          <form className={styles.fileArea} onSubmit={handleCreateFile}>
            <span className={styles.extBadge} style={{ color: LANG_COLORS[activeTab] || '#94a3b8', borderColor: (LANG_COLORS[activeTab] || '#334155') + '44' }}>
              {LANG_EXT[activeTab] || '.html'}
            </span>
            <input
              ref={newFileInputRef}
              type="text"
              placeholder={activeTab === 'css' ? 'style.css' : activeTab === 'js' ? 'app.js' : 'index.html'}
              value={namingValue}
              readOnly={touchInput}
              onFocus={event => focusNameInput("file", event.currentTarget)}
              onChange={e => setNamingValue(e.target.value)}
              className={styles.fileNameInput}
              data-tour="fileName"
            />
            <button type="submit" className={styles.createBtn} data-tour="fileBtn">Create</button>
            <button type="button" className={styles.cancelNaming} onClick={() => { setNamingMode(false); setNamingValue(''); setNameKeyboardOpen(false); }}>✕</button>
          </form>
        ) : currentTabFileName ? (
          <div className={styles.fileArea}>
            <span className={styles.extBadge} style={{ color: LANG_COLORS[activeTab], borderColor: (LANG_COLORS[activeTab]) + '44' }}>
              {LANG_EXT[activeTab]}
            </span>
            <span className={styles.fileNamePill} style={{ color: LANG_COLORS[activeTab] }}>{currentTabFileName}</span>
            <button onClick={() => handleSaveProject()} className={styles.saveIconBtn} title="Save"><StatIcon name="save" size={15} /></button>
          </div>
        ) : null}
        <div className={styles.topBarActions}>
          {webFolder && <AutosaveIndicator />}
          <button onClick={() => setShowCheatSheet(true)} className={styles.toggleButton}>Cheat Sheet</button>
          {activeTab === "css" && <button onClick={() => setShowColors(true)} className={styles.toggleButton}>Colors</button>}
          <button onClick={() => setShowStructure(v => !v)} className={styles.toggleButton}>Structures</button>
          <button onClick={() => setShowProjects(!showProjects)} className={styles.toggleButton}>Files</button>
          {webFolder && ghostTextControl}
        </div>
      </div>

      {!webFolder ? folderEmpty : (<>
      {/* ── Editor tabs ── */}
      <div className={`${styles.editorTabs} ${styles.webDesktopTabs}`}>
        <button className={activeTab === "html" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("html")}>HTML</button>
        <button className={activeTab === "css" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("css")}>CSS</button>
        <button className={activeTab === "js" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("js")}>JavaScript</button>
        <button className={activeTab === "browser" ? styles.activeTab : styles.tab} onClick={() => handleTabClick("browser")}>Preview</button>
      </div>

      {/* ── Editor / Preview ── */}
      <div className={styles.editorContainer} data-tour="editor">
        {activeTab === "html" && (
          <PlaygroundEditor value={htmlCode} language="html" ghostTextEnabled={ghostTextEnabled} onChange={value => setHtmlCode(value)} className={styles.codeEditor} />
        )}
        {activeTab === "css" && (
          <PlaygroundEditor value={cssCode} language="css" ghostTextEnabled={ghostTextEnabled} onChange={value => setCssCode(value)} className={styles.codeEditor} />
        )}
        {activeTab === "js" && (
          <PlaygroundEditor value={jsCode} language="js" ghostTextEnabled={ghostTextEnabled} onChange={value => setJsCode(value)} className={styles.codeEditor} />
        )}
        {activeTab === "browser" && (
          <div style={{ position: "relative", flex: 1, display: "flex", minHeight: 0 }}>
            <PreviewModeToggle mode={preview.mode} onToggle={preview.toggle} className={styles.previewModeBtn} />
            <iframe
              title="output"
              srcDoc={output}
              className={styles.browserFrame}
              style={{
                background: preview.mode === "dark" ? "#0b1220" : "#e9e6df",
                colorScheme: preview.mode,
                filter: preview.mode === "light" ? "brightness(0.85) contrast(0.95)" : undefined
              }}
            />
          </div>
        )}
      </div>
      </>)}

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
              <span className={styles.drawerTitle}><StatIcon name="web" size={14} /> Web Files</span>
              <button className={styles.drawerClose} onClick={() => setShowProjects(false)} aria-label="Close">✕</button>
            </div>
            <button className={styles.drawerNew} onClick={handleNewProject}>＋ New folder</button>
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
                  <span className={styles.drawerEmptyIcon}><StatIcon name="folder" size={28} /></span>
                  <p>No web folders yet.</p>
                  <p className={styles.drawerEmptyHint}>Create a folder to see it here.</p>
                </div>
              ) : filteredProjects.map((proj, idx) => (
                <div key={idx} className={styles.drawerFile}>
                  <span className={styles.drawerFileIcon}><StatIcon name="web" size={15} /></span>
                  <div className={styles.drawerFileInfo}>
                    <span className={styles.drawerFileName}>{proj.folder ?? (proj.htmlName || proj.cssName || proj.jsName || 'untitled').replace(/\.\w+$/, '')}/</span>
                    <span className={styles.drawerFilePreview}>{[proj.htmlName, proj.cssName, proj.jsName].filter(Boolean).join(', ') || 'no files yet'}</span>
                  </div>
                  <div className={styles.drawerFileBtns}>
                    <button className={styles.drawerLoad} onClick={() => { setHtmlCode(proj.html); setCssCode(proj.css); setJsCode(proj.js); setHtmlFileName(proj.htmlName || ''); setCssFileName(proj.cssName || ''); setJsFileName(proj.jsName || ''); setWebFolder(proj.folder ?? (proj.htmlName || proj.cssName || proj.jsName || 'project').replace(/\.\w+$/, '')); setActiveTab('html'); setLastWebTab('html'); setNamingMode(!proj.htmlName); setShowProjects(false); if (mobileLayout && !proj.htmlName) setMobileMenu('files'); }}>Open</button>
                    <button className={styles.drawerDelete} onClick={() => handleDeleteProject(projects.indexOf(proj))}>✕</button>
                  </div>
                </div>
              ))}
            </div> 
          </div>
        </div>
      )}

      {/* ── Tips bar ── */}
      <div className={`${styles.tipsBox} ${styles.webDesktopTips} ${fade ? styles.fadeIn : styles.fadeOut}`}>
        <strong style={{ color: TIP_COLORS[displayedTip.type] }}>Tip</strong>{displayedTip.text}
      </div>
      {nameKeyboard}
    </main>
  );
}