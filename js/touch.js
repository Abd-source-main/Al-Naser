/* ════════════════════════════════════════════════════════════
   TOUCH INTERACTIONS  (phones / tablets)
   - Swipe the product sliders left / right
   - Scroll "spotlight": emphasise the element at screen centre
   - Gentle gyroscope tilt on the hero card (where supported)

   Runs ONLY on phone-width viewports (≤768px) so desktops AND
   touchscreen laptops are untouched. Pairs with css/touch.css.
   ════════════════════════════════════════════════════════════ */
(function () {
  // Bail out on anything wider than the phone breakpoint. Width is used
  // (rather than hover/pointer detection) because some laptops misreport
  // their input capabilities.
  if (!window.matchMedia || !window.matchMedia('(max-width: 768px)').matches) return;

  /* ──────────────────────────────────────────
     1. SCROLL SPOTLIGHT
     Toggle `.in-view` on whatever is crossing the
     vertical centre band of the viewport.
  ────────────────────────────────────────── */
  if ('IntersectionObserver' in window) {
    var spotlight = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    }, {
      // only the middle ~10% of the screen counts as "centre"
      rootMargin: '-45% 0px -45% 0px',
      threshold: 0
    });

    document.querySelectorAll('.card, .pillar, .process-step')
      .forEach(function (el) { spotlight.observe(el); });
  }

  /* ──────────────────────────────────────────
     2. SWIPE THE SLIDERS
     Reuse the existing prev / next buttons (their
     click handlers already drive the slideshow).
  ────────────────────────────────────────── */
  document.querySelectorAll('.card-slider').forEach(function (slider) {
    var startX = 0, startY = 0, tracking = false;

    slider.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      startX = t.clientX;
      startY = t.clientY;
      tracking = true;
    }, { passive: true });

    slider.addEventListener('touchend', function (e) {
      if (!tracking) return;
      tracking = false;

      var t = e.changedTouches[0];
      var dx = t.clientX - startX;
      var dy = t.clientY - startY;

      // require a clearly horizontal swipe of at least 40px
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        var btn = slider.querySelector(dx < 0 ? '.next' : '.prev');
        if (btn) btn.click();
      }
    }, { passive: true });
  });

  /* ──────────────────────────────────────────
     3. GYROSCOPE TILT ON THE HERO CARD
     The desktop card uses mousemove; touch has none.
     Use device orientation instead. iOS 13+ requires an
     explicit permission gesture, so we only auto-enable
     where no permission prompt is needed (e.g. Android).
  ────────────────────────────────────────── */
  var heroCard = document.getElementById('heroCard');
  if (heroCard && window.DeviceOrientationEvent &&
      typeof DeviceOrientationEvent.requestPermission !== 'function') {

    window.addEventListener('deviceorientation', function (e) {
      // gamma = left/right tilt, beta = front/back tilt
      var gamma = Math.max(-25, Math.min(25, e.gamma || 0));
      var beta = Math.max(-25, Math.min(25, (e.beta || 0) - 45));
      heroCard.style.transform =
        'translateY(-40%) rotateY(' + (gamma * 0.4).toFixed(1) + 'deg) ' +
        'rotateX(' + (-beta * 0.3).toFixed(1) + 'deg)';
    }, { passive: true });
  }
})();
