"use client";

import { useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import styles from "./MobileKeyBar.module.css";
import { keyPressFeedback } from "./keyFeedback";
import { keyboardFont } from "./keyboardFont";

interface Props {
  keyboardRef: (element: HTMLDivElement | null) => void;
  onInput: (text: string) => void;
  onBackspace: () => void;
  onEnter: () => void;
}

const LETTER_ROWS = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
const SYMBOL_ROWS = ["1234567890", "@#$&*+()%", ".,-_/:;="];

export default function PlaygroundNameKeyboard({ keyboardRef, onInput, onBackspace, onEnter }: Props) {
  const [symbols, setSymbols] = useState(false);
  const [shift, setShift] = useState(false);
  const rows = symbols ? SYMBOL_ROWS : LETTER_ROWS;
  const keepFocus = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (event.pointerType === "touch") {
      const key = event.currentTarget;
      keyPressFeedback(key, `${styles.keyPreview} ${keyboardFont.variable}`, key.classList.contains(styles.key));
    }
  };

  const insert = (character: string) => {
    onInput(!symbols && shift ? character.toUpperCase() : character);
    if (shift) setShift(false);
  };

  return (
    <div ref={keyboardRef} className={`${styles.keyboard} ${keyboardFont.variable}`} data-lighting="blue" role="group" aria-label="Name entry keyboard">
      <div className={styles.rows}>
        {rows.map((row, rowIndex) => {
          const lastRow = rowIndex === rows.length - 1;
          return (
            <div className={styles.row} key={row} style={{ "--key-cols": 10 } as CSSProperties}>
              {lastRow && !symbols && (
                <button type="button" className={styles.shiftKey} onPointerDown={keepFocus} onClick={() => setShift(!shift)} aria-label="Shift" aria-pressed={shift}>
                  ⇧
                </button>
              )}
              {Array.from(row).map((character) => (
                <button type="button" className={styles.key} key={character} onPointerDown={keepFocus} onClick={() => insert(character)}>
                  {!symbols && shift ? character.toUpperCase() : character}
                </button>
              ))}
              {lastRow && (
                <button type="button" className={styles.edgeKey} onPointerDown={keepFocus} onClick={onBackspace} aria-label="Backspace">
                  ⌫
                </button>
              )}
            </div>
          );
        })}
        <div className={styles.row}>
          <button type="button" className={styles.wide} onPointerDown={keepFocus} onClick={() => setSymbols(!symbols)} aria-label={symbols ? "Show letters" : "Show symbols"}>
            {symbols ? "ABC" : "123"}
          </button>
          <button type="button" className={styles.space} onPointerDown={keepFocus} onClick={() => insert(" ")} aria-label="Space">
            space
          </button>
          <button type="button" className={styles.wide} onPointerDown={keepFocus} onClick={onEnter} aria-label="Create">
            ↵
          </button>
        </div>
      </div>
    </div>
  );
}
