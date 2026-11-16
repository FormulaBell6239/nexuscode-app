// Quick Reference: Mobile Keyboard Keybindings
// Use this file to document available keyboard shortcuts for your app

const KEYBOARD_REFERENCE = {
  allLanguages: [
    { key: "Tab/⇥", action: "Indent or accept AI suggestion" },
    { key: "↶", action: "Undo last change" },
    { key: "↷", action: "Redo last change" },
  ],

  html: [
    { key: "<", action: "Open tag" },
    { key: ">", action: "Close tag" },
    { key: "/", action: "Self-closing or closing tag" },
    { key: "=", action: "Attribute assignment" },
    { key: '""', action: "Empty string" },
    { key: "</>", action: "Closing tag pair" },
    { key: "{}", action: "Curly braces" },
    { key: "( )", action: "Parentheses" },
  ],

  css: [
    { key: "{}", action: "CSS block" },
    { key: ":", action: "Property separator" },
    { key: ";", action: "End rule" },
    { key: "#", action: "ID selector" },
    { key: ".", action: "Class selector" },
    { key: "()", action: "Function call" },
    { key: "%", action: "Percentage unit" },
    { key: '""', action: "String value" },
    { key: "-", action: "Hyphen for properties" },
  ],

  javascript: [
    { key: "{}", action: "Code block" },
    { key: "( )", action: "Function parameters" },
    { key: "[]", action: "Array" },
    { key: '""', action: "String" },
    { key: "'", action: "Single quote" },
    { key: "=>", action: "Arrow function" },
    { key: "=", action: "Assignment" },
    { key: ";", action: "Statement end" },
    { key: ".", action: "Property access" },
  ],

  python: [
    { key: ":", action: "Colon for blocks" },
    { key: "( )", action: "Function call" },
    { key: "[]", action: "List/indexing" },
    { key: '""', action: "String" },
    { key: "'", action: "Single quote" },
    { key: "=", action: "Assignment" },
    { key: "#", action: "Comment" },
    { key: "_", action: "Variable separator" },
    { key: "{}", action: "Dictionary" },
  ],
};

export default KEYBOARD_REFERENCE;
