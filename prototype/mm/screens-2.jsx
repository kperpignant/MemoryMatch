// MemoryMatch — Vibe Page + ReelChemistry screens
(() => {
const { useState, useEffect, useRef } = React;
const D = window.MM_DATA;

/* ---------- reel player (auto-advance slideshow w/ progress segments) ---------- */
function ReelPlayer({ frames, beatLabel, aspect = '4 / 3.6' }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % frames.length), (frames[idx].duration || 4) * 1000);
    return () => clearTimeout(t);
  }, [idx, playing, frames]);

  const frame = frames[idx];

  return (
    <div>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <img key={frame.src} src={frame.src} alt={frame.caption} style={{ width: '100%', aspectRatio: aspect, objectFit: 'cover', animation: 'mmFade 0.5s ease' }}></img>
        {/* progress segments */}
        <div style={{ position: 'absolute', top: '12px', left: '14px', right: '14px', display: 'flex', gap: '6px' }}>
          {frames.map((f, i) => (
            <span key={i} style={{ flex: 1, height: '5px', borderRadius: '99px', background: i <= idx ? 'oklch(0.97 0.02 86 / 0.95)' : 'oklch(0.97 0.02 86 / 0.35)', transition: 'background 0.3s ease' }}></span>
          ))}
        </div>
        <span className="mm-mono" style={{ position: 'absolute', top: '24px', right: '14px', fontSize: '11.5px', color: 'oklch(0.97 0.02 86)', background: 'oklch(0.25 0.05 318 / 0.55)', padding: '3px 9px', borderRadius: '99px' }}>
          {idx + 1}/{frames.length}
        </span>
        {frame.caption && (
          <div style={{ position: 'absolute', insetInline: 0, bottom: 0, padding: 'calc(16px * var(--space))', background: 'linear-gradient(to top, oklch(0.25 0.05 318 / 0.75), transparent)' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '16px', color: 'oklch(0.97 0.02 86)' }}>{frame.caption}</p>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: 'calc(13px * var(--space)) calc(16px * var(--space))' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="mm-icon-btn" style={{ width: '40px', height: '40px' }} aria-label="Previous frame" onClick={() => setIdx((i) => (i - 1 + frames.length) % frames.length)}>‹</button>
          <button className="mm-icon-btn" style={{ width: '40px', height: '40px', background: 'var(--primary)', color: 'var(--primary-fg)', borderColor: 'var(--primary)' }} aria-label={playing ? 'Pause reel' : 'Play reel'} onClick={() => setPlaying(!playing)}>
            {playing ? '❚❚' : '▶'}
          </button>
          <button className="mm-icon-btn" style={{ width: '40px', height: '40px' }} aria-label="Next frame" onClick={() => setIdx((i) => (i + 1) % frames.length)}>›</button>
        </div>
        <button className="mm-chip" onClick={() => setMuted(!muted)} aria-pressed={!muted}>
          <PixelDisc size={13} style={{ color: 'var(--primary)' }}></PixelDisc>
          {muted ? '🔇 ' : '🔊 '}{beatLabel}
        </button>
      </div>
    </div>
  );
}

/* ============ VIBE PAGE ============ */
function VibeScreen({ go, toast }) {
  const R = D.robin;
  const [liked, setLiked] = useState(false);

  return (
    <main className="mm-page" data-screen-label="Vibe Page">
      {/* identity */}
      <Y2KWindow title={R.username + '.vibe'} icon={<PixelHeart size={14}></PixelHeart>}>
        <div style={{ display: 'flex', gap: 'var(--gap)', alignItems: 'flex-start' }}>
          <Avatar letter="R" size={74} online={R.online}></Avatar>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <h1 style={{ fontSize: '27px', fontWeight: 700 }}>{R.displayName}</h1>
            <p className="mm-mono mm-muted" style={{ fontSize: '12.5px' }}>@{R.username} · {R.pronouns} · {R.age} · {R.location}</p>
          </div>
        </div>
        <div className="mm-chip mm-chip-soft" style={{ alignSelf: 'flex-start' }}>
          <PixelStar size={13} style={{ color: 'var(--primary)' }}></PixelStar>
          <span className="mm-mono" style={{ fontSize: '13px' }}>mood: {R.mood}</span>
        </div>
        <div className="mm-chip-row">
          {R.intents.map((i) => (<span key={i} className="mm-chip">{i}</span>))}
        </div>
      </Y2KWindow>

      {/* reel */}
      <Y2KWindow title="memory-reel.exe" icon={<PixelDisc size={14}></PixelDisc>} flush>
        <ReelPlayer frames={R.frames} beatLabel={R.beatLabel}></ReelPlayer>
      </Y2KWindow>

      {/* say hi */}
      <Y2KWindow title="say-hi.exe" soft icon={<PixelWave size={14}></PixelWave>}>
        <p className="mm-muted" style={{ fontSize: '14.5px' }}>
          No swiping here. Send a charm or quietly like their page — if it's mutual, you'll both find out together.
        </p>
        <button className="mm-btn mm-btn-primary" onClick={() => go('chemistry')}>
          <PixelHeart size={15}></PixelHeart> Send a charm
        </button>
        <button className="mm-btn mm-btn-ghost" onClick={() => { setLiked(!liked); toast(liked ? 'Like removed' : 'Liked privately ✦'); }}>
          {liked ? '♥ Liked privately' : '♡ Like privately'}
        </button>
        <p className="mm-muted" style={{ fontSize: '12.5px', textAlign: 'center' }}>Likes are always private. No counts, no leaderboards.</p>
      </Y2KWindow>

      {/* about */}
      <Y2KWindow title="a-little-about-me.txt" icon={<PixelStar size={14}></PixelStar>}>
        <p style={{ fontSize: '15.5px' }}>{R.blurb}</p>
        {R.prompts.map((p) => (
          <div key={p.q} style={{ background: 'color-mix(in oklch, var(--secondary) 35%, var(--surface-2))', border: '1px solid color-mix(in oklch, var(--secondary) 55%, var(--border))', borderRadius: 'var(--radius-card)', padding: 'calc(15px * var(--space)) calc(17px * var(--space))', display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14.5px' }}>{p.q}</p>
            <p className="mm-muted" style={{ fontSize: '15px' }}>{p.a}</p>
          </div>
        ))}
      </Y2KWindow>

      {/* now playing */}
      <Y2KWindow title="now-playing.m3u" soft icon={<PixelDisc size={14}></PixelDisc>}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap)' }}>
          <span style={{ display: 'grid', placeItems: 'center', width: '46px', height: '46px', borderRadius: '14px', background: 'var(--holo)', color: 'var(--ink)', flex: 'none' }}>
            <PixelDisc size={18}></PixelDisc>
          </span>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15.5px' }}>{R.nowPlaying}</p>
            <p className="mm-mono mm-muted" style={{ fontSize: '12px' }}>on repeat lately</p>
          </div>
        </div>
      </Y2KWindow>

      {/* into lately */}
      <Y2KWindow title="into-lately.cfg" icon={<PixelSparkle size={14}></PixelSparkle>}>
        <div className="mm-chip-row">
          {R.interests.map((it, i) => (
            <span key={it} className="mm-chip">
              <span className="mm-mono" style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>{i + 1}</span>
              {it}
            </span>
          ))}
        </div>
      </Y2KWindow>

      {/* top 8 */}
      <Y2KWindow title="top-8.exe" icon={<PixelHeart size={14}></PixelHeart>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--gap)' }}>
          {R.top8.map((f) => (
            <button key={f.username} onClick={() => go('browse')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '7px', color: 'var(--ink)' }}>
              <Avatar src={f.thumb} size={58}></Avatar>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: '13px' }}>{f.displayName}</span>
            </button>
          ))}
        </div>
      </Y2KWindow>
    </main>
  );
}

/* ============ REELCHEMISTRY ============ */
function ChemistryScreen({ go, toast }) {
  const M = D.mira;
  const [picked, setPicked] = useState(null);
  const [message, setMessage] = useState('');

  return (
    <main className="mm-page" data-screen-label="ReelChemistry">
      <section style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', paddingTop: 'calc(8px * var(--space))' }}>
        <Eyebrow icon={<PixelHeart size={13}></PixelHeart>}>REELCHEMISTRY UNLOCKED</Eyebrow>
        <h1 style={{ fontSize: '34px', fontWeight: 700, letterSpacing: '-0.01em' }}>You and {M.displayName} <span className="mm-holo-text">both felt it</span></h1>
        <p className="mm-muted" style={{ fontSize: '15.5px', maxWidth: '46ch' }}>
          No rush, no pressure. You liked each other's reels — say hi whenever you feel like it, or just enjoy knowing the vibe was mutual.
        </p>
      </section>

      <Y2KWindow title="your-reels-clicked.exe" icon={<PixelSparkle size={14}></PixelSparkle>}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'calc(18px * var(--space))', padding: 'calc(6px * var(--space)) 0' }}>
          {[{ src: 'mm/reels/cafe-window.png', who: 'You' }, { src: M.thumb, who: M.displayName }].map((s, i) => (
            <React.Fragment key={s.who}>
              {i === 1 && <PixelHeart size={22} style={{ color: 'var(--primary)' }}></PixelHeart>}
              <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '9px' }}>
                <Avatar src={s.src} size={108} radius={18}></Avatar>
                <figcaption style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14.5px' }}>{s.who}</figcaption>
              </figure>
            </React.Fragment>
          ))}
        </div>
        <p className="mm-muted" style={{ textAlign: 'center', fontSize: '14px' }}>
          {M.displayName} is feeling: <strong style={{ color: 'var(--ink)' }}>{M.mood}</strong>
        </p>
      </Y2KWindow>

      <Y2KWindow title="what-you-have-in-common.cfg" icon={<PixelStar size={14}></PixelStar>}>
        <div className="mm-chip-row">
          {M.shared.map((s) => (
            <span key={s} className="mm-chip mm-chip-soft">
              <PixelSparkle size={12} style={{ color: 'var(--primary)' }}></PixelSparkle>{s}
            </span>
          ))}
        </div>
      </Y2KWindow>

      <Y2KWindow title="break-the-ice.exe" icon={<PixelWave size={14}></PixelWave>}>
        <p className="mm-muted" style={{ fontSize: '14.5px' }}>
          Stuck on a first message? Tap a starter to drop it in — then make it your own.
        </p>
        {M.starters.map((s, i) => (
          <button
            key={i}
            onClick={() => { setPicked(i); setMessage(s); }}
            style={{
              textAlign: 'left', fontSize: '15px', lineHeight: 1.5, color: 'var(--ink)', cursor: 'pointer',
              background: picked === i ? 'color-mix(in oklch, var(--primary) 12%, var(--surface-2))' : 'var(--surface-2)',
              border: '1.5px solid ' + (picked === i ? 'var(--primary)' : 'var(--border)'),
              borderRadius: 'var(--radius-card)', padding: 'calc(15px * var(--space)) calc(17px * var(--space))',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            {s}
          </button>
        ))}
        <textarea
          className="mm-textarea"
          placeholder={'write something to ' + M.displayName + '…'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-label={'Message to ' + M.displayName}
        ></textarea>
        <button className="mm-btn mm-btn-primary" onClick={() => { if (message.trim()) { toast('Starter sent to ' + M.displayName + ' ✦'); setMessage(''); setPicked(null); } else { toast('Pick a starter or write a note first'); } }}>
          <PixelWave size={15}></PixelWave> Send a starter
        </button>
        <p className="mm-muted" style={{ fontSize: '12.5px', textAlign: 'center' }}>You can also just sit with the good feeling. That's allowed.</p>
      </Y2KWindow>

      <button className="mm-btn mm-btn-ghost" onClick={() => go('browse')} style={{ alignSelf: 'center' }}>← Back to the buddy list</button>
    </main>
  );
}

Object.assign(window, { ReelPlayer, VibeScreen, ChemistryScreen });
})();
