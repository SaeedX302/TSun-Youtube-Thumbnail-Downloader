/**
 * animations.js — Clay GSAP Animation Module
 * Handles all GSAP-powered entrance, scroll, and interaction animations.
 * Respects prefers-reduced-motion. Exposes ClayAnimations on window for main.js.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /* ── Public API ─────────────────────────────────────────────────── */
  window.ClayAnimations = {
    animateResultsReveal,
    animateStatus,
  };

  /* ── Init ───────────────────────────────────────────────────────── */
  function init() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Set initial visibility for elements that will animate in
    gsap.set(['.pill', '.hero h1', '.hero__subtitle', '.panel--input'], {
      opacity: 0,
      y: 0,
    });

    /* Hero entrance — staggered sequence */
    const heroTl = gsap.timeline({
      defaults: { ease: 'power3.out' },
      delay: 0.05,
    });

    heroTl
      .to('.pill', {
        y: 0,
        opacity: 1,
        duration: 0.5,
        clearProps: 'y',
      })
      .fromTo(
        '.hero h1',
        { y: 44, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.65 },
        '-=0.30'
      )
      .fromTo(
        '.hero__subtitle',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.60 },
        '-=0.42'
      )
      .fromTo(
        '.panel--input',
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.60, clearProps: 'all' },
        '-=0.40'
      );

    /* Preview panel — ScrollTrigger reveal */
    gsap.fromTo(
      '.panel--preview',
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.65,
        ease: 'power2.out',
        clearProps: 'all',
        scrollTrigger: {
          trigger: '.panel--preview',
          start: 'top 88%',
          once: true,
        },
      }
    );
  }

  /* ── Results reveal — called by main.js ─────────────────────────── */
  function animateResultsReveal() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    /* Section slides up */
    gsap.fromTo(
      '#resultSection',
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', clearProps: 'all' }
    );

    /* Cards stagger in after a short delay */
    const cards = document.querySelectorAll('.thumb-card');
    if (cards.length) {
      gsap.fromTo(
        cards,
        { y: 22, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.50,
          ease: 'power2.out',
          stagger: 0.07,
          delay: 0.18,
          clearProps: 'all',
        }
      );
    }
  }

  /* ── Status message — called by main.js ─────────────────────────── */
  function animateStatus() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    gsap.fromTo(
      '#status',
      { y: -7, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.30, ease: 'power2.out', clearProps: 'all' }
    );
  }

  /* ── Bootstrap ──────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
