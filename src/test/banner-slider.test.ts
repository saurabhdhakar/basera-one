import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// @ts-expect-error Browser module is shared with the standalone marketplace.
import { AUTO_SLIDE_MS, createBannerSlider, safeBannerUrl } from '../../public/banner-slider.js';

const banners = [
  { image_url: '/assets/cats/flat.png', link: 'https://example.com/flats', alt: 'Flats' },
  { image_url: '/assets/cats/house.png', link: '/houses', alt: 'Houses' },
  { image_url: '/assets/cats/shop.png', link: '/shops', alt: 'Shops' },
];
let slider: ReturnType<typeof createBannerSlider>;
let root: HTMLElement;
beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<section><div class="banner-track"></div><div class="banner-dots"></div></section>';
  root = document.querySelector('section') as HTMLElement;
  slider = createBannerSlider(root);
});
afterEach(() => { slider.destroy(); vi.useRealTimers(); });

describe('home banner rules', () => {
  it('advances only after exactly 4 seconds and loops through all banners', () => {
    expect(AUTO_SLIDE_MS).toBe(4000);
    slider.update(banners);
    vi.advanceTimersByTime(3999); expect(slider.getIndex()).toBe(0);
    vi.advanceTimersByTime(1); expect(slider.getIndex()).toBe(1);
    vi.advanceTimersByTime(8000); expect(slider.getIndex()).toBe(0);
  });
  it('provides one visual-only dot per banner and never advances from dot clicks', () => {
    slider.update(banners.slice(0, 2));
    const dots = root.querySelectorAll<HTMLElement>('.banner-dot');
    expect(dots.length).toBe(2);
    dots[1]?.click(); expect(slider.getIndex()).toBe(0);
    slider.update(banners); expect(root.querySelectorAll('.banner-dot').length).toBe(3);
  });
  it('hides dots and disables auto-slide entirely for one image', () => {
    slider.update(banners.slice(0, 1));
    expect(root.querySelector<HTMLElement>('.banner-dots')?.hidden).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(12000); expect(slider.getIndex()).toBe(0);
  });
  it('opens the link saved on each banner and rejects executable URLs', () => {
    slider.update(banners);
    expect(root.querySelector('a')?.getAttribute('href')).toBe('https://example.com/flats');
    expect(safeBannerUrl('javascript:alert(1)')).toBe('');
    expect(safeBannerUrl('//evil.example')).toBe('');
    expect(safeBannerUrl('/\\evil.example')).toBe('');
  });
  it('supports finger swipes without activating the banner link', () => {
    slider.update(banners);
    const pointer = (name: string, x: number) => {
      const event = new Event(name, { bubbles: true });
      Object.assign(event, { clientX: x, clientY: 30, pointerType: 'touch', isPrimary: true });
      root.dispatchEvent(event);
    };
    pointer('pointerdown', 250); pointer('pointermove', 80); pointer('pointerup', 80);
    expect(slider.getIndex()).toBe(1);
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    root.querySelector('a')?.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
  });
  it('stops any running timer when live data switches to a single banner', () => {
    slider.update(banners); vi.advanceTimersByTime(4000);
    slider.update(banners.slice(0, 1));
    expect(slider.getIndex()).toBe(0); expect(vi.getTimerCount()).toBe(0);
  });
  it('hides the whole container and renders no images when the database has no banners', () => {
    slider.update(banners); vi.advanceTimersByTime(4000);
    slider.update([]);
    expect(root.hidden).toBe(true);
    expect(root.querySelector('img')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('stays hidden with no text or image while empty, then shows and loops when banners arrive', () => {
    expect(root.hidden).toBe(true);
    expect(root.textContent).toBe('');
    slider.update(banners.slice(0, 2));
    expect(root.hidden).toBe(false);
    expect(root.querySelectorAll('img').length).toBe(2);
    vi.advanceTimersByTime(4000); expect(slider.getIndex()).toBe(1);
    vi.advanceTimersByTime(4000); expect(slider.getIndex()).toBe(0);
  });
});