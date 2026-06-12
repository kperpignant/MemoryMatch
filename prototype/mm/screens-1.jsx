// MemoryMatch — Landing + Browse screens
(() => {
const { useState } = React;
const D = window.MM_DATA;

/* ============ LANDING ============ */
function LandingScreen({ go }) {
  return (
    <main className="mm-page" data-screen-label="Landing">
      {/* hero */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'calc(18px * var(--space))', paddingTop: 'calc(10px * var(--space))' }}>
        <span className="mm-chip mm-chip-soft" style={{ alignSelf: 'flex-start' }}>
          <PixelSparkle size={13} style={{ color: 'var(--primary)' }}></PixelSparkle>
          Soft Launch — low pressure, no swiping
        </span>
        <h1 style={{ fontSize: 'clamp(38px, 9vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Less swiping.<br></br>
          <span className="mm-holo-text">More story.</span>
        </h1>
        <p className="mm-muted" style={{ fontSize: '17px', maxWidth: '46ch' }}>
          Find chemistry through the moments that made you. Build a Memory Reel, react to the moments you love, and let ReelChemistry do the rest.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--gap-sm)' }}>
          <button className="mm-btn mm-btn-primary" onClick={() => go('onboarding')}>
            <PixelHeart size={15}></PixelHeart> Make your Vibe Page
          </button>
          <button className="mm-btn mm-btn-ghost" onClick={() => go('browse')}>Take a peek around</button>
        </div>
        <p className="mm-muted" style={{ fontSize: '13px' }}>18+ only. No public like counts, ever.</p>
      </section>

      {/* reel showcase window */}
      <Y2KWindow title="memory-reel.exe" icon={<PixelDisc size={14}></PixelDisc>} flush>
        <div style={{ position: 'relative' }}>
          <img src="mm/reels/bedroom-setup.png" alt="A cozy Y2K bedroom desk setup from a Memory Reel" style={{ width: '100%', aspectRatio: '4 / 3.4', objectFit: 'cover' }}></img>
          <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 'calc(18px * var(--space))', background: 'linear-gradient(to top, oklch(0.25 0.05 318 / 0.75), transparent)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px', color: 'oklch(0.97 0.02 86)' }}>where i make all my mixtapes</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: 'calc(14px * var(--space)) calc(18px * var(--space))' }}>
          <span className="mm-mono mm-muted" style={{ fontSize: '12.5px' }}>4 frames · lo-fi beat</span>
          <span className="mm-chip mm-chip-soft" style={{ minHeight: '34px', fontSize: '13px' }}>
            <PixelHeart size={12} style={{ color: 'var(--primary)' }}></PixelHeart> charm sent
          </span>
        </div>
      </Y2KWindow>

      {/* how it works */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: 700 }}>How it works</h2>
          <p className="mm-muted">Three gentle steps. No swiping required.</p>
        </div>
        {[
          { n: '01', icon: <PixelDisc size={16}></PixelDisc>, t: 'Build your reel', d: 'Stitch a few moments into a Memory Reel — captions, a beat, your story.' },
          { n: '02', icon: <PixelWave size={16}></PixelWave>, t: 'React to moments', d: 'Send a charm or a note about a specific frame. Low stakes, real things.' },
          { n: '03', icon: <PixelHeart size={16}></PixelHeart>, t: 'ReelChemistry', d: 'When the feeling is mutual, we hand you conversation starters that actually fit.' },
        ].map((s) => (
          <Y2KWindow key={s.n} title={'step-' + s.n + '.exe'} soft icon={s.icon}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h3 style={{ fontSize: '19px', fontWeight: 600 }}>{s.t}</h3>
              <p className="mm-muted" style={{ fontSize: '15px' }}>{s.d}</p>
            </div>
          </Y2KWindow>
        ))}
      </section>

      {/* who it's for */}
      <Y2KWindow title="who-its-for.txt" icon={<PixelStar size={14}></PixelStar>}>
        <p className="mm-muted" style={{ fontSize: '15px' }}>
          For shy daters, creative people, and anyone who shows up best through context — your taste, your humor, your moments — not a single static photo.
        </p>
        <div className="mm-chip-row">
          {['slow burn', 'friend first', 'open to dating', 'just browsing', 'co-op mode'].map((c) => (
            <span key={c} className="mm-chip">{c}</span>
          ))}
        </div>
      </Y2KWindow>

      {/* footer */}
      <footer style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: 'calc(6px * var(--space))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '13.5px' }}>
          <span className="mm-muted">Guidelines</span>
          <span className="mm-muted">Privacy</span>
          <span className="mm-muted">Terms</span>
        </div>
        <p className="mm-mono mm-muted" style={{ fontSize: '12px' }}>est. 2026 · made with charms, not swipes</p>
      </footer>
    </main>
  );
}

/* ============ BROWSE ============ */
function BrowseScreen({ go, toast }) {
  const [filter, setFilter] = useState('everyone');
  const [query, setQuery] = useState('');
  const filters = ['everyone', 'slow burn', 'friend first', 'open to dating', 'just browsing', 'co-op mode'];

  const match = (b) =>
    (filter === 'everyone' || b.intent === filter) &&
    (query.trim() === '' || (b.displayName + b.username + b.mood).toLowerCase().includes(query.trim().toLowerCase()));

  const online = D.buddies.filter((b) => b.online && match(b));
  const away = D.buddies.filter((b) => !b.online && match(b));

  const BuddyRow = ({ b }) => (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--gap)',
        background: 'var(--surface-2)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)', padding: 'calc(13px * var(--space)) calc(15px * var(--space))',
        boxShadow: 'inset 0 1px 0 oklch(1 0 0 / 0.45)',
      }}
    >
      <button onClick={() => go('vibe')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }} aria-label={'Open ' + b.displayName + "'s vibe page"}>
        <Avatar src={b.thumb} size={54} online={b.online}></Avatar>
      </button>
      <button onClick={() => go('vibe')} style={{ flex: 1, minWidth: 0, background: 'none', border: 'none', padding: 0, textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--ink)' }}>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: '7px', minWidth: 0 }}>
          <strong style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16.5px' }}>{b.displayName}</strong>
          <span className="mm-mono mm-muted" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{b.username}</span>
        </span>
        <span className="mm-muted" style={{ fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.mood}</span>
        <span className="mm-mono" style={{ fontSize: '11px', color: 'var(--primary)', letterSpacing: '0.05em' }}>{b.intent}</span>
      </button>
      <button className="mm-btn mm-btn-ghost mm-btn-sm" onClick={() => toast('Charm sent to ' + b.displayName + ' ✦')}>
        <PixelHeart size={13} style={{ color: 'var(--primary)' }}></PixelHeart> Charm
      </button>
    </div>
  );

  return (
    <main className="mm-page" data-screen-label="Browse">
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.01em' }}>Buddy list</h1>
        <p className="mm-muted" style={{ fontSize: '15.5px', maxWidth: '52ch' }}>
          People whose vibes might match yours. Peek at a reel, send a charm, no rush. We don't show like counts or rankings here.
        </p>
      </section>

      <Y2KWindow title="whos-around.exe" icon={<PixelWave size={14}></PixelWave>}>
        <input
          className="mm-input"
          placeholder="search names or moods…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search names or moods"
        ></input>
        <div className="mm-chip-row">
          {filters.map((f) => (
            <button key={f} className={'mm-chip' + (filter === f ? ' mm-chip-on' : '')} onClick={() => setFilter(f)}>{f}</button>
          ))}
        </div>

        {online.length > 0 && (
          <p className="mm-mono" style={{ fontSize: '12px', letterSpacing: '0.08em', color: 'var(--online)', marginTop: '4px' }}>● ONLINE — {online.length}</p>
        )}
        {online.map((b) => (<BuddyRow key={b.username} b={b}></BuddyRow>))}

        {away.length > 0 && (
          <p className="mm-mono mm-muted" style={{ fontSize: '12px', letterSpacing: '0.08em', marginTop: 'calc(8px * var(--space))' }}>○ AWAY — {away.length}</p>
        )}
        {away.map((b) => (<BuddyRow key={b.username} b={b}></BuddyRow>))}

        {online.length + away.length === 0 && (
          <p className="mm-muted" style={{ textAlign: 'center', padding: '20px 0' }}>nobody around with that vibe — try another filter ✦</p>
        )}
      </Y2KWindow>
    </main>
  );
}

Object.assign(window, { LandingScreen, BrowseScreen });
})();
