(() => {
  'use strict';
  const intro = document.querySelector('#brand-intro');
  const replay = document.querySelector('#intro-replay');
  const skip = document.querySelector('#intro-skip');
  if (!intro || !replay || !skip) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = Number(intro.dataset.duration) || 4200;
  const exitDuration = Number(intro.dataset.exitDuration) || 700;
  let endTimer, closeTimer, previousFocus, remaining, startedAt;
  let running = false, autoPending = !reduced.matches;
  const logoSource = intro.querySelector('[data-intro-logo] image')?.getAttribute('href');
  let logoReady = Promise.resolve();
  if (logoSource) {
    const logoImage = new Image();
    logoImage.src = logoSource;
    logoReady = logoImage.decode().catch(() => {});
  }

  function cleanup() {
    clearTimeout(endTimer); clearTimeout(closeTimer);
    running = false;
    document.body.classList.remove('intro-open');
    intro.classList.remove('playing', 'leaving', 'paused');
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    previousFocus = null;
  }
  function finish(immediate = false) {
    if (!running) return;
    clearTimeout(endTimer);
    intro.classList.remove('paused');
    if (immediate || reduced.matches) { intro.close(); return; }
    if (intro.classList.contains('leaving')) return;
    intro.classList.add('leaving');
    closeTimer = setTimeout(() => { if (intro.open) intro.close(); }, exitDuration);
  }
  function startTimer() {
    startedAt = performance.now();
    endTimer = setTimeout(() => finish(), remaining);
  }
  async function play(manual = false) {
    if (running || document.querySelector('dialog[open]:not(#brand-intro)')) return;
    await logoReady;
    if (running || document.querySelector('dialog[open]:not(#brand-intro)')) return;
    if (!manual && (reduced.matches || document.hidden)) {
      autoPending = !reduced.matches;
      return;
    }
    running = true;
    previousFocus = manual ? document.activeElement : null;
    intro.classList.remove('playing', 'leaving', 'paused');
    document.body.classList.add('intro-open');
    intro.showModal();
    skip.focus({preventScroll:true});
    void intro.offsetWidth;
    intro.classList.add('playing');
    remaining = reduced.matches ? 900 : duration;
    if (document.hidden) intro.classList.add('paused');
    else startTimer();
  }
  function visibilityChanged() {
    if (running && !intro.classList.contains('leaving')) {
      if (document.hidden && !intro.classList.contains('paused')) {
        remaining = Math.max(0, remaining - (performance.now() - startedAt));
        clearTimeout(endTimer); intro.classList.add('paused');
      } else if (!document.hidden && intro.classList.contains('paused')) {
        intro.classList.remove('paused'); startTimer();
      }
    }
    if (autoPending && !document.hidden) {
      autoPending = false; play();
    }
  }
  skip.addEventListener('click', () => finish(true));
  intro.addEventListener('cancel', event => { event.preventDefault(); finish(true); });
  intro.addEventListener('close', cleanup);
  replay.addEventListener('click', () => { autoPending = false; play(true); });
  document.addEventListener('visibilitychange', visibilityChanged);
  reduced.addEventListener('change', () => {
    if (reduced.matches) { autoPending = false; finish(true); }
  });
  addEventListener('pageshow', event => { if (event.persisted && running) finish(true); });
  visibilityChanged();
})();
