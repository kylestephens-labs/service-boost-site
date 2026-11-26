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
  const homepage = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const main = { innerHTML: homepage.match(/<main id="app">([\s\S]*?)<\/main>/)[1] };
  const ctx = vm.createContext({
    URL, window: { SERVICE_BOOST_BOOKING_ENABLED: false }, ...globals,
    location: { hash: "", origin: globals.origin || "http://localhost" },
    history: { replaceState(_state, _title, hash) { ctx.location.hash = hash; } },
    document: {
      body: { classList: { add() {}, toggle() {} } },
      querySelector: selector => selector === "#proposed-computer-services" ? null : main,
      querySelectorAll: () => [],
      getElementById: () => null,
    },
    scrollTo() {}, addEventListener() {},
  });
  const run = (code) => vm.runInContext(code, ctx);
  run(readFileSync(new URL("./visit-planner/booking.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/smart-home.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/wifi-menu.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/service-menu.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/computer-menu.js", import.meta.url), "utf8"));
  run(readFileSync(new URL("./visit-planner/visit.js", import.meta.url), "utf8"));
  return { run, main, visit: (route) => {ctx.location.hash = route; run("render()"); return main.innerHTML;} };
}

test("legacy visit links retain their selection and enter one non-sending review flow", () => {
  const {visit, run} = planner();
  for (const route of ["book", "fit", "contact", "time", "checkout", "done"]) {
    const html = visit("#" + route + "/0/1");
    assert.match(html, /Printer Setup &amp; Troubleshooting/);
    assert.match(html, /<strong>\$229<\/strong>/);
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
  assert.equal(url.pathname, "/kyle-serviceboost/book-a-visit");
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

test("all packages display approved prices and only the computer lesson booking retains its duration", () => {
  const { visit } = planner();
  for (const [path, price] of [
    ["0/0",229], ["0/1",229], ["0/2",229],
    ["0/3",229], ["0/4",229], ["0/5",229],
    ["1/1",249], ["1/2",249], ["1/3",249], ["1/4",249], ["2/0",249], ["3/0",199],
  ]) {
    const html = visit("#services/" + path);
    const needsIntake = /^1\/[123]$/.test(path);
    const next = needsIntake ? "#device/" : "#book/";
    assert.ok(html.includes('href="' + next + path + '">' + (needsIntake ? "Schedule Service" : "Schedule a visit")));
    assert.ok(html.includes("<strong>$" + price + "</strong>"));
    assert.doesNotMatch(html, /minutes?|Visit duration/);
    const booking = visit("#book/" + path);
    assert.ok(booking.includes("<strong>$" + price + "</strong>"));
    if (path === "0/5") assert.match(booking, /60-minute lesson/);
    else assert.doesNotMatch(booking, /minutes?|Visit duration/);
    assert.doesNotMatch(html, /type="checkbox"/);
    if (path === "0/2") assert.match(html, /even if it remains unresolved.*approval before extra work/);
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

test("home links to four local categories and remote help", () => {
  const {visit} = planner();
  const home = visit("#home");
  assert.equal((home.match(/class="card"/g) || []).length, 5);
  assert.deepEqual([...home.matchAll(/<a class="card" href="([^"]+)"/g)].map(match => match[1]),
    ["/computer-troubleshooting", "/smart-home", "/wifi-networking", "/phone-tablet-setup", "/remote-tech-help"]);
  assert.doesNotMatch(home, /\$\d/);
  assert.doesNotMatch(home, /Fixed-price services · Pay after your visit/);
  for (const [category, price] of [229,249,249,199].entries()) {
    const choices = visit("#services/" + category);
    assert.ok(choices.includes('Fixed price: <strong>$' + price + '</strong><small class="payment-footnote">* Payment due after your visit.</small>'));
    assert.match(choices, /class="visit-menu-inline-help"/);
    assert.match(choices, /<aside class="visit-menu-help"/);
    assert.match(visit("#fit/" + category + "/" + (category === 1 ? 1 : 0)), /Pay after your visit · No card required/);
    assert.doesNotMatch(choices, /<input/);
  }
});

test("folder transfer has a quote path outside the fixed-price flow", () => {
  const {visit} = planner();
  const closed = visit("#services/0");
  assert.doesNotMatch(closed, /Schedule a visit|design preview|list only/i);
  assert.deepEqual([...closed.matchAll(/class="visit-menu-name">([^<]+)/g)].map(match => match[1]), [
    "Set up a new computer", "Printer Setup &amp; Troubleshooting", "Install and set up software", "Back up or transfer a folder",
    "Computer troubleshooting", "Set up or troubleshoot email", "Get a personal computer lesson",
  ]);
  assert.match(closed, /id="visit-menu-card-0-folder" aria-expanded="false" aria-controls="visit-menu-scope-0-folder"/);
  const html = visit("#services/0/folder");
  assert.ok(html.includes('href="/request-help">Request a quote'));
  assert.ok(html.includes("Full-device migration, damaged drives, and data recovery are outside this service."));
  assert.match(html, /id="visit-menu-card-0-folder" aria-expanded="true" aria-controls="visit-menu-scope-0-folder"/);
  assert.doesNotMatch(html, /Schedule a visit/);
  assert.doesNotMatch(visit("#book/0/folder"), /booking-calendar|booking-widget/);
  assert.ok(html.indexOf("Setup &amp; installation") < html.indexOf("Help &amp; learning"));
  assert.ok(html.indexOf("Help &amp; learning") < html.indexOf("Not sure what you need?"));
});

test("review smart-home support carries approved terms and installations have no booking route", () => {
  const {visit, run} = planner();
  for (const [offset, slug] of ["doorbell-installation", "thermostat-installation", "garage-installation"].entries()) {
    const id = offset + 1;
    const html = visit("#services/1/" + id);
    assert.equal(visit("#services/1/" + slug), html);
    assert.match(html, /Schedule Service/);
    const intake = visit("#device/1/" + id);
    assert.ok(intake.includes('/request-help?service=smart-home&amp;installation=' + slug));
    assert.ok(intake.includes('href="#book/1/' + id + '"'));
    const booking = visit("#book/1/" + id);
    for (const term of ["Support", "<strong>$249</strong>", "remains unresolved", "extra work and price", "subscriptions and replacement parts"]) assert.ok(booking.includes(term));
    assert.doesNotMatch(visit("#fit/1/" + slug), /id="calendar-title"/);
  }
});

test("retired pairing routes never book or alias another service; support IDs stay stable", () => {
  const {visit, run} = planner();
  run("window.SERVICE_BOOST_BOOKING_ENABLED = true");
  const menu = visit("#services/1");
  assert.doesNotMatch(menu, /Pairing|pairing|\$199/);
  assert.equal((menu.match(/class="visit-menu-name"/g) || []).length, 4);
  for (const route of ["services", "book", "fit", "contact", "time", "checkout", "done", "detail"]) {
    for (const id of ["0", "00"]) {
      const html = visit("#" + route + "/1/" + id);
      assert.match(html, /That service is no longer offered/);
      assert.doesNotMatch(html, /booking-widget|id="calendar-title"|Schedule a visit/);
      assert.equal(run("location.hash"), "#services/1/retired");
    }
  }
  assert.doesNotMatch(visit("#services/1/guide"), /pairing|Smart-home device setup/);
  const names = ["Video Doorbell Support", "Smart Thermostat Support", "Smart Garage Controller Support", "Smart Hub &amp; Speaker Support"];
  run("window.SERVICE_BOOST_BOOKING_ENABLED = false");
  for (const [i, name] of names.entries()) assert.ok(visit("#book/1/" + (i + 1)).includes(name));
});

test("Wi-Fi groups show router setup and installation before support, with approved prices", () => {
  const {visit} = planner();
  const html = visit("#services/2");
  assert.deepEqual([...html.matchAll(/class="visit-menu-name">([^<]+)/g)].map(m => m[1]),
    ["New WiFi Connection Setup", "Wi-Fi Coverage &amp; Connection Help", "In-Wall Cable Running"]);
  assert.doesNotMatch(html, /\$229/);
  assert.match(html, /Fixed price: <strong>\$249<\/strong>/);
  assert.doesNotMatch(html, /Unavailable for booking/);
  assert.match(visit("#book/2/0"), /New WiFi Connection Setup[\s\S]*<strong>\$249<\/strong>/);
  assert.match(visit("#services/2/0"), /ISP repair, cable runs and whole-home coverage guarantees/);
});

test("Wi-Fi inquiry cards keep their selected service on legacy routes without opening booking", () => {
  const {visit, run} = planner();
  run("window.SERVICE_BOOST_BOOKING_ENABLED = true");
  for (const [service, detail] of [
    ["cabling", /Describe where the network cable needs to go/],
    ["connectivity", /which devices have connection problems/],
    ["extension", /where Wi-Fi is weak/],
    ["coverage", /where Wi-Fi is weak/],
  ]) {
    const html = visit("#services/2/" + service);
    const target = service === "cabling" ? service : "coverage";
    assert.match(html, detail);
    assert.ok(html.includes('href="/request-help?service=wifi&amp;network=' + target + '"'));
    assert.ok(html.includes(">Schedule Service</a>"));
    assert.doesNotMatch(html, /Schedule a visit/);
    for (const route of ["book", "fit", "contact", "time", "checkout", "done", "detail"]) {
      const legacy = visit("#" + route + "/2/" + service);
      assert.equal(legacy, html);
      assert.equal(run("location.hash"), "#services/2/" + target);
      assert.doesNotMatch(legacy, /id="calendar-title"|booking-widget/);
    }
  }
});

test("mobile setup keeps its scope, exclusion, price and legacy guide", () => {
  const {visit, run} = planner();
  const details = visit("#services/3/0");
  assert.match(details, /Phone or tablet setup/);
  assert.match(details, /Carrier activation, account recovery and data transfer/);
  assert.match(details, /href="#book\/3\/0">Schedule a visit/);
  assert.match(visit("#fit/3/0"), /<strong>\$199<\/strong>/);
  assert.equal(run("location.hash"), "#book/3/0");
  const guide = visit("#services/3/guide");
  assert.match(guide, /Find the right visit.*href="#services\/3\/0">Review this service.*href="#services\/3">Back to choices/);
});
