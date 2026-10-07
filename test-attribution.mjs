import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('./app.js', import.meta.url), 'utf8');
const navigationSource = readFileSync(new URL('./site-ui.js', import.meta.url), 'utf8');

function portfolioLink(currentUrl, destination) {
  const location = new URL(currentUrl);
  const link = { href: destination, getAttribute: () => destination };
  vm.runInNewContext(navigationSource, {
    URL, URLSearchParams, location,
    window: { addEventListener() {} },
    document: {
      querySelector: () => null,
      querySelectorAll: selector => selector === '[data-preserve-ref]' ? [link] : [],
    },
  });
  return new URL(link.href, currentUrl);
}

function page({ ref = 'a'.repeat(32), visible = true, blocked = false, storage = new Map(), fetchFail = false, address = 'example.com', quoteStatus = 200, quoteThrows = false } = {}) {
  const handlers = {}, calls = [];
  const button = {}, status = {}, error = {};
  const website = { value: address, required: true, addEventListener() {}, setCustomValidity() {}, removeAttribute() {}, setAttribute() {}, focus() {} };
  const problem = { value: 'Please fix my booking form.' };
  const form = { elements: { name: { value: 'Test Visitor' }, email: { value: 'private@example.com' }, company: { value: '' } }, addEventListener: (n, f) => handlers[n] = f, querySelector: () => button, querySelectorAll: () => [], reset() { this.resetCalled = true; } };
  const nodes = { '#request-form': form, '#website': website, '#problem': problem, '#form-status': status, '#website-error': error, '#website-label': {} };
  const document = { visibilityState: visible ? 'visible' : 'hidden', querySelector: s => nodes[s], querySelectorAll: () => [], addEventListener: (n, f) => handlers[n] = f, removeEventListener: n => delete handlers[n] };
  vm.runInNewContext(source, {
    document, location: { search: '?ref=' + ref }, navigator: {},
    window: { SERVICE_BOOST_QUOTE_ENDPOINT: 'https://quotes.serviceboost.co/quote' },
    URL, URLSearchParams, AbortSignal, crypto: { randomUUID: () => '12345678-1234-1234-1234-123456789abc' },
    sessionStorage: { getItem(k) { if (blocked) throw Error(); return storage.get(k); }, setItem(k,v) { storage.set(k,v); } },
    fetch: async (url, options) => { calls.push({ url: String(url), data: JSON.parse(options.body) }); if (String(url).endsWith('/events')) { if (fetchFail) throw Error(); return { ok: true }; } if (quoteThrows) throw Error(); return { ok: quoteStatus === 200, status: quoteStatus }; },
  });
  return { calls, handlers, form, status, document, website, error, button };
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
test('redesign without project controls sends existing improvement contract', async () => {
  const p = page({ ref: '', address: 'example.com' });
  await p.handlers.submit({ preventDefault() {} });
  assert.equal(p.calls.length, 1);
  assert.equal(p.calls[0].data.website, 'example.com');
  assert.equal(p.calls[0].data.name, 'Test Visitor');
  assert.equal(p.calls[0].data.project_type, 'improve');
  assert.equal(p.form.resetCalled, true);
  assert.equal(p.website.required, true);
  assert.equal(p.button.textContent, 'Start my redesign');
  assert.match(p.status.textContent, /redesign request has been sent/);
});
test('redesign requires a website and rejects unsafe or malformed addresses', async () => {
  for (const address of ['', '   ', 'javascript:alert(1)', 'bad site.com', 'https://user:pass@example.com']) {
    const p = page({ ref: '', address });
    await p.handlers.submit({ preventDefault() {} });
    assert.equal(p.calls.length, 0);
    assert.match(p.error.textContent, /Enter a website/);
    assert.equal(p.form.resetCalled, undefined);
  }
});
test('failed delivery preserves input, restores button and does not claim success', async () => {
  for (const options of [{ quoteStatus: 429 }, { quoteStatus: 502 }, { quoteThrows: true }]) {
    const p = page({ ref: '', ...options });
    await p.handlers.submit({ preventDefault() {} });
    assert.equal(p.form.resetCalled, undefined);
    assert.equal(p.form.elements.name.value, 'Test Visitor');
    assert.equal(p.button.disabled, false);
    assert.match(p.status.textContent, /Too many requests|Delivery could not be confirmed/);
    assert.equal(p.button.textContent, 'Start my redesign');
  }
});

test('portfolio round trips preserve only a validated ref in the subsequent quote', async () => {
  const ref = 'a'.repeat(32);
  for (const route of ['/landscape', '/salon', '/auto-repair', '/auto-repair/services', '/auto-repair/about', '/auto-repair/contact', '/restaurant', '/dental', '/contractor', '/real-estate']) {
    const concept = portfolioLink(`https://www.serviceboost.co/?ref=${ref}&unrelated=private`, route);
    const home = portfolioLink(concept.href, '/');
    assert.equal(concept.search, `?ref=${ref}`);
    assert.equal(home.search, `?ref=${ref}`);
    const p = page({ ref: home.searchParams.get('ref') });
    await p.handlers.submit({ preventDefault() {} });
    assert.equal(p.calls.at(-1).data.ref, ref);
    assert.equal(p.calls.at(-1).data.event_id, '12345678-1234-1234-1234-123456789abc');
  }
});

test('auto service enquiry retains the selected service and only allowlisted query values', () => {
  const ref = 'a'.repeat(32);
  const selected = portfolioLink(`https://www.serviceboost.co/auto-repair/services?ref=${ref}`, '/auto-repair/contact?service=diagnostics&unrelated=private');
  assert.equal(selected.searchParams.get('service'), 'diagnostics');
  assert.equal(selected.searchParams.get('ref'), ref);
  assert.equal(selected.searchParams.has('unrelated'), false);
  const back = portfolioLink(selected.href, '/#examples');
  assert.equal(back.search, `?ref=${ref}`);
  assert.equal(back.hash, '#examples');
});

test('portfolio navigation preserves explicit opt-out and rejects malformed refs', async () => {
  for (const suffix of ['', '?ref=email%40example.com', '?ref=' + 'a'.repeat(33)]) {
    const concept = portfolioLink('https://www.serviceboost.co/' + suffix, '/salon');
    const home = portfolioLink(concept.href, '/');
    assert.equal(home.search, '');
    const p = page({ ref: home.searchParams.get('ref') || '' });
    await p.handlers.submit({ preventDefault() {} });
    assert.equal(p.calls.length, 1);
    assert.equal(p.calls[0].data.ref, undefined);
  }
  const removed = portfolioLink('https://www.serviceboost.co/salon', '/');
  assert.equal(removed.search, '');
  assert.equal(portfolioLink('https://www.serviceboost.co/?ref=' + 'a'.repeat(32), 'https://example.com/').search, '');
});
