(() => {
  'use strict';
  const t = value => window.AquaI18n.t(value);
  const form = document.querySelector('#ai-design-form');
  const button = document.querySelector('#ai-generate');
  const wait = document.querySelector('#ai-wait');
  const error = document.querySelector('#ai-error');
  const service = document.querySelector('#ai-service-state');
  let busy = false, result = null, elapsedTimer;
  const labels = {
    style: { forest: '水草森林', stone: '極簡石景', wood: '沉木自然' },
    space: { living: '客廳空間', office: '辦公空間', shop: '店面空間', studio: '魚缸造景' },
    fish: { small: '少量小型觀賞魚', none: '純造景' },
  };
  async function readResponse(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(t(data.message || '暫時無法連線，請稍後再試。'));
    return data;
  }
  async function checkService() {
    try {
      const data = await readResponse(await fetch('/api/aqua-design/status'));
      service.textContent = t(data.message);
      service.dataset.ready = String(data.ready);
    } catch { service.textContent = t('生成服務尚未連線，請確認本機網站與 Z-Image 已啟動。'); service.dataset.ready = 'false'; }
  }
  function formatBrief(settings) {
    return `${t(labels.style[settings.style])} · ${settings.length} × ${settings.width} × ${settings.height} cm\n${t(labels.space[settings.space])} · ${t(labels.fish[settings.fish])}${settings.idea.trim() ? '\n'+settings.idea.trim() : ''}`;
  }
  addEventListener('aqua:languagechange', () => {
    if (result) { result.brief = formatBrief(result.settings); document.querySelector('#ai-brief').textContent = result.brief; }
  });
  const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const settings = Object.fromEntries(new FormData(form));
    ['length','width','height'].forEach(key => { settings[key] = Number(settings[key]); });
    busy = true; button.disabled = true; error.hidden = true; wait.hidden = false;
    document.querySelector('#ai-job-state').textContent = t('正在準備你的風景');
    document.querySelector('#ai-job-detail').textContent = t('圖片會依本機生成速度完成，請稍候。');
    const started = Date.now();
    document.querySelector('#ai-elapsed').textContent = '00:00';
    elapsedTimer = setInterval(() => { const seconds = Math.floor((Date.now()-started)/1000); document.querySelector('#ai-elapsed').textContent = `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`; }, 1000);
    try {
      const { id } = await readResponse(await fetch('/api/aqua-design/jobs', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(settings) }));
      let job;
      for (;;) {
        job = await readResponse(await fetch(`/api/aqua-design/jobs/${id}`));
        if (job.state === 'succeeded') break;
        if (job.state === 'failed') throw new Error(t(job.message || '生成未完成，請再試一次。'));
        document.querySelector('#ai-job-state').textContent = t(job.state === 'queued' ? '正在等待生成' : '正在描繪你的魚缸');
        document.querySelector('#ai-job-detail').textContent = t(job.message || '本機模型正在處理，第一張圖可能需要較長時間。');
        await pause(1800);
      }
      const img = document.querySelector('#ai-output');
      img.src = job.imageUrl;
      await img.decode();
      img.hidden = false; document.querySelector('#ai-placeholder').hidden = true;
      document.querySelector('#ai-result-actions').hidden = false;
      document.querySelector('#ai-download').href = job.imageUrl;
      const brief = formatBrief(settings);
      document.querySelector('#ai-brief').textContent = brief;
      document.querySelector('#ai-brief').hidden = false;
      document.querySelector('#ai-result-size').textContent = `${settings.length} × ${settings.width} × ${settings.height} CM`;
      result = { id, brief, settings, imageUrl:job.imageUrl };
      button.replaceChildren(document.createTextNode(t('再生成一張') + ' '),Object.assign(document.createElement('span'),{textContent:'↗'}));
    } catch (err) {
      error.textContent = t(err.message); error.hidden = false;
    } finally {
      clearInterval(elapsedTimer); wait.hidden = true; busy = false; button.disabled = false; checkService();
    }
  });
  document.querySelector('#ai-consult').addEventListener('click', () => {
    if (!result) return;
    document.dispatchEvent(new CustomEvent('aqua-design:consult', {detail:result}));
  });
  checkService();
})();
