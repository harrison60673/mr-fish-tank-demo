(() => {
  'use strict';
  const t = value => value;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const setPhoto = (img, slot, fallbackSrc, fallbackAlt) => {
    img.dataset.photoSlot = slot;
    if (typeof window.AquaPhotos?.set === 'function') {
      window.AquaPhotos.set(img, slot, fallbackSrc, fallbackAlt);
      return;
    }
    img.src = fallbackSrc;
    img.alt = fallbackAlt;
  };
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    document.body.classList.add('js-motion');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    }), { threshold: .08 });
    $$('.reveal').forEach(el => observer.observe(el));
  }
  let scrollQueued = false;
  function progress() {
    const range = document.documentElement.scrollHeight - innerHeight;
    $('.progress').style.width = `${range > 0 ? scrollY / range * 100 : 0}%`;
    scrollQueued = false;
  }
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(progress); } }, { passive: true });
  addEventListener('resize', progress); progress();

  const menu = $('.menu-toggle');
  function closeMenu() { menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', '開啟選單'); $('.nav').classList.remove('open'); }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? '關閉選單' : '開啟選單'); $('.nav').classList.toggle('open', open);
  });
  $$('.nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  const scenes = [
    {image:'hero-reef',name:'01 / 珊瑚之海',alt:'自然光穿過清澈海水，珊瑚礁與魚群構成水下層次'},
    {image:'coral-detail',name:'02 / 珊瑚細語',alt:'橘粉色柔珊瑚與紫色枝狀珊瑚的細緻紋理'},
    {image:'reef-aquarium',name:'03 / 日常裡的海',alt:'在室內空間收藏一座礁岩與珊瑚海水缸的概念'}
  ];
  let scene = 0, sceneTimer;
  function setScene(index) {
    scene = index; clearTimeout(sceneTimer);
    const img = $('#hero-image'); img.style.opacity = '0';
    $$('.scene-dot').forEach((btn, i) => { btn.classList.toggle('active', i === scene); btn.setAttribute('aria-pressed', String(i === scene)); });
    $('.scene-name').textContent = t(scenes[scene].name);
    $('.hero-index').textContent = `0${scene + 1} — 03`;
    sceneTimer = setTimeout(() => { setPhoto(img, `hero-${scene + 1}`, `assets/${scenes[scene].image}.png`, t(scenes[scene].alt)); img.style.opacity = '1'; }, reducedMotion.matches ? 0 : 250);
  }
  $$('.scene-dot').forEach(btn => btn.addEventListener('click', () => setScene(Number(btn.dataset.scene))));
  $('.scene-next').addEventListener('click', () => setScene((scene + 1) % scenes.length));
  $$('.magnetic').forEach(el => {
    el.addEventListener('pointermove', event => {
      if (reducedMotion.matches || event.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect(); el.style.transform = `translate(${(event.clientX-r.left-r.width/2)*.12}px,${(event.clientY-r.top-r.height/2)*.12}px)`;
    }); el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  $$('.filter').forEach(btn => btn.addEventListener('click', () => {
    $$('.filter').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
    let count = 0;
    $$('.work-card').forEach(card => { card.hidden = btn.dataset.filter !== 'all' && card.dataset.category !== btn.dataset.filter; if (!card.hidden) { count++; card.classList.add('visible'); } });
    $('#work-count').textContent = `${String(count).padStart(2,'0')} SELECTED SCENES`; progress();
  }));
  const coralTabs = $$('[data-coral]');
  function selectCoral(tab, focus = false) {
    coralTabs.forEach(button => {
      const selected = button === tab;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      $('#' + button.getAttribute('aria-controls')).hidden = !selected;
    });
    if (focus) tab.focus({preventScroll:true});
    progress();
  }
  coralTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectCoral(tab));
    tab.addEventListener('keydown', event => {
      const actions = {ArrowRight:(index + 1) % coralTabs.length, ArrowLeft:(index - 1 + coralTabs.length) % coralTabs.length, Home:0, End:coralTabs.length - 1};
      if (!Object.hasOwn(actions, event.key)) return;
      event.preventDefault(); selectCoral(coralTabs[actions[event.key]], true);
    });
  });
  const projects = [
    {name:'珊瑚之海',category:'01 / CORAL REEF',image:'hero-reef',service:'珊瑚礁景',description:'珊瑚的色彩與礁岩的輪廓交錯，魚群穿過清澈的藍。在層次與留白之間，尋找能融入生活的海洋風景。這是視覺概念，實際生物與設備配置需另行確認。',tags:['珊瑚層次','礁岩輪廓','海洋光線']},
    {name:'海底花園',category:'02 / CORAL GARDEN',image:'coral-detail',service:'珊瑚礁景',description:'靠近一點，海洋就有了不同的表情。以橘粉、紫色與青綠的珊瑚紋理組合，探索柔和而鮮明的視覺方向。',tags:['珊瑚紋理','色彩配比','柔軟姿態']},
    {name:'日常裡的海',category:'03 / OCEAN LIVING',image:'reef-aquarium',service:'海洋空間',description:'一座清透的海水缸，讓室內多了一個可以慢慢凝望的角落。從視線、光線與材質出發，討論海洋風景與空間的關係。',tags:['室內整合','海水缸概念','空間視線']},
    {name:'礁岩的呼吸',category:'04 / BLUE LAGOON',image:'hero-reef',service:'白沙潟湖',description:'礁岩的起伏、珊瑚的節奏與白沙留白，為海洋風景留下開放的游動空間。以簡潔的輪廓，探索通透而平衡的造景方向。',tags:['礁岩構景','白沙留白','開放泳區']}
  ];
  const projectDialog = $('#project-dialog'), bookingDialog = $('#booking-dialog');
  let currentProject = 0, bookingOpener = null;
  function showDialog(dialog) { closeMenu(); dialog.showModal(); document.body.classList.add('modal-open'); }
  $$('#project-dialog, #booking-dialog').forEach(dialog => {
    $('.dialog-close', dialog).addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { if (!$('dialog[open]')) document.body.classList.remove('modal-open'); });
    dialog.addEventListener('click', event => { if (event.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); });
  });
  $$('.work-card').forEach(card => card.addEventListener('click', () => {
    currentProject = Number(card.dataset.project); const p = projects[currentProject];
    setPhoto($('#project-image'), `work-${currentProject + 1}`, `assets/${p.image}.png`, t(p.name));
    $('#project-title').textContent = t(p.name); $('#project-category').textContent = t(p.category); $('#project-description').textContent = t(p.description);
    $('#project-tags').replaceChildren(...p.tags.map(tag => { const span = document.createElement('span'); span.textContent = t(tag); return span; }));
    showDialog(projectDialog);
  }));
  // 日夜光境切到「深藍」時，整個網站一起沉入夜海（body.deep-sea），並記住選擇。
  const themeMeta = $('meta[name="theme-color"]');
  function setDeepSea(night, save = true) {
    $('#experience').classList.toggle('night', night);
    document.body.classList.toggle('deep-sea', night);
    $$('[data-light]').forEach(b => { const on = (b.dataset.light === 'night') === night; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
    $('.light-caption').textContent = t(night ? 'NIGHTFALL / 深藍時刻 · 浮游生物微光' : 'DAYLIGHT / 清澈海水 · 珊瑚色彩');
    themeMeta?.setAttribute('content', night ? '#020c13' : '#061e2a');
    if (save) { try { localStorage.setItem('aqua-ocean-deep', night ? 'night' : 'day'); } catch {} }
    document.body.dispatchEvent(new CustomEvent('deepseachange', { detail: { night } }));
  }
  $$('[data-light]').forEach(btn => btn.addEventListener('click', () => setDeepSea(btn.dataset.light === 'night')));
  if (document.body.classList.contains('deep-sea')) setDeepSea(true, false);
  $$('.service-list details').forEach(detail => detail.addEventListener('toggle', () => { if (detail.open) $$('.service-list details').forEach(other => { if (other !== detail) other.open = false; }); }));

  const form = $('#booking-form'); let step = 0;
  function renderStep(focus = false) {
    $$('[data-step]').forEach((field, index) => { field.hidden = index !== step; $$('input,select,textarea',field).forEach(input => { input.disabled = index !== step; }); });
    $$('.booking-progress span').forEach((span,index) => span.classList.toggle('active',index <= step));
    $('#booking-back').hidden = step === 0; $('#step-count').textContent = `STEP 0${step + 1} / 03`;
    $('#booking-next').replaceChildren(document.createTextNode(t(step === 2 ? '完成需求摘要' : '下一步') + ' '), Object.assign(document.createElement('span'),{textContent:'→'}));
    if (step === 2) $('#booking-summary').textContent = `${t($('input[name=service]:checked').value)} · ${t(form.elements.space.value)} · ${t(form.elements.budget.value)}`;
    if (focus) { bookingDialog.scrollTop = 0; const input = $('input:not(:disabled),select:not(:disabled)',form); input?.focus({preventScroll:true}); }
  }
  function openBooking(service, opener) {
    bookingOpener = opener; step = 0; form.reset();
    form.elements.name.setCustomValidity('');
    if (service) $$('input[name=service]').forEach(input => { input.checked = input.value === service; });
    form.hidden = false; $('.booking-progress').hidden = false; $('#booking-success').hidden = true;
    renderStep(); showDialog(bookingDialog);
  }
  $$('[data-book]').forEach(btn => btn.addEventListener('click', () => openBooking(btn.dataset.service || null,btn)));
  document.addEventListener('aqua-design:consult', event => {
    openBooking('珊瑚礁景', document.querySelector('#ai-consult'));
    form.elements.idea.value = `AI 海洋缸概念需求：\n${event.detail.brief}\n圖片編號：${event.detail.id}`;
  });
  $('#project-book').addEventListener('click', () => { projectDialog.close(); openBooking(projects[currentProject].service,$(`[data-project="${currentProject}"]`)); });
  bookingDialog.addEventListener('close', () => bookingOpener?.focus({preventScroll:true}));
  $('#booking-back').addEventListener('click', () => { if (step > 0) { step--; renderStep(true); } });
  form.addEventListener('submit', event => {
    event.preventDefault(); if (!form.reportValidity()) return;
    if (step < 2) { step++; renderStep(true); return; }
    const name = form.elements.name.value.trim();
    if (!name) { form.elements.name.setCustomValidity(t('請輸入你的稱呼')); form.elements.name.reportValidity(); return; }
    renderSuccessSummary();
    form.hidden = true; $('.booking-progress').hidden = true; $('#booking-success').hidden = false; bookingDialog.scrollTop = 0; $('#booking-done').focus({preventScroll:true});
  });
  form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
  $('#booking-done').addEventListener('click', () => bookingDialog.close());
  function renderSuccessSummary() {
    $('#success-summary').textContent = `${t('嚮往的海洋：')}${t($('input[name=service]:checked').value)}\n${t('空間類型：')}${t(form.elements.space.value)}\n${t('規劃預算：')}${t(form.elements.budget.value)}\n${t('稱呼：')}${form.elements.name.value.trim()}\n${t('電子信箱：')}${form.elements.email.value}${form.elements.idea.value.trim() ? '\n'+t('你的想法：')+form.elements.idea.value.trim() : ''}`;
  }
  renderStep();
})();
