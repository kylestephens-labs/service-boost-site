import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('./tech-support.js', import.meta.url), 'utf8');

function page({ available = true, serviceQuery = 'wifi', response = async () => ({ok:true}), readiness } = {}) {
  const nodes = {}, calls = [];
  for (const id of ['tech-help-form','help-fields','help-service','help-email','help-status','help-submit','retry-availability','service-picker','change-service','selected-name','selected-icon','service-summary','request-form','request-confirmation','confirmation-title']) {
    nodes[id] = {value:'', hidden:id === 'request-confirmation', handlers:{}, addEventListener(name, callback) {this.handlers[name] = callback;},
      setAttribute(name, value) {this[name] = value;}, focus() {this.focused = true;}};
  }
  const service = nodes['help-service'];
  service.options = ['help','wifi','workspace','computer','printer','mobile','smart-home'].map(value => ({value,textContent:value}));
  service.value = 'help';
  nodes['help-email'].value = 'visitor@example.com';
  const form = nodes['tech-help-form'];
  form.reportValidity = () => true;
  form.reset = () => {form.resetCalled = true; service.value = 'help'; nodes['help-email'].value = '';};
  vm.runInNewContext(source, {
    URL, URLSearchParams, AbortSignal, location:new URL('https://serviceboost.co/request-help?service=' + encodeURIComponent(serviceQuery)),
    window:{SERVICE_BOOST_QUOTE_ENDPOINT:'https://quotes.serviceboost.co/quote', addEventListener() {}, scrollTo() {}},
    document:{getElementById:id => nodes[id], querySelectorAll:() => [], body:{classList:{add() {}}}},
    FormData: class { *[Symbol.iterator]() {
      yield ['service',service.value]; yield ['email',nodes['help-email'].value];
      yield ['name','Test visitor']; yield ['location','Walnut Creek']; yield ['problem','Wi-Fi drops during calls.'];
    }},
    fetch:async (url, options) => {
      if (String(url).endsWith('/tech-help-ready')) return readiness ? readiness() : {ok:true,json:async () => ({message:available ? 'tech_support_v1' : 'ok'})};
      calls.push(JSON.parse(options.body)); return response();
    },
  });
  return {nodes, calls, form, submit:() => form.handlers.submit({preventDefault(){}})};
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('older backend disables submission but allows manual availability retry', async () => {
  let available = false;
  const p = page({readiness:async () => ({ok:true,json:async () => ({message:available ? 'tech_support_v1' : 'ok'})})});
  await settle(); await p.submit();
  assert.equal(p.calls.length, 0);
  assert.equal(p.nodes['help-submit'].disabled, true);
  assert.equal(p.nodes['retry-availability'].hidden, false);
  available = true;
  await p.nodes['retry-availability'].handlers.click();
  assert.equal(p.nodes['help-submit'].disabled, false);
  assert.equal(p.nodes['retry-availability'].hidden, true);
});

test('email-only requests retain service and clear personal fields on success', async () => {
  const p = page(); await settle(); await p.submit();
  assert.equal(p.calls[0].service, 'wifi');
  assert.equal(p.calls[0].project_type, 'tech_support');
  assert.equal(p.calls[0].reply_method, 'email');
  assert.equal(p.calls[0].email, 'visitor@example.com');
  assert.equal(p.calls[0].phone, undefined);
  assert.equal(p.nodes['help-service'].value, 'wifi');
  assert.equal(p.nodes['help-email'].value, '');
  assert.equal(p.nodes['request-form'].hidden, true);
  assert.equal(p.nodes['request-confirmation'].hidden, false);
  assert.equal(p.nodes['confirmation-title'].focused, true);
  assert.equal(p.nodes['help-fields'].disabled, true);
  await p.submit();
  assert.equal(p.calls.length, 1, 'completed request cannot be resubmitted');
});

test('pending request blocks duplicates and failure retains visitor details', async () => {
  let resolve;
  const pending = new Promise(r => {resolve = r;});
  const p = page({response:() => pending}); await settle();
  const first = p.submit(); await p.submit();
  assert.equal(p.calls.length, 1);
  assert.equal(p.nodes['help-fields'].disabled, true);
  assert.equal(p.nodes['request-confirmation'].hidden, true);
  resolve({ok:false,status:502}); await first;
  assert.equal(p.form.resetCalled, undefined);
  assert.equal(p.nodes['help-email'].value, 'visitor@example.com');
  assert.equal(p.nodes['help-fields'].disabled, false);
  assert.equal(p.nodes['request-form'].hidden, false);
  assert.equal(p.nodes['request-confirmation'].hidden, true);
  assert.match(p.nodes['help-status'].textContent, /could not confirm delivery/);
});

test('invalid service query falls back safely; valid services remain selected', () => {
  for (const value of ['wifi','workspace','computer','printer','mobile','smart-home','help']) {
    assert.equal(page({serviceQuery:value}).nodes['help-service'].value, value);
  }
  for (const value of ['unknown','<img src=x>','constructor','__proto__','']) {
    assert.equal(page({serviceQuery:value}).nodes['help-service'].value, 'help');
  }
});

test('change service reveals focused selector without resetting entered contact', () => {
  const p = page();
  p.nodes['change-service'].handlers.click();
  assert.equal(p.nodes['service-picker'].hidden, false);
  assert.equal(p.nodes['help-service'].focused, true);
  p.nodes['help-service'].value = 'printer';
  p.nodes['help-service'].handlers.change();
  assert.equal(p.nodes['selected-name'].textContent, 'printer');
  assert.equal(p.nodes['help-email'].value, 'visitor@example.com');
});

test('native invalid fields prevent any request', async () => {
  const p = page(); await settle();
  p.form.reportValidity = () => false;
  await p.submit(); assert.equal(p.calls.length, 0);
});

test('network and rate-limit failures preserve input and explain next action', async () => {
  for (const response of [async () => {throw new Error('network');},async () => ({ok:false,status:429})]) {
    const p = page({response}); await settle(); await p.submit();
    assert.equal(p.nodes['help-email'].value, 'visitor@example.com');
    assert.equal(p.nodes['help-fields'].disabled, false);
    assert.match(p.nodes['help-status'].textContent, /call or text Kyle/);
  }
});
