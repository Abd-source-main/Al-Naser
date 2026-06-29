/* Contact form: two-step flow.
 *   1. Visitor fills the form and submits  -> POST /send-otp (emails a code)
 *   2. Visitor enters the code and submits -> POST /contact  (verifies + delivers)
 *
 * Set API_BASE to your deployed API origin (no trailing slash).
 * After you deploy on Render you'll get a URL like https://al-naser-api.onrender.com
 * Paste that here. For local testing use 'http://localhost:8000'.
 */
(function () {
  'use strict';

  var API_BASE = 'https://REPLACE-WITH-YOUR-RENDER-URL.onrender.com';

  var form = document.getElementById('contactForm');
  if (!form) return;

  var otpField = document.getElementById('otpField');
  var codeInput = form.querySelector('input[name="code"]');
  var submitBtn = document.getElementById('contactSubmit');
  var statusEl = document.getElementById('contactStatus');

  // 'collect' = waiting for details; 'verify' = code emailed, waiting for code.
  var stage = 'collect';

  function showStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.style.display = msg ? 'block' : 'none';
    statusEl.className = 'form-status' + (kind ? ' form-status--' + kind : '');
  }

  function setBusy(busy, label) {
    submitBtn.disabled = busy;
    submitBtn.textContent = label;
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

  function sendCode(values) {
    setBusy(true, 'Sending code…');
    showStatus('', '');
    post('/send-otp', { email: values.email })
      .then(function (r) {
        if (!r.ok) {
          setBusy(false, 'Initiate Transmission');
          showStatus(errorMessage(r.data, 'Could not send the code. Try again.'), 'error');
          return;
        }
        stage = 'verify';
        otpField.style.display = '';
        codeInput.focus();
        setBusy(false, 'Verify & Send');
        showStatus('We emailed a 6-digit code to ' + values.email + '. Enter it above.', 'ok');
      })
      .catch(function () {
        setBusy(false, 'Initiate Transmission');
        showStatus('Network error. Please try again.', 'error');
      });
  }

  function sendMessage(values) {
    setBusy(true, 'Sending…');
    showStatus('', '');
    post('/contact', values)
      .then(function (r) {
        if (!r.ok) {
          setBusy(false, 'Verify & Send');
          showStatus(errorMessage(r.data, 'Verification failed. Check the code and try again.'), 'error');
          return;
        }
        form.reset();
        otpField.style.display = 'none';
        stage = 'collect';
        setBusy(false, 'Initiate Transmission');
        showStatus('Thanks — your message has been sent.', 'ok');
      })
      .catch(function () {
        setBusy(false, 'Verify & Send');
        showStatus('Network error. Please try again.', 'error');
      });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var values = {
      fullName: form.fullName.value.trim(),
      email: form.email.value.trim().toLowerCase(),
      company: form.company.value.trim(),
      message: form.message.value.trim()
    };

    if (!values.fullName || !values.email || !values.message) {
      showStatus('Please fill in your name, email, and message.', 'error');
      return;
    }

    if (stage === 'collect') {
      sendCode(values);
    } else {
      var code = (codeInput.value || '').trim();
      if (!/^\d{6}$/.test(code)) {
        showStatus('Enter the 6-digit code from your email.', 'error');
        return;
      }
      values.code = code;
      sendMessage(values);
    }
  });
})();
