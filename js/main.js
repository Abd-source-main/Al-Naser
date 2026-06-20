(function () {
  /* ══════════════════════════════
     SCROLL PROGRESS BAR
  ══════════════════════════════ */
  var bar = document.getElementById('scroll-bar');
  function updateBar() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docH > 0 ? (scrollTop / docH) * 100 : 0) + '%';
  }

  /* ══════════════════════════════
     MOBILE NAV (hamburger drawer)
  ══════════════════════════════ */
  var navToggle = document.querySelector('.nav-toggle');
  var mobileNav = document.getElementById('mobileNav');
  if (navToggle && mobileNav) {
    function setMenu(open) {
      navToggle.classList.toggle('open', open);
      mobileNav.classList.toggle('open', open);
      document.body.classList.toggle('menu-open', open);
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      mobileNav.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    navToggle.addEventListener('click', function () {
      setMenu(!mobileNav.classList.contains('open'));
    });
    mobileNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  /* ══════════════════════════════
     ANIMATED WAVES ON SCROLL
     Each wave gets a unique phase offset and amplitude so they
     undulate independently as you scroll the page
  ══════════════════════════════ */
  var waveConfigs = [
    {
      pathId: 'wave1path',
      divId: 'wave1',
      baseD: 'M0,{A} C200,{B} 400,{C} 600,{A} C800,{B} 1000,{C} 1200,{A} L1200,90 L0,90 Z',
      a0: 40, b0: 80, c0: 0,
      amp: 18, phase: 0, speed: 0.0012
    },
    {
      pathId: 'wave2path',
      divId: 'wave2',
      baseD: 'M0,{C} C300,{B} 600,{C2} 900,{A} C1050,{B} 1150,{C} 1200,{C2} L1200,90 L0,90 Z',
      a0: 20, b0: 70, c0: 0, c20: 50,
      amp: 14, phase: 1.2, speed: 0.001
    },
    {
      pathId: 'wave3path',
      divId: 'wave3',
      baseD: 'M0,{B} C150,{C} 350,{B2} 600,{A} C850,{C} 1050,{B} 1200,{A2} L1200,90 L0,90 Z',
      a0: 60, b0: 20, c0: 70, a20: 55, b20: 35,
      amp: 16, phase: 2.5, speed: 0.0014
    },
    {
      pathId: 'wave4path',
      divId: 'wave4',
      baseD: 'M0,{A} C250,{B} 500,{C} 750,{A2} C900,{B} 1050,{C} 1200,{A} L1200,90 L0,90 Z',
      a0: 30, b0: 75, c0: 10, a20: 50,
      amp: 20, phase: 0.7, speed: 0.0011
    },
    {
      pathId: 'wave5path',
      divId: 'wave5',
      baseD: 'M0,{A} C300,{B} 600,{C} 900,{A2} C1050,{B} 1150,{A} 1200,{C} L1200,70 L0,70 Z',
      a0: 20, b0: 55, c0: 5, a20: 35,
      amp: 12, phase: 3.1, speed: 0.0016
    }
  ];

  var waveElements = waveConfigs.map(function (cfg) {
    return {
      path: document.getElementById(cfg.pathId),
      div: document.getElementById(cfg.divId),
      cfg: cfg
    };
  });

  /* Check if wave is near/in viewport */
  function isWaveNearViewport(divEl) {
    if (!divEl) return false;
    var rect = divEl.getBoundingClientRect();
    return rect.top < window.innerHeight + 200 && rect.bottom > -200;
  }

  var tNow = 0;
  function animateWaves(ts) {
    tNow = ts * 0.001; // seconds
    waveElements.forEach(function (we) {
      if (!we.path) return;
      if (!isWaveNearViewport(we.div)) return;
      var cfg = we.cfg;
      var t = tNow * cfg.speed * 1000 + cfg.phase;
      var s = Math.sin(t);
      var s2 = Math.sin(t + 1.0);
      var s3 = Math.cos(t * 0.7);

      /* Compute shifted control points */
      var A = cfg.a0 + s * cfg.amp;
      var B = cfg.b0 + s2 * cfg.amp * 0.8;
      var C = (cfg.c0 !== undefined ? cfg.c0 : 0) + s3 * cfg.amp * 0.7;
      var A2 = (cfg.a20 !== undefined ? cfg.a20 : cfg.a0) + s * cfg.amp * 0.9;
      var B2 = (cfg.b20 !== undefined ? cfg.b20 : cfg.b0) + s2 * cfg.amp;
      var C2 = (cfg.c20 !== undefined ? cfg.c20 : cfg.c0) + s3 * cfg.amp * 0.6;

      var d = cfg.baseD
        .replace(/{A2}/g, A2.toFixed(1))
        .replace(/{B2}/g, B2.toFixed(1))
        .replace(/{C2}/g, C2.toFixed(1))
        .replace(/{A}/g, A.toFixed(1))
        .replace(/{B}/g, B.toFixed(1))
        .replace(/{C}/g, C.toFixed(1));

      we.path.setAttribute('d', d);
    });
    requestAnimationFrame(animateWaves);
  }
  requestAnimationFrame(animateWaves);

  /* ══════════════════════════════
     HERO BACKGROUND — REACTIVE TO SCROLL
     As user scrolls down, the hero image lifts and darkens
  ══════════════════════════════ */
  var heroBgImg = document.getElementById('heroBgImg');
  var heroBgImg2 = document.getElementById('heroBgImg2');
  var heroReactiveBg = document.getElementById('hero-reactive-bg');
  var hero = document.getElementById('hero');

  function updateHeroParallax() {
    if (!hero || !heroBgImg) return;
    var heroH = hero.offsetHeight;
    var scrollY = window.scrollY;
    var progress = Math.min(scrollY / heroH, 1); // 0..1

    /* Parallax lift */
    var shift = scrollY * 0.35;
    heroBgImg.style.transform = 'scale(1.05) translateY(' + shift + 'px)';
    if (heroBgImg2) heroBgImg2.style.transform = 'scale(1.05) translateY(' + shift + 'px)';

    /* Reactive background tint shifts hue as you scroll */
    var hue1 = Math.round(200 + progress * 20);
    var hue2 = Math.round(180 + progress * 40);
    var glow = 0.4 + progress * 0.35;
    heroReactiveBg.style.background =
      'radial-gradient(ellipse 60% 70% at ' + (50 - progress * 20) + '% 50%, ' +
      'hsla(' + hue1 + ',60%,' + (20 + progress * 10) + '%,' + glow + ') 0%, transparent 70%)';
  }

  /* ══════════════════════════════
     SECTION BACKGROUNDS — REACTIVE
     Sections subtly shift their bg tone based on scroll progress within them
  ══════════════════════════════ */
  var sectionReactive = document.querySelectorAll('.section-reactive');

  function updateSectionBgs() {
    sectionReactive.forEach(function (sec) {
      var rect = sec.getBoundingClientRect();
      var vh = window.innerHeight;
      var progress = 1 - Math.max(0, Math.min(1, (rect.top) / vh)); // 0 at top, 1 when fully entered
      /* Subtle brightness shift */
      var brightness = 1 + progress * 0.04;
      sec.style.filter = 'brightness(' + brightness + ')';
    });
  }

  /* ══════════════════════════════
     HERO CANVAS PARTICLES
  ══════════════════════════════ */
  var canvas = document.getElementById('hero-canvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var NUM = 55;

    function resizeCanvas() {
      canvas.width = hero.offsetWidth;
      canvas.height = hero.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    for (var i = 0; i < NUM; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.5,
        alpha: Math.random() * 0.5 + 0.15
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(201,168,76,' + p.alpha + ')';
        ctx.fill();
      });
      /* Connecting lines between nearby particles */
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var dx = particles[a].x - particles[b].x;
          var dy = particles[a].y - particles[b].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.strokeStyle = 'rgba(201,168,76,' + (0.06 * (1 - dist / 90)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(drawParticles);
    }
    drawParticles();
  }

  /* ══════════════════════════════
     HERO CARD 3D TILT
  ══════════════════════════════ */
  var card = document.getElementById('heroCard');
  if (card && hero) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      card.style.transform =
        'translateY(-40%) rotateY(' + (dx * -8) + 'deg) rotateX(' + (dy * 6) + 'deg) translateZ(10px)';
    });
    hero.addEventListener('mouseleave', function () {
      card.style.transform = 'translateY(-40%) rotateY(0) rotateX(0) translateZ(0)';
    });
  }

  /* ══════════════════════════════
     INTERSECTION OBSERVER — REVEAL
  ══════════════════════════════ */
  var reveals = document.querySelectorAll('.reveal, .reveal-group');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ═══ FLOATING CTA ═══ */
  var floatCta = document.getElementById('float-cta');
  window.addEventListener('scroll', function () {
    floatCta.classList.toggle('visible', window.scrollY > window.innerHeight * 0.55);
  }, { passive: true });

  /* ══════════════════════════════
     ACTIVE SIDEBAR ON SCROLL
  ══════════════════════════════ */
  var sections = document.querySelectorAll('section[id]');
  var sidebarLinks = document.querySelectorAll('.sidebar a');
  var topbarLinks = document.querySelectorAll('.topbar-nav a');

  function onScroll() {
    updateBar();
    updateHeroParallax();
    updateSectionBgs();

    var current = '';
    sections.forEach(function (s) {
      if (window.scrollY >= s.offsetTop - 140) current = s.id;
    });
    sidebarLinks.forEach(function (a) {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ══════════════════════════════
     CARD IMAGE SLIDERS
  ══════════════════════════════ */
  document.querySelectorAll('.card-slider').forEach(function (slider, sliderIndex) {
    var imgs = slider.querySelectorAll('img');
    var dots = slider.querySelectorAll('.slider-dot');
    var current = 0;

    function goTo(idx) {
      imgs[current].classList.remove('active');
      if (dots[current]) dots[current].classList.remove('active');
      current = (idx + imgs.length) % imgs.length;
      imgs[current].classList.add('active');
      if (dots[current]) dots[current].classList.add('active');
    }

    var prevBtn = slider.querySelector('.prev');
    var nextBtn = slider.querySelector('.next');

    if (prevBtn) prevBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      goTo(current - 1);
    });

    if (nextBtn) nextBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      goTo(current + 1);
    });

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        goTo(i);
      });
    });

    /* Auto-advance with staggered start so cards don't all flip at once */
    setInterval(function () { goTo(current + 1); }, 4000 + sliderIndex * 800);
  });
})();
