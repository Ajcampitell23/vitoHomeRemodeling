// Keep the original photo visible until the next image has fully decoded.
document.querySelectorAll('[data-slideshow]').forEach(tile => {
  const slides = Array.from(tile.querySelectorAll('img'));
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let paused = motion.matches;
  let visible = false;
  let busy = false;
  let timer;

  const controls = document.createElement('div');
  controls.className = 'slideshow-controls';
  function button(text, label) {
    const element = document.createElement('button');
    element.type = 'button';
    element.textContent = text;
    element.setAttribute('aria-label', label);
    controls.append(element);
    return element;
  }
  const previous = button('\u2039', 'Previous photo');
  const toggle = button('', '');
  const next = button('\u203a', 'Next photo');
  const counter = document.createElement('span');
  counter.className = 'slideshow-counter';
  controls.append(counter);
  tile.append(controls);
  tile.classList.add('slideshow-ready');

  function updateControls() {
    toggle.textContent = paused ? 'Play' : 'Pause';
    toggle.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    counter.textContent = `${current + 1} / ${slides.length}`;
  }
  function schedule() {
    clearTimeout(timer);
    if (!paused && visible && !document.hidden && !busy) {
      timer = setTimeout(() => show(1), 5000);
    }
  }
  async function show(direction) {
    if (busy) return;
    clearTimeout(timer);
    busy = true;
    // Skip unavailable images without hiding the last successfully loaded photo.
    for (let step = 1; step < slides.length; step++) {
      const index = (current + direction * step + slides.length) % slides.length;
      const image = slides[index];
      if (image.dataset.failed) continue;
      try {
        if (image.dataset.src) {
          image.src = image.dataset.src;
          delete image.dataset.src;
        }
        await image.decode();
        if (!visible || document.hidden) break;
        slides[current].classList.remove('is-active');
        slides[current].setAttribute('aria-hidden', 'true');
        image.classList.add('is-active');
        image.removeAttribute('aria-hidden');
        current = index;
        break;
      } catch {
        image.dataset.failed = 'true';
      }
    }
    busy = false;
    updateControls();
    schedule();
  }
  toggle.addEventListener('click', () => {
    paused = !paused;
    updateControls();
    schedule();
  });
  previous.addEventListener('click', () => { paused = true; show(-1); });
  next.addEventListener('click', () => { paused = true; show(1); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', () => {
    paused = motion.matches;
    updateControls();
    schedule();
  });
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    schedule();
  }, { threshold: 0.15 }).observe(tile);
  updateControls();
});
