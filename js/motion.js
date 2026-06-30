/* ══════════════════════════════════════════════════════════════
   MOTION — spring-based scroll reveals (DESKTOP ONLY)

   Why this exists:
   The CSS scroll-reveal system (.reveal / .reveal-group in base.css)
   is scoped to ≤768px viewports. On desktop those elements simply
   appear with no entrance animation. This module fills that gap using
   Motion (https://motion.dev) — the free, open-source animation library
   (the successor to Framer Motion's vanilla API).

   Design rules to avoid conflicts with the existing animation code:
     • Runs ONLY on >768px, so it never fights the mobile CSS reveals.
     • Bails out entirely under prefers-reduced-motion.
     • Hides an element only if it is BELOW the fold at load, so there is
       no flash of already-visible content (no FOUC).
     • Uses inline styles + Motion's own inView observer, independent of
       main.js's IntersectionObserver (the .visible class it adds has no
       desktop CSS effect, so the two coexist safely).
     • If the CDN module fails to load, nothing is hidden and the page
       renders exactly as before — graceful degradation.

   Loaded as: <script type="module" src="js/motion.js"></script>
   To pin the version for reproducible builds, replace `@latest` below
   with a specific version, e.g. motion@11.
══════════════════════════════════════════════════════════════ */
import { animate, inView } from "https://cdn.jsdelivr.net/npm/motion@latest/+esm";

(function () {
  var isDesktop = window.matchMedia("(min-width: 769px)").matches;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!isDesktop || reduceMotion) return;

  /* Site signature easing (matches the CSS cubic-beziers used elsewhere). */
  var EASE = [0.16, 1, 0.3, 1];

  function belowFold(el) {
    /* True when the element is far enough down that hiding it can't flash. */
    return el.getBoundingClientRect().top > window.innerHeight * 0.9;
  }

  function hide(el, y) {
    el.style.opacity = "0";
    el.style.transform = "translateY(" + y + "px)";
    el.style.willChange = "opacity, transform";
  }

  function settle(el) {
    /* Drop will-change once the entrance is done, so the compositor can rest. */
    setTimeout(function () { el.style.willChange = ""; }, 1000);
  }

  /* ── 1. Standalone reveal elements: gentle slide + fade ── */
  document.querySelectorAll(".reveal").forEach(function (el) {
    if (!belowFold(el)) return;          // already on screen → leave untouched
    hide(el, 24);
    inView(el, function () {
      animate(el, { opacity: 1, y: 0 }, { duration: 0.7, ease: EASE });
      settle(el);
      return function () {};             // don't re-hide when it scrolls away
    }, { amount: 0.15 });
  });

  /* ── 2. Grouped reveals: stagger the children in with a soft spring ── */
  document.querySelectorAll(".reveal-group").forEach(function (group) {
    var kids = Array.prototype.slice.call(group.children).filter(belowFold);
    if (!kids.length) return;
    kids.forEach(function (kid) { hide(kid, 18); });
    inView(group, function () {
      kids.forEach(function (kid, i) {
        animate(
          kid,
          { opacity: 1, y: 0 },
          { type: "spring", stiffness: 130, damping: 18, delay: i * 0.08 }
        );
        settle(kid);
      });
      return function () {};
    }, { amount: 0.1 });
  });
})();
