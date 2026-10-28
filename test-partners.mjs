import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import vm from 'node:vm';

const source = readFileSync(new URL('./partner-inquiry.js', import.meta.url), 'utf8');
const accepted = 'Your request has been sent. Kyle will follow up using your preferred reply method.';
const settle = () => new Promise(resolve => setImmediate(resolve));
const values = {
  business:'Example MSP', name:'Test contact', email:'contact@example.com',
  location:'Walnut Creek',
  task:'Exploring scheduled coverage for local offices.', company:''
};

function page({readiness, response = async () => ({ok:true, json:async () => ({message:accepted})})} = {}) {
  const nodes = {}, requests = [];
  for (const id of ['partner-form','partner-fields','partner-submit',
    'partner-status','partner-retry','inquiry-content','partner-confirmation','partner-confirmation-title']) {
    nodes[id] = {handlers:{}, hidden:id === 'partner-confirmation',
      addEventListener(event, fn) {this.handlers[event] = fn;},
      focus() {this.focused = true;}};
  }
  const form = nodes['partner-form'];
  form.values = {...values};
  form.reportValidity = () => true;
  form.reset = () => {form.resetCalled = true; form.values = {};};
  const context = vm.createContext({
    URL, AbortSignal,
    window:{SERVICE_BOOST_QUOTE_ENDPOINT:'https://quotes.serviceboost.co/quote'},
    document:{getElementById:id => nodes[id]},
    FormData:class {constructor(form) {this.values = form.values;} *[Symbol.iterator]() {yield* Object.entries(this.values);}},
    fetch:async (url, options) => {
      requests.push({url:String(url), options});
      if (String(url).endsWith('/tech-help-ready')) {
        return readiness ? readiness() : {ok:true,json:async () => ({message:'tech_support_v1'})};
      }
      return response();
    }
  });
  vm.runInContext(source, context);
  return {nodes, form, requests, context,
    submit:() => form.handlers.submit({preventDefault() {}}),
    payload: data => context.partnerPayload(data)};
}

test('dedicated inquiry checks readiness on load without sending a quote', async () => {
  const p = page(); await settle();
  assert.equal(p.requests.length, 1);
  assert.equal(p.nodes['partner-submit'].disabled, false);
  assert.equal(p.requests[0].options.credentials, 'omit');
});

test('report opens independently without any inquiry delivery code', () => {
  const dialog = {open:false, showModal() {this.open = true;}};
  let click;
  vm.runInNewContext(readFileSync(new URL('./partners.js', import.meta.url), 'utf8'), {
    document:{querySelectorAll:() => [{dataset:{openDialog:'sample-report'},
      addEventListener(event, handler) {click = handler;}}],
      getElementById:() => dialog}
  });
  click({preventDefault() {}});
  assert.equal(dialog.open, true);
});

test('five-field inquiry preserves existing backend contract', () => {
  const payload = page().payload(values);
  assert.equal(payload.company, '', 'company remains the honeypot');
  assert.match(payload.problem, /Company: Example MSP/);
  assert.doesNotMatch(payload.problem, /Desired date:/);
  assert.doesNotMatch(payload.problem, /Remote engineer available:/);
  assert.equal(payload.project_type, 'tech_support');
  assert.equal(payload.reply_method, 'email');
  assert.equal(payload.service, 'help');
  assert.equal(payload.ref, undefined);
  // Validate real generated payloads against the unchanged production validator.
  for (const input of [payload, page().payload({...values, business:'B'.repeat(200), task:'T'.repeat(3500)})]) {
    assert.ok(input.problem.length <= 4000);
    const result = spawnSync('python3', ['-c',
      'import json, sys; from backend.app import validate; print(json.dumps(validate(json.load(sys.stdin))))'],
    {cwd:new URL('.', import.meta.url), input:JSON.stringify(input), encoding:'utf8'});
    assert.equal(result.status, 0, result.stderr);
    const validated = JSON.parse(result.stdout);
    assert.equal(validated.problem, input.problem);
    assert.equal(validated.phone, input.phone);
  }
});

test('whitespace-only details are rejected; real company cannot erase honeypot', async () => {
  const p = page();
  assert.throws(() => p.payload({...values, task:' '.repeat(15)}), /Describe/);
  assert.throws(() => p.payload({...values, business:'   '}), /company/);
  assert.equal(p.payload({...values, company:'bot'}).company, 'bot');
  await settle();
  p.form.values.task = ' '.repeat(15);
  await p.submit();
  assert.equal(p.requests.length, 1);
  assert.match(p.nodes['partner-status'].textContent, /Describe/);
});

test('unsupported readiness blocks submit and explicit retry can recover', async () => {
  let available = false;
  const p = page({readiness:async () => ({ok:true,json:async () => ({message:available ? 'tech_support_v1' : 'ok'})})});
  await settle(); await p.submit();
  assert.equal(p.requests.length, 1);
  assert.equal(p.nodes['partner-submit'].disabled, true);
  assert.equal(p.nodes['partner-retry'].hidden, false);
  available = true;
  await p.nodes['partner-retry'].handlers.click();
  assert.equal(p.nodes['partner-submit'].disabled, false);
});

test('pending requests prevent duplicates; success clears data and focuses confirmation', async () => {
  let resolve;
  const pending = new Promise(r => {resolve = r;});
  const p = page({response:() => pending});
  await settle();
  const first = p.submit();
  await p.submit();
  assert.equal(p.requests.length, 2);
  assert.equal(p.nodes['partner-fields'].disabled, true);
  resolve({ok:true,json:async () => ({message:accepted})});
  await first;
  assert.equal(p.form.resetCalled, true);
  assert.equal(p.nodes['inquiry-content'].hidden, true);
  assert.equal(p.nodes['partner-confirmation'].hidden, false);
  assert.equal(p.nodes['partner-confirmation-title'].focused, true);
  await p.submit();
  assert.equal(p.requests.length, 2);
});

test('validation, network, rate limit and uncertain responses retain details', async () => {
  for (const response of [
    async () => ({ok:false,status:400}), async () => ({ok:false,status:429}),
    async () => ({ok:false,status:502}), async () => {throw new Error('timeout');},
    async () => ({ok:true,json:async () => ({message:'unknown'})})
  ]) {
    const p = page({response}); await settle(); await p.submit();
    assert.deepEqual(p.form.values, values);
    assert.equal(p.form.resetCalled, undefined);
    assert.equal(p.nodes['partner-fields'].disabled, false);
    assert.equal(p.nodes['partner-confirmation'].hidden, true);
    assert.ok(p.nodes['partner-status'].textContent.length > 10);
  }
});

test('browser validation blocks POST', async () => {
  const p = page(); await settle();
  p.form.reportValidity = () => false;
  await p.submit();
  assert.equal(p.requests.length, 1);
});
