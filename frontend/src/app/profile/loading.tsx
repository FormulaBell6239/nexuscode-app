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

      {/* Top banner / calling card */}
      <div style={skel({ height: 120, marginBottom: '1.25rem', borderRadius: 16, border: '1px solid var(--border)' })} />

      {/* Avatar + display name row */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={skel({ width: 72, height: 72, borderRadius: '50%', flexShrink: 0, animationDelay: '0.1s' })} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <div style={skel({ height: 20, width: '45%', animationDelay: '0.15s' })} />
          <div style={skel({ height: 14, width: '30%', animationDelay: '0.2s' })} />
        </div>
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={skel({ height: 76, animationDelay: `${0.1 + i * 0.1}s`, border: '1px solid var(--border)' })} />
        ))}
      </div>

      {/* Skill bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div style={skel({ height: 12, width: `${30 + i * 8}%`, animationDelay: `${0.2 + i * 0.08}s` })} />
            <div style={skel({ height: 8, borderRadius: 99, animationDelay: `${0.25 + i * 0.08}s` })} />
          </div>
        ))}
      </div>
    </div>
  );
}
