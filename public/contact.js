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
    sending = true;
    button.disabled = true;
    form.setAttribute('aria-busy', 'true');
    show('FormSubmit öffnet sich in einem neuen Tab. Bitte schliesse dort die Spam-Prüfung ab. Erst die Bestätigung des Dienstes zeigt, ob deine Anfrage angenommen wurde.', 'pending');
    // Keep the original form and all answers intact while the service handles CAPTCHA.
    HTMLFormElement.prototype.submit.call(form);
    setTimeout(() => {
      sending = false;
      button.disabled = false;
      button.innerHTML = originalLabel;
      form.removeAttribute('aria-busy');
    }, 10000);
  });
})();
