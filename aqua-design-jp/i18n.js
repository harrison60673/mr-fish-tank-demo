(() => {
  'use strict';
  const dictionary = window.AquaJapanese || {};
  const reverse = new Map(Object.entries(dictionary).map(([source, target]) => [target, source]));
  const textSources = new WeakMap(), rendered = new WeakMap(), attributeSources = new WeakMap();
  const attributes = ['aria-label', 'placeholder', 'title', 'alt', 'download'];
  const titleSource = document.title;
  const description = document.querySelector('meta[name="description"]');
  const descriptionSource = description?.content;
  let language = 'ja';
  let initialized = false;
  try { language = localStorage.getItem('aqua-business-language') === 'zh-Hant' ? 'zh-Hant' : 'ja'; } catch {}
  const toSource = value => reverse.get(value) || value;
  const t = value => language === 'ja' ? (dictionary[value] || value) : value;
  function translateText(node) {
    if (node.parentElement?.closest('script,style,[data-i18n-ignore]')) return;
    const value = node.nodeValue;
    let source = textSources.get(node);
    if (source === undefined || value !== rendered.get(node)) source = initialized ? toSource(value.trim()) : value.trim();
    textSources.set(node, source);
    const leading = value.match(/^\s*/)[0], trailing = value.match(/\s*$/)[0];
    const next = source ? leading + t(source) + trailing : value;
    rendered.set(node, next);
    if (value !== next) node.nodeValue = next;
  }
  function translateAttributes(element) {
    if (element.closest('script,style,[data-i18n-ignore]')) return;
    let sources = attributeSources.get(element);
    if (!sources) { sources = {}; attributeSources.set(element, sources); }
    for (const name of attributes) {
      const value = element.getAttribute(name);
      if (value == null) continue;
      if (!sources[name] || sources[name].rendered !== value) sources[name] = {source:initialized ? toSource(value) : value};
      const next = t(sources[name].source);
      sources[name].rendered = next;
      if (value !== next) element.setAttribute(name, next);
    }
  }
  function walk(root) {
    if (root.nodeType === Node.TEXT_NODE) { translateText(root); return; }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeType === Node.TEXT_NODE) translateText(node);
      else translateAttributes(node);
    }
  }
  // Preserve stored form values when option labels change languages.
  document.querySelectorAll('option').forEach(option => {
    if (!option.hasAttribute('value')) option.setAttribute('value', option.value);
  });
  function render() {
    document.documentElement.lang = language;
    document.title = t(titleSource);
    if (description) description.content = t(descriptionSource);
    walk(document.body);
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  }
  function setLanguage(next) {
    language = next === 'zh-Hant' ? 'zh-Hant' : 'ja';
    try { localStorage.setItem('aqua-business-language', language); } catch {}
    render();
    dispatchEvent(new CustomEvent('aqua:languagechange', {detail:{language}}));
  }
  window.AquaI18n = {t, setLanguage, get language() { return language; }};
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));
  render();
  initialized = true;
  new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'characterData') translateText(record.target);
      else if (record.type === 'attributes') translateAttributes(record.target);
      else record.addedNodes.forEach(walk);
    }
  }).observe(document.body, {subtree:true, childList:true, characterData:true, attributes:true, attributeFilter:attributes});
})();
