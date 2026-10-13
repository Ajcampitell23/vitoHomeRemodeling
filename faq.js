// Keep native details/summary behavior when animation is unavailable.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.faq-list details').forEach(details => {
  const summary = details.querySelector('summary');
  let animation = null;
  let expanded = details.open;

  function finish() {
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
      animation = null;
    }
    details.open = expanded;
    details.style.removeProperty('height');
  }

  summary.addEventListener('click', event => {
    if (!details.animate || reducedMotion.matches) return;
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    expanded = animation ? !expanded : !details.open;
    if (animation) {
      animation.onfinish = null;
      animation.cancel();
    }
    details.style.removeProperty('height');
    details.open = true;
    const borders = details.offsetHeight - details.clientHeight;
    const endHeight = expanded
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height + borders;
    details.style.height = `${startHeight}px`;
    animation = details.animate(
      [{ height: `${startHeight}px` }, { height: `${endHeight}px` }],
      { duration: 300, easing: 'ease-in-out', fill: 'forwards' }
    );
    animation.onfinish = finish;
  });

  window.addEventListener('resize', () => { if (animation) finish(); });
  reducedMotion.addEventListener('change', () => { if (animation) finish(); });
});
