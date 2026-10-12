(() => {
  'use strict';
  const base = new URL('.', document.currentScript.src);
  const asset = name => new URL(name, base).href;
  const groups = { home: '首頁輪播', about: '關於我們', coral: '珊瑚探索', work: '精選作品', experience: '日夜光境' };
  const natureImages = ['aquascape', 'ecosystem', 'terrarium', 'greenwall'];
  const natureScenes = ['水下之森', '雨林之間', '微型綠境'];
  const natureWorks = ['水下之森', '雨林之間', '一方綠境', '會呼吸的牆'];
  const reefImages = ['hero-reef', 'coral-detail', 'reef-aquarium', 'hero-reef'];
  const reefScenes = ['珊瑚之海', '珊瑚細語', '日常裡的海'];
  const reefWorks = ['珊瑚之海', '海底花園', '日常裡的海', '礁岩的呼吸'];
  const makeSlots = (ocean, japanese = false) => {
    const images = ocean ? reefImages : natureImages;
    const sceneNames = ocean ? reefScenes : natureScenes;
    const workNames = ocean ? reefWorks : natureWorks;
    const image = index => asset(ocean ? `aqua-design-ocean/assets/${images[index]}.png` : `aqua-design/assets/${images[index]}.jpg`);
    return [
      ...sceneNames.map((title, index) => ({ key: `hero-${index + 1}`, group: 'home', title, label: `輪播 ${String(index + 1).padStart(2, '0')} · ${title}`, anchor: 'home', selector: '#hero-image', src: image(index), ratio: japanese ? '1.12 / 1' : '16 / 9', description: `首頁大圖的第 ${index + 1} 張。預覽會自動切換到「${title}」，可直接查看圖片與文字的搭配。` })),
      ...workNames.map((title, index) => ({ key: `work-${index + 1}`, group: 'work', title, label: `作品 ${String(index + 1).padStart(2, '0')} · ${title}`, anchor: 'work', selector: `[data-project="${index}"] .work-photo img`, src: image(index), ratio: japanese ? '1.52 / 1' : '4 / 3', description: `精選作品「${title}」的卡片圖片，套用後也會同步更換這個作品的詳情大圖。` })),
      { key: 'experience', group: 'experience', title: ocean ? '一片海，也有日與夜。' : japanese ? '把光線，也納入設計。' : '同一片自然，不同的心境。', label: '日夜光境 · 背景大圖', anchor: 'experience', selector: '#experience .experience-image img', src: image(ocean ? 2 : 0), ratio: '16 / 9', description: '頁面下方日夜光境區塊的背景圖。日光與夜色使用同一張照片，原有光線效果保留。' }
    ];
  };
  const versions = {
    original: { label: '水草缸', subtitle: '水草、沉木與自然造景', url: asset('aqua-design/'), cover: asset('aqua-design/assets/aquascape.jpg'), pageTitle: '讓自然，住進日常。', groups, slots: makeSlots(false) },
    japanese: { label: '純魚缸', subtitle: '觀賞魚與日式空間', url: asset('aqua-design-jp/'), cover: asset('aqua-design/assets/studio.jpg'), pageTitle: '水景設計，讓空間更有生命。', groups, slots: makeSlots(false, true) },
    ocean: { label: '海水缸', subtitle: '珊瑚、礁岩與海洋空間', url: asset('aqua-design-ocean/'), cover: asset('aqua-design-ocean/assets/hero-reef.png'), pageTitle: '把一片海，帶進生活。', groups, slots: makeSlots(true) }
  };
  versions.japanese.slots.splice(3, 0, { key: 'about', group: 'about', title: '讓自然，成為空間的一部分。', label: '關於我們 · 空間介紹照片', anchor: 'about', selector: '#about .intro-photo img', src: asset('aqua-design/assets/studio.jpg'), ratio: '1.06 / 1', description: '「讓自然，成為空間的一部分。」區塊左側的空間介紹照片，與右側品牌介紹並列。' });
  versions.ocean.slots.splice(3, 0, { key: 'about', group: 'about', title: '海的細節，值得慢慢看。', label: '關於我們 · 海洋細節照片', anchor: 'about', selector: '#about .intro-photo img', src: asset('aqua-design-ocean/assets/coral-detail.png'), ratio: '4 / 3', description: '「海的細節，值得慢慢看。」區塊的珊瑚細節照片，與品牌介紹並列。' });
  versions.ocean.slots.splice(4, 0, ...['branch', 'bloom', 'soft'].map((kind, index) => ({ key: `coral-${kind}`, group: 'coral', title: ['枝狀珊瑚', '花朵型珊瑚', '柔珊瑚'][index], label: `珊瑚介紹 · ${['枝狀珊瑚', '花朵型珊瑚', '柔珊瑚'][index]}`, anchor: 'coral', selector: `#coral-panel-${kind} .coral-media img`, src: asset(`aqua-design-ocean/assets/${reefImages[index]}.png`), ratio: '4 / 3', description: `珊瑚探索中「${['枝狀珊瑚', '花朵型珊瑚', '柔珊瑚'][index]}」頁籤的介紹照片，預覽會自動展開這個頁籤。` })));

  function mapping(version, slot) {
    return window.AquaPhotoConfig?.mappings?.[version]?.[slot] || null;
  }
  function photoURL(photo) {
    if (!photo || !/^images\/IG-\d{3}-\d{2}-[\w-]+\.jpg$/.test(photo.file)) return null;
    return asset(`aqua-design/assets/instagram/${photo.file}`);
  }
  const originals = new WeakMap();
  function set(img, slot, fallbackSrc, fallbackAlt) {
    if (!img) return;
    let fallbacks = originals.get(img);
    if (!fallbacks) { fallbacks = new Map(); originals.set(img, fallbacks); }
    fallbacks.set(slot, { src: fallbackSrc, alt: fallbackAlt });
    const photo = mapping(document.body.dataset.aquaVersion, slot);
    const src = photoURL(photo);
    img.dataset.photoSlot = slot;
    img.src = src || fallbackSrc;
    img.alt = src ? (document.documentElement.lang === 'ja' ? `魚缸先森 Instagram 写真 ${photo.id}` : `魚缸先森 Instagram 照片 ${photo.id}`) : fallbackAlt;
    if (src) img.dataset.photoId = photo.id;
    else delete img.dataset.photoId;
  }
  function refresh() {
    document.querySelectorAll('img[data-photo-slot]').forEach(img => {
      const fallback = originals.get(img)?.get(img.dataset.photoSlot);
      if (fallback) set(img, img.dataset.photoSlot, fallback.src, fallback.alt);
    });
  }
  const isAdminPreview = window.parent !== window && new URLSearchParams(location.search).get('photo-admin') === '1';
  window.AquaPhotos = { versions, mapping, photoURL, set, refresh, isAdminPreview };

  document.querySelectorAll('img[data-photo-slot]').forEach(img => set(img, img.dataset.photoSlot, img.getAttribute('src'), img.alt));
  addEventListener('aqua:languagechange', () => {
    // Unmapped text belongs to i18n; scene handlers handle the dynamic images.
    document.querySelectorAll('img[data-photo-id]:not(#hero-image):not(#project-image)').forEach(img => {
      const fallback = originals.get(img)?.get(img.dataset.photoSlot);
      if (fallback) set(img, img.dataset.photoSlot, fallback.src, fallback.alt);
    });
  });
  document.addEventListener('DOMContentLoaded', () => {
    const previewSlot = new URLSearchParams(location.search).get('photo-slot');
    const sceneMatch = /^hero-([1-3])$/.exec(previewSlot || '');
    if (sceneMatch) document.querySelector(`[data-scene="${Number(sceneMatch[1]) - 1}"]`)?.click();
    const coralMatch = /^coral-(branch|bloom|soft)$/.exec(previewSlot || '');
    if (coralMatch) document.querySelector(`[data-coral="${coralMatch[1]}"]`)?.click();
  });
})();
