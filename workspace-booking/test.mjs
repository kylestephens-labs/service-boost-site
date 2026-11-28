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
test('evening invitation ends at 8 p.m.; private busy tail runs through 11',()=>{
  const start=Date.parse('2026-12-04T01:00:00Z'),end=start+6*3600000;
  const ctx=runtime();
  const holds=[];
  ctx.Calendar.Events={get(){throw Error('Not found')},insert(event,calendar,options){holds.push({event,options})}};
  ctx.Utilities.computeDigest=()=>[32];ctx.Utilities.DigestAlgorithm={SHA_256:'sha256'};
  const publicEnd=run(`const slot={start:${start},end:${end},window:true};protection_({calendar:'qa'},{id:'qa'},slot,{kind:'local'});attendedEnd_({kind:'local'},slot)`,ctx);
  assert.equal(publicEnd,start+3*3600000);
  assert.equal(Date.parse(holds[0].event.start.dateTime),publicEnd);
  assert.equal(Date.parse(holds[0].event.end.dateTime),end);
  assert.equal(holds[0].event.attendees,undefined);
  assert.equal(holds[0].options.sendUpdates,'none');
});

function bookingFixture() {
  const context=runtime({qa:{busy:[]}});
  const events=new Map(),values=new Map(),messages=[];
  const properties={
    getProperty:k=>values.get(k),setProperty:(k,v)=>values.set(k,v),
    deleteProperty:k=>values.delete(k),getProperties:()=>Object.fromEntries(values)
  };
  Object.assign(context,{properties,ScriptApp:{getService:()=>({getUrl:()=>'https://example.invalid/exec'})},
    MailApp:{sendEmail:(...args)=>messages.push(args)}});
  context.Calendar.Events={
    get:(_,id)=>{if(!events.has(id))throw Error('Not found');return events.get(id)},
    insert:e=>{if(events.has(e.id))throw Error('Duplicate ID');events.set(e.id,e);return e},
    patch:(patch,_,id)=>Object.assign(events.get(id),patch),remove:(_,id)=>events.delete(id)
  };
  context.Utilities.getUuid=()=> 'b'.repeat(32);
  run("settings_=()=>({p:properties,calendar:'qa',conflicts:['qa'],secret:'qa',live:true});locked_=fn=>fn();signed_=(s,v)=>v.replace(/[^a-z0-9]/gi,'');eventId_=k=>k.startsWith('protection')?'c'.repeat(64):'a'.repeat(64);",context);
  return {context,events,values,messages,call:(expr)=>vm.runInContext(expr,context)};
}
test('remote Meet delay is retried durably without duplicating the reservation',()=>{
  const f=bookingFixture();
  const start=f.call("candidates_({kind:'remote'},Date.now(),Date.now()+7*86400000,Date.now())[0].start");
  const request=`reserve('remote-fix',${start},{name:'QA',email:'qa@example.invalid',notes:'example'},'12345678-1234-1234-1234-123456789012')`;
  const pending=f.call(request);assert.equal(f.call('bookingStatus('+JSON.stringify(pending.token)+')').status,'pending');
  assert.equal(f.events.size,1);
  [...f.events.values()][0].hangoutLink='https://example.invalid/meet';
  f.call('recoverBookings_()');
  const result=f.call(request);
  assert.equal(f.messages.length,0);assert.match([...f.events.values()][0].description,/Reschedule: .*action=move#/);assert.equal(f.events.size,1);
  f.call('cancelVisit('+JSON.stringify(result.token)+')');
  assert.equal(f.events.size,0);
});
test('failed customer-event move protects both slots until the same move completes',()=>{
  const f=bookingFixture();
  const slots=f.call("candidates_({kind:'local'},Date.now(),Date.now()+8*86400000,Date.now())");
  const result=f.call(`reserve('0/2',${slots[0].start},{name:'QA',email:'qa@example.invalid',address:'test',phone:'test'},'12345678-1234-1234-1234-123456789012')`);
  const move=`moveVisit(${JSON.stringify(result.token)},${slots.at(-1).start})`;
  const patch=f.context.Calendar.Events.patch;
  f.context.Calendar.Events.patch=()=>{throw Error('temporary failure')};
  assert.throws(()=>f.call(move),/temporary/);
  assert.equal(f.events.size,3);
  f.context.Calendar.Events.patch=patch;f.call(move);
  assert.equal(f.events.size,2);
  f.call('cancelVisit('+JSON.stringify(result.token)+')');
  assert.equal(f.events.size,0);
});
test('interrupted cancellation releases the remaining hold during recovery',()=>{
  const f=bookingFixture();
  const start=f.call("candidates_({kind:'local'},Date.now(),Date.now()+8*86400000,Date.now())[0].start");
  const result=f.call(`reserve('0/2',${start},{name:'QA',email:'qa@example.invalid',address:'test',phone:'test'},'12345678-1234-1234-1234-123456789012')`);
  const remove=f.context.Calendar.Events.remove;
  f.context.Calendar.Events.remove=(calendar,id)=>{if(id.startsWith('c'))throw Error('timeout');remove(calendar,id)};
  assert.throws(()=>f.call('cancelVisit('+JSON.stringify(result.token)+')'),/timeout/);
  assert.equal(f.events.size,1);
  f.context.Calendar.Events.remove=remove;f.call('recoverBookings_()');assert.equal(f.events.size,0);
});
test('first-party transport only dispatches customer booking methods',()=>{
  const f=bookingFixture();
  f.context.ContentService={MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})};
  const call=(method,args)=>f.call('doPost('+JSON.stringify({postData:{length:200,contents:JSON.stringify({method,args})}})+')');
  assert.ok(call('availability',['0/2',new Date().toISOString().slice(0,7)]).result.item.price);
  for(const method of ['settings_','recoverBookings_','constructor','toString'])assert.ok(call(method,[]).error);
});
