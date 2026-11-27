'use strict';
const el = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
let service = params.get('service');
let token = location.hash.slice(1);
let slots = [], selected = 0, day = '', month, current, item;
let operationKey = crypto.randomUUID();
const zone = el('zone');
const zones = new Set(['America/Los_Angeles', Intl.DateTimeFormat().resolvedOptions().timeZone,
  ...(Intl.supportedValuesOf?.('timeZone') || ['America/New_York','America/Chicago','Europe/London','UTC'])]);
for (const name of zones) zone.add(new Option(name.replaceAll('_',' '),name));
zone.value = 'America/Los_Angeles';
const format = (stamp, options) => new Intl.DateTimeFormat('en-US',{timeZone:zone.value,...options}).format(stamp * 1000);
function dateKey(stamp) {
  const parts = new Intl.DateTimeFormat('en-US',{timeZone:zone.value,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(stamp*1000);
  const val = type => parts.find(p => p.type===type).value;
  return [val('year'),val('month'),val('day')].join('-');
}
function display(id) {
  for (const section of ['calendar','intake','receipt']) el(section).hidden = section !== id;
  el(id).querySelector('h2')?.focus({preventScroll:true});
}
function button(text, action) {
  const b = document.createElement('button');
  b.type='button'; b.textContent=text; b.onclick=action; return b;
}
function draw() {
  const prefix = month.toISOString().slice(0,7);
  const first = new Date(prefix+'-01T12:00:00Z');
  const available = new Set(slots.map(dateKey));
  el('month').textContent = first.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
  el('prev').disabled = !slots.length || prefix<=dateKey(slots[0]).slice(0,7);
  el('next').disabled = !slots.length || prefix>=dateKey(slots.at(-1)).slice(0,7);
  const grid=el('days');grid.replaceChildren();
  for (const label of ['Su','Mo','Tu','We','Th','Fr','Sa']) {
    const span=document.createElement('span');span.textContent=label;grid.append(span);
  }
  for (let i=0;i<first.getUTCDay();i++) grid.append(document.createElement('span'));
  const date=new Date(first);
  while(date.getUTCMonth()===first.getUTCMonth()) {
    const key=date.toISOString().slice(0,10), number=date.getUTCDate();
    const node=available.has(key)?button(number,()=>{day=key;selected=0;draw();el('times').querySelector('button')?.focus();}):document.createElement('span');
    node.textContent=number;
    if(node.tagName==='BUTTON') {
      node.setAttribute('aria-label',date.toLocaleDateString('en-US',{dateStyle:'full',timeZone:'UTC'}));
      node.setAttribute('aria-pressed',String(day===key));
    }
    grid.append(node);date.setUTCDate(number+1);
  }
  const times=el('times');times.replaceChildren();
  if(day || !slots.length) {
    const h=document.createElement('h3');h.textContent=day?'Choose a time':'No times available';times.append(h);
  }
  for(const stamp of slots.filter(s=>dateKey(s)===day)) {
    const b=button(format(stamp,{hour:'numeric',minute:'2-digit'}),()=>{
      selected=stamp;operationKey=crypto.randomUUID();draw();el('continue').focus();
    });
    b.setAttribute('aria-pressed',String(stamp===selected));times.append(b);
  }
  el('continue').hidden=!selected;
  el('chosen').textContent=selected?format(selected,{dateStyle:'full',timeStyle:'short'}):'';
}
function showCalendar() {
  const ref=slots[0] || Date.now()/1000;
  month=new Date(dateKey(ref).slice(0,7)+'-01T12:00:00Z');
  selected=0;day='';display('calendar');draw();
}
function showReceipt() {
  display('receipt');el('chosen').textContent=format(current.start,{dateStyle:'full',timeStyle:'short'});
  el('outcome').textContent=current.active?'Preview appointment confirmed':'Preview appointment cancelled';
  el('delivery').textContent=current.active?'Your confirmation is in the simulated email outbox. Keep this page link to manage the preview appointment.':'The time is available again.';
  if(current.active && current.conference) el('delivery').textContent+=' Video meeting assigned (simulated).';
  if(!current.delivered) el('delivery').textContent='Your request is saved. Confirmation delivery is pending.';
  el('cancel').hidden=el('move').hidden=!current.active;el('confirmCancel').hidden=true;
}
async function load() {
  const r=await fetch('/api/availability?'+new URLSearchParams({service:service||''}),{headers:{'X-Manage':token}});
  const data=await r.json();if(!r.ok)throw Error(data.error);
  ({item,slots,current}=data);service=item.id;
  const remote=item.kind==='remote';
  el('service').textContent=item.name;el('mode').textContent=remote?'Remote Tech Help · Google Meet':'In-home service';
  el('price').textContent='$'+item.price+(remote?' · Up to 45 minutes':'')+' · Pay after '+(remote?'the session':'your visit');
  el('terms').textContent=item.terms;el('scope').hidden=remote;
  el('limits').textContent=[item.exclusions,item.prep].filter(Boolean).join(' ');
  el('when').textContent=remote?'Choose a date and time':'Choose an arrival time';
  el('question').textContent=remote?'What would you like help fixing or improving?':'Anything else Kyle should know? (optional)';
  el('local').hidden=remote;el('guests').hidden=!remote;
  for(const input of el('local').querySelectorAll('input')) input.required=!remote;
  el('intake').elements.notes.required=remote;
  if(current)showReceipt();else showCalendar();
}
let busy=false;
async function submit(action) {
  if(busy)return;busy=true;el('error').textContent='';
  try {
    const body={service,action,start:selected||current?.start,key:operationKey,details:Object.fromEntries(new FormData(el('intake')))};
    const response=await fetch('/api/booking',{method:'POST',headers:{'Content-Type':'application/json','X-Manage':token},body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok){
      if(response.status===409){await load();showCalendar();}
      throw Error(data.error);
    }
    token=data.token;history.replaceState(null,'','#'+token);operationKey=crypto.randomUUID();await load();
  } catch(e){el('error').textContent=e.message;} finally{busy=false;}
}
for(const [id,step] of [['prev',-1],['next',1]])el(id).onclick=()=>{
  month.setUTCMonth(month.getUTCMonth()+step);selected=0;day='';draw();
};
zone.onchange=showCalendar;
el('continue').onclick=()=>token?submit('move'):display('intake');
el('intake').onsubmit=e=>{e.preventDefault();submit('book');};
el('change').onclick=()=>{display('calendar');draw();};
el('move').onclick=showCalendar;
el('cancel').onclick=()=>{el('confirmCancel').hidden=false;el('confirmCancel').focus();};
el('confirmCancel').onclick=()=>submit('cancel');
load().catch(e=>{el('error').textContent=e.message;});
