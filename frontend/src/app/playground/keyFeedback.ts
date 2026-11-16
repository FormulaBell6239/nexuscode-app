let bubble: HTMLDivElement | null = null;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

// Short buzz plus an enlarged pop-up of the pressed key above the finger.
// The pop-up lives on <body> because the keyboard container clips overflow.
export function keyPressFeedback(key: HTMLButtonElement, previewClass: string, showPreview: boolean) {
  try {
    navigator.vibrate?.(8);
  } catch {
    // Vibration is optional and unsupported on some browsers.
  }
  if (!showPreview) return;
  const label = key.textContent?.trim();
  if (!label) return;

  if (!bubble) {
    bubble = document.createElement("div");
    bubble.setAttribute("aria-hidden", "true");
    document.body.appendChild(bubble);
  }
  const rect = key.getBoundingClientRect();
  const half = 30;
  const center = Math.min(Math.max(rect.left + rect.width / 2, half + 4), window.innerWidth - half - 4);
  bubble.className = previewClass;
  bubble.textContent = label;
  bubble.style.left = `${center}px`;
  bubble.style.top = `${rect.top - 6}px`;
  bubble.style.display = "flex";

  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (bubble) bubble.style.display = "none";
  }, 140);
}
