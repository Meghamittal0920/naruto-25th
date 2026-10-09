import { useEffect, useState } from 'react';
import Lenis from 'lenis';
import { loadRest, loadSwing, reducedMotion } from './lib/assets.js';
import Preloader from './components/Preloader.jsx';
import Cursor from './components/Cursor.jsx';
import Hero from './components/Hero.jsx';
import SageMode from './components/SageMode.jsx';
import Swing from './components/Swing.jsx';
import Bonds from './components/Bonds.jsx';
import Lightning from './reactbits/Lightning.jsx';
import ScrollVelocity from './reactbits/ScrollVelocity.jsx';
import ClickSpark from './reactbits/ClickSpark.jsx';
import Noise from './reactbits/Noise.jsx';

const MIN_PRELOAD_MS = 1800;

const BAND_ONE = ['だってばよ！ ・ 火の意志 ・ うずまきナルト ・ ', '木ノ葉隠れの里 ・ 七代目火影 ・ 忍道 ・ '];
const BAND_TWO = ['仲間 ・ 絆 ・ 約束 ・ 諦めない ・ ', 'NARUTO 25周年 ・ ありがとう ・ '];

export default function App() {
  const [progress, setProgress] = useState(0);
  const [swingReady, setSwingReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const started = performance.now();
    (async () => {
      await loadSwing();
      if (cancelled) return;
      setSwingReady(true);
      await loadRest((p) => !cancelled && setProgress(p));
      const wait = Math.max(0, MIN_PRELOAD_MS - (performance.now() - started));
      setTimeout(() => !cancelled && setReady(true), wait);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('is-loading', !ready);
    if (!ready || reducedMotion()) return;
    const lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    let raf = requestAnimationFrame(function tick(time) {
      lenis.raf(time);
      raf = requestAnimationFrame(tick);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [ready]);

  return (
    <>
      <Preloader progress={progress} swingReady={swingReady} done={ready} />
      {swingReady && (
        <main>
          <Hero ready={ready} />
          <ScrollVelocity texts={BAND_ONE} velocity={70} />
          <SageMode />
          <ScrollVelocity texts={BAND_TWO} velocity={55} className="sv--cold" />
          <Swing />
          <Bonds />
        </main>
      )}
      <Lightning active={ready} />
      <Noise />
      <ClickSpark />
      <Cursor />
    </>
  );
}
