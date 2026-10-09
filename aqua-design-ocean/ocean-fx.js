// 海洋互動特效：首頁水面折射、游標氣泡、點擊水波、泡泡游標、避人的魚群、卡片水光，
// 以及深藍模式的發光浮游生物。右下角可切換深藍模式與停用特效（記在 localStorage），
// 減少動態偏好時只保留深藍模式的配色，不啟動任何動畫。
(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const body = document.body;
  const STORE_KEY = 'aqua-ocean-effects';
  const isOn = () => body.dataset.effects === 'ocean' && !reducedMotion.matches;
  const introOpen = () => body.classList.contains('intro-open');

  /* ---------- 右下角控制：深藍模式、水中特效 ---------- */
  const deep = () => body.classList.contains('deep-sea');
  const dock = document.createElement('div');
  dock.className = 'fx-dock';
  const deepButton = document.createElement('button');
  deepButton.type = 'button';
  deepButton.className = 'fx-deep';
  deepButton.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1z"/><circle cx="17" cy="5" r=".9"/><circle cx="20.5" cy="9" r=".6"/></svg><span>深藍</span>';
  function syncDeep() {
    const on = deep();
    deepButton.setAttribute('aria-pressed', String(on));
    deepButton.setAttribute('aria-label', on ? '切回日光模式' : '切換到深藍模式');
    deepButton.title = on ? '深藍模式：開' : '深藍模式：關';
  }
  // 交給日夜光境的按鈕處理，兩邊狀態永遠一致
  deepButton.addEventListener('click', () => $(`[data-light="${deep() ? 'day' : 'night'}"]`)?.click());
  body.addEventListener('deepseachange', syncDeep);
  syncDeep();
  dock.append(deepButton);

  let saved = null;
  try { saved = localStorage.getItem(STORE_KEY); } catch {}
  body.dataset.effects = saved === 'quiet' || reducedMotion.matches ? 'quiet' : 'ocean';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'fx-toggle';
  toggle.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><circle cx="9" cy="15" r="5"/><circle cx="16.5" cy="7.5" r="3"/><circle cx="19" cy="15.5" r="1.6"/><path d="M6.4 13.2a3 3 0 0 1 2-1.6"/></svg><span>水中特效</span>';
  function syncToggle() {
    const on = body.dataset.effects === 'ocean';
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', on ? '關閉水中特效' : '開啟水中特效');
    toggle.title = on ? '水中特效：開' : '水中特效：關';
  }
  toggle.addEventListener('click', () => {
    body.dataset.effects = body.dataset.effects === 'ocean' ? 'quiet' : 'ocean';
    try { localStorage.setItem(STORE_KEY, body.dataset.effects); } catch {}
    syncToggle();
    body.dispatchEvent(new CustomEvent('oceanfxchange'));
  });
  if (!reducedMotion.matches) { dock.append(toggle); syncToggle(); }
  body.append(dock);
  if (reducedMotion.matches) return;

  /* ---------- 判斷背景深淺（決定氣泡顏色） ---------- */
  let darkCache = new WeakMap();
  body.addEventListener('deepseachange', () => { darkCache = new WeakMap(); });
  function isDarkAt(x, y) {
    if (deep()) return true;
    let el = document.elementFromPoint(x, y);
    const start = el;
    if (start && darkCache.has(start)) return darkCache.get(start);
    while (el && el !== document.documentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      const m = bg.match(/[\d.]+/g);
      if (m && (m.length < 4 || Number(m[3]) > .5)) {
        const dark = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) < 128;
        if (start) darkCache.set(start, dark);
        return dark;
      }
      el = el.parentElement;
    }
    return false;
  }

  /* ---------- 全頁覆蓋層：氣泡尾跡、點擊水波、泡泡游標 ---------- */
  const layer = document.createElement('canvas');
  layer.className = 'fx-layer';
  layer.setAttribute('aria-hidden', 'true');
  body.append(layer);
  const ctx = layer.getContext('2d');
  const cursor = document.createElement('div');
  cursor.className = 'fx-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  body.append(cursor);

  let dpr = 1, vw = 0, vh = 0;
  function sizeLayer() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    vw = innerWidth; vh = innerHeight;
    layer.width = Math.round(vw * dpr); layer.height = Math.round(vh * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  sizeLayer();
  addEventListener('resize', sizeLayer);

  const particles = [];
  const MAX_PARTICLES = 180;
  function addBubble(x, y, dark, opts = {}) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    const r = opts.r ?? (Math.random() < .12 ? 4.5 + Math.random() * 2.5 : 1.4 + Math.random() * 3);
    particles.push({
      kind: 'bubble', x, y, r, dark,
      vx: opts.vx ?? (Math.random() - .5) * .5,
      vy: opts.vy ?? -(.25 + Math.random() * .35),
      wobble: .25 + Math.random() * .45, freq: .05 + Math.random() * .05, phase: Math.random() * 6.28,
      life: 0, max: 70 + Math.random() * 70
    });
  }
  function addRing(x, y, dark, delay = 0, size = 64) {
    particles.push({ kind: 'ring', x, y, dark, glow: deep(), life: -delay, max: deep() ? 56 : 46, size: deep() ? size * 1.3 : size });
  }
  function addPop(x, y, r, dark) {
    particles.push({ kind: 'pop', x, y, r, dark, life: 0, max: 12 });
  }
  function addSpark(x, y, opts = {}) {
    if (particles.length >= MAX_PARTICLES) particles.shift();
    particles.push({
      kind: 'spark', x, y,
      vx: opts.vx ?? (Math.random() - .5) * .6, vy: opts.vy ?? (Math.random() - .5) * .6,
      size: 7 + Math.random() * 9, hue: Math.random() < .7 ? 0 : 1 + Math.floor(Math.random() * 2),
      life: 0, max: 50 + Math.random() * 45
    });
  }

  /* ---------- 深藍模式：被攪動就發光的浮游生物 ---------- */
  const sprites = ['111, 247, 255', '125, 255, 208', '120, 175, 255', '235, 255, 255'].map(rgb => {
    const sprite = document.createElement('canvas');
    sprite.width = sprite.height = 64;
    const g = sprite.getContext('2d'), grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, `rgba(${rgb}, 1)`);
    grad.addColorStop(.18, `rgba(${rgb}, .55)`);
    grad.addColorStop(.5, `rgba(${rgb}, .12)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = grad; g.fillRect(0, 0, 64, 64);
    return sprite;
  });
  const plankton = [];
  let deepMix = 0;
  function seedPlankton() {
    const target = Math.round(Math.max(36, Math.min(150, vw * vh / 9500)));
    while (plankton.length < target) {
      plankton.push({
        x: Math.random() * vw, y: Math.random() * vh, z: .3 + Math.random() * .7,
        vx: (Math.random() - .5) * .2, vy: (Math.random() - .5) * .2, glow: 0, phase: Math.random() * 6.28,
        hue: Math.random() < .68 ? 0 : Math.random() < .5 ? 1 : 2
      });
    }
    plankton.length = target;
  }
  // 被水流攪動的地方亮起來，並被推開一點
  function disturb(x, y, radius, power, push) {
    for (const p of plankton) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d >= radius || d === 0) continue;
      const k = 1 - d / radius;
      p.glow = Math.min(1.2, Math.max(p.glow, power * k * (.7 + Math.random() * .5)));
      p.vx += dx / d * push * k * 6; p.vy += dy / d * push * k * 6;
    }
  }
  let lastScroll = scrollY;
  addEventListener('scroll', () => {
    const dy = scrollY - lastScroll;
    lastScroll = scrollY;
    if (deepMix < .003) return;
    // 浮游生物懸在水中：捲動時依遠近產生視差，捲得快的地方水被攪動而發光
    for (const p of plankton) {
      p.y -= dy * (.15 + p.z * .45);
      if (Math.abs(dy) > 3 && Math.random() < .12) p.glow = Math.min(1, p.glow + Math.min(.6, Math.abs(dy) / 120));
    }
  }, { passive: true });
  function drawPlankton(now) {
    if (!plankton.length) seedPlankton();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of plankton) {
      p.vx = p.vx * .97 + (Math.random() - .5) * .02 + Math.sin(p.y * .004 + now * .00025) * .006;
      p.vy = p.vy * .97 + (Math.random() - .5) * .02 - .004 * p.z;
      p.x += p.vx * p.z; p.y += p.vy * p.z;
      if (p.x < -20) p.x = vw + 20; else if (p.x > vw + 20) p.x = -20;
      if (p.y < -20) p.y = vh + 20; else if (p.y > vh + 20) p.y = -20;
      p.glow *= .962;
      const twinkle = .5 + .5 * Math.sin(now * .0011 * (.6 + p.z) + p.phase);
      const size = (5 + p.z * 9) * (1 + p.glow * 1.8);
      ctx.globalAlpha = Math.min(1, (.16 + .26 * twinkle * p.z + p.glow * .9) * deepMix);
      ctx.drawImage(sprites[p.hue], p.x - size / 2, p.y - size / 2, size, size);
      if (p.glow > .3) {
        const core = size * .3;
        ctx.globalAlpha = Math.min(1, (p.glow - .3) * deepMix);
        ctx.drawImage(sprites[3], p.x - core / 2, p.y - core / 2, core, core);
      }
    }
    // 偶爾有一隻自己亮一下
    if (Math.random() < .03 * deepMix) {
      const p = plankton[Math.floor(Math.random() * plankton.length)];
      p.glow = Math.max(p.glow, .5 + Math.random() * .4);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
  addEventListener('resize', () => { if (plankton.length) seedPlankton(); });

  const pointer = { x: -100, y: -100, cx: -100, cy: -100, inside: false, dark: true, hover: false, down: false, lastX: null, lastY: null, travel: 0 };
  const interactive = 'a, button, summary, label, [role="tab"], .work-card, input, select, textarea';

  addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    pointer.x = event.clientX; pointer.y = event.clientY;
    if (!pointer.inside) { pointer.cx = pointer.x; pointer.cy = pointer.y; pointer.inside = true; }
    if (!isOn() || introOpen()) { pointer.lastX = null; return; }
    pointer.dark = isDarkAt(pointer.x, pointer.y);
    pointer.hover = !!event.target.closest?.(interactive);
    if (pointer.lastX !== null) {
      const step = Math.hypot(pointer.x - pointer.lastX, pointer.y - pointer.lastY);
      const gap = deep() ? 11 : 16;
      pointer.travel += step;
      while (pointer.travel > gap) {
        pointer.travel -= gap;
        const x = pointer.x + (Math.random() - .5) * 8, y = pointer.y + (Math.random() - .5) * 8;
        // 深藍模式下，劃過的水留下一道冷光；白天則是氣泡
        if (deep()) addSpark(x, y); else addBubble(x, y, pointer.dark);
      }
      if (deep()) disturb(pointer.x, pointer.y, 125, Math.min(1, step / 26), .02);
    }
    pointer.lastX = pointer.x; pointer.lastY = pointer.y;
    wake();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.inside = false; pointer.lastX = null; wake(); });
  addEventListener('blur', () => { pointer.inside = false; pointer.lastX = null; wake(); });
  addEventListener('pointerdown', event => {
    if (!isOn() || introOpen()) return;
    pointer.down = true;
    const x = event.clientX, y = event.clientY, dark = isDarkAt(x, y);
    addRing(x, y, dark, 0, 58);
    addRing(x, y, dark, 9, 92);
    if (deep()) {
      // 一圈光的衝擊波：附近的浮游生物同時亮起並被推開
      disturb(x, y, 260, 1, .9);
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2, speed = 1 + Math.random() * 2.4;
        addSpark(x, y, { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed });
      }
    } else {
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (Math.random() - .5) * 2.4;
        const speed = .8 + Math.random() * 1.8;
        addBubble(x, y, dark, { vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 1.5 + Math.random() * 3.5 });
      }
    }
    wake();
  }, { passive: true });
  addEventListener('pointerup', () => { pointer.down = false; wake(); }, { passive: true });

  function strokeColor(dark, alpha) {
    return dark ? `rgba(214, 248, 240, ${alpha})` : `rgba(35, 125, 120, ${alpha})`;
  }
  function drawBubble(p, alpha) {
    const { x, y, r, dark } = p;
    const fill = ctx.createRadialGradient(x - r * .35, y - r * .35, r * .1, x, y, r);
    fill.addColorStop(0, dark ? `rgba(255,255,255,${.22 * alpha})` : `rgba(255,255,255,${.5 * alpha})`);
    fill.addColorStop(1, dark ? `rgba(140,218,208,${.06 * alpha})` : `rgba(140,218,208,${.18 * alpha})`);
    ctx.fillStyle = fill;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = r > 4 ? 1.1 : .9;
    ctx.strokeStyle = strokeColor(dark, .75 * alpha);
    ctx.stroke();
    if (r > 2.2) {
      ctx.beginPath(); ctx.arc(x, y, r * .62, Math.PI * 1.08, Math.PI * 1.45);
      ctx.strokeStyle = `rgba(255,255,255,${(dark ? .85 : .95) * alpha})`;
      ctx.lineWidth = .9; ctx.stroke();
    }
  }

  let running = false, frame = 0;
  function wake() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function tick(now = performance.now()) {
    frame++;
    ctx.clearRect(0, 0, vw, vh);
    const wantDeep = deep() && isOn() && !introOpen();
    deepMix += ((wantDeep ? 1 : 0) - deepMix) * .035;
    if (deepMix > .003) drawPlankton(now); else deepMix = wantDeep ? deepMix : 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      if (p.life > p.max) {
        if (p.kind === 'bubble' && p.r > 2.5 && Math.random() < .55) addPop(p.x, p.y, p.r, p.dark);
        particles.splice(i, 1); continue;
      }
      if (p.life < 0) continue;
      const t = p.life / p.max;
      if (p.kind === 'bubble') {
        p.vx *= .96; p.vy = p.vy * .97 - .012 * (1 + p.r * .12);
        p.x += p.vx + Math.sin(p.phase + p.life * p.freq) * p.wobble;
        p.y += p.vy;
        const alpha = Math.min(1, p.life / 6) * (1 - t * t);
        drawBubble(p, alpha);
      } else if (p.kind === 'ring') {
        const e = 1 - Math.pow(1 - t, 3);
        const r = 4 + e * p.size;
        ctx.beginPath(); ctx.ellipse(p.x, p.y, r, r * .62, 0, 0, Math.PI * 2);
        ctx.lineWidth = 1.4 * (1 - t) + .3;
        if (p.glow) {
          ctx.shadowBlur = 12; ctx.shadowColor = 'rgba(111, 247, 255, .9)';
          ctx.strokeStyle = `rgba(160, 250, 255, ${.7 * (1 - t)})`;
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          ctx.strokeStyle = strokeColor(p.dark, .55 * (1 - t));
          ctx.stroke();
        }
      } else if (p.kind === 'spark') {
        p.vx *= .95; p.vy = p.vy * .95 - .008;
        p.x += p.vx; p.y += p.vy;
        const alpha = Math.min(1, p.life / 4) * (1 - t);
        const size = p.size * (1 - t * .4);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = alpha;
        ctx.drawImage(sprites[p.hue], p.x - size / 2, p.y - size / 2, size, size);
        ctx.globalAlpha = alpha * .9;
        ctx.drawImage(sprites[3], p.x - size * .15, p.y - size * .15, size * .3, size * .3);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      } else if (p.kind === 'pop') {
        const r = p.r * (1 + t * 1.4);
        for (let k = 0; k < 6; k++) {
          const a = k / 6 * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(p.x + Math.cos(a) * r * .7, p.y + Math.sin(a) * r * .7);
          ctx.lineTo(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r);
          ctx.strokeStyle = strokeColor(p.dark, .6 * (1 - t)); ctx.lineWidth = .8; ctx.stroke();
        }
      }
    }
    // 泡泡游標：帶點延遲地跟著滑鼠，像水中漂著的一顆氣泡
    const showCursor = isOn() && pointer.inside && !introOpen() && finePointer.matches;
    pointer.cx += (pointer.x - pointer.cx) * .2;
    pointer.cy += (pointer.y - pointer.cy) * .2;
    cursor.style.transform = `translate3d(${pointer.cx}px, ${pointer.cy}px, 0)`;
    cursor.classList.toggle('visible', showCursor);
    cursor.classList.toggle('on-dark', pointer.dark);
    cursor.classList.toggle('hover', pointer.hover);
    cursor.classList.toggle('down', pointer.down);
    const settled = Math.abs(pointer.x - pointer.cx) < .3 && Math.abs(pointer.y - pointer.cy) < .3;
    if (particles.length || !settled || deepMix > 0 || wantDeep) requestAnimationFrame(tick);
    else running = false;
  }
  // 開場動畫結束、切換深藍或特效時重新喚醒繪製迴圈
  new MutationObserver(wake).observe(body, { attributes: true, attributeFilter: ['class', 'data-effects'] });
  wake();
  body.addEventListener('oceanfxchange', () => { if (!isOn()) particles.length = 0; wake(); });

  /* ---------- 首頁水面折射（WebGL） ---------- */
  function heroWater() {
    const art = $('.hero-art'), img = $('#hero-image'), hero = $('.hero');
    if (!art || !img || !hero) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-water';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false, premultipliedAlpha: false });
    if (!gl) return;
    const vs = 'attribute vec2 p;varying vec2 v;void main(){v=vec2(p.x*.5+.5,.5-p.y*.5);gl_Position=vec4(p,0.,1.);}';
    const fs = `precision mediump float;varying vec2 v;uniform sampler2D img;uniform sampler2D wave;uniform vec4 map;uniform float amp;
      void main(){
        vec2 g=texture2D(wave,v).rg-.5;
        vec2 uv=clamp((v+g*amp-map.xy)/map.zw,0.,1.);
        vec3 c=texture2D(img,uv).rgb;
        vec3 n=normalize(vec3(-g*7.,1.));
        float spec=pow(max(dot(n,normalize(vec3(.35,-.55,1.))),0.),36.);
        c*=1.+dot(g,vec2(-.5,.9))*.3;
        c+=vec3(.75,1.,.95)*spec*.22;
        gl_FragColor=vec4(c,1.);
      }`;
    function shader(type, src) { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    function texture(unit) {
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return tex;
    }
    const imgTex = texture(0), waveTex = texture(1);
    gl.uniform1i(gl.getUniformLocation(prog, 'img'), 0);
    gl.uniform1i(gl.getUniformLocation(prog, 'wave'), 1);
    const uMap = gl.getUniformLocation(prog, 'map'), uAmp = gl.getUniformLocation(prog, 'amp');

    const CELL = 4;
    let W = 0, H = 0, cur, prev, bytes, cw = 0, ch = 0, imgReady = false, energy = 0;
    function uploadImage() {
      if (!img.complete || !img.naturalWidth) return;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      imgReady = true; layout(); render();
    }
    function layout() {
      const rect = art.getBoundingClientRect();
      cw = rect.width; ch = rect.height;
      const scale = Math.min(devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(cw * scale)); canvas.height = Math.max(1, Math.round(ch * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      const nw = Math.ceil(cw / CELL) + 2, nh = Math.ceil(ch / CELL) + 2;
      if (nw !== W || nh !== H) {
        W = nw; H = nh;
        cur = new Float32Array(W * H); prev = new Float32Array(W * H); bytes = new Uint8Array(W * H * 4).fill(128);
      }
      if (img.naturalWidth) {
        // 重現 img 的 object-fit: cover 與 object-position
        const [px, py] = getComputedStyle(img).objectPosition.split(' ').map(v => parseFloat(v) / 100);
        const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
        const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
        gl.uniform4f(uMap, (cw - dw) * (isNaN(px) ? .5 : px) / cw, (ch - dh) * (isNaN(py) ? .5 : py) / ch, dw / cw, dh / ch);
      }
      gl.uniform1f(uAmp, .11);
    }
    function drop(x, y, radius, strength) {
      const gx = x / CELL + 1, gy = y / CELL + 1, r = radius / CELL;
      const x0 = Math.max(1, Math.floor(gx - r)), x1 = Math.min(W - 2, Math.ceil(gx + r));
      const y0 = Math.max(1, Math.floor(gy - r)), y1 = Math.min(H - 2, Math.ceil(gy + r));
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) {
        const d = Math.hypot(xx - gx, yy - gy) / r;
        if (d < 1) cur[yy * W + xx] += strength * (Math.cos(d * Math.PI) + 1) * .5;
      }
      energy = Math.max(energy, Math.abs(strength));
      start();
    }
    function step() {
      for (let y = 1; y < H - 1; y++) {
        let i = y * W + 1;
        for (let x = 1; x < W - 1; x++, i++) {
          prev[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) * .5 - prev[i]) * .984;
        }
      }
      const t = cur; cur = prev; prev = t;
    }
    function render() {
      if (!imgReady) return;
      let peak = 0;
      for (let y = 1; y < H - 1; y++) {
        let i = y * W + 1;
        for (let x = 1; x < W - 1; x++, i++) {
          const dx = cur[i + 1] - cur[i - 1], dy = cur[i + W] - cur[i - W];
          const a = Math.abs(cur[i]); if (a > peak) peak = a;
          bytes[i * 4] = 128 + Math.max(-127, Math.min(127, dx * 32));
          bytes[i * 4 + 1] = 128 + Math.max(-127, Math.min(127, dy * 32));
        }
      }
      energy = peak;
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, waveTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, W, H, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    let looping = false, visible = true, nextAmbient = 0;
    function active() { return isOn() && visible && !document.hidden; }
    function start() { if (!looping && active()) { looping = true; requestAnimationFrame(loop); } }
    function loop(now) {
      if (!active()) { looping = false; return; }
      if (now > nextAmbient && !introOpen()) {
        // 偶爾落下一滴水，讓水面保持呼吸感（集中在右側看得到海景的地方）
        drop(cw * (.42 + Math.random() * .55), ch * (.12 + Math.random() * .7), 18 + Math.random() * 14, .9 + Math.random() * .8);
        nextAmbient = now + 1600 + Math.random() * 2200;
      }
      step(); step(); render();
      requestAnimationFrame(loop);
    }

    let last = null;
    hero.addEventListener('pointermove', event => {
      if (!isOn() || introOpen()) return;
      const rect = art.getBoundingClientRect();
      const x = event.clientX - rect.left, y = event.clientY - rect.top;
      if (last) {
        const dist = Math.hypot(x - last.x, y - last.y), steps = Math.min(8, Math.ceil(dist / 18));
        for (let k = 1; k <= steps; k++) drop(last.x + (x - last.x) * k / steps, last.y + (y - last.y) * k / steps, 16, 1.1);
      }
      last = { x, y };
    }, { passive: true });
    hero.addEventListener('pointerleave', () => { last = null; });
    hero.addEventListener('pointerdown', event => {
      if (!isOn() || introOpen()) return;
      const rect = art.getBoundingClientRect();
      drop(event.clientX - rect.left, event.clientY - rect.top, 30, 4.5);
    }, { passive: true });

    // 跟著原本 img 的淡入淡出與換圖
    function syncOpacity() { canvas.style.opacity = img.style.opacity === '0' ? '0' : ''; }
    new MutationObserver(syncOpacity).observe(img, { attributes: true, attributeFilter: ['style'] });
    img.addEventListener('load', uploadImage);
    new ResizeObserver(() => { layout(); render(); }).observe(art);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }).observe(hero);
    document.addEventListener('visibilitychange', start);
    body.addEventListener('oceanfxchange', () => {
      art.classList.toggle('fx-water-on', isOn());
      if (!isOn()) { cur.fill(0); prev.fill(0); render(); }
      start();
    });
    canvas.addEventListener('webglcontextlost', () => { art.classList.remove('fx-water-on'); canvas.remove(); });

    img.after(canvas);
    layout();
    uploadImage();
    art.classList.toggle('fx-water-on', isOn());
    start();
  }
  heroWater();

  /* ---------- 聯絡區：會避開游標的線條魚群 ---------- */
  function fishSchool() {
    const section = $('.contact');
    if (!section) return;
    const canvas = document.createElement('canvas');
    canvas.className = 'fx-fish';
    canvas.setAttribute('aria-hidden', 'true');
    section.prepend(canvas);
    const c = canvas.getContext('2d');
    const shape = new Path2D('M0 15q19-16 40 0q-21 16-40 0l-12-10v20z');
    let w = 0, h = 0, scale = 1;
    function size() {
      scale = Math.min(devicePixelRatio || 1, 2);
      w = section.clientWidth; h = section.clientHeight;
      canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
      c.setTransform(scale, 0, 0, scale, 0, 0);
    }
    size();
    new ResizeObserver(size).observe(section);
    const fish = Array.from({ length: Math.max(9, Math.min(18, Math.round(w / 80))) }, () => {
      const a = (Math.random() - .5) * .6 + (Math.random() < .5 ? 0 : Math.PI);
      return { x: Math.random() * w, y: h * (.2 + Math.random() * .6), vx: Math.cos(a), vy: Math.sin(a) * .3, s: .35 + Math.random() * .4, phase: Math.random() * 6.28, scare: 0 };
    });
    const mouse = { x: -999, y: -999 };
    section.addEventListener('pointermove', event => {
      const r = section.getBoundingClientRect();
      mouse.x = event.clientX - r.left; mouse.y = event.clientY - r.top;
    }, { passive: true });
    section.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    section.addEventListener('pointerdown', event => {
      const r = section.getBoundingClientRect();
      const x = event.clientX - r.left, y = event.clientY - r.top;
      fish.forEach(f => { const d = Math.hypot(f.x - x, f.y - y); if (d < 260) { f.vx += (f.x - x) / d * 3; f.vy += (f.y - y) / d * 3; f.scare = 1; } });
    }, { passive: true });

    let visible = false, looping = false;
    function active() { return isOn() && visible && !document.hidden; }
    function start() { if (!looping && active()) { looping = true; requestAnimationFrame(loop); } else if (!active()) c.clearRect(0, 0, w, h); }
    function loop(now) {
      if (!active()) { looping = false; c.clearRect(0, 0, w, h); return; }
      c.clearRect(0, 0, w, h);
      for (const f of fish) {
        let ax = 0, ay = 0, n = 0, cx = 0, cy = 0, avx = 0, avy = 0;
        for (const o of fish) {
          if (o === f) continue;
          const dx = o.x - f.x, dy = o.y - f.y, d = Math.hypot(dx, dy);
          if (d < 110) { n++; cx += o.x; cy += o.y; avx += o.vx; avy += o.vy; }
          if (d < 30 && d > 0) { ax -= dx / d * .05; ay -= dy / d * .05; }
        }
        if (n) { ax += (cx / n - f.x) * .0006 + (avx / n - f.vx) * .02; ay += (cy / n - f.y) * .0006 + (avy / n - f.vy) * .02; }
        const mdx = f.x - mouse.x, mdy = f.y - mouse.y, md = Math.hypot(mdx, mdy);
        if (md < 140) { const k = (1 - md / 140) * .35; ax += mdx / md * k; ay += mdy / md * k; f.scare = Math.min(1, f.scare + .08); }
        // 留在區塊中間的水域
        if (f.y < h * .12) ay += .03; if (f.y > h * .88) ay -= .03;
        ay += (Math.random() - .5) * .02;
        f.vx += ax; f.vy += ay;
        f.scare *= .97;
        const max = 1.1 + f.scare * 2.6, min = .45;
        const sp = Math.hypot(f.vx, f.vy);
        if (sp > max) { f.vx *= max / sp; f.vy *= max / sp; }
        else if (sp < min) { f.vx *= min / sp; f.vy *= min / sp; }
        f.vy *= .985;
        f.x += f.vx; f.y += f.vy;
        if (f.x > w + 40) f.x = -40; if (f.x < -40) f.x = w + 40;
        const angle = Math.atan2(f.vy, f.vx);
        const swim = Math.sin(now * (.006 + f.scare * .012) + f.phase);
        c.save();
        c.translate(f.x, f.y); c.rotate(angle + swim * .06); c.scale(f.s, f.s * (1 + swim * .05));
        c.translate(-20, -15);
        c.lineWidth = 1.3 / f.s;
        if (deep()) {
          // 夜裡的魚帶著冷光
          c.shadowBlur = 10; c.shadowColor = 'rgba(111, 247, 255, .85)';
          c.strokeStyle = `rgba(150, 250, 245, ${.45 + f.scare * .45})`;
        } else {
          c.shadowBlur = 0;
          c.strokeStyle = `rgba(187, 222, 215, ${.28 + f.scare * .3})`;
        }
        c.stroke(shape);
        c.beginPath(); c.arc(31, 13, 1.1, 0, Math.PI * 2); c.fillStyle = c.strokeStyle; c.fill();
        c.restore();
      }
      requestAnimationFrame(loop);
    }
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; start(); }).observe(section);
    document.addEventListener('visibilitychange', start);
    body.addEventListener('oceanfxchange', start);
  }
  fishSchool();

  /* ---------- 圖片卡片：跟著游標移動的水下光斑 ---------- */
  $$('.work-photo, .coral-media').forEach(el => {
    el.classList.add('fx-caustic');
    el.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--fx-x', `${event.clientX - r.left}px`);
      el.style.setProperty('--fx-y', `${event.clientY - r.top}px`);
    }, { passive: true });
  });
})();
