/* Decorative flight only. Workshop buttons and their hit areas never move. */
(() => {
  'use strict';

  if (!document.documentElement.classList.contains('theme-folderverse')) return;

  const sky = document.querySelector('#folderverse-sky');
  const sources = [...document.querySelectorAll('#workshop-map .module-nav .folder > .folder-object')];
  const toggle = document.querySelector('#folderverse-motion-toggle');
  const scatter = document.querySelector('#folderverse-scatter');
  const status = document.querySelector('#folderverse-motion-status');
  if (!sky || !sources.length) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const compactViewport = window.matchMedia('(max-width: 760px)');
  const canAnimate = typeof Element.prototype.animate === 'function';
  const storageKey = 'riola-folderverse-motion';
  const parkedPlaces = [
    [0.06, 0.17], [0.85, 0.11], [0.97, 0.47], [0.09, 0.64],
    [0.73, 0.89], [0.36, 0.96], [0.36, 0.05], [0.66, 0.27],
    [0.18, 0.39], [0.89, 0.73], [0.48, 0.61], [0.03, 0.92]
  ];
  let userPaused = false;
  try { userPaused = localStorage.getItem(storageKey) === 'paused'; } catch { /* Optional preference. */ }
  let orbitVersion = 0;
  let resizeTimer;
  let dimensions = { width: sky.clientWidth, height: sky.clientHeight };

  sky.setAttribute('aria-hidden', 'true');
  sky.inert = true;
  const sprites = Array.from({ length: 12 }, (_, index) => {
    const element = document.createElement('div');
    element.className = 'folderverse-sprite';
    element.setAttribute('aria-hidden', 'true');
    const art = sources[index % sources.length].cloneNode(true);
    // The source is decorative SVG, but cloned IDs must not become duplicates.
    art.removeAttribute('id');
    art.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    art.querySelectorAll('svg').forEach((node) => node.setAttribute('focusable', 'false'));
    element.append(art);
    sky.append(element);
    return { element, animation: null, index, scale: 0.78 + (index % 4) * 0.09 };
  });

  function isActive(sprite) {
    return sprite.index < (compactViewport.matches ? 6 : 12);
  }

  function transformAt(sprite, x, y, rotation) {
    const size = sprite.element.offsetWidth;
    return `translate3d(${(x * dimensions.width - size / 2).toFixed(2)}px, ${(y * dimensions.height - size * 0.375).toFixed(2)}px, 0) rotate(${rotation.toFixed(2)}deg) scale(${sprite.scale})`;
  }

  function parkedTransform(sprite) {
    const [x, y] = parkedPlaces[sprite.index];
    return transformAt(sprite, x, y, (sprite.index % 3 - 1) * 15);
  }

  function parkAll() {
    sprites.forEach((sprite) => {
      sprite.animation?.cancel();
      sprite.animation = null;
      sprite.element.hidden = !isActive(sprite);
      sprite.element.style.transform = parkedTransform(sprite);
    });
  }

  function resizedTransform(transform, sprite, previousDimensions) {
    if (!previousDimensions.width || !previousDimensions.height) return parkedTransform(sprite);
    try {
      const pose = new DOMMatrix(transform);
      const width = sprite.element.offsetWidth;
      const height = width * 0.75;
      // Keep the same relative viewport position and rotation/scale, with
      // enough of each folder on-screen after a large desktop/mobile resize.
      pose.m41 = Math.max(-width * 0.8, Math.min(dimensions.width - width * 0.2,
        pose.m41 * dimensions.width / previousDimensions.width));
      pose.m42 = Math.max(-height * 0.8, Math.min(dimensions.height - height * 0.2,
        pose.m42 * dimensions.height / previousDimensions.height));
      return pose.toString();
    } catch {
      return parkedTransform(sprite);
    }
  }

  function createOrbits(previousDimensions = null) {
    // Read every pose before cancelling: remix keeps it exactly, while resize
    // maps its translation into the new viewport before starting a new track.
    const poses = sprites.map((sprite) => {
      const wasHidden = sprite.element.hidden;
      sprite.element.hidden = !isActive(sprite);
      if (wasHidden || !sprite.animation) return parkedTransform(sprite);
      const transform = getComputedStyle(sprite.element).transform;
      return previousDimensions ? resizedTransform(transform, sprite, previousDimensions) : transform;
    });

    sprites.forEach((sprite, index) => {
      sprite.animation?.cancel();
      sprite.animation = null;
      sprite.element.hidden = !isActive(sprite);
      sprite.element.style.transform = poses[index];
      if (!isActive(sprite)) return;

      const phase = index * 2.399963 + orbitVersion * 0.73;
      const frames = [{ transform: poses[index], easing: 'ease-in-out' }];
      for (let step = 1; step <= 7; step += 1) {
        const angle = phase + step * Math.PI / 4;
        const x = 0.5 + Math.sin(angle) * (0.55 + (index % 3) * 0.055);
        const y = 0.5 + Math.sin(angle * 2 + index * 0.43) * 0.59;
        const rotation = Math.sin(angle + index) * 38 + (index % 2 ? 13 : -13);
        frames.push({ transform: transformAt(sprite, x, y, rotation), easing: 'ease-in-out' });
      }
      frames.push({ transform: poses[index], easing: 'ease-in-out' });
      const duration = (compactViewport.matches ? 84000 : 54000) + (index * 7139 + orbitVersion * 2371) % 26000;
      sprite.animation = sprite.element.animate(frames, { duration, iterations: Infinity, fill: 'both' });
      if (userPaused || document.hidden) sprite.animation.pause();
    });
  }

  function updateControls(announce = false) {
    const staticMode = reducedMotion.matches || !canAnimate;
    const label = reducedMotion.matches ? 'Reduced motion' : (userPaused || !canAnimate ? 'Parked' : 'Flight mode');
    sky.dataset.motion = reducedMotion.matches ? 'reduced' : (document.hidden ? 'hidden' : (userPaused || !canAnimate ? 'paused' : 'running'));
    if (toggle) {
      toggle.hidden = staticMode;
      toggle.textContent = userPaused ? 'Release the folders' : 'Pause the chaos';
      toggle.setAttribute('aria-pressed', String(userPaused));
      toggle.setAttribute('aria-controls', 'folderverse-sky');
    }
    if (scatter) {
      scatter.hidden = staticMode;
      scatter.disabled = userPaused;
      scatter.textContent = 'Remix orbits';
      scatter.setAttribute('aria-controls', 'folderverse-sky');
    }
    if (status && (announce || !status.textContent.trim())) status.textContent = label;
  }

  function syncPlayback(announce = false) {
    if (reducedMotion.matches || !canAnimate) {
      parkAll();
    } else {
      if (!sprites.some((sprite) => sprite.animation)) createOrbits();
      sprites.forEach(({ animation }) => {
        if (!animation) return;
        if (userPaused || document.hidden) animation.pause();
        else animation.play();
      });
    }
    updateControls(announce);
  }

  toggle?.addEventListener('click', () => {
    if (reducedMotion.matches || !canAnimate) return;
    userPaused = !userPaused;
    try { localStorage.setItem(storageKey, userPaused ? 'paused' : 'running'); } catch { /* Optional preference. */ }
    syncPlayback(true);
  });

  scatter?.addEventListener('click', () => {
    if (userPaused || reducedMotion.matches || !canAnimate) return;
    orbitVersion += 1;
    createOrbits();
    updateControls(true);
  });

  function resizeField() {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const next = { width: sky.clientWidth, height: sky.clientHeight };
      if (next.width === dimensions.width && next.height === dimensions.height) return;
      const previousDimensions = dimensions;
      dimensions = next;
      if (reducedMotion.matches || !canAnimate) parkAll();
      else createOrbits(previousDimensions);
      updateControls();
    }, 180);
  }

  window.addEventListener('resize', resizeField, { passive: true });
  compactViewport.addEventListener('change', resizeField);
  reducedMotion.addEventListener('change', () => syncPlayback(true));
  document.addEventListener('visibilitychange', () => syncPlayback());
  window.addEventListener('pagehide', () => sprites.forEach(({ animation }) => animation?.pause()));
  window.addEventListener('pageshow', () => syncPlayback());

  parkAll();
  syncPlayback(true);
})();
