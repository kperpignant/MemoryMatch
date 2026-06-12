// MemoryMatch — shared components (windows, chips, icons, header)
const { useState, useEffect, useRef } = React;

/* ---------- pixel icons (7x7 grid, crisp) ---------- */
function Px({ px, size = 16, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 7 7" shapeRendering="crispEdges" fill="currentColor" aria-hidden="true" style={{ display: 'inline-block', flex: 'none', ...style }}>
      {px.map(([x, y], i) => (<rect key={i} x={x} y={y} width="1" height="1"></rect>))}
    </svg>
  );
}
const HEART_PX = [[1,1],[2,1],[4,1],[5,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[3,5]];
const STAR_PX = [[3,0],[3,1],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[1,5],[2,5],[4,5],[5,5],[1,6],[5,6]];
const SPARKLE_PX = [[3,0],[3,1],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[3,5],[3,6]];
const DISC_PX = [[2,0],[3,0],[4,0],[1,1],[5,1],[0,2],[3,2],[6,2],[0,3],[2,3],[3,3],[4,3],[6,3],[0,4],[3,4],[6,4],[1,5],[5,5],[2,6],[3,6],[4,6]];
const WAVE_PX = [[2,0],[4,0],[2,1],[3,1],[4,1],[1,2],[2,2],[3,2],[4,2],[5,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[2,5],[3,5],[4,5],[2,6],[4,6]];

function PixelHeart(props) { return <Px px={HEART_PX} {...props} />; }
function PixelStar(props) { return <Px px={STAR_PX} {...props} />; }
function PixelSparkle(props) { return <Px px={SPARKLE_PX} {...props} />; }
function PixelDisc(props) { return <Px px={DISC_PX} {...props} />; }
function PixelWave(props) { return <Px px={WAVE_PX} {...props} />; }

/* ---------- window module ---------- */
function WindowDots() {
  return (
    <div className="mm-window-dots" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
  );
}

function Y2KWindow({ title, icon, soft, flush, children, style, bodyStyle, label }) {
  return (
    <section className="mm-window" style={style} data-screen-label={label}>
      {title !== undefined && (
        <header className={'mm-titlebar' + (soft ? ' mm-titlebar-soft' : '')}>
          {icon && <span style={{ display: 'grid', placeItems: 'center' }}>{icon}</span>}
          <h2 className="mm-titlebar-text">{title}</h2>
          <WindowDots></WindowDots>
        </header>
      )}
      <div className={'mm-window-body' + (flush ? ' mm-flush' : '')} style={bodyStyle}>{children}</div>
    </section>
  );
}

/* ---------- header ---------- */
function SiteHeader({ route, go }) {
  const navLink = (label, r) => (
    <button
      onClick={() => go(r)}
      className="mm-chip"
      style={{
        border: 'none',
        background: route === r ? 'color-mix(in oklch, var(--primary) 14%, transparent)' : 'transparent',
        color: route === r ? 'var(--primary)' : 'var(--muted)',
        fontWeight: 600,
        minHeight: '40px',
      }}
    >
      {label}
    </button>
  );
  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'color-mix(in oklch, var(--bg) 82%, transparent)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid color-mix(in oklch, var(--border) 60%, transparent)',
      }}
    >
      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '12px var(--pad-page)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <button onClick={() => go('landing')} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', padding: 0, color: 'var(--ink)' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: '34px', height: '34px', borderRadius: '11px', background: 'var(--primary)', color: 'var(--primary-fg)', boxShadow: 'var(--shadow-soft), inset 0 1px 0 oklch(1 0 0 / 0.35)' }}>
            <PixelHeart size={16}></PixelHeart>
          </span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '19px', letterSpacing: '-0.01em' }}>MemoryMatch</span>
        </button>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {navLink('Browse', 'browse')}
          {navLink('Sign in', 'onboarding')}
        </nav>
      </div>
    </header>
  );
}

/* ---------- small bits ---------- */
function Avatar({ src, letter, size = 56, online, radius }) {
  return (
    <span className="mm-avatar" style={{ width: size + 'px', height: size + 'px', borderRadius: radius ? radius + 3 : undefined }}>
      {src
        ? <img src={src} alt="" style={radius ? { borderRadius: radius + 'px' } : undefined}></img>
        : <span className="mm-avatar-letter" style={{ fontSize: size * 0.4 + 'px', ...(radius ? { borderRadius: radius + 'px' } : {}) }}>{letter}</span>}
      {online && <span className="mm-online-dot" aria-label="online"></span>}
    </span>
  );
}

function Eyebrow({ icon, children }) {
  return <span className="mm-eyebrow">{icon}{children}</span>;
}

/* toast for prototype feedback (charm sent, copied, etc.) */
function useToast() {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const show = (msg) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2200);
  };
  const node = toast ? (
    <div
      style={{
        position: 'fixed', bottom: '28px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 90, background: 'var(--ink)', color: 'var(--surface)',
        fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14.5px',
        padding: '12px 22px', borderRadius: '999px', boxShadow: 'var(--shadow-soft)',
        display: 'flex', alignItems: 'center', gap: '9px', whiteSpace: 'nowrap',
      }}
    >
      <PixelSparkle size={14}></PixelSparkle>{toast}
    </div>
  ) : null;
  return [node, show];
}

Object.assign(window, {
  PixelHeart, PixelStar, PixelSparkle, PixelDisc, PixelWave,
  Y2KWindow, WindowDots, SiteHeader, Avatar, Eyebrow, useToast,
});
