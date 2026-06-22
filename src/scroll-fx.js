import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function ready(fn) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(fn, 0);
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(() => {

  // ---------- 1. Nav: turns to frosted glass once you scroll past the hero ----------
  const nav = document.querySelector('nav');
  if (nav) {
    ScrollTrigger.create({
      start: 80,
      end: 99999,
      toggleClass: { targets: nav, className: 'nav-glass' },
    });
  }

  // ---------- 2. Section reveals: float up out of the page with a touch of 3D ----------
  const reveals = gsap.utils.toArray('.reveal');
  reveals.forEach((el) => {
    if (reducedMotion) { gsap.set(el, { opacity: 1, y: 0, rotateX: 0 }); return; }
    gsap.fromTo(el,
      { opacity: 0, y: 56, rotateX: 8, transformPerspective: 800, transformOrigin: '50% 100%' },
      {
        opacity: 1, y: 0, rotateX: 0, duration: 1.1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 86%' },
      }
    );
  });

  // ---------- 3. Hero parallax depth: text + crystal drift at different speeds than background ----------
  const heroEl = document.querySelector('.hero');
  const heroCopy = document.querySelector('.hero-grid > div:first-child');
  const heroCard = document.querySelector('.call-card');
  const crystalWrap = document.querySelector('.three-hero-wrap');
  const gridLines = document.querySelector('.hero-grid-lines');

  if (heroEl && !reducedMotion) {
    if (heroCopy) {
      gsap.to(heroCopy, {
        yPercent: 18, opacity: 0.4, ease: 'none',
        scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
    if (heroCard) {
      gsap.to(heroCard, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
    if (crystalWrap) {
      gsap.to(crystalWrap, {
        yPercent: -6, rotateZ: 6, ease: 'none',
        scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
    if (gridLines) {
      gsap.to(gridLines, {
        yPercent: 30, ease: 'none',
        scrollTrigger: { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
  }

  // ---------- 4. Weightlessness: gentle perpetual float on key cards ----------
  if (!reducedMotion) {
    [heroCard, crystalWrap].forEach((el) => {
      if (!el) return;
      gsap.to(el, {
        y: '+=14', duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1,
      });
    });
  }

  // ---------- 5. Isometric tilt-on-hover: call card + chips + stat cells respond to the cursor ----------
  const tiltables = document.querySelectorAll('.call-card, .chip, .stat-cell');
  if (!reducedMotion) {
    tiltables.forEach((el) => {
      el.style.transformStyle = 'preserve-3d';
      el.style.willChange = 'transform';

      function onMove(e) {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        gsap.to(el, {
          rotateY: px * 10,
          rotateX: -py * 10,
          transformPerspective: 700,
          scale: 1.02,
          duration: 0.5,
          ease: 'power2.out',
        });
      }
      function onLeave() {
        gsap.to(el, { rotateY: 0, rotateX: 0, scale: 1, duration: 0.6, ease: 'power3.out' });
      }
      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', onLeave);
    });
  }

  // ---------- 6. Glass treatment: apply frosted-glass surface to floating UI cards ----------
  document.querySelectorAll('.chip, .stat-cell, .contact-form').forEach((el) => {
    el.classList.add('glass-surface');
  });

  // ---------- 7. Closing CTA: subtle depth pop as it enters view ----------
  const closingH2 = document.querySelector('.closing h2');
  if (closingH2 && !reducedMotion) {
    gsap.fromTo(closingH2,
      { scale: 0.92, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: closingH2, start: 'top 80%' } }
    );
  }
});
