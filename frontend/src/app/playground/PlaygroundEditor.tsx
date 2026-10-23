"use client";
import { useMemo } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { python } from "@codemirror/lang-python";
import { nexusTheme } from "../../lib/nexusTheme";
import { ghostTextExtension } from "../../lib/ghostText";
import { htmlSnippetCompletions, cssSnippetCompletions } from "../../lib/localCompletions";

type Language = "html" | "css" | "js" | "python";

interface Props {
  value: string;
  onChange: (v: string) => void;
  language: Language;
  className?: string;
}

function getExtensions(language: Language) {
  switch (language) {
    case "html":   return [html(), htmlSnippetCompletions(), ...ghostTextExtension("html")];
    case "css":    return [css(), cssSnippetCompletions(), ...ghostTextExtension("css")];
    case "js":     return [...ghostTextExtension("js")];
    case "python": return [python()];
  }
}

export default function PlaygroundEditor({ value, onChange, language, className }: Props) {
  const extensions = useMemo(() => getExtensions(language), [language]);
  return (
    <CodeMirror
      value={value}
      height="100%"
      theme={nexusTheme}
      extensions={extensions}
      onChange={onChange}
      className={className}
    />
  );
}
