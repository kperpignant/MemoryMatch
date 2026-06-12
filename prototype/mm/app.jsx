// MemoryMatch — app shell: routing, theming, tweaks
(() => {
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "soft-pixel-romance",
  "headingFont": "Baloo 2",
  "holo": 85,
  "spacing": "roomy"
}/*EDITMODE-END*/;

const SPACING = { cozy: 0.85, roomy: 1, airy: 1.18 };

const ROUTES = ['landing', 'browse', 'vibe', 'chemistry', 'onboarding', 'reel'];

function useHashRoute() {
  const initial = () => {
    const h = window.location.hash.replace(/^#\/?/, '');
    return ROUTES.includes(h) ? h : 'landing';
  };
  const [route, setRoute] = useState(initial);
  useEffect(() => {
    const onHash = () => setRoute(initial());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (r) => {
    window.location.hash = '/' + r;
    window.scrollTo({ top: 0 });
  };
  return [route, go];
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, go] = useHashRoute();
  const [toastNode, toast] = useToast();

  // apply theme + tweak vars to document
  useEffect(() => {
    const root = document.documentElement;
    if (t.theme === 'soft-pixel-romance') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', t.theme);
    root.style.setProperty('--holo-alpha', String(t.holo / 100));
    root.style.setProperty('--space', String(SPACING[t.spacing] || 1));
    root.style.setProperty('--font-heading', `'${t.headingFont}', system-ui, sans-serif`);
  }, [t.theme, t.holo, t.spacing, t.headingFont]);

  const screens = {
    landing: <LandingScreen go={go}></LandingScreen>,
    browse: <BrowseScreen go={go} toast={toast}></BrowseScreen>,
    vibe: <VibeScreen go={go} toast={toast}></VibeScreen>,
    chemistry: <ChemistryScreen go={go} toast={toast}></ChemistryScreen>,
    onboarding: <OnboardingScreen go={go} toast={toast} theme={t.theme} setTheme={(v) => setTweak('theme', v)}></OnboardingScreen>,
    reel: <ReelBuilderScreen go={go} toast={toast}></ReelBuilderScreen>,
  };

  return (
    <React.Fragment>
      <SiteHeader route={route} go={go}></SiteHeader>
      {screens[route]}

      {/* prototype screen switcher */}
      <nav
        aria-label="Prototype screens"
        style={{
          position: 'fixed', bottom: '14px', left: '50%', transform: 'translateX(-50%)', zIndex: 60,
          display: 'flex', gap: '4px', padding: '6px',
          background: 'color-mix(in oklch, var(--surface) 88%, transparent)',
          backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid var(--border)', borderRadius: '999px', boxShadow: 'var(--shadow-soft)',
          maxWidth: 'calc(100vw - 24px)', overflowX: 'auto',
        }}
      >
        {[['landing', 'home'], ['onboarding', 'setup'], ['reel', 'reel'], ['vibe', 'vibe'], ['browse', 'browse'], ['chemistry', 'match']].map(([r, label]) => (
          <button
            key={r}
            onClick={() => go(r)}
            style={{
              border: 'none', borderRadius: '999px', padding: '7px 13px', fontSize: '12.5px',
              fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap',
              background: route === r ? 'var(--primary)' : 'transparent',
              color: route === r ? 'var(--primary-fg)' : 'var(--muted)',
              cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease',
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      {toastNode}

      <TweaksPanel>
        <TweakSection label="Theme"></TweakSection>
        <TweakSelect
          label="Profile theme"
          value={t.theme}
          options={[
            { value: 'soft-pixel-romance', label: 'Soft Pixel Romance' },
            { value: 'late-night-aim', label: 'Late Night AIM' },
            { value: 'cyber-cafe', label: 'Cyber Café' },
            { value: 'arcade-crush', label: 'Arcade Crush' },
            { value: 'dreamcast-summer', label: 'Dreamcast Summer' },
          ]}
          onChange={(v) => setTweak('theme', v)}
        ></TweakSelect>
        <TweakSlider label="Holo shimmer" value={t.holo} min={0} max={100} unit="%" onChange={(v) => setTweak('holo', v)}></TweakSlider>
        <TweakSection label="Type & space"></TweakSection>
        <TweakRadio label="Heading font" value={t.headingFont} options={['Baloo 2', 'Fredoka', 'Gabarito']} onChange={(v) => setTweak('headingFont', v)}></TweakRadio>
        <TweakRadio label="Spacing" value={t.spacing} options={['cozy', 'roomy', 'airy']} onChange={(v) => setTweak('spacing', v)}></TweakRadio>
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App></App>);
})();
