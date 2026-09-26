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
  form.addEventListener('input', e => e.target.removeAttribute('aria-invalid'));
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    const invalid = [...form.elements].filter(field => field.willValidate && !field.validity.valid);
    if (invalid.length) {
      invalid.forEach(field => field.setAttribute('aria-invalid', 'true'));
      const labels = invalid.map(field => field.type === 'checkbox' ? 'Zustimmung zum Datenschutz' : (field.labels?.[0]?.childNodes[0]?.textContent.trim() || field.name));
      show('Bitte prüfe diese Angaben: ' + labels.join(', ') + '.', 'error');
      const first = invalid[0];
      const details = first.closest('details');
      if (details) details.open = true;
      first.focus();
      first.scrollIntoView({behavior:'smooth', block:'center'});
      return;
    }
    if (form.elements.namedItem('_honey').value) return;
    const payload = Object.fromEntries(new FormData(form));
    sending = true;
    button.disabled = true;
    button.textContent = 'Wird gesendet …';
    form.setAttribute('aria-busy', 'true');
    show('Deine Anfrage wird übermittelt. Bitte warte kurz.', 'pending');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('https://formsubmit.co/ajax/timliam.schneider@gmail.com', {
        method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', headers: {'Content-Type':'application/json', 'Accept':'application/json'},
        body: JSON.stringify(payload), signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok) throw new Error('service');
      if (/activat|confirm.*email/i.test(String(result.message || ''))) {
        show('Der E-Mail-Versand muss von Tim noch aktiviert werden. Bitte bestätige als Website-Inhaber die Aktivierungsmail von FormSubmit und sende danach erneut. Deine Eingaben bleiben erhalten.', 'activation');
      } else if (result.success === true || result.success === 'true') {
        show('Deine Anfrage wurde vom Versanddienst angenommen. Tim meldet sich per E-Mail bei dir.', 'success');
        form.reset();
        document.getElementById('packageQuestions').replaceChildren();
      } else {
        throw new Error('service');
      }
    } catch (error) {
      show('Der Versand konnte nicht bestätigt werden. Deine Eingaben bleiben erhalten. Bitte versuche es erneut oder schreibe direkt an timliam.schneider@gmail.com.', 'error');
    } finally {
      clearTimeout(timer);
      sending = false;
      button.disabled = false;
      button.innerHTML = originalLabel;
      form.removeAttribute('aria-busy');
      status.scrollIntoView({behavior:'smooth', block:'center'});
    }
  });
})();
