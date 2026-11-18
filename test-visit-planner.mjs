import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
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
function planner(globals = {}) {
  const main = { innerHTML: "" };
  const ctx = vm.createContext({
    URL, window: { SERVICE_BOOST_BOOKING_ENABLED: false }, ...globals,
    location: { hash: "", origin: globals.origin || "http://localhost" },
    history: { replaceState(_state, _title, hash) { ctx.location.hash = hash; } },
    document: {
      body: { classList: { add() {}, toggle() {} } },
      querySelector: selector => selector === "#proposed-computer-services" ? null : main,
      querySelectorAll: () => [],
    },
    scrollTo() {}, addEventListener() {},
  });
  const run = (code) => vm.runInContext(code, ctx);
  run(readFileSync(new URL("./visit-planner/booking.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/smart-home.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/wifi-menu.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/visit.js", import.meta.url), "utf8"));
  return { run, main, visit: (route) => {ctx.location.hash = route; run("render()"); return main.innerHTML;} };
}

test("legacy visit links retain their selection and enter one non-sending review flow", () => {
  const {visit, run} = planner();
  for (const route of ["book", "fit", "contact", "time", "checkout", "done"]) {
    const html = visit("#" + route + "/0/1");
    assert.match(html, /Printer setup or reconnection/);
    assert.match(html, /<strong>\$199<\/strong>/);
    assert.match(html, /Review preview: scheduling is disabled/);
    assert.doesNotMatch(html, /<iframe|booking-widget|href="https:\/\/calendly|Step \d|Send visit request/);
    if (route !== "book") assert.equal(run("location.hash"), "#book/0/1");
  }
  for (const route of ["#book/0/999", "#book/1/doorbell-installation", "#book/2/cabling", "#book/0/folder", "#book/-1/0", "#book/0/NaN"]) {
    assert.doesNotMatch(visit(route), /id="calendar-title"|booking-widget/);
  }
});

test("booking leaves all invitee answers blank and retains service tracking", () => {
  const {visit, run} = planner();
  visit("#book/0/2");
  const url = new URL(run('bookingURL("0/2")'));
  assert.equal(url.origin, "https://calendly.com");
  assert.equal(url.pathname, "/kyle-serviceboost/30min");
  assert.equal(url.searchParams.get("utm_content"), "service-0-2");
  assert.equal(url.searchParams.get("timezone"), "America/Los_Angeles");
  for (let i = 1; i <= 10; i++) assert.equal(url.searchParams.has("a" + i), false);
  assert.equal(url.searchParams.has("email"), false);
  assert.equal(url.searchParams.has("name"), false);
  const html = visit("#book/0/2");
  assert.ok(html.indexOf("even if the issue remains unresolved") < html.indexOf("<details"));
});

test("delayed provider load cannot mount an obsolete service and failures keep a help path", async () => {
  const {run, visit, main} = planner();
  const mounts = [];
  const scripts = [];
  let host;
  run("window.SERVICE_BOOST_BOOKING_ENABLED = true");
  run("document.createElement = () => ({remove(){}})");
  run("document.head = {append: script => captureScript(script)}");
  run("document.getElementById = () => currentHost()");
  // Inject only the external boundary; use the real loading and rendering code.
  run("window.Calendly = undefined");
  const first = {isConnected:true, replaceChildren(){}, querySelector(){return null;}};
  host = first;
  // Functions supplied through the VM retain access to the test's boundary state.
  run("globalThis.installHooks = (capture, current) => {globalThis.captureScript=capture;globalThis.currentHost=current}");
  run("installHooks")((script) => scripts.push(script), () => host);
  visit("#book/0/0");
  first.isConnected = false;
  host = {isConnected:true, replaceChildren(){}, querySelector(){return null;}};
  visit("#book/0/1");
  assert.equal(scripts.length, 1);
  run("window.Calendly = {initInlineWidget: options => captureMount(options)}");
  run("globalThis.installMount = callback => {globalThis.captureMount=callback}");
  run("installMount")(options => mounts.push(options));
  scripts[0].onload();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(mounts.length, 1);
  assert.equal(mounts[0].parentElement, host);
  assert.equal(new URL(mounts[0].url).searchParams.get("utm_content"), "service-0-1");
  assert.equal(new URL(mounts[0].url).searchParams.has("a3"), false);
  assert.equal(mounts[0].prefill, undefined);
  assert.match(main.innerHTML, /Open scheduling in a new tab/);

  run("window.Calendly = undefined; calendlyScript = null");
  visit("#book/3/0");
  scripts[1].onerror();
  await new Promise(resolve => setImmediate(resolve));
  assert.match(host.innerHTML, /calendar could not load/);
  assert.match(main.innerHTML, /Not sure\? Ask Kyle/);
});

test("all packages display approved prices and only the computer lesson has a duration", () => {
  const { visit, run } = planner();
  for (const [path, price] of [
    ["0/0",229], ["0/1",199], ["0/2",229],
    ["0/3",229], ["0/4",229], ["0/5",229],
    ["1/0",199], ["1/1",229], ["1/2",229], ["1/3",229], ["1/4",229], ["2/0",229], ["3/0",199],
  ]) {
    const html = visit("#services/" + path);
    assert.ok(html.includes('onclick="go(\'book\')">Choose a time</button>'));
    assert.ok(html.includes("<span>$" + price + "</span>"));
    if (path === "0/5") assert.match(html, /60-minute lesson/);
    else assert.doesNotMatch(html, /minutes?|Visit duration/);
    const booking = visit("#book/" + path);
    assert.ok(booking.includes("<strong>$" + price + "</strong>"));
    if (path === "0/5") assert.match(booking, /60-minute lesson/);
    else assert.doesNotMatch(booking, /minutes?|Visit duration/);
    assert.doesNotMatch(html, /type="checkbox"/);
    if (path === "0/2") assert.match(html, /even if the issue remains unresolved.*approval before any extra work/);
  }
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
  for (const [category, prices] of [[229,199,229,229,229,229],[199,229,229,229,229,249,249,249],[229,249],[199]].entries()) {
    const choices = visit("#services/" + category);
    assert.deepEqual([...choices.matchAll(/<span>\$(\d+)<\/span>/g)].map(m => Number(m[1])), prices);
    assert.match(choices, /Fixed-price services · Pay after your visit/);
    assert.match(visit("#fit/" + category + "/0"), /Pay after your visit · No card required/);
    assert.doesNotMatch(choices, /<input/);
  }
});

test("folder transfer has a quote path outside the fixed-price flow", () => {
  const {visit} = planner();
  const html = visit("#services/0/folder");
  assert.ok(html.includes('href="/request-help">Request a quote'));
  assert.ok(html.includes("Full-device migration, damaged drives and data recovery"));
  assert.doesNotMatch(html, /Choose a time<\/button>/);
  assert.ok(html.indexOf("Setup &amp; installation") < html.indexOf("Help &amp; learning"));
  assert.ok(html.indexOf("Help &amp; learning") < html.indexOf("Not sure what you need? Ask Kyle"));
});

test("review smart-home support carries approved terms and installations have no booking route", () => {
  const {visit, run} = planner();
  for (const index of [1, 2, 3, 4]) {
    const html = visit("#services/1/" + index);
    assert.match(html, /Choose a time<\/button>/);
    const context = visit("#book/1/" + index);
    for (const term of ["Support", "<strong>$229</strong>", "remains unresolved", "extra work and price", "subscriptions and replacement parts"]) assert.ok(context.includes(term));
    assert.match(visit("#fit/1/" + index), /Choose a time/);
  }
  for (const slug of ["doorbell-installation", "thermostat-installation", "garage-installation"]) {
    const html = visit("#services/1/" + slug);
    assert.match(html, /Unavailable for booking/);
    assert.doesNotMatch(html, /Choose a time<\/button>/);
    assert.doesNotMatch(visit("#fit/1/" + slug), /id="calendar-title"/);
  }
});

test("Wi-Fi services outside router setup have no booking route", () => {
  const {visit} = planner();
  for (const service of ["cabling", "connectivity", "extension"]) {
    const html = visit("#services/2/" + service);
    assert.match(html, /Unavailable for booking/);
    assert.doesNotMatch(html, /Choose a time<\/button>/);
    assert.doesNotMatch(visit("#fit/2/" + service), /id="calendar-title"/);
  }
});
