const PULSE = `@keyframes nxPulse{0%,100%{opacity:.35}50%{opacity:.7}}`;
const skel = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: 'var(--surface-2)',
  borderRadius: 10,
  animation: 'nxPulse 1.6s ease-in-out infinite',
  ...extra,
});

export default function Loading() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1.25rem' }}>
      <style>{PULSE}</style>

      {/* Title */}
      <div style={skel({ height: 28, width: 180, marginBottom: '1.25rem' })} />

      {/* Filter pills */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[80, 60, 72, 56, 90, 64].map((w, i) => (
          <div key={i} style={skel({ height: 32, width: w, borderRadius: 99, animationDelay: `${i * 0.07}s` })} />
        ))}
      </div>

      {/* Achievement rows */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            gap: '0.85rem',
            alignItems: 'center',
            padding: '0.85rem',
            border: '1px solid var(--border)',
            borderRadius: 12,
            marginBottom: '0.6rem',
            animationDelay: `${i * 0.08}s`,
          }}
        >
          {/* Badge icon */}
          <div style={skel({ width: 44, height: 44, borderRadius: 10, flexShrink: 0, animationDelay: `${i * 0.08}s` })} />
          {/* Text + bar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={skel({ height: 14, width: '55%', animationDelay: `${0.05 + i * 0.08}s` })} />
            <div style={skel({ height: 11, width: '75%', animationDelay: `${0.1 + i * 0.08}s` })} />
            <div style={skel({ height: 6, borderRadius: 99, animationDelay: `${0.15 + i * 0.08}s` })} />
          </div>
          {/* Credit badge */}
          <div style={skel({ width: 36, height: 20, borderRadius: 99, flexShrink: 0, animationDelay: `${0.1 + i * 0.08}s` })} />
        </div>
      ))}
    </div>
  );
}
