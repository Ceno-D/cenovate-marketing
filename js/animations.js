// Cenovate Marketing — animations.js
// GSAP + ScrollTrigger entrance/reveal animations. Deliberately varied per
// section (not the same fade-up everywhere) — Danny's own note was that
// GSAP passes often end up looking identical section to section, so each
// treatment below is picked to match what that section is actually about:
// cards that split apart get split-direction reveals, a hub-and-spoke
// section converges toward its center, a timeline enters from the side
// each item's card sits on, etc. Kept short/subtle throughout — no bounce,
// no cheesy overshoot, nothing that fights the page's existing calmer
// motion language (ticker marquee, hover lifts, CTA glow rotation).

(function () {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // GSAP failed to load (CDN blocked/offline) — fail silently, the page
    // is fully readable/functional without it, just without the polish.
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Respect reduced-motion system setting — skip everything, content is
  // already visible by default (these are all gsap.from() reveals, so
  // doing nothing here just means no animation, not hidden content).
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return;

  const EASE = 'power3.out';

  // Shared defaults for a standard scroll-triggered reveal — "play once,
  // when the trigger is 80% up the viewport" reads naturally without
  // feeling delayed or janky on fast scrolls.
  function scrollDefaults(trigger) {
    return {
      trigger,
      start: 'top 82%',
      toggleActions: 'play none none none',
    };
  }

  // ===================== Hero: on-load entrance, not scroll-triggered =====================
  // Built as a PAUSED timeline and started only once the page can actually
  // paint it (see below). Previously these were bare gsap.from() calls that
  // fired the instant this file executed — but GSAP animates in real time
  // regardless of whether anything has painted yet, so on a cold load (Spline
  // iframe + GSAP CDN + web fonts all in flight) the entire ~1.25s sequence
  // burned through before first meaningful paint. Net effect: the headline
  // looked like it never animated at all, and the rest flashed past.
  //
  // The .from() tweens still apply their start state immediately on creation
  // even while paused, so the content is hidden from the very first frame —
  // no flash of un-animated text before the timeline is released.
  const heroTl = gsap.timeline({ paused: true });

  heroTl
    .from('.hero-headline', { opacity: 0, y: 34, duration: 1.2, ease: EASE })
    .from('.hero-subhead', { opacity: 0, y: 24, duration: 1.0, ease: EASE }, '-=0.75')
    .from('.hero-ctas .btn', {
      opacity: 0,
      y: 18,
      duration: 0.85,
      ease: EASE,
      stagger: 0.14,
    }, '-=0.6');

  // Release the timeline once web fonts have loaded (the headline uses a
  // gradient background-clip:text fill plus the Playfair accent word, so it
  // genuinely cannot paint correctly until fonts resolve) and then on the next
  // animation frame, so frame one of the tween is a frame the user can see.
  let heroStarted = false;
  function startHero() {
    if (heroStarted) return;
    heroStarted = true;
    requestAnimationFrame(() => heroTl.play());
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(startHero);
  } else {
    startHero();
  }
  // Safety net: never leave the hero stuck hidden if fonts.ready stalls or
  // never settles (blocked font CDN, odd browser). Whichever fires first wins.
  setTimeout(startHero, 1500);

  // ===================== What I Do: cards rise, grid slides in from the side =====================
  // Two different motions for the two different card treatments already
  // built into this section, instead of one blanket animation.
  gsap.from('.service-card-primary', {
    opacity: 0,
    y: 30,
    duration: 0.7,
    ease: EASE,
    stagger: 0.12,
    scrollTrigger: scrollDefaults('.service-cards-primary'),
  });

  gsap.from('.service-grid-item', {
    opacity: 0,
    x: -30,
    duration: 0.6,
    ease: EASE,
    stagger: 0.1,
    scrollTrigger: scrollDefaults('.service-grid-secondary'),
  });

  // ===================== The Real Problem: text builds line by line =====================
  gsap.from('.rp-headline', { opacity: 0, y: 24, duration: 0.8, ease: EASE, scrollTrigger: scrollDefaults('.real-problem-inner') });
  gsap.from('.rp-body', {
    opacity: 0,
    y: 16,
    duration: 0.7,
    ease: EASE,
    stagger: 0.15,
    scrollTrigger: scrollDefaults('.real-problem-inner'),
  });
  gsap.from('.rp-divider', {
    scaleX: 0,
    duration: 0.6,
    ease: EASE,
    transformOrigin: 'center center',
    scrollTrigger: scrollDefaults('.rp-divider'),
  });
  gsap.from('.rp-closing', { opacity: 0, y: 14, duration: 0.7, ease: EASE, scrollTrigger: scrollDefaults('.rp-closing') });
  gsap.from('.rp-cta-glow', { opacity: 0, y: 14, duration: 0.6, ease: EASE, scrollTrigger: scrollDefaults('.rp-cta-glow') });

  // ===================== Projects: reel cards settle in with a soft scale-up =====================
  gsap.from('.project-card', {
    opacity: 0,
    scale: 0.94,
    duration: 0.7,
    ease: EASE,
    stagger: 0.12,
    scrollTrigger: scrollDefaults('.project-cards'),
  });
  gsap.from('.site-shot', {
    opacity: 0,
    y: 20,
    duration: 0.6,
    ease: EASE,
    stagger: 0.1,
    scrollTrigger: scrollDefaults('.sites-strip'),
  });

  // ===================== Why It Takes Both: the two cards converge from opposite sides =====================
  // Matches the actual concept of the section (two different strengths
  // meeting in the middle) instead of a generic fade.
  gsap.from('.skill-card-dark', {
    opacity: 0,
    x: -50,
    duration: 0.8,
    ease: EASE,
    scrollTrigger: scrollDefaults('.skills-split'),
  });
  gsap.from('.skill-card-light', {
    opacity: 0,
    x: 50,
    duration: 0.8,
    ease: EASE,
    scrollTrigger: scrollDefaults('.skills-split'),
  });

  // ===================== How I Work: hub-and-spoke converges toward the center mark =====================
  gsap.from('.process-col-left .process-card', {
    opacity: 0,
    x: -40,
    duration: 0.7,
    ease: EASE,
    stagger: 0.15,
    scrollTrigger: scrollDefaults('.process-hub'),
  });
  gsap.from('.process-col-right .process-card', {
    opacity: 0,
    x: 40,
    duration: 0.7,
    ease: EASE,
    stagger: 0.15,
    scrollTrigger: scrollDefaults('.process-hub'),
  });
  gsap.from('.process-symbol', {
    opacity: 0,
    scale: 0.75,
    duration: 0.8,
    ease: 'back.out(1.5)', // the one deliberate touch of overshoot — a small
    // settle on the brand mark itself, not applied anywhere else on the page
    scrollTrigger: scrollDefaults('.process-hub'),
  });

  // ===================== Why Cenovate Your Business: timeline items enter from their own side =====================
  // Separate concern from the existing scroll-color-fill logic in main.js
  // (that continuously tracks scroll position to color dots/cards green) —
  // this only fires once, on first entrance, and only touches
  // opacity/position, not color/background, so the two systems don't fight.
  gsap.utils.toArray('.timeline-left').forEach((item) => {
    gsap.from(item.querySelector('.timeline-content'), {
      opacity: 0,
      x: -40,
      duration: 0.7,
      ease: EASE,
      scrollTrigger: scrollDefaults(item),
    });
  });
  gsap.utils.toArray('.timeline-right').forEach((item) => {
    gsap.from(item.querySelector('.timeline-content'), {
      opacity: 0,
      x: 40,
      duration: 0.7,
      ease: EASE,
      scrollTrigger: scrollDefaults(item),
    });
  });

  // ===================== Final CTA: builds top to bottom =====================
  gsap.from('.final-cta-eyebrow', { opacity: 0, y: 12, duration: 0.6, ease: EASE, scrollTrigger: scrollDefaults('.final-cta-content') });
  gsap.from('.final-cta-headline', { opacity: 0, y: 20, duration: 0.8, ease: EASE, scrollTrigger: scrollDefaults('.final-cta-content') });
  gsap.from('.final-cta-body', { opacity: 0, y: 14, duration: 0.7, ease: EASE, scrollTrigger: scrollDefaults('.final-cta-content') });
  gsap.from('.final-cta-closer', { opacity: 0, y: 12, duration: 0.6, ease: EASE, scrollTrigger: scrollDefaults('.final-cta-content') });
  gsap.from('.final-cta-btn', { opacity: 0, y: 12, duration: 0.6, ease: EASE, scrollTrigger: scrollDefaults('.final-cta-content') });

  // ===================== Footer: quiet fade, the page's exhale =====================
  gsap.from('.footer-inner > *', {
    opacity: 0,
    y: 16,
    duration: 0.6,
    ease: EASE,
    stagger: 0.1,
    scrollTrigger: scrollDefaults('.footer-inner'),
  });
})();
