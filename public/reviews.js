const carousel = document.querySelector('.review-carousel');
if (carousel) {
  const slides = [...carousel.querySelectorAll('.review-slide')];
  const pause = carousel.querySelector('.review-pause');
  const count = carousel.querySelector('.review-count');
  const announcement = carousel.querySelector('.review-announcement');
  const dots = [...carousel.querySelectorAll('.review-dots i')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, timer, manualUntil = 0, stopped = reduced.matches;
  const schedule = () => {
    clearTimeout(timer);
    if (stopped || reduced.matches || document.hidden) return;
    timer = setTimeout(() => { show(index + 1); schedule(); }, Math.max(10000, manualUntil - Date.now()));
  };
  function show(next, manual = false) {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.inert = i !== index;
      dots[i].classList.toggle('active', i === index);
    });
    count.textContent = `0${index + 1} / 0${slides.length}`;
    if (manual) {
      manualUntil = Date.now() + 30000;
      announcement.textContent = `Bewertung von ${index === 0 ? 'Simon' : 'Fynn'}, ${index + 1} von ${slides.length}.`;
      schedule();
    }
  }
  const measure = () => {
    const height = Math.max(...slides.map(s => s.querySelector('blockquote').getBoundingClientRect().height));
    const caption = Math.max(67, ...slides.map(s => s.querySelector('figcaption').getBoundingClientRect().height));
    carousel.style.setProperty('--review-caption-height', `${Math.ceil(caption)}px`);
    carousel.style.setProperty('--review-text-height', `${Math.ceil(height) + 24}px`);
  };
  carousel.classList.add('enhanced');
  carousel.querySelector('.review-controls').hidden = false;
  show(0); measure();
  let width = 0;
  const observer = new ResizeObserver(entries => {
    const next = entries[0].contentRect.width;
    if (next !== width) { width = next; measure(); }
  });
  observer.observe(carousel);
  document.fonts?.ready.then(measure);
  carousel.querySelector('.review-prev').addEventListener('click', () => show(index - 1, true));
  carousel.querySelector('.review-next').addEventListener('click', () => show(index + 1, true));
  const updatePause = () => {
    pause.textContent = stopped || reduced.matches ? '▶ Start' : 'Ⅱ Pause';
    pause.disabled = reduced.matches;
    pause.setAttribute('aria-label', reduced.matches ? 'Automatischer Wechsel bei reduzierter Bewegung deaktiviert' : stopped ? 'Automatischen Wechsel starten' : 'Automatischen Wechsel pausieren');
  };
  pause.addEventListener('click', () => { stopped = !stopped; updatePause(); schedule(); });
  reduced.addEventListener('change', () => { if (reduced.matches) stopped = true; updatePause(); schedule(); });
  document.addEventListener('visibilitychange', schedule);
  updatePause(); schedule();
}
