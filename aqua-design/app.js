(() => {
  'use strict';
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
    {image:'aquascape',name:'01 / 水下之森',alt:'以沉木與水草構築的自然水景'},
    {image:'ecosystem',name:'02 / 雨林之間',alt:'結合岩壁與垂直植栽的室內生態空間'},
    {image:'terrarium',name:'03 / 微型綠境',alt:'玻璃生態缸裡的微型雨林'}
  ];
  let scene = 0, sceneTimer;
  function setScene(index) {
    scene = index; clearTimeout(sceneTimer);
    const img = $('#hero-image'); img.style.opacity = '0';
    $$('.scene-dot').forEach((btn, i) => { btn.classList.toggle('active', i === scene); btn.setAttribute('aria-pressed', String(i === scene)); });
    $('.scene-name').textContent = scenes[scene].name;
    $('.hero-index').textContent = `0${scene + 1} — 03`;
    sceneTimer = setTimeout(() => { setPhoto(img, `hero-${scene + 1}`, `assets/${scenes[scene].image}.jpg`, scenes[scene].alt); img.style.opacity = '1'; }, reducedMotion.matches ? 0 : 250);
  }
  $$('.scene-dot').forEach(btn => btn.addEventListener('click', () => setScene(Number(btn.dataset.scene))));
  $('.scene-next').addEventListener('click', () => setScene((scene + 1) % scenes.length));
  let lastRipple = 0;
  $('.hero-art').addEventListener('pointermove', event => {
    if (reducedMotion.matches || event.pointerType !== 'mouse' || performance.now() - lastRipple < 330) return;
    lastRipple = performance.now();
    const rect = $('.hero-art').getBoundingClientRect();
    const ripple = document.createElement('span'); ripple.className = 'ripple';
    ripple.style.left = `${event.clientX - rect.left}px`; ripple.style.top = `${event.clientY - rect.top}px`;
    $('.ripple-field').append(ripple); ripple.addEventListener('animationend', () => ripple.remove(), { once:true });
  });
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
  const projects = [
    {name:'水下之森',category:'01 / AQUASCAPING',image:'aquascape',service:'水族造景',description:'沉木向光延伸，水草沿著起伏的輪廓生長。以虛實層次與留白，將一座森林的深邃感帶進水中，讓忙碌的日常，多一個能安靜凝望的角落。',tags:['沉木構景','水草層次','自然水景']},
    {name:'雨林之間',category:'02 / NATURE SPACE',image:'ecosystem',service:'自然空間',description:'讓岩壁、水流與植物共同構築空間。從垂直綠意到自然材質的觸感，把雨林的尺度與生命力，轉化成可以親身走入的日常風景。',tags:['生態整合','植栽配置','岩壁水景']},
    {name:'一方綠境',category:'03 / TERRARIUM',image:'terrarium',service:'雨林生態',description:'一座玻璃缸，也能收藏自然的豐富。以苔蘚、蕨類與枝幹構築微型地景，透過光線的安排，觀察每一天細微而美好的生長。',tags:['微型雨林','水陸造景','植物光照']},
    {name:'會呼吸的牆',category:'04 / LIVING WALL',image:'greenwall',service:'自然空間',description:'以深淺交錯的綠葉，重新定義牆面的表情。將植物的紋理與生長姿態帶進建築，讓垂直立面成為空間裡一片柔軟、鮮活的自然。',tags:['垂直綠化','葉形搭配','自然空間']}
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
    setPhoto($('#project-image'), `work-${currentProject + 1}`, `assets/${p.image}.jpg`, p.name);
    $('#project-title').textContent = p.name; $('#project-category').textContent = p.category; $('#project-description').textContent = p.description;
    $('#project-tags').replaceChildren(...p.tags.map(tag => { const span = document.createElement('span'); span.textContent = tag; return span; }));
    showDialog(projectDialog);
  }));
  $$('[data-light]').forEach(btn => btn.addEventListener('click', () => {
    const night = btn.dataset.light === 'night'; $('#experience').classList.toggle('night', night);
    $$('[data-light]').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
    $('.light-caption').textContent = night ? 'NIGHTFALL / 靜謐夜色 · 一盞風景' : 'DAYLIGHT / 柔和日光 · 自然顯色';
  }));
  $$('.service-list details').forEach(detail => detail.addEventListener('toggle', () => { if (detail.open) $$('.service-list details').forEach(other => { if (other !== detail) other.open = false; }); }));

  const form = $('#booking-form'); let step = 0;
  function renderStep(focus = false) {
    $$('[data-step]').forEach((field, index) => { field.hidden = index !== step; $$('input,select,textarea',field).forEach(input => { input.disabled = index !== step; }); });
    $$('.booking-progress span').forEach((span,index) => span.classList.toggle('active',index <= step));
    $('#booking-back').hidden = step === 0; $('#step-count').textContent = `STEP 0${step + 1} / 03`;
    $('#booking-next').replaceChildren(document.createTextNode(step === 2 ? '完成體驗 ' : '下一步 '), Object.assign(document.createElement('span'),{textContent:'→'}));
    if (step === 2) $('#booking-summary').textContent = `${$('input[name=service]:checked').value} · ${form.elements.space.value} · ${form.elements.budget.value}`;
    if (focus) { bookingDialog.scrollTop = 0; const input = $('input:not(:disabled),select:not(:disabled)',form); input?.focus({preventScroll:true}); }
  }
  function openBooking(service, opener) {
    bookingOpener = opener; step = 0; form.reset();
    if (service) $$('input[name=service]').forEach(input => { input.checked = input.value === service; });
    form.hidden = false; $('.booking-progress').hidden = false; $('#booking-success').hidden = true;
    renderStep(); showDialog(bookingDialog);
  }
  $$('[data-book]').forEach(btn => btn.addEventListener('click', () => openBooking(null,btn)));
  document.addEventListener('aqua-design:consult', event => {
    openBooking('水族造景', document.querySelector('#ai-consult'));
    form.elements.idea.value = `AI 魚缸概念需求：\n${event.detail.brief}\n圖片編號：${event.detail.id}`;
  });
  $('#project-book').addEventListener('click', () => { projectDialog.close(); openBooking(projects[currentProject].service,$(`[data-project="${currentProject}"]`)); });
  bookingDialog.addEventListener('close', () => bookingOpener?.focus({preventScroll:true}));
  $('#booking-back').addEventListener('click', () => { if (step > 0) { step--; renderStep(true); } });
  form.addEventListener('submit', event => {
    event.preventDefault(); if (!form.reportValidity()) return;
    if (step < 2) { step++; renderStep(true); return; }
    const name = form.elements.name.value.trim();
    if (!name) { form.elements.name.setCustomValidity('請輸入你的稱呼'); form.elements.name.reportValidity(); return; }
    $('#success-summary').textContent = `嚮往的自然：${$('input[name=service]:checked').value}\n空間類型：${form.elements.space.value}\n規劃預算：${form.elements.budget.value}\n稱呼：${name}\n電子信箱：${form.elements.email.value}${form.elements.idea.value.trim() ? '\n你的想法：' + form.elements.idea.value.trim() : ''}`;
    form.hidden = true; $('.booking-progress').hidden = true; $('#booking-success').hidden = false; bookingDialog.scrollTop = 0; $('#booking-done').focus({preventScroll:true});
  });
  form.elements.name.addEventListener('input', () => form.elements.name.setCustomValidity(''));
  $('#booking-done').addEventListener('click', () => bookingDialog.close());
  renderStep();
})();
