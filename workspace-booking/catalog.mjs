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
const remote = readFileSync(new URL('../service-pages/remote-tech-help.html',import.meta.url),'utf8');
for (const [index,match] of [...remote.matchAll(/<h2>([^<]+)<\/h2>.*?<p><strong>\$\$(\d+\.\d+) (.*?)<\/strong> (.*?)<\/p>/gs)].entries()) {
  const id = ['remote-fix','remote-improve'][index];
  records.push({id,kind:'remote',name:match[1],price:Number(match[2]),terms:match[4]});
}
if(records.filter(r=>r.kind==='remote').length!==2)throw Error('Review remote service catalog.');
console.log('const CATALOG = '+JSON.stringify(Object.fromEntries(records.map(r=>[r.id,r])),null,2)+';');
