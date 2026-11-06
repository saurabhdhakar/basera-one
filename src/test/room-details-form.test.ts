import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { afterEach, beforeEach, expect, it } from 'vitest';

let dom: JSDOM;
let hook: { state: { specs: Record<string, unknown> }; collectSpecs: () => { specs: Record<string, unknown>; missing: string | null } };
beforeEach(() => {
  const html = readFileSync('public/basera.html', 'utf8');
  dom = new JSDOM(html, { url: 'http://localhost/basera.html', runScripts: 'outside-only' });
  const start = html.indexOf('<script>', html.indexOf('firebase-storage-compat.js'));
  const end = html.indexOf('</script>', start);
  const source = html.slice(start + 8, end);
  const call = source.lastIndexOf('initFirebase();');
  const script = source.slice(0, call) + 'window.__roomTest={state:state,collectSpecs:collectSpecs};' + source.slice(call);
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  dom.window.eval(script);
  hook = (dom.window as unknown as { __roomTest: typeof hook }).__roomTest;
  dom.window.document.querySelector<HTMLButtonElement>('#postNavBtn')?.click();
  dom.window.document.querySelector<HTMLButtonElement>('[data-group="0"]')?.click();
});
afterEach(() => dom.window.close());
function choose(key: string, value: string) {
  const chip = dom.window.document.querySelector<HTMLButtonElement>(`#commBody [data-tab="${key}"][data-val="${value}"]`);
  if (!chip) throw new Error(`Missing selection: ${key}`);
  chip.click();
}
function fill(key: string, value: string) {
  const input = dom.window.document.querySelector<HTMLInputElement>(`#commBody [data-in="${key}"]`);
  if (!input) throw new Error(`Missing input: ${key}`);
  input.value = value;
  input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}
function next() {
  fill('adTitle', 'Sunny private room'); fill('price', '12000');
  choose('acType', 'AC Room'); choose('water', 'Government Supply'); choose('sharing', 'Private Room');
  dom.window.document.querySelector<HTMLButtonElement>('#commNext')?.click();
}
it.each(['Boys', 'Girls', 'Families', 'Anyone'])('carries Allowed For %s into the posting payload', value => {
  choose('allowedFor', value); choose('washroomType', 'Attached'); next();
  expect(hook.collectSpecs().specs['allowedFor']).toBe(value);
});
it.each(['Attached', 'Common'])('carries Washroom Type %s into the posting payload', value => {
  choose('allowedFor', 'Anyone'); choose('washroomType', value); next();
  expect(hook.collectSpecs().specs['washroomType']).toBe(value);
});
it('Next retains entered room details and multiple amenities without submitting', () => {
  choose('allowedFor', 'Anyone'); choose('washroomType', 'Common');
  choose('amenities', 'Bed'); choose('amenities', 'Wi-Fi'); next();
  expect(hook.collectSpecs().specs['amenities']).toEqual(['Bed', 'Wi-Fi']);
  expect(hook.collectSpecs().specs['acType']).toBe('AC Room');
  expect(dom.window.document.querySelector<HTMLInputElement>('#pPrice')?.value).toBe('12000');
  expect(dom.window.document.querySelector('#postModal')?.classList.contains('open')).toBe(true);
});