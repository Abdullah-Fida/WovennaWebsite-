import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * The curtain that lifts on arrival.
 *
 * Deliberately restrained: it shows once per session, only on the homepage,
 * lasts under a second, and never blocks the page loading behind it. Anyone
 * who has asked for reduced motion, or who taps or scrolls, skips it outright.
 */
const KEY = 'wovenaa_intro_seen';

/**
 * Decided once per page load, outside React.
 *
 * StrictMode runs effects twice in development. Storing "seen" inside the
 * effect meant the second run read the flag the first run had just written and
 * skipped the intro entirely, so it never appeared. Holding the decision in a
 * module variable makes the effect idempotent: the replayed run resumes the
 * same intro instead of cancelling it, while a genuine remount later (going
 * Home → Shop → Home) still sees 'done' and stays quiet.
 */
let introPhase = null; // null = undecided | 'play' | 'done'

export default function BrandIntro() {
  const [state, setState] = useState('idle'); // idle | showing | lifting | done

  useEffect(() => {
    if (introPhase === null) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      let seen = false;
      try {
        seen = sessionStorage.getItem(KEY) === '1';
        sessionStorage.setItem(KEY, '1');
      } catch {
        seen = true; // storage blocked — better to skip than repeat on every route
      }
      introPhase = reduced || seen ? 'done' : 'play';
    }

    if (introPhase === 'done') {
      setState('done');
      return undefined;
    }

    setState('showing');

    const lift = setTimeout(() => setState('lifting'), 950);
    const finish = setTimeout(() => {
      introPhase = 'done';
      setState('done');
    }, 1750);

    // Any intent to interact ends it early.
    const skip = () => setState((s) => (s === 'showing' ? 'lifting' : s));
    window.addEventListener('pointerdown', skip, { once: true });
    window.addEventListener('wheel', skip, { once: true, passive: true });
    window.addEventListener('keydown', skip, { once: true });

    return () => {
      clearTimeout(lift);
      clearTimeout(finish);
      window.removeEventListener('pointerdown', skip);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('keydown', skip);
    };
  }, []);

  if (state === 'done' || state === 'idle') return null;

  // Portalled to body: <main> carries a page-enter animation, and an animated
  // transform on an ancestor makes position:fixed resolve against that
  // ancestor instead of the viewport, which left the veil offset and clipped.
  return createPortal(
    <div className={`brand-intro ${state === 'lifting' ? 'is-lifting' : ''}`} aria-hidden="true">
      <div className="brand-intro-mark">
        <img src="/brand/logo-white.png" alt="" />
        <span className="brand-intro-rule" />
        <span className="brand-intro-word">Wovenaa</span>
      </div>
    </div>,
    document.body
  );
}
