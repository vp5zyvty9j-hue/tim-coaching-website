(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formSuccess');
  const button = form.querySelector('button[type="submit"]');
  const originalLabel = button.innerHTML;
  let sending = false;
  form.noValidate = true;
  function show(message, state) {
    status.textContent = message;
    status.dataset.state = state;
    status.classList.add('show');
  }
  function failure() {
    show('Deine Anfrage konnte leider nicht versendet werden. Bitte versuche es erneut oder kontaktiere mich direkt per E-Mail unter ', 'error');
    const link = document.createElement('a');
    link.href = 'mailto:timliam.schneider@gmail.com';
    link.textContent = 'timliam.schneider@gmail.com';
    status.append(link, '.');
  }
  form.addEventListener('input', e => e.target.removeAttribute('aria-invalid'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
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
