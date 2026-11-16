import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

test("service shortcut focuses the heading and honors the user's motion preference", () => {
  let reduced = true;
  const listeners = {};
  const calls = [];
  const services = {
    querySelector: () => ({focus: options => calls.push(options.preventScroll)}),
    scrollIntoView: options => calls.push(options.behavior),
  };
  const header = {offsetHeight: 90, querySelector: () => ({})};
  const context = {
    document: {
      querySelector: () => header,
      getElementById: id => id === "services" ? services : null,
      documentElement: {style: {setProperty() {}}},
      addEventListener: (name, handle) => { listeners[name] = handle; },
    },
    addEventListener() {},
    ResizeObserver: class {observe() {}},
    matchMedia: query => ({matches: query.includes("reduced-motion") && reduced}),
  };
  vm.runInNewContext(readFileSync(new URL("./visit-planner/service-cta.js", import.meta.url), "utf8"), context);
  const click = {target: {closest: () => true}, preventDefault() {}};
  listeners.click(click);
  reduced = false;
  listeners.click(click);
  assert.deepEqual(calls, [true, "instant", true, "smooth"]);
});

// Exercise route guards with no network, storage, SMTP or payment adapter.
function planner(globals = {}, smartHomePreview = false) {
  const main = { innerHTML: "" };
  const ctx = vm.createContext({
    AbortSignal, ...globals,
    location: { hash: "", origin: globals.origin || "http://localhost" },
    history: { replaceState(_state, _title, hash) { ctx.location.hash = hash; } },
    document: {
      body: { classList: { add() {} } },
      querySelector: selector => selector === "#proposed-computer-services" ? null : main,
      querySelectorAll: () => [],
    },
    scrollTo() {}, addEventListener() {},
  });
  const run = (code) => vm.runInContext(code, ctx);
  run(readFileSync(new URL("./visit-planner/intake.js", import.meta.url), "utf8"));
  if (smartHomePreview) run(readFileSync(new URL("./visit-planner/smart-home-preview.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/visit.js", import.meta.url), "utf8"));
  return { run, main, visit: (route) => {ctx.location.hash = route; run("render()"); return main.innerHTML;} };
}

test("a preference requires an eligible setup and a visit address matching the ZIP", () => {
  const {run,visit} = planner();
  assert.match(visit("#time/0/1"), /Check your setup/);
  assert.equal(run("location.hash"), "#fit/0/1");
  run("city='94599'; fit='Yes'");
  assert.match(visit("#time/0/1"), /Contact &amp; address/);
  run("Object.assign(contact,{person:'Avery Example',email:'avery@example.invalid',street:'100 Example Lane',town:''})");
  assert.match(visit("#checkout/0/1"), /Contact &amp; address/);
  run("contact.town='Walnut Creek'");
  assert.match(visit("#checkout/0/1"), /Describe your preferred timing/);
  assert.equal(run("location.hash"), "#time/0/1");
});

test("review shows the fixed package price and ZIP edits invalidate timing", () => {
  const {run,visit} = planner();
  visit("#services/0/1");
  run("city='94596';fit='Yes';Object.assign(contact,{person:'Avery Example',email:'avery@example.invalid',street:'100 Example Lane',town:'Walnut Creek'});useFlexibleTime()");
  const review = visit("#checkout/0/1");
  assert.match(review, /Fixed visit price · \$199/);
  assert.match(review,/Payment is due after the visit/);
  run("zipChanged({value:'123'})");
  assert.equal(run("slot"),"");
  assert.match(visit("#checkout/0/1"),/Check your setup/);
});

test("all nine packages display approved prices and durations before continuing", () => {
  const { visit, run } = planner();
  for (const [path, price, minutes] of [
    ["0/0",229,"up to 60"], ["0/1",199,"up to 45"], ["0/2",229,"up to 60"],
    ["0/3",229,"up to 60"], ["0/4",229,"up to 60"], ["0/5",229,"60"],
    ["1/0",199,"up to 45"], ["2/0",229,"up to 60"], ["3/0",199,"up to 45"],
  ]) {
    const html = visit("#services/" + path);
    assert.ok(html.includes("Continue · $" + price + "</button>"));
    assert.ok(html.includes(minutes + " minutes"));
    assert.ok(run("visitPayload().problem").includes("$" + price + " · " + minutes + " minutes"));
    assert.doesNotMatch(html, /type="checkbox"/);
    if (path === "0/2") assert.match(html, /even if the issue remains unresolved.*approval before any extra work/);
  }
});
test("preview keeps the selected package and updates timing without transmitting", async () => {
  const {run, main, visit} = planner({ fetch() { assert.fail("unexpected network call"); } });
  visit("#services/0/2");
  run("city='94596';fit='Yes';Object.assign(contact,{person:'QA Example',email:'qa@example.invalid',street:'100 Example Lane',town:'Walnut Creek',arrival:'TEST ONLY'});timingChanged('Tuesday morning')");
  assert.equal(main.textContent, "Tuesday morning · Pacific");
  run("timingChanged('')");
  assert.equal(main.hidden, true);
  run("timingChanged('Friday afternoon')");
  assert.equal(main.hidden, false);
  assert.equal(main.textContent, "Friday afternoon · Pacific");
  await run("finishVisit()");
  const done = visit("#done/0/2");
  for (const expected of ["$229", "even if the issue remains unresolved", "100 Example Lane", "Friday afternoon", "TEST ONLY", "Sending is disabled"])
    assert.ok(done.includes(expected), expected);

  const payload = run("visitPayload()");
  const python = `import json, sys
from unittest.mock import patch
from backend import app
with patch.object(app.smtplib, 'SMTP') as relay:
    smtp = relay.return_value.__enter__.return_value
    smtp.send_message.return_value = {}
    app.send_quote(app.validate(json.load(sys.stdin)))
    print(smtp.send_message.call_args.args[0].get_content())`;
  const result = spawnSync("python3", ["-c", python], {
    cwd: new URL(".", import.meta.url), input: JSON.stringify(payload), encoding: "utf8",
    env: { ...process.env, PYTHONPATH: "backend" },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.ok(result.stdout.includes(payload.problem));
});

test("intake retries explicitly, retains payload and suppresses duplicate sends", async () => {
  let release;
  const calls = [];
  const {run} = planner({ transport(url, options) {
    calls.push({url, options});
    return new Promise(resolve => { release = resolve; });
  } });
  run("const candidate = createVisitIntake('/quote', transport); const data = {problem:'TEST ONLY'}");
  const pending = run("candidate.submit(data)");
  assert.equal(await run("candidate.submit(data)"), "sending");
  release({status:502, json:async () => ({message:"unconfirmed"})});
  assert.equal(await pending, "unconfirmed");
  const retry = run("candidate.submit(data)");
  release({status:200, json:async () => ({message:"Your request has been sent. Kyle will follow up using your preferred reply method."})});
  assert.equal(await retry, "accepted");
  assert.equal(await run("candidate.submit(data)"), "accepted");
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.body, calls[1].options.body);
  assert.equal(calls[1].options.method, "POST");
  const other = run("candidate.submit({problem:'Second fictional package'})");
  release({status:200, json:async () => ({message:"Your request has been sent. Kyle will follow up using your preferred reply method."})});
  assert.equal(await other, "accepted");
  assert.equal(await run("candidate.submit(data)"), "accepted");
  assert.equal(calls.length, 3);
});
test("live form submits using the chosen reply method with manual address and timing confirmation", async () => {
  const calls = [];
  const { run, main, visit } = planner({
    origin: "https://www.serviceboost.co",
    window: {
      SERVICE_BOOST_QUOTE_ENDPOINT: "https://quotes.serviceboost.co/quote",
      async fetch(url, options) {
        calls.push(JSON.parse(options.body));
        return {status:200, json:async () => ({message:"Your request has been sent. Kyle will follow up using your preferred reply method."})};
      },
    },
  });
  visit("#services/0/1");
  run("city='94599';fit='Yes';slot='Friday afternoon';Object.assign(contact,{method:'text',person:'Example',street:'100 Example Lane',town:'Walnut Creek'})");
  assert.equal(run("hasContact()"), false);
  run("contact.phone='925-555-0100'");
  run("contact.email='jane@example.c'");
  assert.equal(run("hasContact()"), false);
  run("contact.email=''");
  const html = visit("#checkout/0/1");
  for (const expected of ["There is no fee", "by text", "pending until Kyle accepts", "payment options before the visit","Send visit request"]) assert.ok(html.includes(expected));
  await run("finishVisit()");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].reply_method, "text");
  assert.match(main.textContent, /pending until Kyle accepts/);
  await run("finishVisit()");
  assert.equal(calls.length, 1);
});
test("legacy homepage sections have a rendered scroll target", () => {
  const {run,main} = planner();
  run("document.getElementById = id => ({scrollIntoView(){document.scrolled=id}})");
  for (const anchor of ["services","pricing","about","process"]) {
    run("location.hash='#" + anchor + "';renderRoute()");
    assert.ok(main.innerHTML.includes('id="' + anchor + '"'));
    assert.equal(run("document.scrolled"),anchor);
  }
});

test("four price-free category cards lead directly to priced packages", () => {
  const {visit} = planner();
  const home = visit("#home");
  assert.equal((home.match(/class="card"/g) || []).length, 4);
  assert.doesNotMatch(home, /\$\d/);
  assert.doesNotMatch(home, /Fixed-price services · Pay after your visit/);
  for (const [category, prices] of [[229,199,229,229,229,229],[199],[229],[199]].entries()) {
    const choices = visit("#services/" + category);
    assert.deepEqual([...choices.matchAll(/<span>\$(\d+)<\/span>/g)].map(m => Number(m[1])), prices);
    assert.match(choices, /Fixed-price services · Pay after your visit/);
    assert.match(visit("#fit/" + category + "/0"), /Visit summary[\s\S]*Fixed-price services · Pay after your visit<\/p><\/aside>/);
    assert.doesNotMatch(choices, /<input/);
  }
});

test("folder transfer has a quote path outside the fixed-price flow", () => {
  const {visit} = planner();
  const html = visit("#services/0/folder");
  assert.ok(html.includes('href="/request-help">Request a quote'));
  assert.ok(html.includes("Full-device migration, damaged drives and data recovery"));
  assert.doesNotMatch(html, /Continue ·/);
  assert.ok(html.indexOf("Setup &amp; installation") < html.indexOf("Help &amp; learning"));
  assert.ok(html.indexOf("Help &amp; learning") < html.indexOf("Not sure what you need? Ask Kyle"));
});

test("review smart-home support carries approved terms and installations have no booking route", () => {
  const {visit, run} = planner({}, true);
  for (const index of [1, 2, 3, 4]) {
    const html = visit("#services/1/" + index);
    assert.match(html, /Continue · \$229/);
    const payload = run("visitPayload()");
    assert.equal(payload.service, "smart-home");
    for (const term of ["Support · $229 · up to 60 minutes", "remains unresolved", "extra work and price", "subscriptions and replacement parts"]) assert.ok(payload.problem.includes(term));
    assert.match(visit("#fit/1/" + index), /Check your setup/);
  }
  for (const slug of ["doorbell-installation", "thermostat-installation", "garage-installation"]) {
    const html = visit("#services/1/" + slug);
    assert.match(html, /Scope under review/);
    assert.doesNotMatch(html, /Continue ·/);
    assert.doesNotMatch(visit("#fit/1/" + slug), /Check your setup/);
  }
});
