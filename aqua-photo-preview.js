(() => {
  'use strict';
  const api = window.AquaPhotos;
  if (!api?.isAdminPreview) return;
  const version = document.body.dataset.aquaVersion;
  const versionInfo = api.versions?.[version];
  if (!versionInfo) return;
  const metadata = new Map(versionInfo.slots.map(slot => [slot.key, slot]));
  let selectedSlot = null;
  let focusedSlot = null;
  let requestId = 0;
  let drawing = false;
  const labels = new Map();

  document.documentElement.classList.add('aqua-admin-preview');
  document.body.dataset.effects = 'quiet';
  document.body.classList.remove('js-motion', 'intro-open', 'modal-open');
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
  document.querySelectorAll('dialog[open]').forEach(dialog => dialog.close());

  const style = document.createElement('style');
  style.textContent = `
    .aqua-admin-preview { scroll-behavior:auto!important; }
    .aqua-admin-preview *, .aqua-admin-preview *::before, .aqua-admin-preview *::after {
      animation:none!important; transition:none!important; scroll-behavior:auto!important;
    }
    .aqua-admin-preview .reveal { opacity:1!important; transform:none!important; visibility:visible!important; }
    .aqua-admin-preview .ripple-field, .aqua-admin-preview .water-light,
    .aqua-admin-preview .fx-layer, .aqua-admin-preview .fx-cursor, .aqua-admin-preview .fx-water,
    .aqua-admin-preview .fx-fish, .aqua-admin-preview .fx-dock { display:none!important; }
    .aqua-admin-preview .hero-art.fx-water-on > img { opacity:1!important; }
    .aqua-admin-preview .aqua-preview-image {
      outline:1px dashed #6ccbb6!important; outline-offset:-1px; cursor:pointer!important;
    }
    .aqua-admin-preview .aqua-preview-image:hover, .aqua-admin-preview .aqua-preview-image:focus-visible {
      outline:3px solid #43d8a5!important; outline-offset:-3px;
    }
    .aqua-admin-preview .aqua-preview-image.aqua-preview-selected {
      outline:4px solid #00c88d!important; outline-offset:-4px;
    }
    .aqua-preview-label-layer { position:fixed; inset:0; z-index:2147483000; pointer-events:none!important; }
    .aqua-preview-label { position:absolute; box-sizing:border-box; max-width:190px; padding:5px 9px;
      border:1px solid #6ccbb6; border-radius:4px; background:#f7fffc; color:#123e35;
      font:600 12px/1.5 system-ui,sans-serif; white-space:nowrap; overflow:hidden;
      text-overflow:ellipsis; box-shadow:0 2px 9px #001b2530; pointer-events:none!important; }
    .aqua-preview-label.selected { border:2px solid #00a973; padding:4px 8px; background:#00c88d; color:#052e23; }
    .aqua-admin-preview [data-book], .aqua-admin-preview #intro-replay,
    .aqua-admin-preview #ai-generate, .aqua-admin-preview #ai-consult,
    .aqua-admin-preview #ai-download, .aqua-admin-preview [data-language],
    .aqua-admin-preview [data-light] { cursor:not-allowed!important; }
  `;
  document.head.append(style);
  const layer = document.createElement('div');
  layer.className = 'aqua-preview-label-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  function post(type, slot) {
    window.parent.postMessage({ type, version, ...(slot ? { slot } : {}) }, location.origin);
  }

  function photos() {
    return [...document.querySelectorAll('img[data-photo-slot]')].filter(img => !img.closest('dialog') && metadata.has(img.dataset.photoSlot));
  }

  function drawLabels() {
    drawing = false;
    const current = new Set(photos());
    for (const [img, label] of labels) {
      if (!current.has(img)) { img.classList.remove('aqua-preview-image', 'aqua-preview-selected'); label.remove(); labels.delete(img); }
    }
    for (const img of current) {
      const slot = metadata.get(img.dataset.photoSlot);
      img.classList.add('aqua-preview-image');
      img.classList.toggle('aqua-preview-selected', slot.key === selectedSlot);
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `${slot.label}，按 Enter 選擇這個換圖位置`);
      let label = labels.get(img);
      if (!label) { label = document.createElement('div'); label.className = 'aqua-preview-label'; layer.append(label); labels.set(img, label); }
      label.textContent = slot.key === selectedSlot ? `✓ ${slot.label}` : slot.label;
      label.classList.toggle('selected', slot.key === selectedSlot);
      const rect = img.getBoundingClientRect();
      const visible = rect.width > 0 && rect.height > 0 && rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight && getComputedStyle(img).visibility !== 'hidden';
      label.hidden = !visible;
      if (!visible) continue;
      label.style.maxWidth = `${Math.max(70, Math.min(190, rect.width - 12, innerWidth - 16))}px`;
      const width = label.getBoundingClientRect().width;
      const height = label.getBoundingClientRect().height;
      label.style.left = `${Math.max(8, Math.min(rect.left + 7, innerWidth - width - 8))}px`;
      label.style.top = `${Math.max(8, Math.min(rect.top + 7, innerHeight - height - 8))}px`;
    }
  }

  function scheduleLabels() {
    if (drawing) return;
    drawing = true;
    requestAnimationFrame(drawLabels);
  }

  function pictureFor(slot) {
    const selector = metadata.get(slot)?.selector;
    if (selector) {
      try {
        const match = [...document.querySelectorAll(selector)].find(element => element instanceof HTMLImageElement && !element.closest('dialog') && element.dataset.photoSlot === slot);
        if (match) return match;
      } catch { /* Fall back to the actual image marker while metadata is updated. */ }
    }
    return photos().find(img => img.dataset.photoSlot === slot) || null;
  }

  function choose(slot, notify = true) {
    if (!metadata.has(slot)) return;
    selectedSlot = slot;
    focusedSlot = slot;
    scheduleLabels();
    if (notify) post('aqua-photos:select', slot);
  }

  async function focusSlot(slot, token) {
    const hero = /^hero-([1-3])$/.exec(slot);
    if (hero) {
      const img = document.querySelector('#hero-image');
      const button = document.querySelector(`[data-scene="${Number(hero[1]) - 1}"]`);
      if (img?.dataset.photoSlot !== slot) {
        if (button?.getAttribute('aria-pressed') !== 'true') button?.click();
        await new Promise(resolve => setTimeout(resolve, 280));
      }
    }
    const coral = /^coral-(branch|bloom|soft)$/.exec(slot);
    if (coral) document.querySelector(`[data-coral="${coral[1]}"]`)?.click();
    if (token !== requestId) return;
    api.refresh?.();
    let img = pictureFor(slot);
    if (img?.closest('[hidden]') && slot.startsWith('work-')) {
      document.querySelector('[data-filter="all"]')?.click();
      img = pictureFor(slot);
    }
    selectedSlot = slot;
    if (img && focusedSlot !== slot) img.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'nearest' });
    focusedSlot = slot;
    scheduleLabels();
  }

  addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== window.parent) return;
    const data = event.data;
    if (!data || data.type !== 'aqua-photos:preview' || data.version !== version || !metadata.has(data.slot)) return;
    if (!data.config || data.config.version !== 1 || !data.config.mappings || typeof data.config.mappings !== 'object') return;
    window.AquaPhotoConfig = data.config;
    api.refresh?.();
    void focusSlot(data.slot, ++requestId);
  });

  function eventPhoto(target) {
    if (!(target instanceof Element)) return null;
    const direct = target.closest('img[data-photo-slot]');
    if (direct && !direct.closest('dialog')) return direct;
    const container = target.closest('.work-card, .hero-art, .experience-image, .intro-photo, .coral-media');
    return container?.querySelector('img[data-photo-slot]') || null;
  }

  function stop(event) { event.preventDefault(); event.stopImmediatePropagation(); }
  const blocked = '[data-book], #intro-replay, #project-book, #ai-generate, #ai-consult, #ai-download, [data-light], [data-language], .fx-toggle, .fx-deep';

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const img = eventPhoto(target);
    if (img && metadata.has(img.dataset.photoSlot)) { stop(event); choose(img.dataset.photoSlot); return; }
    if (target.closest(blocked)) { stop(event); return; }
    const anchor = target.closest('a[href]');
    if (anchor) {
      const url = new URL(anchor.href, location.href);
      if (anchor.hasAttribute('download') || url.origin !== location.origin || url.pathname !== location.pathname || url.search !== location.search) { stop(event); return; }
    }
    if (event.isTrusted && target.closest('[data-scene], .scene-next')) {
      setTimeout(() => { const hero = document.querySelector('#hero-image'); if (hero) choose(hero.dataset.photoSlot); }, 280);
    }
    if (event.isTrusted && target.closest('[data-coral]')) {
      const slot = `coral-${target.closest('[data-coral]').dataset.coral}`;
      queueMicrotask(() => choose(slot));
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (!['Enter', ' ', 'Spacebar'].includes(event.key)) return;
    const target = event.target instanceof Element ? event.target : null;
    const img = eventPhoto(target);
    if (img && metadata.has(img.dataset.photoSlot)) { stop(event); choose(img.dataset.photoSlot); }
    else if (target?.closest(blocked)) stop(event);
  }, true);
  document.addEventListener('submit', stop, true);
  document.addEventListener('pointermove', event => event.stopImmediatePropagation(), true);
  const observer = new MutationObserver(records => {
    if (records.some(record => !layer.contains(record.target))) scheduleLabels();
  });
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-photo-slot', 'hidden', 'src'] });
  addEventListener('scroll', scheduleLabels, { passive: true });
  addEventListener('resize', scheduleLabels);
  document.addEventListener('load', scheduleLabels, true);
  scheduleLabels();
  post('aqua-photos:ready');
})();
