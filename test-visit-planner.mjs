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
    assert.doesNotMatch(html, /<iframe|booking-widget|href="https:\/\/calendar\.google|Step \d|Send visit request/);
    if (route !== "book") assert.equal(run("location.hash"), "#book/0/1");
  }
  for (const route of ["#book/0/999", "#book/1/doorbell-installation", "#book/2/cabling", "#book/0/folder", "#book/-1/0", "#book/0/NaN"]) {
    assert.doesNotMatch(visit(route), /id="calendar-title"|booking-widget/);
  }
});

test("eligible visits offer distinct Google schedules with the selected service", () => {
  const {visit, run} = planner();
  run("window.SERVICE_BOOST_BOOKING_ENABLED = true");
  const html = visit("#book/0/2");
  const links = [...html.matchAll(/href="(https:[^"]+)"/g)].map(match => new URL(match[1].replaceAll("&amp;", "&")));
  assert.equal(links.length, 2);
  assert.notEqual(links[0].pathname, links[1].pathname);
  for (const url of links) {
    assert.equal(url.origin, "https://calendar.google.com");
    assert.match(url.pathname, /^\/calendar\/appointments\/schedules\/AcZ/);
    assert.equal(url.searchParams.get("utm_content"), "service-0-2");
  }
  assert.match(html, /Monday or Thursday evening/);
  assert.match(html, /Not sure\? Ask Kyle/);
  assert.ok(html.indexOf("even if the issue remains unresolved") < html.indexOf("<details"));
  for (const route of ["#book/0/folder", "#book/1/0"])
    assert.doesNotMatch(visit(route), /calendar\.google\.com/);
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
    const target = needsIntake ? "1/" + (Number(path.slice(-1)) + 4) : path;
    assert.ok(html.includes('href="' + "#book/" + target + '">' + (needsIntake ? "Schedule Service" : "Schedule a visit")));
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

test("device bookings keep installation checks and preserve existing support links", () => {
  const {visit, run} = planner();
  for (const [offset, slug] of ["doorbell-installation", "thermostat-installation", "garage-installation"].entries()) {
    const id = offset + 1;
    const html = visit("#services/1/" + id);
    assert.equal(visit("#services/1/" + slug), html);
    assert.match(html, /Schedule Service/);
    const intake = visit("#device/1/" + id);
    assert.equal(intake, visit("#book/1/" + (id+4)));
    assert.match(intake,/checks compatibility and scope before installation/);
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

test("Wi-Fi legacy names open their correct calendar service", () => {
  const {visit} = planner();
  for (const [alias,id] of [["coverage",1],["extension",1],["connectivity",1],["cabling",2]]) {
    assert.equal(visit("#book/2/"+alias),visit("#book/2/"+id));
    assert.match(visit("#services/2/"+alias),new RegExp('href="#book/2/'+id+'"'));
    assert.match(visit("#book/2/"+id),/Review preview: scheduling is disabled/);
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
