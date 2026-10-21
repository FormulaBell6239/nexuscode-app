const PULSE = `@keyframes nxPulse{0%,100%{opacity:.35}50%{opacity:.7}}`;
const skel = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--surface-2)',
  borderRadius: 10,
  animation: 'nxPulse 1.6s ease-in-out infinite',
  ...extra,
});

export default function Loading() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '2rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      <style>{PULSE}</style>

      {/* Title bar */}
      <div style={skel({ height: 28, width: 160 })} />

      {/* Three content cards */}
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={skel({
            height: 110,
            animationDelay: `${i * 0.12}s`,
            border: '1px solid var(--border)',
          })}
        />
      ))}
    </div>
  );
}
