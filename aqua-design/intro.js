(() => {
  'use strict';
  const intro = document.querySelector('#brand-intro');
  const replay = document.querySelector('#intro-replay');
  const skip = document.querySelector('#intro-skip');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let endTimer, closeTimer, previousFocus, running = false;
  function cleanup() {
    clearTimeout(endTimer); clearTimeout(closeTimer);
    running = false;
    document.body.classList.remove('intro-open');
    intro.classList.remove('playing', 'leaving');
    if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
  }
  function finish(immediate = false) {
    if (!running) return;
    clearTimeout(endTimer);
    if (immediate || reduced.matches) { intro.close(); return; }
    intro.classList.add('leaving');
    closeTimer = setTimeout(() => { if (intro.open) intro.close(); }, 720);
  }
  async function play() {
    if (running) return;
    running = true;
    previousFocus = document.activeElement === document.body ? replay : document.activeElement;
    intro.classList.remove('playing','leaving');
    document.body.classList.add('intro-open');
    intro.showModal();
    skip.focus({preventScroll:true});
    // Restart CSS timelines only after the freshly opened dialog has a layout.
    void intro.offsetWidth;
    intro.classList.add('playing');
    endTimer = setTimeout(() => finish(), reduced.matches ? 1700 : 6400);
  }
  skip.addEventListener('click', () => finish(true));
  intro.addEventListener('cancel', event => { event.preventDefault(); finish(true); });
  intro.addEventListener('close', cleanup);
  replay.addEventListener('click', play);
  reduced.addEventListener('change', () => { if (reduced.matches && running) finish(true); });
  // Avoid starting halfway through the sequence while a background tab is hidden.
  function startWhenVisible() {
    if (document.hidden) return;
    document.removeEventListener('visibilitychange', startWhenVisible);
    if (!reduced.matches) play();
  }
  const logo = new Image();
  logo.src = 'assets/mr-fish-tank-logo.jpg';
  logo.decode().then(() => {
    if (document.hidden) document.addEventListener('visibilitychange', startWhenVisible);
    else startWhenVisible();
  }).catch(() => { /* Keep the homepage available if the supplied asset cannot load. */ });
})();
