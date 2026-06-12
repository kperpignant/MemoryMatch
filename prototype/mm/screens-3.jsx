// MemoryMatch — Onboarding wizard + Reel builder
(() => {
const { useState } = React;
const D = window.MM_DATA;

/* ============ ONBOARDING ============ */
function OnboardingScreen({ go, toast, theme, setTheme }) {
  const [step, setStep] = useState(0);
  const [username, setUsername] = useState('mixtape_kid');
  const [display, setDisplay] = useState('Robin');
  const [vibes, setVibes] = useState(['slow-burn']);
  const [softLaunch, setSoftLaunch] = useState(true);
  const [bio, setBio] = useState('');
  const [moodTxt, setMoodTxt] = useState('brb, building a reel ✦');
  const [top8, setTop8] = useState(['lo-fi beats', 'pixel art']);
  const [search, setSearch] = useState('');

  const steps = ['Your name', 'Your vibe', 'Your look', 'Your top 8'];
  const canNext = step === 0 ? username.trim() && display.trim() : true;

  const toggleVibe = (id) => setVibes((v) => v.includes(id) ? v.filter((x) => x !== id) : [...v, id]);
  const addInterest = (it) => setTop8((t) => t.includes(it) || t.length >= 8 ? t : [...t, it]);
  const removeInterest = (it) => setTop8((t) => t.filter((x) => x !== it));
  const moveInterest = (i, dir) => setTop8((t) => {
    const j = i + dir;
    if (j < 0 || j >= t.length) return t;
    const n = [...t]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });

  const suggestions = D.interests.filter((it) => !top8.includes(it) && it.includes(search.trim().toLowerCase()));

  return (
    <main className="mm-page" data-screen-label="Onboarding">
      {/* progress */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <p className="mm-mono mm-muted" style={{ fontSize: '12.5px', letterSpacing: '0.05em' }}>STEP {step + 1} OF 4 · {steps[step].toUpperCase()}</p>
          <p className="mm-mono" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>{(step + 1) * 25}%</p>
        </div>
        <div style={{ display: 'flex', gap: '7px' }}>
          {steps.map((s, i) => (
            <div key={s} className="mm-progress-track">
              <div className="mm-progress-fill" style={{ width: i <= step ? '100%' : '0%' }}></div>
            </div>
          ))}
        </div>
      </div>

      <Y2KWindow title="setup-wizard.exe" icon={<PixelSparkle size={14}></PixelSparkle>}>
        {step === 0 && (<>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Let's claim your corner</h1>
            <p className="mm-muted" style={{ fontSize: '14.5px', marginTop: '6px' }}>No pressure — you can change all of this later.</p>
          </div>
          <div>
            <label className="mm-label" htmlFor="ob-username">Username</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="mm-mono" style={{ fontSize: '17px', color: 'var(--muted)' }}>@</span>
              <input id="ob-username" className="mm-input" value={username} onChange={(e) => setUsername(e.target.value)}></input>
            </div>
            <p className="mm-hint">Lowercase letters, numbers, underscores.</p>
          </div>
          <div>
            <label className="mm-label" htmlFor="ob-display">Display name</label>
            <input id="ob-display" className="mm-input" value={display} onChange={(e) => setDisplay(e.target.value)}></input>
            <p className="mm-hint">What people see on your Vibe Page.</p>
          </div>
        </>)}

        {step === 1 && (<>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>What are you here for?</h1>
            <p className="mm-muted" style={{ fontSize: '14.5px', marginTop: '6px' }}>Pick as many as feel true. This just helps set the tone.</p>
          </div>
          <div className="mm-chip-row">
            {D.intents.map((i) => (
              <button key={i.id} className={'mm-chip' + (vibes.includes(i.id) ? ' mm-chip-on' : '')} onClick={() => toggleVibe(i.id)} aria-pressed={vibes.includes(i.id)}>{i.label}</button>
            ))}
          </div>
          <div style={{ background: 'color-mix(in oklch, var(--secondary) 30%, var(--surface-2))', border: '1px solid color-mix(in oklch, var(--secondary) 50%, var(--border))', borderRadius: 'var(--radius-card)', padding: 'calc(16px * var(--space))', display: 'flex', gap: 'var(--gap)', alignItems: 'flex-start' }}>
            <button
              role="switch"
              aria-checked={softLaunch}
              onClick={() => setSoftLaunch(!softLaunch)}
              style={{
                flex: 'none', width: '52px', height: '30px', borderRadius: '99px', border: 'none', position: 'relative',
                background: softLaunch ? 'var(--primary)' : 'var(--border)', transition: 'background 0.2s ease', marginTop: '2px',
              }}
            >
              <span style={{ position: 'absolute', top: '3px', left: softLaunch ? '25px' : '3px', width: '24px', height: '24px', borderRadius: '50%', background: 'oklch(0.98 0.01 86)', boxShadow: '0 1px 3px oklch(0 0 0 / 0.25)', transition: 'left 0.2s ease' }}></span>
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <PixelStar size={13} style={{ color: 'var(--primary)' }}></PixelStar>
                Soft Launch Mode
                <span className="mm-mono" style={{ fontSize: '10.5px', background: 'var(--holo)', color: 'var(--ink)', padding: '2px 9px', borderRadius: '99px', fontWeight: 700 }}>recommended</span>
              </p>
              <p className="mm-muted" style={{ fontSize: '13.5px' }}>Softer, lower-pressure interactions. No like counts, gentler prompts, and a calmer pace.</p>
            </div>
          </div>
        </>)}

        {step === 2 && (<>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Pick your look</h1>
            <p className="mm-muted" style={{ fontSize: '14.5px', marginTop: '6px' }}>Choose a theme — your whole Vibe Page recolors to match. Try one, it's live.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
            {D.themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={theme === t.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--gap)', textAlign: 'left', cursor: 'pointer',
                  background: theme === t.id ? 'color-mix(in oklch, var(--primary) 10%, var(--surface-2))' : 'var(--surface-2)',
                  border: '1.5px solid ' + (theme === t.id ? 'var(--primary)' : 'var(--border)'),
                  borderRadius: 'var(--radius-card)', padding: 'calc(13px * var(--space)) calc(15px * var(--space))',
                  transition: 'border-color 0.15s ease, background 0.15s ease', color: 'var(--ink)',
                }}
              >
                <span style={{ display: 'flex', flex: 'none', borderRadius: '99px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
                  {t.swatch.map((c) => (<span key={c} style={{ width: '20px', height: '28px', background: c }}></span>))}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15.5px' }}>{t.name}</span>
                  <span className="mm-muted" style={{ display: 'block', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.blurb}</span>
                </span>
              </button>
            ))}
          </div>
          <div>
            <label className="mm-label" htmlFor="ob-bio">Short bio</label>
            <textarea id="ob-bio" className="mm-textarea" maxLength={160} placeholder="collector of small moments + lo-fi loops" value={bio} onChange={(e) => setBio(e.target.value)}></textarea>
            <p className="mm-hint" style={{ textAlign: 'right' }}>{bio.length}/160</p>
          </div>
          <div>
            <label className="mm-label" htmlFor="ob-mood">Mood status</label>
            <input id="ob-mood" className="mm-input mm-mono" style={{ fontSize: '14.5px' }} value={moodTxt} onChange={(e) => setMoodTxt(e.target.value)}></input>
            <p className="mm-hint">AIM-style away message. Set the mood.</p>
          </div>
        </>)}

        {step === 3 && (<>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Your Top 8 interests</h1>
            <p className="mm-muted" style={{ fontSize: '14.5px', marginTop: '6px' }}>Pick up to 8 and rank them. These power your matches.</p>
          </div>
          {top8.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
              {top8.map((it, i) => (
                <div key={it} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: '9px 12px 9px 14px' }}>
                  <span style={{ display: 'grid', placeItems: 'center', flex: 'none', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--holo)', color: 'var(--ink)', fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '13.5px' }}>{i + 1}</span>
                  <span style={{ flex: 1, fontFamily: 'var(--font-heading)', fontWeight: 500, fontSize: '15px' }}>{it}</span>
                  <button className="mm-icon-btn" style={{ width: '34px', height: '34px' }} aria-label={'Move ' + it + ' up'} onClick={() => moveInterest(i, -1)}>↑</button>
                  <button className="mm-icon-btn" style={{ width: '34px', height: '34px' }} aria-label={'Move ' + it + ' down'} onClick={() => moveInterest(i, 1)}>↓</button>
                  <button className="mm-icon-btn" style={{ width: '34px', height: '34px' }} aria-label={'Remove ' + it} onClick={() => removeInterest(it)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <p className="mm-mono mm-muted" style={{ fontSize: '12px' }}>{top8.length}/8 chosen · use the arrows to rank</p>
          <input className="mm-input" placeholder="search or add your own…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search interests"></input>
          <div className="mm-chip-row">
            {suggestions.slice(0, 14).map((it) => (
              <button key={it} className="mm-chip" onClick={() => addInterest(it)} disabled={top8.length >= 8} style={top8.length >= 8 ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}>+ {it}</button>
            ))}
          </div>
        </>)}
      </Y2KWindow>

      {/* nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="mm-btn mm-btn-ghost" style={{ visibility: step === 0 ? 'hidden' : 'visible' }} onClick={() => setStep(step - 1)}>← Back</button>
        {step < 3 ? (
          <button className="mm-btn mm-btn-primary" disabled={!canNext} style={!canNext ? { opacity: 0.5, cursor: 'not-allowed' } : undefined} onClick={() => canNext && setStep(step + 1)}>Continue →</button>
        ) : (
          <button className="mm-btn mm-btn-primary" onClick={() => { toast('Vibe Page created ✦ welcome in'); go('reel'); }}>
            <PixelHeart size={15}></PixelHeart> Finish setup
          </button>
        )}
      </div>
    </main>
  );
}

/* ============ REEL BUILDER ============ */
function ReelBuilderScreen({ go, toast }) {
  const [frames, setFrames] = useState([
    { src: 'mm/reels/sunset-drive.png', caption: 'golden hour drives', duration: 4 },
    { src: 'mm/reels/polaroid-pile.png', caption: '', duration: 4 },
  ]);
  const [sel, setSel] = useState(0);
  const [beat, setBeat] = useState('lofi-tape');

  const update = (i, patch) => setFrames((f) => f.map((fr, j) => (j === i ? { ...fr, ...patch } : fr)));
  const move = (i, dir) => setFrames((f) => {
    const j = i + dir;
    if (j < 0 || j >= f.length) return f;
    const n = [...f]; [n[i], n[j]] = [n[j], n[i]];
    setSel(j);
    return n;
  });
  const remove = (i) => setFrames((f) => { const n = f.filter((_, j) => j !== i); setSel(Math.max(0, Math.min(sel, n.length - 1))); return n; });
  const add = (clip) => setFrames((f) => { setSel(f.length); return [...f, { src: clip.src, caption: '', duration: 4 }]; });

  const total = frames.reduce((s, f) => s + f.duration, 0);
  const selFrame = frames[sel];
  const beatObj = D.beats.find((b) => b.id === beat);

  return (
    <main className="mm-page" data-screen-label="Reel Builder">
      <section style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.01em' }}>Build your memory reel</h1>
        <p className="mm-muted" style={{ fontSize: '15.5px', maxWidth: '54ch' }}>
          Stitch a few moments together, pick a beat, and tell a tiny story. No pressure to be perfect — messy and honest reads best.
        </p>
      </section>

      {/* live preview */}
      {frames.length > 0 && (
        <Y2KWindow title="live-preview.exe" icon={<PixelDisc size={14}></PixelDisc>} flush>
          <ReelPlayer key={frames.map((f) => f.src + f.caption + f.duration).join('|')} frames={frames} beatLabel={beatObj.title}></ReelPlayer>
        </Y2KWindow>
      )}

      {/* frames */}
      <Y2KWindow title={'frames · ' + frames.length} icon={<PixelSparkle size={14}></PixelSparkle>}>
        {frames.map((f, i) => (
          <div
            key={f.src + i}
            onClick={() => setSel(i)}
            style={{
              display: 'flex', alignItems: 'center', gap: 'var(--gap)', cursor: 'pointer',
              background: sel === i ? 'color-mix(in oklch, var(--primary) 10%, var(--surface-2))' : 'var(--surface-2)',
              border: '1.5px solid ' + (sel === i ? 'var(--primary)' : 'var(--border)'),
              borderRadius: 'var(--radius-card)', padding: 'calc(11px * var(--space)) calc(13px * var(--space))',
              transition: 'border-color 0.15s ease, background 0.15s ease',
            }}
          >
            <span style={{ position: 'relative', flex: 'none' }}>
              <img src={f.src} alt="" style={{ width: '58px', height: '58px', objectFit: 'cover', borderRadius: '14px' }}></img>
              <span className="mm-mono" style={{ position: 'absolute', top: '-6px', left: '-6px', display: 'grid', placeItems: 'center', width: '22px', height: '22px', borderRadius: '8px', background: 'var(--primary)', color: 'var(--primary-fg)', fontSize: '11px', fontWeight: 700 }}>{i + 1}</span>
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: f.caption ? 'var(--ink)' : 'var(--muted)' }}>
                {f.caption || 'no caption yet'}
              </p>
              <p className="mm-mono mm-muted" style={{ fontSize: '12px' }}>{f.duration}s</p>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button className="mm-icon-btn" style={{ width: '36px', height: '36px' }} aria-label="Move frame up" onClick={(e) => { e.stopPropagation(); move(i, -1); }}>↑</button>
              <button className="mm-icon-btn" style={{ width: '36px', height: '36px' }} aria-label="Move frame down" onClick={(e) => { e.stopPropagation(); move(i, 1); }}>↓</button>
              <button className="mm-icon-btn" style={{ width: '36px', height: '36px' }} aria-label="Delete frame" onClick={(e) => { e.stopPropagation(); remove(i); }}>✕</button>
            </div>
          </div>
        ))}
        <p className="mm-mono mm-muted" style={{ fontSize: '12px' }}>total reel length: {total}s</p>
      </Y2KWindow>

      {/* frame details */}
      {selFrame && (
        <Y2KWindow title={'frame-' + (sel + 1) + '-details.cfg'} soft icon={<PixelStar size={14}></PixelStar>}>
          <div>
            <label className="mm-label" htmlFor="rb-caption">Caption</label>
            <input id="rb-caption" className="mm-input" placeholder="say something about this moment…" value={selFrame.caption} onChange={(e) => update(sel, { caption: e.target.value })}></input>
          </div>
          <div>
            <label className="mm-label" htmlFor="rb-duration" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Duration</span>
              <span className="mm-mono" style={{ color: 'var(--primary)' }}>{selFrame.duration}s</span>
            </label>
            <input id="rb-duration" type="range" min="1" max="6" step="1" value={selFrame.duration} onChange={(e) => update(sel, { duration: +e.target.value })} style={{ width: '100%', accentColor: 'var(--primary)' }}></input>
          </div>
        </Y2KWindow>
      )}

      {/* clips */}
      <Y2KWindow title="add-from-your-clips" icon={<PixelSparkle size={14}></PixelSparkle>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gap-sm)' }}>
          {D.clips.map((c) => (
            <button key={c.src} onClick={() => add(c)} aria-label={'Add ' + c.label} style={{ position: 'relative', background: 'none', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-soft)' }}>
              <img src={c.src} alt={c.label} style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', transition: 'transform 0.2s ease' }}></img>
              <span style={{ position: 'absolute', right: '7px', bottom: '7px', display: 'grid', placeItems: 'center', width: '26px', height: '26px', borderRadius: '9px', background: 'var(--primary)', color: 'var(--primary-fg)', fontWeight: 700, fontSize: '15px' }}>+</span>
            </button>
          ))}
        </div>
      </Y2KWindow>

      {/* beat */}
      <Y2KWindow title="background-beat.m3u" icon={<PixelDisc size={14}></PixelDisc>}>
        <p className="mm-muted" style={{ fontSize: '13.5px' }}>Hand-made loops. Audio stays muted until someone taps play — it never autoplays.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-sm)' }}>
          {D.beats.map((b) => (
            <button
              key={b.id}
              onClick={() => setBeat(b.id)}
              aria-pressed={beat === b.id}
              style={{
                display: 'flex', alignItems: 'center', gap: '11px', textAlign: 'left', cursor: 'pointer',
                background: beat === b.id ? 'color-mix(in oklch, var(--primary) 10%, var(--surface-2))' : 'var(--surface-2)',
                border: '1.5px solid ' + (beat === b.id ? 'var(--primary)' : 'var(--border)'),
                borderRadius: 'var(--radius-card)', padding: 'calc(12px * var(--space))', color: 'var(--ink)',
                transition: 'border-color 0.15s ease, background 0.15s ease',
              }}
            >
              <span style={{ display: 'grid', placeItems: 'center', flex: 'none', width: '36px', height: '36px', borderRadius: '50%', background: beat === b.id ? 'var(--holo)' : 'var(--secondary)', color: 'var(--ink)' }}>
                <PixelDisc size={15}></PixelDisc>
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'var(--font-heading)', fontWeight: 600, fontSize: '14px' }}>{b.title}</span>
                <span className="mm-muted" style={{ display: 'block', fontSize: '12px' }}>{b.vibe}</span>
              </span>
            </button>
          ))}
        </div>
      </Y2KWindow>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button className="mm-btn mm-btn-primary" onClick={() => { toast('Reel saved ✦'); go('vibe'); }}>
          <PixelDisc size={15}></PixelDisc> Save reel
        </button>
        <p className="mm-muted" style={{ fontSize: '12.5px', textAlign: 'center' }}>
          <PixelStar size={11} style={{ color: 'var(--primary)' }}></PixelStar> You can re-edit your reel anytime.
        </p>
      </div>
    </main>
  );
}

Object.assign(window, { OnboardingScreen, ReelBuilderScreen });
})();
