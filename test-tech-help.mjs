import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('./tech-support.js', import.meta.url), 'utf8');

function page({ available = true, response = async () => ({ok:true}) } = {}) {
  const nodes = {}, calls = [];
  for (const id of ['tech-help', 'tech-help-form', 'help-fields', 'help-service', 'help-reply', 'help-phone', 'help-email', 'help-status', 'help-submit', 'phone-field', 'email-field']) {
    nodes[id] = {value:'', handlers:{}, addEventListener(name, callback) {this.handlers[name] = callback;}};
  }
  const service = nodes['help-service'], reply = nodes['help-reply'];
  service.options = ['help','wifi','workspace','computer','printer','mobile','smart-home'].map(value => ({value}));
  service.value = 'help';
  reply.value = 'text';
  nodes['help-phone'].value = '202-555-0123';
  nodes['help-email'].value = 'visitor@example.com';
  const form = nodes['tech-help-form'];
  form.reportValidity = () => true;
  form.reset = () => { form.resetCalled = true; service.value = 'help'; reply.value = 'text'; };
  const dialog = nodes['tech-help'];
  dialog.showModal = () => {dialog.open = true;};
  const trigger = {dataset:{dialog:'wifi'}, addEventListener(name, callback) {this[name] = callback;}};
  vm.runInNewContext(source, {
    URL, URLSearchParams, AbortSignal, location:new URL('https://serviceboost.co/'),
    window:{SERVICE_BOOST_QUOTE_ENDPOINT:'https://quotes.serviceboost.co/quote', addEventListener() {}},
    document:{getElementById:id => nodes[id], querySelectorAll:selector => selector === '[data-dialog]' ? [trigger] : []},
    FormData: class { *[Symbol.iterator]() {
      yield ['service',service.value]; yield ['reply_method',reply.value];
      for (const name of ['phone','email']) if (!nodes['help-'+name].disabled) yield [name,nodes['help-'+name].value];
    }},
    fetch:async (url, options) => {
      if (String(url).endsWith('/tech-help-ready')) return {ok:true,json:async () => ({message:available ? 'tech_support_v1' : 'ok'})};
      calls.push(JSON.parse(options.body)); return response();
    },
  });
  trigger.click({preventDefault(){}});
  return {nodes, calls, form, trigger, submit:() => form.handlers.submit({preventDefault(){}})};
}
const settle = () => new Promise(resolve => setImmediate(resolve));

test('tech readiness prevents requests against an older backend', async () => {
  const p = page({available:false}); await settle(); await p.submit();
  assert.equal(p.calls.length, 0);
  assert.equal(p.nodes['help-submit'].disabled, true);
  assert.match(p.nodes['help-status'].textContent, /unavailable/);
});

test('tech selected reply sends only its contact and retains service on success', async () => {
  const p = page(); await settle();
  p.nodes['help-reply'].value = 'email'; p.nodes['help-reply'].handlers.change();
  await p.submit();
  assert.equal(p.calls[0].service, 'wifi');
  assert.equal(p.calls[0].project_type, 'tech_support');
  assert.equal(p.calls[0].email, 'visitor@example.com');
  assert.equal(p.calls[0].phone, undefined);
  assert.equal(p.nodes['help-service'].value, 'wifi');
  assert.equal(p.form.resetCalled, true);
});

test('tech pending request blocks duplicates and locks selection; failure retains data', async () => {
  let resolve;
  const pending = new Promise(r => {resolve = r;});
  const p = page({response:() => pending}); await settle();
  const first = p.submit(); await p.submit();
  assert.equal(p.calls.length, 1);
  assert.equal(p.nodes['help-fields'].disabled, true);
  p.trigger.dataset.dialog = 'printer'; p.trigger.click({preventDefault(){}});
  assert.equal(p.nodes['help-service'].value, 'wifi');
  resolve({ok:false,status:502}); await first;
  assert.equal(p.form.resetCalled, undefined);
  assert.equal(p.nodes['help-fields'].disabled, false);
  assert.match(p.nodes['help-status'].textContent, /could not confirm delivery/);
});
