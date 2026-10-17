(() => {
  const root = document.querySelector('.app-showcase');
  if (!root) return;
  const track = root.querySelector('.app-screens');
  const slides = [...track.querySelectorAll('.app-shot')];
  const controls = root.querySelector('.app-gallery-controls');
  const dots = [...controls.querySelectorAll('[data-app-slide]')];
  const prev = controls.querySelector('[data-app-prev]');
  const next = controls.querySelector('[data-app-next]');
  const position = controls.querySelector('.app-gallery-position');
  const mobile = matchMedia('(max-width: 620px)');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0, frame = 0;
  const step = () => mobile.matches ? 1 : 2;
  const stride = () => slides[1].offsetLeft - slides[0].offsetLeft;
  function update() {
    const count = step();
    index = Math.min(slides.length - count, Math.max(0, Math.round(track.scrollLeft / (stride() * count)) * count));
    prev.disabled = index === 0;
    next.disabled = index + count >= slides.length;
    dots.forEach((dot, i) => {
      dot.hidden = i % count !== 0;
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    position.textContent = count === 1 ? `${index + 1} von ${slides.length}` : `${index + 1}–${index + count} von ${slides.length}`;
  }
  function go(target) {
    const count = step();
    const safe = Math.max(0, Math.min(slides.length - count, target));
    track.scrollTo({left: safe * stride(), behavior: reduceMotion.matches ? 'instant' : 'smooth'});
  }
  prev.addEventListener('click', () => go(index - step()));
  next.addEventListener('click', () => go(index + step()));
  dots.forEach((dot, i) => dot.addEventListener('click', () => go(i)));
  track.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    go(event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - step() : index + (event.key === 'ArrowRight' ? step() : -step()));
  });
  track.addEventListener('scroll', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, {passive:true});
  new ResizeObserver(update).observe(track);
  mobile.addEventListener('change', update);
  controls.hidden = false;
  update();
})();
