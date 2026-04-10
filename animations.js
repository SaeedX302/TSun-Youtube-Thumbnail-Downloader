/**
 * animations.js -- Clay GSAP Animation Module
 * Handles hero, storytelling, results, and interaction animations with GSAP.
 * Respects prefers-reduced-motion and exposes ClayAnimations on window for main.js.
 */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  window.ClayAnimations = {
    animateResultsReveal,
    animateStatus,
  };

  function init() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    gsap.set(
      ['.pill', '.hero h1', '.hero__subtitle', '.hero__cta span', '.hero__scroll-indicator'],
      {
        opacity: 0,
        y: 18,
      }
    );

    gsap.set('.panel--input', { opacity: 0, y: 36 });
    gsap.set('.story-card', { opacity: 0, y: 32, scale: 0.97 });
    gsap.set('.cta-strip', { opacity: 0, y: 34 });
    gsap.set('.result-head__subtitle', { opacity: 0, y: 20 });
    gsap.set('.result-benefits article', { opacity: 0, y: 24 });
    gsap.set('.storyline__intro', { opacity: 0, y: 28 });
    gsap.set('.storyline__reveal', { opacity: 0, y: 26, scale: 0.96 });
    gsap.set('.hero__decor--orb', { yPercent: -8 });
    gsap.set('.hero__decor--waves', { yPercent: -4 });

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.05 });

    heroTl
      .fromTo('.pill', { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.55, clearProps: 'all' })
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
        '.hero__cta span',
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.12 },
        '-=0.36'
      )
      .fromTo(
        '.hero__scroll-indicator',
        { y: 18, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, clearProps: 'all' },
        '-=0.28'
      )
      .fromTo(
        '.panel--input',
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.60, clearProps: 'all' },
        '-=0.50'
      );

    gsap.to('.hero__scroll-indicator svg circle', {
      y: 6,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      duration: 0.8,
      delay: 0.5,
    });

    const heroIndicator = document.querySelector('.hero__scroll-indicator');
    const storySection = document.querySelector('.storyline');

    const smoothScrollToStory = () => {
      if (!storySection) return;
      gsap.to(window, {
        scrollTo: { y: storySection, offsetY: 80 },
        duration: 0.75,
        ease: 'power3.inOut',
      });
    };

    if (heroIndicator) {
      heroIndicator.addEventListener('click', smoothScrollToStory);
      heroIndicator.addEventListener('keyup', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          smoothScrollToStory();
        }
      });
    }

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

    gsap.to('.hero__decor--orb', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });

    gsap.to('.hero__decor--waves', {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.4,
      },
    });

    const storyTl = gsap.timeline({
      scrollTrigger: {
        trigger: '.storyline',
        start: 'top 92%',
        once: true,
      },
    });

    storyTl
      .fromTo(
        '.storyline__intro',
        { y: 28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' }
      )
      .fromTo(
        '.story-card',
        { y: 28, opacity: 0, scale: 0.97 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.65,
          ease: 'power2.out',
          stagger: 0.12,
        },
        '-=0.35'
      )
      .fromTo(
        '.storyline__reveal',
        { y: 26, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: 'power1.out' },
        '-=0.28'
      );

    gsap.fromTo(
      '.cta-strip',
      { y: 34, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.55,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: '.cta-strip',
          start: 'top 92%',
          once: true,
        },
      }
    );
  }

  function animateResultsReveal() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    gsap.fromTo(
      '#resultSection',
      { y: 32, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', clearProps: 'all' }
    );

    gsap.fromTo(
      '.result-head__subtitle',
      { y: 22, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out', clearProps: 'all' }
    );

    gsap.fromTo(
      '.result-benefits article',
      { y: 24, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.1,
        clearProps: 'all',
      }
    );

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

  function animateStatus() {
    if (prefersReducedMotion || typeof gsap === 'undefined') return;

    gsap.fromTo(
      '#status',
      { y: -7, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.30, ease: 'power2.out', clearProps: 'all' }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
