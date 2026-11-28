import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const file=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const catalog=file('app/Catalog.gs');
const server=file('app/Booking.gs');
const clock=new Intl.DateTimeFormat('en-US',{timeZone:'America/Los_Angeles',weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function runtime(calendars={}) {
  return vm.createContext({Utilities:{formatDate:date=>clock.format(date).replace(',','')},
    Calendar:{Freebusy:{query:()=>({calendars})}}});
}
function run(code,context=runtime()){
  return vm.runInContext(catalog+'\n'+server+'\n'+code,context);
}
test('hosted catalog matches the shipping menu including inquiry exclusions',()=>{
  assert.equal(execFileSync('node',[new URL('catalog.mjs',import.meta.url).pathname],{encoding:'utf8'}),catalog);
  assert.equal(run("service_('0/2').price"),229);
  assert.equal(run("service_('remote-improve').price"),99.99);
  assert.throws(()=>run("service_('1/0')"));
});
test('both Pacific offsets have a single protected evening and no Wednesday arrival',()=>{
  for(const [date,hour] of [['2027-03-08',1],['2027-03-15',0]]) {
    const start=Date.parse(date+'T08:00Z');
    const slots=run(`candidates_({kind:'local'},${start},${start+86400000},${start-86400000})`);
    assert.equal(slots.length,1);assert.equal(new Date(slots[0].start).getUTCHours(),hour);
    assert.equal(slots[0].end-slots[0].start,6*3600000);
  }
  assert.equal(run("candidates_({kind:'local'},Date.parse('2027-03-10T08:00Z'),Date.parse('2027-03-11T07:00Z'),Date.parse('2027-03-01')).length"),0);
});
test('absent and failed calendars close availability',()=>{
  const now=Date.now(), start=now+86400000;
  for (const results of [{},{main:{errors:[{reason:'notFound'}]}}]) {
    assert.throws(()=>run(`openings_({conflicts:['main'],p:{getProperties:()=>({})}},{kind:'local'},${start},${start+7*86400000})`,runtime(results)),/Unable to check/);
  }
});
test('one calendar exposes standard arrivals and evenings together',()=>{
  const start=Date.parse('2027-03-15T07:00Z');
  const slots=run(`candidates_({kind:'local'},${start},${start+7*86400000},${start-86400000})`);
  assert.equal(slots.length,18);assert.equal(slots.filter(s=>s.window).length,2);
});
