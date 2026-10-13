const scrollCue = document.querySelector('.scroll-cue');
const scrollCueSlot = document.querySelector('.scroll-cue-slot');
if (scrollCue && scrollCueSlot) {
  const updateCue = () => {
    const belowScreen = scrollCueSlot.getBoundingClientRect().bottom > window.innerHeight - 12;
    scrollCue.classList.toggle('is-floating', window.scrollY < 32 && belowScreen);
  };
  window.addEventListener('scroll', updateCue, { passive: true });
  window.addEventListener('resize', updateCue);
  window.addEventListener('load', updateCue);
  document.fonts?.ready.then(updateCue);
  updateCue();
}
