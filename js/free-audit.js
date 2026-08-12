// js/free-audit.js — Free Audit form validation + submit.
// Consent is conditionally required: only if a phone number was actually entered
// (TCPA logic — no phone number given means there's nothing to consent to).
(function () {
  var formEl = document.getElementById('audit-form-el');
  if (!formEl) return;

  var phoneInput = document.getElementById('audit-phone');
  var consentRow = document.getElementById('consent-row');
  var consentCheckbox = document.getElementById('audit-consent');
  var submitBtn = document.getElementById('audit-submit');
  var errorBox = document.getElementById('audit-error');
  var successBox = document.getElementById('audit-success');

  function syncConsentRequirement() {
    var hasPhone = phoneInput.value.trim().length > 0;
    consentRow.style.opacity = hasPhone ? '1' : '0.55';
  }
  phoneInput.addEventListener('input', syncConsentRequirement);
  syncConsentRequirement();

  function getSource() {
    var params = new URLSearchParams(window.location.search);
    var src = params.get('src');
    var allowed = ['nav', 'hero', 'real-problem', 'final-cta'];
    return allowed.indexOf(src) !== -1 ? src : 'direct';
  }

  formEl.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.hidden = true;

    var payload = {
      contactName: document.getElementById('audit-name').value.trim(),
      businessName: document.getElementById('audit-business').value.trim(),
      email: document.getElementById('audit-email').value.trim(),
      location: document.getElementById('audit-location').value.trim(),
      website: document.getElementById('audit-website').value.trim(),
      phone: phoneInput.value.trim(),
      consent: consentCheckbox.checked,
      source: getSource(),
    };

    if (!payload.contactName || !payload.businessName || !payload.email || !payload.location) {
      errorBox.textContent = 'Please fill in your name, business name, email, and location.';
      errorBox.hidden = false;
      return;
    }
    if (payload.phone && !payload.consent) {
      errorBox.textContent = 'Please check the consent box to submit a phone number, or leave it blank.';
      errorBox.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    fetch('/api/audit-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Request failed with status ' + res.status);
        formEl.hidden = true;
        successBox.hidden = false;
      })
      .catch(function (err) {
        console.error('Audit request submit failed:', err);
        errorBox.textContent =
          "Something went wrong on our end — please email me directly at daniel@cenovatemarketing.com and I'll get your audit started.";
        errorBox.hidden = false;
        submitBtn.disabled = false;
        submitBtn.textContent = 'Get My Free Audit';
      });
  });
})();
