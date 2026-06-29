/* Magnetize — gold particle "blobs" that drift around the contact submit
 * button and are attracted toward the cursor as it nears (vanilla port of
 * the MagnetizeButton Variant 2). The blobs float on a CSS keyframe while
 * this loop drives the cursor-attraction transform on each particle.
 */
(function () {
  'use strict';

  var btn = document.getElementById('contactSubmit');
  if (!btn) return;

  var host = btn.closest('.form-submit') || btn.parentElement;
  var COUNT = 60;          // particle count
  var RADIUS = 150;        // attraction radius in px
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── build the particle layer ─────────────────────────────
  var layer = document.createElement('div');
  layer.className = 'mag-layer';
  layer.setAttribute('aria-hidden', 'true');
  host.appendChild(layer);

  var particles = [];
  for (var i = 0; i < COUNT; i++) {
    var el = document.createElement('span');
    el.className = 'mag-particle';

    var inner = document.createElement('i');
    inner.style.setProperty('--fx', (Math.random() * 16 - 8).toFixed(1) + 'px');
    inner.style.setProperty('--fy', (Math.random() * 16 - 8).toFixed(1) + 'px');
    inner.style.animationDuration = (2.5 + Math.random() * 2).toFixed(2) + 's';
    inner.style.animationDelay = (-Math.random() * 3).toFixed(2) + 's';
    el.appendChild(inner);
    layer.appendChild(el);

    var bx = Math.random() * 1000 - 500;  // scattered wider around the button
    var by = Math.random() * 700 - 350;
    particles.push({ el: el, baseX: bx, baseY: by, x: bx, y: by });
  }

  // ── pointer tracking ─────────────────────────────────────
  var mouse = { x: 0, y: 0 };
  var hovering = false;

  function center() {
    var r = host.getBoundingClientRect();
    return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
  }

  window.addEventListener('mousemove', function (e) {
    var c = center();
    mouse.x = e.clientX - c.cx;
    mouse.y = e.clientY - c.cy;
  }, { passive: true });

  btn.addEventListener('mouseenter', function () { hovering = true; });
  btn.addEventListener('mouseleave', function () { hovering = false; });

  // ── animation loop: lerp each particle toward its target ─
  function frame() {
    var dist = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
    var near = dist < RADIUS;
    var strength = near ? Math.max(0, 1 - dist / RADIUS) : 0;

    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var tx, ty;

      if (hovering) {
        tx = mouse.x * 0.25;
        ty = mouse.y * 0.25;
      } else if (near) {
        tx = p.baseX + (mouse.x - p.baseX) * strength * 0.4;
        ty = p.baseY + (mouse.y - p.baseY) * strength * 0.4;
      } else {
        tx = p.baseX;
        ty = p.baseY;
      }

      // spring-like easing toward the target
      var ease = hovering ? 0.18 : near ? 0.12 : 0.06;
      p.x += (tx - p.x) * ease;
      p.y += (ty - p.y) * ease;

      p.el.style.transform =
        'translate(-50%, -50%) translate(' + p.x.toFixed(2) + 'px,' + p.y.toFixed(2) + 'px)';
    }

    requestAnimationFrame(frame);
  }

  if (!prefersReduced) requestAnimationFrame(frame);
})();
