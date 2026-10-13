/* Decorative motion only; the navigation hit areas never move. */
(() => {
  const maps = document.querySelectorAll('.floating-workshop');
  const desktop = window.matchMedia('(min-width: 761px)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false;
  try { paused = localStorage.getItem('riola-folder-motion') === 'paused'; } catch { /* Storage is optional. */ }

  const sync = () => {
    for (const map of maps) {
      map.dataset.motion = paused ? 'paused' : 'running';
      const toggle = map.querySelector('.folder-motion-toggle');
      if (!toggle) continue;
      toggle.hidden = !desktop.matches || reduced.matches;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.textContent = paused ? 'Resume floating' : 'Pause floating';
    }
  };
  for (const map of maps) {
    map.querySelector('.folder-motion-toggle')?.addEventListener('click', () => {
      paused = !paused;
      try { localStorage.setItem('riola-folder-motion', paused ? 'paused' : 'running'); } catch { /* Storage is optional. */ }
      sync();
    });
  }
  desktop.addEventListener('change', sync);
  reduced.addEventListener('change', sync);
  sync();
})();
