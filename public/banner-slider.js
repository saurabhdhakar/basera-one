export const AUTO_SLIDE_MS = 4000;

export function safeBannerUrl(value, image = false) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const url = value.trim();
  if (/^\/[^/\\]/.test(url) && !/[\\\u0000-\u001f]/.test(url)) return url;
  try {
    const parsed = new URL(url);
    return (parsed.protocol === 'https:' || (!image && parsed.protocol === 'http:')) && !parsed.username && !parsed.password ? parsed.href : '';
  } catch { return ''; }
}

export function createBannerSlider(root, { fallback = [], interval = AUTO_SLIDE_MS } = {}) {
  const doc = root.ownerDocument;
  const win = doc.defaultView;
  const track = root.querySelector('.banner-track');
  const dots = root.querySelector('.banner-dots');
  if (!track || !dots || !win) return null;
  let banners = [], index = 0, timer = null, start = null, suppressClick = false;
  let hovering = false, focused = false, intersecting = true;
  const reduced = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const clear = () => { if (timer !== null) win.clearInterval(timer); timer = null; };
  const restart = () => {
    clear();
    if (banners.length > 1 && !doc.hidden && !hovering && !focused && intersecting && !reduced?.matches) {
      timer = win.setInterval(() => go(index + 1), interval);
    }
  };
  function go(next) {
    index = (next + banners.length) % banners.length;
    Array.from(track.children).forEach((slide, i) => {
      slide.style.transform = `translateX(${(i - index) * 100}%)`;
      slide.setAttribute('aria-hidden', String(i !== index));
      slide.tabIndex = i === index && slide.hasAttribute('href') ? 0 : -1;
    });
    Array.from(dots.children).forEach((dot, i) => dot.classList.toggle('active', i === index));
    root.dataset.index = String(index);
  }
  function update(rows) {
    const valid = (Array.isArray(rows) ? rows : []).filter(row => row && row.active !== false && safeBannerUrl(row.image_url, true));
    const next = valid.length ? valid : fallback;
    if (JSON.stringify(banners) === JSON.stringify(next)) return;
    banners = next;
    clear(); track.replaceChildren(); dots.replaceChildren(); index = 0;
    root.hidden = !banners.length;
    banners.forEach((banner, i) => {
      const link = safeBannerUrl(banner.link);
      const slide = doc.createElement(link ? 'a' : 'div');
      slide.className = 'banner-slide';
      slide.setAttribute('aria-label', banner.alt || `Basera banner ${i + 1}`);
      if (link) { slide.href = link; slide.target = '_top'; slide.rel = 'noopener noreferrer'; }
      const image = doc.createElement('img');
      image.src = safeBannerUrl(banner.image_url, true); image.alt = banner.alt || 'Basera banner';
      image.width = 1536; image.height = 512; image.draggable = false;
      image.loading = i === 0 ? 'eager' : 'lazy';
      image.addEventListener('error', () => { if (!image.src.endsWith('/assets/home-banner.jpg')) image.src = '/assets/home-banner.jpg'; });
      slide.append(image); track.append(slide);
      const dot = doc.createElement('span'); dot.className = 'banner-dot'; dots.append(dot);
    });
    dots.hidden = banners.length <= 1;
    if (banners.length) go(0);
    restart();
  }
  const handlers = [];
  const on = (element, event, handler, options) => { element.addEventListener(event, handler, options); handlers.push(() => element.removeEventListener(event, handler, options)); };
  on(root, 'pointerdown', event => {
    if (event.isPrimary === false || (event.pointerType === 'mouse' && event.button !== 0)) return;
    start = { x: event.clientX, y: event.clientY }; suppressClick = false; clear();
  });
  on(root, 'pointermove', event => {
    if (start && Math.abs(event.clientX - start.x) > 12 && Math.abs(event.clientX - start.x) > Math.abs(event.clientY - start.y)) suppressClick = true;
  });
  const finish = event => {
    if (!start) return;
    const dx = event.clientX - start.x, dy = event.clientY - start.y;
    if (banners.length > 1 && Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy)) { suppressClick = true; go(index + (dx < 0 ? 1 : -1)); }
    start = null; restart();
  };
  on(win, 'pointerup', finish);
  on(win, 'pointercancel', () => { start = null; restart(); });
  on(root, 'click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, true);
  on(root, 'pointerenter', event => { if (event.pointerType === 'mouse') { hovering = true; clear(); } });
  on(root, 'pointerleave', () => { hovering = false; restart(); });
  on(root, 'focusin', () => { focused = true; clear(); });
  on(root, 'focusout', () => { focused = false; restart(); });
  on(root, 'keydown', event => {
    if (banners.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); go(index + (event.key === 'ArrowRight' ? 1 : -1)); restart(); }
  });
  on(doc, 'visibilitychange', restart);
  if (reduced) on(reduced, 'change', restart);
  const observer = win.IntersectionObserver ? new win.IntersectionObserver(entries => { intersecting = entries[0].isIntersecting; restart(); }) : null;
  observer?.observe(root);
  update(fallback);
  return { update, getIndex: () => index, destroy: () => { clear(); observer?.disconnect(); handlers.forEach(remove => remove()); } };
}

const root = document.getElementById('homeBanner');
if (root) {
  const slider = createBannerSlider(root, { fallback: [{ image_url: '/assets/home-banner.jpg', link: '', alt: 'Find your next space with Basera' }] });
  document.addEventListener('basera-banners-updated', event => slider?.update(event.detail));
  window.addEventListener('pagehide', () => slider?.destroy(), { once: true });
  document.dispatchEvent(new CustomEvent('basera-banners-ready'));
}