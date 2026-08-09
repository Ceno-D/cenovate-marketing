// Cenovate Marketing — main.js
// Sections get their own behavior added here incrementally as we build them.

console.log('Cenovate Marketing site loaded.');

// ===================== Mobile nav toggle =====================
(function () {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    links.classList.remove('is-open');
  }

  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Close after tapping any link — these are same-page anchors, so the menu
  // should get out of the way once the user has picked a destination.
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));

  // Close if the viewport is resized back up to desktop while open (avoids
  // an open mobile menu getting stuck visible after a rotate/resize).
  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
})();

// Real Problem's cursor-follow effect is now the actual Spline smoke-particle
// scene (embedded iframe, self-contained) — the earlier CSS/JS glow
// approximation has been removed in favor of it.

// ===================== Projects: hover-to-play reel cards =====================
// Videos are large (30-60MB each) — preload="none" means nothing downloads
// until a card is actually hovered, and the src is only ever set once per
// card (not re-fetched on repeated hovers).
(function () {
  const cards = document.querySelectorAll('.project-card');

  cards.forEach((card) => {
    const video = card.querySelector('.project-video');
    const muteToggle = card.querySelector('.project-mute-toggle');
    const src = card.dataset.video;

    card.addEventListener('mouseenter', () => {
      if (!video.src) {
        video.src = src;
      }
      card.classList.add('is-playing');
      video.play().catch(() => {
        // Autoplay can be blocked in some contexts (e.g. low-power mode) —
        // fail silently rather than throwing, the thumbnail stays visible.
      });
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('is-playing');
      video.pause();
      // Reset to muted on every new hover — carrying an "unmuted" choice
      // silently into the next card/next viewing would risk sound blasting
      // unexpectedly later, which is worse than just asking again.
      video.muted = true;
      if (muteToggle) muteToggle.setAttribute('aria-pressed', 'false');
    });

    if (muteToggle) {
      muteToggle.addEventListener('click', (e) => {
        // Stop this from bubbling to the card (which has no click handler
        // right now, but this keeps the button's behavior self-contained
        // regardless of what gets added to the card later).
        e.stopPropagation();
        const nowMuted = !video.muted;
        video.muted = nowMuted;
        muteToggle.setAttribute('aria-pressed', nowMuted ? 'false' : 'true');
        muteToggle.setAttribute('aria-label', nowMuted ? 'Turn sound on' : 'Turn sound off');
      });
    }
  });
})();

// ===================== Mission timeline: scroll-driven fill + active dots =====================
// Line/dots start gray, then turn green as you scroll past each step —
// matches the OC Digital Firm reference. No animation library needed, just
// a scroll-position check against a fixed "reading line" partway down the
// viewport (65% — roughly where someone's eye actually is while scrolling,
// not the exact vertical center).
(function () {
  const timeline = document.querySelector('.mission-timeline');
  const line = document.querySelector('.timeline-line');
  const fill = document.querySelector('.timeline-line-fill');
  const items = document.querySelectorAll('.mission-timeline .timeline-item');
  if (!timeline || !line || !fill || !items.length) return;

  const dots = Array.from(items)
    .map((item) => item.querySelector('.timeline-dot'))
    .filter(Boolean);

  const READING_LINE = 0.65; // fraction of viewport height

  // Card heights vary (copy length differs per item), so the line can't be
  // pinned to fixed top/bottom CSS values — this measures the real first
  // and last dot positions and sets the line to run exactly between them,
  // so it starts and ends capped by a bullet instead of overshooting.
  function positionLine() {
    if (dots.length < 2) return;
    const timelineRect = timeline.getBoundingClientRect();
    const firstRect = dots[0].getBoundingClientRect();
    const lastRect = dots[dots.length - 1].getBoundingClientRect();
    const topY = (firstRect.top + firstRect.height / 2) - timelineRect.top;
    const bottomY = (lastRect.top + lastRect.height / 2) - timelineRect.top;
    line.style.top = topY + 'px';
    line.style.height = (bottomY - topY) + 'px';
  }

  function update() {
    const readingY = window.innerHeight * READING_LINE;
    const lineRect = line.getBoundingClientRect();

    // Fill height: how far the reading line has progressed through the
    // (now dot-to-dot) line itself, clamped 0-100%.
    const progressPx = readingY - lineRect.top;
    const progress = lineRect.height > 0 ? Math.min(1, Math.max(0, progressPx / lineRect.height)) : 0;
    fill.style.height = (progress * 100) + '%';

    // Each dot (and its card) lights up once the reading line has reached it.
    items.forEach((item) => {
      const dot = item.querySelector('.timeline-dot');
      if (!dot) return;
      const dotRect = dot.getBoundingClientRect();
      item.classList.toggle('is-active', dotRect.top <= readingY);
    });
  }

  function refresh() {
    positionLine();
    update();
  }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', refresh);
  refresh(); // set correct line span + active state on load, e.g. mid-scroll reload
})();
