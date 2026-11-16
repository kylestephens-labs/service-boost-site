import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

// Exercise route guards with no network, storage, SMTP or payment adapter.
function planner() {
  const main = { innerHTML: "" };
  const ctx = vm.createContext({
    location: { hash: "" },
    history: { replaceState(_state, _title, hash) { ctx.location.hash = hash; } },
    document: {
      body: { classList: { add() {} } },
      querySelector: () => main,
      querySelectorAll: () => [],
    },
    addEventListener() {},
  });
  const run = (code) => vm.runInContext(code, ctx);
  run(readFileSync(new URL("./visit-planner/visit.js", import.meta.url), "utf8"));
  return { run, main, visit: (route) => {ctx.location.hash = route; run("render()"); return main.innerHTML;} };
}

test("a preference requires an eligible setup and a visit address matching the ZIP", () => {
  const {run,visit} = planner();
  assert.match(visit("#time/0/1"), /Check your setup/);
  assert.equal(run("location.hash"), "#fit/0/1");
  run("city='94596'; fit='Yes'");
  assert.match(visit("#time/0/1"), /Contact &amp; address/);
  run("Object.assign(contact,{person:'Avery Example',email:'avery@example.invalid',street:'100 Example Lane',town:'Concord'})");
  assert.match(visit("#checkout/0/1"), /Contact &amp; address/);
  run("contact.town='Walnut Creek'");
  assert.match(visit("#checkout/0/1"), /Choose a preferred arrival window/);
  assert.equal(run("location.hash"), "#time/0/1");
});

test("review adds only selected extras and ZIP edits invalidate timing", () => {
  const {run,visit} = planner();
  visit("#services/0/1");
  run("city='94596';fit='Yes';Object.assign(contact,{person:'Avery Example',email:'avery@example.invalid',street:'100 Example Lane',town:'Walnut Creek'});useFlexibleTime()");
  assert.match(visit("#checkout/0/1"), /Full illustrative price · \$89/);
  run("extra=true");
  const review=visit("#checkout/0/1");
  assert.match(review,/Full illustrative price · \$114/);
  assert.match(review,/Payment is due after the visit/);
  run("zipChanged({value:'00000'})");
  assert.equal(run("slot"),"");
  assert.match(visit("#checkout/0/1"),/Check your setup/);
});
