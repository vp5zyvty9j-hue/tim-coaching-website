(() => {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('formSuccess');
  const button = form.querySelector('button[type="submit"]');
  const originalLabel = button.innerHTML;
  let sending = false, attempt = null;
  const allowed = ["Vorname", "email", "Paket", "Ziel", "Sporterfahrung", "Trainingszeit", "Start", "Weitere Angaben", "Ausdauersportart", "Trainingsumfang", "Ausdauerziel", "Trainingsplanung", "Krafterfahrung", "Ausstattung", "Kraftziel", "Essgewohnheiten", "Vorlieben", "Ernährungsalltag", "Coaching-Check", "Beste Übereinstimmung", "Gewähltes Funnel-Paket", "Funnel-Antworten"];
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
    show('Deine Anfrage konnte gerade nicht gesendet werden. Bitte versuche es erneut oder nutze den ', 'error');
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
    const payload = Object.fromEntries([...new FormData(form)].filter(([key]) => allowed.includes(key)));
    const content = JSON.stringify(payload);
    if (!attempt || attempt.content !== content) attempt = {content, id: crypto.randomUUID()};
    const controls = [...form.elements].map(field => [field, field.disabled]);
    sending = true;
    controls.forEach(([field]) => field.disabled = true);
    button.textContent = 'Wird gesendet …';
    form.setAttribute('aria-busy', 'true');
    show('Deine Anfrage wird gesendet …', 'pending');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      let analyticsContext=null;
      try{analyticsContext=typeof window!=='undefined'?window.TIMAnalytics?.context?.():null;}catch{}
      const response = await fetch('/api/coaching-inquiries', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...(analyticsContext ? {'X-Tim-Analytics': JSON.stringify(analyticsContext)} : {}) },
        body: JSON.stringify({request_id: attempt.id, form: payload, honey: ''}), signal: controller.signal,
        credentials: 'same-origin', referrerPolicy: 'strict-origin-when-cross-origin'
      });
      const result = await response.json();
      // Only a committed server-side inquiry is success; no public account/status details.
      if (!response.ok || result.success !== true) throw new Error('Submission not confirmed');
      document.dispatchEvent(new CustomEvent('tim:contact-success', {detail: {package: payload.Paket || null, funnel: payload['Coaching-Check'] === 'Abgeschlossen', recommended: payload['Beste Übereinstimmung'] || null}}));
      form.reset();
      attempt = null;
      show('ANFRAGE GESENDET – Danke für deine Anfrage. Ich melde mich persönlich bei dir bezüglich des Erstgesprächs.', 'success');
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
