import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');

function page({ ref = 'a'.repeat(32), visible = true, blocked = false, storage = new Map(), fetchFail = false } = {}) {
  const handlers = {}, calls = [];
  const button = {}, status = {}, error = {};
  const website = { value: 'example.com', addEventListener() {}, setCustomValidity() {}, removeAttribute() {}, setAttribute() {}, focus() {} };
  const problem = { value: 'Please fix my booking form.' };
  const form = { elements: { email: { value: 'private@example.com' }, company: { value: '' } }, addEventListener: (n, f) => handlers[n] = f, querySelector: () => button, querySelectorAll: () => [], reset() { this.resetCalled = true; } };
  const nodes = { '#request-form': form, '#website': website, '#problem': problem, '#form-status': status, '#website-error': error };
  const document = { visibilityState: visible ? 'visible' : 'hidden', querySelector: s => nodes[s], addEventListener: (n, f) => handlers[n] = f, removeEventListener: n => delete handlers[n] };
  vm.runInNewContext(source, {
    document, location: { search: '?ref=' + ref }, navigator: {},
    window: { SERVICE_BOOST_QUOTE_ENDPOINT: 'https://quotes.serviceboost.co/quote' },
    URL, URLSearchParams, AbortSignal, crypto: { randomUUID: () => '12345678-1234-1234-1234-123456789abc' },
    sessionStorage: { getItem(k) { if (blocked) throw Error(); return storage.get(k); }, setItem(k,v) { storage.set(k,v); } },
    fetch: async (url, options) => { calls.push({ url: String(url), data: JSON.parse(options.body) }); if (fetchFail && String(url).endsWith('/events')) throw Error(); return { ok: true }; },
  });
  return { calls, handlers, form, status, document };
}

test('tagged arrival records only allowlisted metadata; reload reuses ID', () => {
  const storage = new Map(), a = page({ storage }), b = page({ storage });
  assert.equal(a.calls[0].url, 'https://quotes.serviceboost.co/events');
  assert.deepEqual(Object.keys(a.calls[0].data).sort(), ['event_id','ref','type']);
  assert.equal(a.calls[0].data.event_id, b.calls[0].data.event_id);
});
test('untagged and malformed links do not track; hidden tabs wait', () => {
  assert.equal(page({ ref: '' }).calls.length, 0);
  assert.equal(page({ ref: 'email@example.com' }).calls.length, 0);
  const p = page({ visible: false });
  assert.equal(p.calls.length, 0);
  p.document.visibilityState = 'visible'; p.handlers.visibilitychange();
  assert.equal(p.calls.length, 1);
});
test('tracking network/storage failures do not prevent attributed quote', async () => {
  const p = page({ blocked: true, fetchFail: true });
  await p.handlers.submit({ preventDefault() {} });
  assert.equal(p.calls[1].data.ref, 'a'.repeat(32));
  assert.equal(p.calls[1].data.email, 'private@example.com');
  assert.equal(p.form.resetCalled, true);
});
test('ordinary quote remains backward compatible', async () => {
  const p = page({ ref: '' });
  await p.handlers.submit({ preventDefault() {} });
  assert.equal(p.calls.length, 1);
  assert.equal(p.calls[0].data.ref, undefined);
  assert.equal(p.form.resetCalled, true);
});
