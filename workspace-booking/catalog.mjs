// Read the same trusted catalog and route guards as the shipped local booking page.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const main = {innerHTML: ''};
const context = vm.createContext({
  document: {querySelector: () => main, getElementById: () => null, body: {classList: {toggle() {}}}},
  location: {hash: ''}, scrollTo() {}, addEventListener() {}
});
for (const script of ['smart-home', 'visit']) {
  vm.runInContext(readFileSync(new URL('../visit-planner/' + script + '.js', import.meta.url), 'utf8'), context);
}
const records = vm.runInContext(`tasks.flatMap((rows, category) => rows.flatMap((row, id) => ({
  id: category + '/' + id, kind: 'local', name: row[0], price: row[2], terms: row[3],
  exclusions: row[5], prep: [row[6],prep[category][id]].filter(Boolean).join(' '), included: row[4], cities: cities.join(', '), attribution: 'service-' + category + '-' + id
})))`, context);
// Preserve existing IDs for appointment management links.
records.push(...[
  {
    "id": "remote-fix",
    "kind": "remote",
    "name": "Fix a problem",
    "price": 99.99,
    "terms": "We’ll first check whether I can help remotely. If I can’t fix the issue or explain what’s wrong and give you a clear next step, you won’t be charged."
  },
  {
    "id": "remote-improve",
    "kind": "remote",
    "name": "Improve your setup",
    "price": 99.99,
    "terms": "If I can’t make the improvement we agree on or give you a useful plan, you won’t be charged."
  },
  {
    "id": "remote-help",
    "kind": "remote",
    "name": "Remote Tech Help",
    "price": 99.99,
    "terms": "We’ll first check whether I can help remotely. If I can’t fix the issue or explain what’s wrong and give you a clear next step, you won’t be charged. If I can’t make the improvement we agree on or give you a useful plan, you won’t be charged. I’ll ask your permission before screen sharing or using temporary access."
  }
]);
console.log('const CATALOG = '+JSON.stringify(Object.fromEntries(records.map(r=>[r.id,r])),null,2)+';');
