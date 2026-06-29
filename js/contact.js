/* Contact form: two-step flow with a segmented OTP panel.
 *   1. Visitor fills the form and submits  -> POST /send-otp (emails a code),
 *      then the verification panel slides in.
 *   2. Visitor enters the 6-digit code and hits Verify -> POST /contact
 *      (verifies the code + delivers the message).
 *
 * The API runs on a different host than this static page:
 *   - locally (Live Server on localhost/127.0.0.1) -> http://localhost:8000
 *   - in production (alnaser-company.com) -> the deployed Render URL.
 */
(function () {
  'use strict';

  var PROD_API = 'https://al-naser-api.onrender.com';
  var isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API_BASE = isLocal ? 'http://localhost:8000' : PROD_API;

  var form = document.getElementById('contactForm');
  if (!form) return;

  var submitBtn = document.getElementById('contactSubmit');
  var statusEl = document.getElementById('contactStatus');
  var loader = document.getElementById('contactLoader');
  var loaderText = loader && loader.querySelector('.cl-text');

  // OTP verification panel
  var overlay = document.getElementById('otpOverlay');
  var otpEmailEl = document.getElementById('otpEmail');
  var otpStatusEl = document.getElementById('otpStatus');
  var verifyBtn = document.getElementById('otpVerify');
  var resendBtn = document.getElementById('otpResend');
  var changeBtn = document.getElementById('otpChange');
  var closeBtn = document.getElementById('otpClose');
  var panel = overlay ? overlay.querySelector('.otp-panel') : null;
  var boxes = overlay
    ? Array.prototype.slice.call(overlay.querySelectorAll('.otp-box'))
    : [];

  var stage = 'collect';   // 'collect' = filling the form; 'verify' = entering the code
  var pending = null;      // form values awaiting verification
  var verifying = false;   // a /contact request is in flight (guards against double-submit)

  function showStatus(el, msg, kind) {
    if (!el) return;
    el.textContent = msg;
    el.style.display = msg ? 'block' : 'none';
    el.className = 'form-status' + (kind ? ' form-status--' + kind : '');
  }

  function setBusy(busy, label) {
    submitBtn.disabled = busy;
    if (verifyBtn) verifyBtn.disabled = busy;
    if (loader) {
      if (busy && loaderText && label) loaderText.textContent = label;
      loader.classList.toggle('is-active', busy);
      loader.setAttribute('aria-hidden', busy ? 'false' : 'true');
    }
  }

  // Pull a human-readable message out of a FastAPI error response.
  function errorMessage(data, fallback) {
    if (data && typeof data.detail === 'string') return data.detail;
    return fallback;
  }

  function post(path, payload) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        return { ok: res.ok, data: data };
      });
    });
  }

  /* ── OTP panel helpers ─────────────────────────────────── */
  function clearBoxes() {
    for (var i = 0; i < boxes.length; i++) boxes[i].value = '';
    showStatus(otpStatusEl, '', '');
  }

  function readCode() {
    var code = '';
    for (var i = 0; i < boxes.length; i++) {
      code += (boxes[i].value || '').replace(/\D/g, '');
    }
    return code;
  }

  function openOverlay() {
    if (!overlay) return;
    overlay.classList.add('is-active');
    overlay.setAttribute('aria-hidden', 'false');
    clearBoxes();
    if (boxes[0]) boxes[0].focus();
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.classList.remove('is-active');
    overlay.setAttribute('aria-hidden', 'true');
  }

  function backToForm() {
    closeOverlay();
    stage = 'collect';
    if (form.email) form.email.focus();
  }

  /* ── network steps ─────────────────────────────────────── */
  function sendCode(values) {
    var resend = stage === 'verify';
    setBusy(true, resend ? 'Resending code…' : 'Sending code…');
    showStatus(statusEl, '', '');
    showStatus(otpStatusEl, '', '');

    post('/send-otp', { email: values.email })
      .then(function (r) {
        setBusy(false);
        if (!r.ok) {
          showStatus(resend ? otpStatusEl : statusEl,
            errorMessage(r.data, 'Could not send the code. Try again.'), 'error');
          return;
        }
        pending = values;
        stage = 'verify';
        if (otpEmailEl) otpEmailEl.textContent = values.email;
        openOverlay();
        if (resend) showStatus(otpStatusEl, 'A new code is on its way.', 'ok');
      })
      .catch(function () {
        setBusy(false);
        showStatus(resend ? otpStatusEl : statusEl, 'Network error. Please try again.', 'error');
      });
  }

  function sendMessage(values) {
    setBusy(true, 'Verifying…');
    showStatus(otpStatusEl, '', '');

    post('/contact', values)
      .then(function (r) {
        verifying = false;
        setBusy(false);
        if (!r.ok) {
          showStatus(otpStatusEl,
            errorMessage(r.data, 'Verification failed. Check the code and try again.'), 'error');
          // keep the digits so the visitor can fix them instead of retyping
          var last = boxes[boxes.length - 1];
          if (last) { last.focus(); if (last.select) last.select(); }
          return;
        }
        form.reset();
        stage = 'collect';
        pending = null;

        if (panel) {
          // play the success tick, then dismiss the panel
          panel.classList.add('is-success');
          setTimeout(function () {
            closeOverlay();
            panel.classList.remove('is-success');
            showStatus(statusEl, "Thank you for your message. We'll get back to you soon.", 'ok');
          }, 2800);
        } else {
          closeOverlay();
          showStatus(statusEl, "Thank you for your message. We'll get back to you soon.", 'ok');
        }
      })
      .catch(function () {
        verifying = false;
        setBusy(false);
        showStatus(otpStatusEl, 'Network error. Please try again.', 'error');
      });
  }

  /* ── step 1: collect the details & request a code ──────── */
  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var values = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      company: form.company.value.trim(),
      message: form.message.value.trim()
    };

    if (!values.fullName || !values.email || !values.message) {
      showStatus(statusEl, 'Please fill in your name, email, and message.', 'error');
      return;
    }

    sendCode(values);
  });

  /* ── step 2: verify the code & deliver ─────────────────── */
  function submitCode() {
    if (verifying) return;   // a request is already in flight — don't fire twice
    var code = readCode();
    if (!/^\d{6}$/.test(code)) {
      showStatus(otpStatusEl, 'Enter the 6-digit code from your email.', 'error');
      return;
    }
    if (!pending) {
      showStatus(otpStatusEl, 'Your session expired — please request a new code.', 'error');
      return;
    }
    verifying = true;
    sendMessage({
      fullName: pending.fullName,
      email: pending.email,
      company: pending.company,
      message: pending.message,
      code: code
    });
  }

  if (verifyBtn) verifyBtn.addEventListener('click', submitCode);
  if (changeBtn) changeBtn.addEventListener('click', backToForm);
  if (closeBtn) closeBtn.addEventListener('click', backToForm);
  if (resendBtn) resendBtn.addEventListener('click', function () {
    if (pending) sendCode(pending);
  });

  /* ── segmented input behaviour: auto-advance, backspace, paste ── */
  function maybeAutoSubmit() {
    if (readCode().length === boxes.length && verifyBtn && !verifyBtn.disabled) {
      submitCode();
    }
  }

  boxes.forEach(function (box, idx) {
    box.addEventListener('input', function () {
      box.value = (box.value || '').replace(/\D/g, '').slice(-1);
      if (box.value && idx < boxes.length - 1) boxes[idx + 1].focus();
      maybeAutoSubmit();
    });

    box.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        boxes[idx - 1].focus();
      } else if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        boxes[idx - 1].focus();
      } else if (e.key === 'ArrowRight' && idx < boxes.length - 1) {
        e.preventDefault();
        boxes[idx + 1].focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submitCode();
      }
    });

    box.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text') || '';
      var digits = text.replace(/\D/g, '').slice(0, boxes.length).split('');
      for (var i = 0; i < boxes.length; i++) boxes[i].value = digits[i] || '';
      boxes[Math.min(digits.length, boxes.length - 1)].focus();
      maybeAutoSubmit();
    });
  });
})();
