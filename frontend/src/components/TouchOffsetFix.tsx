'use client';
import { useEffect } from 'react';

// iOS standalone can shift the layout viewport up by the notch height after the first touch
// (visualViewport.offsetTop < 0). Touch coordinates stay in visual space but native hit-testing
// uses the shifted layout, so taps land on the element 59px away. Re-route taps to the element
// that is really under the finger.
const INTERACTIVE = 'button,a,[role="button"],input,textarea,select,label,summary';
const FLAG = '__offsetFixed';

export default function TouchOffsetFix() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const redirect = (e: Event) => {
      const ev = e as PointerEvent;
      if ((ev as any)[FLAG]) return;
      const offset = vv.offsetTop;
      if (offset > -1) return;
      const correct = document.elementFromPoint(ev.clientX, ev.clientY - offset);
      const from = (ev.target as Element | null)?.closest?.(INTERACTIVE) ?? null;
      const to = correct?.closest(INTERACTIVE) ?? null;
      if (from === to) return;

      ev.stopImmediatePropagation();
      ev.preventDefault();
      if (!to) return;

      const init = {
        bubbles: true, cancelable: true, composed: true,
        clientX: ev.clientX, clientY: ev.clientY - offset,
        screenX: ev.screenX, screenY: ev.screenY,
        button: ev.button, buttons: ev.buttons,
      };
      const copy = ev.type === 'click'
        ? new MouseEvent('click', init)
        : new PointerEvent(ev.type, { ...init, pointerId: ev.pointerId, pointerType: ev.pointerType, isPrimary: true });
      (copy as any)[FLAG] = true;
      to.dispatchEvent(copy);
    };

    const types = ['pointerdown', 'pointerup', 'pointercancel', 'click'];
    types.forEach(t => document.addEventListener(t, redirect, true));
    return () => types.forEach(t => document.removeEventListener(t, redirect, true));
  }, []);
  return null;
}
