'use client';
import { useEffect, useRef, useState } from 'react';

const KEY = 'nexus-debug';
const wanted = () => new URLSearchParams(window.location.search).has('debug') || localStorage.getItem(KEY) === '1';

// Shown with ?debug=1 or after 5 quick taps in the top-left corner. Prints live viewport numbers to diagnose iOS height issues.
export default function ViewportDebug() {
  const ref = useRef<HTMLPreElement>(null);
  const [on, setOn] = useState(false);

  // 5 quick taps in the top-left corner toggles the overlay (works in the Home Screen app)
  useEffect(() => {
    setOn(wanted());
    let taps: number[] = [];
    const onTap = (e: PointerEvent) => {
      if (e.clientX > 90 || e.clientY > 90) return;
      const now = Date.now();
      taps = [...taps.filter(t => now - t < 2500), now];
      if (taps.length >= 5) {
        taps = [];
        const next = localStorage.getItem(KEY) !== '1';
        localStorage.setItem(KEY, next ? '1' : '0');
        setOn(next);
      }
    };
    window.addEventListener('pointerdown', onTap, { passive: true });
    return () => window.removeEventListener('pointerdown', onTap);
  }, []);

  useEffect(() => {
    if (!on) return;
    const probe = document.createElement('div');
    probe.style.cssText = 'position:fixed;left:0;top:0;width:0;height:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
    document.body.appendChild(probe);
    let events = '';
    let touchInfo = '-';
    const dot = document.createElement('div');
    dot.style.cssText = 'position:fixed;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:red;opacity:.7;z-index:99998;pointer-events:none;display:none';
    document.body.appendChild(dot);
    const onPtr = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      const t = e.target as HTMLElement | null;
      const nm = (n: HTMLElement | null) => n ? `${n.tagName.toLowerCase()}.${String(n.className).split(' ')[0].slice(0, 18)}|${(n.textContent || '').trim().slice(0, 8)}` : '-';
      touchInfo = `c ${Math.round(e.clientX)},${Math.round(e.clientY)} p ${Math.round(e.pageX)},${Math.round(e.pageY)} s ${Math.round(e.screenY)}\nhit ${nm(el)}\ntgt ${nm(t)}`;
      dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; dot.style.display = 'block';
      render();
    };
    window.addEventListener('pointerdown', onPtr, { passive: true, capture: true });
    const log = (e: Event) => { events = e.type; render(); };
    const render = () => {
      const el = ref.current; if (!el) return;
      const vv = window.visualViewport;
      const cs = getComputedStyle(probe);
      const main = document.querySelector('main');
      const mr = main?.getBoundingClientRect();
      const kb = document.querySelector('[data-mobile-keyboard]')?.getBoundingClientRect();
      const standalone = (navigator as any).standalone || matchMedia('(display-mode: standalone)').matches;
      el.textContent =
        `inner ${innerWidth}x${innerHeight}\n` +
        `vv ${Math.round(vv?.width ?? 0)}x${Math.round(vv?.height ?? 0)} top ${Math.round(vv?.offsetTop ?? 0)}\n` +
        `screen ${screen.width}x${screen.height}\n` +
        `docEl client ${document.documentElement.clientHeight}\n` +
        `--app-h ${document.documentElement.style.getPropertyValue('--app-h') || '-'}\n` +
        `safe top ${cs.paddingTop} bottom ${cs.paddingBottom}\n` +
        `main top ${Math.round(mr?.top ?? 0)} h ${Math.round(mr?.height ?? 0)}\n` +
        `kb bottom ${kb ? Math.round(kb.bottom) : '-'}\n` +
        `gap ${kb ? Math.round(innerHeight - kb.bottom) : '-'}\n` +
        `standalone ${standalone}\n` +
        `scrollY ${Math.round(scrollY)} bodyTop ${Math.round(document.body.getBoundingClientRect().top)}\n` +
        `touch ${touchInfo}\n` +
        `last ${events}`;
    };
    const names = ['resize', 'orientationchange', 'pageshow', 'touchstart', 'scroll'];
    names.forEach(n => window.addEventListener(n, log, { passive: true }));
    window.visualViewport?.addEventListener('resize', log);
    const t = window.setInterval(render, 500);
    render();
    return () => {
      names.forEach(n => window.removeEventListener(n, log));
      window.visualViewport?.removeEventListener('resize', log);
      clearInterval(t); probe.remove(); dot.remove();
      window.removeEventListener('pointerdown', onPtr, true);
    };
  }, [on]);
  if (!on) return null;
  return <pre ref={ref} style={{ position: 'fixed', top: 'calc(env(safe-area-inset-top) + 4px)', right: 4, zIndex: 99999, margin: 0, padding: 6, background: 'rgba(0,0,0,.82)', color: '#0f0', font: '10px/1.3 monospace', pointerEvents: 'none', borderRadius: 6 }} />;
}
