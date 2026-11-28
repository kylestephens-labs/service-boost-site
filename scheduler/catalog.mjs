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
  exclusions: row[5], prep: prep[category][id], attribution: 'service-' + category + '-' + id
})))`, context);
console.log(JSON.stringify(records));
