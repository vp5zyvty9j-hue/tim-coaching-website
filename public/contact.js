(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formSuccess');
  const button = form.querySelector('button[type="submit"]');
  const originalLabel = button.innerHTML;
  let sending = false;
  form.noValidate = true;
  const start = form.elements.namedItem('Start');
  function refreshStartDate() {
    if (!start) return;
    const today = new Date();
    const minimum = [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
    start.min = minimum;
    start.setCustomValidity(start.value && start.value < minimum ? 'Bitte wähle heute oder ein späteres Datum.' : '');
  }
  refreshStartDate();
  start?.addEventListener('focus', refreshStartDate);
  start?.addEventListener('input', refreshStartDate);
  function show(message, state) {
    status.textContent = message;
    status.dataset.state = state;
    status.classList.add('show');
  }
  function failure() {
    show('Deine Anfrage konnte leider nicht versendet werden. Bitte versuche es erneut oder nutze den ', 'error');
    const link = document.createElement('a');
    link.href = '#footer-contact';
    link.textContent = 'Kontakt im Footer';
    status.append(link, '.');
  }
  form.addEventListener('input', e => e.target.removeAttribute('aria-invalid'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    refreshStartDate();
    const invalid = [...form.elements].filter(field => field.willValidate && !field.validity.valid);
    if (invalid.length) {
      invalid.forEach(field => field.setAttribute('aria-invalid', 'true'));
      const labels = invalid.map(field => field.labels?.[0]?.childNodes[0]?.textContent.trim() || field.name);
      show('Bitte prüfe diese Angaben: ' + labels.join(', ') + '.', 'error');
      invalid[0].focus();
      invalid[0].scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    if (form.elements.namedItem('_honey').value) { failure(); return; }
    const payload = Object.fromEntries(new FormData(form));
    const controls = [...form.elements].map(field => [field, field.disabled]);
    sending = true;
    controls.forEach(([field]) => field.disabled = true);
    button.textContent = 'Wird gesendet …';
    form.setAttribute('aria-busy', 'true');
    show('Deine Anfrage wird gesendet …', 'pending');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch('https://formsubmit.co/ajax/timliam.schneider@gmail.com', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload), signal: controller.signal,
        credentials: 'omit', referrerPolicy: 'strict-origin-when-cross-origin'
      });
      const result = await response.json();
      // Activation notices, HTML, HTTP errors and ambiguous replies are not delivery confirmations.
      if (!response.ok || ![true, 'true'].includes(result.success) || result.message !== 'The form was submitted successfully.') throw new Error('Submission not confirmed');
      document.dispatchEvent(new CustomEvent('tim:contact-success', {detail: {package: payload.Paket || null, funnel: payload['Coaching-Check'] === 'Abgeschlossen', recommended: payload['Beste Übereinstimmung'] || null}}));
      form.reset();
      show('Vielen Dank! Deine Anfrage wurde erfolgreich versendet. Ich melde mich so schnell wie möglich bei dir.', 'success');
    } catch {
      failure();
    } finally {
      clearTimeout(timeout);
      controls.forEach(([field, disabled]) => field.disabled = disabled);
      sending = false;
      button.innerHTML = originalLabel;
      form.removeAttribute('aria-busy');
    }
  });
})();
