// Apps Script server. Calendar identifiers and the signing secret are deployment properties.
const PACIFIC = 'America/Los_Angeles';
const HOUR = 3600000;

function settings_() {
  const p = PropertiesService.getScriptProperties();
  const calendar = p.getProperty('BOOKING_CALENDAR');
  const conflicts = JSON.parse(p.getProperty('CONFLICT_CALENDARS') || '[]');
  const secret = p.getProperty('SIGNING_SECRET');
  const recipient = p.getProperty('QA_RECIPIENT');
  const live = p.getProperty('RELEASE_MODE') === 'live';
  if (!calendar || !Array.isArray(conflicts) || !conflicts.length || !secret || secret.length < 32 || (!live && !recipient)) {
    throw Error('Booking is unavailable. Please contact Kyle.');
  }
  return {p, calendar, conflicts: [...new Set([calendar,...conflicts])], secret, recipient, live};
}
function service_(id) {
  if (!Object.prototype.hasOwnProperty.call(CATALOG,id)) throw Error('Please choose a service at serviceboost.co.');
  return CATALOG[id];
}
function doGet(request) {
  const view = HtmlService.createTemplateFromFile('Picker');
  const id = request.parameter.service || '';
  view.serviceId = Object.prototype.hasOwnProperty.call(CATALOG,id) ? id : '';
  return view.evaluate().setTitle('Schedule with Kyle | Service Boost').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function include_(name) { return HtmlService.createHtmlOutputFromFile(name).getContent(); }
function signed_(secret,value) {
  return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value,secret)).replace(/=+$/,'');
}
function validKey_(value) {
  if (typeof value !== 'string' || !/^[a-z0-9-]{36}$/i.test(value)) throw Error('Invalid booking request.');
}
function locked_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(15000)) throw Error('Please retry your request.');
  try {return fn();} finally {lock.releaseLock();}
}
function candidates_(item,first,last,now) {
  const slots = [];
  for (let t=Math.ceil(Math.max(first,now+4*HOUR)/(HOUR/2))*(HOUR/2);t<Math.min(last,now+120*24*HOUR);t+=HOUR/2) {
    const [day,clock] = Utilities.formatDate(new Date(t),PACIFIC,'EEE HH:mm').split(' ');
    const h=Number(clock.slice(0,2)), half=clock.endsWith(':30');
    const evening = day==='Mon'||day==='Thu';
    if (day==='Wed') continue;
    const remote = item.kind==='remote';
    if (remote) {
      if (evening ? (h<17||h>20||(h===20&&half)) : ![8,11,14,17].some(s=>h===s||(h===s+1&&!half))) continue;
    } else if (half || (evening ? h!==17 : ![8,11,14,17].includes(h))) continue;
    slots.push({start:t,end:t+(remote?1:evening?6:3)*HOUR,window:!remote&&evening});
  }
  return slots;
}
function openings_(cfg,item,first,last) {
  const choices=candidates_(item,first,last,Date.now());
  if (!choices.length) return [];
  const data=Calendar.Freebusy.query({timeMin:new Date(choices[0].start).toISOString(),
    timeMax:new Date(choices[choices.length-1].end).toISOString(),items:cfg.conflicts.map(id=>({id}))}).calendars;
  const busy=[];
  for (const id of cfg.conflicts) {
    if (!data || !data[id] || data[id].errors?.length || !Array.isArray(data[id].busy)) throw Error('Unable to check calendar availability.');
    for (const block of data[id].busy) busy.push([Date.parse(block.start),Date.parse(block.end)]);
  }
  for (const [key,value] of Object.entries(cfg.p.getProperties())) {
    if (key.startsWith('reservation:')) {
      const r=JSON.parse(value);
      if (r.status!=='cancelled') {busy.push([r.start,r.end]);if(r.move)busy.push([r.move.start,r.move.end]);}
    }
  }
  return choices.filter(s=>!busy.some(([a,b])=>a<s.end&&s.start<b));
}
function availability(id,month) {
  const item=service_(id);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw Error('Invalid month.');
  const start=Date.parse(month+'-01T00:00:00Z');
  const next=new Date(start);next.setUTCMonth(next.getUTCMonth()+1);
  return {item,slots:openings_(settings_(),item,start,next.getTime()+24*HOUR)
    .filter(s=>Utilities.formatDate(new Date(s.start),PACIFIC,'yyyy-MM')===month)};
}
function details_(item,input) {
  const fields = item.kind==='local'?['name','email','phone','address','notes']:['name','email','notes','guests'];
  const d={};
  for(const f of fields){
    const v=input[f]||'';
    if(typeof v!=='string'||v.length>(f==='notes'?2000:300))throw Error('Please check your details.');
    d[f]=v.trim();
  }
  if(!d.name || !/^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/.test(d.email) || (item.kind==='remote'?!d.notes:!d.address||!d.phone))throw Error('Complete the required fields.');
  return d;
}
function eventId_(key) {return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,key).map(n=>('0'+((n+256)%256).toString(16)).slice(-2)).join('');}
function findEvent_(cfg,id) {
  try{return Calendar.Events.get(cfg.calendar,id);}
  catch(e){if (/not found|Resource has been deleted/i.test(String(e))) return null;throw e;}
}
function reserve(id,start,input,key) {
  validKey_(key);
  if (!Number.isSafeInteger(start)) throw Error('Invalid appointment time.');
  const cfg=settings_(),item=service_(id),d=details_(item,input);
  const guests=(d.guests||'').split(',').map(x=>x.trim()).filter(Boolean);
  if(guests.length>10||guests.some(e=>!/^\S+@[^\s@,]+\.[^\s@,]+$/.test(e)))throw Error('Check the guest email addresses.');
  if(!cfg.live && (d.email!==cfg.recipient||guests.length))throw Error('Only the designated test recipient is enabled.');
  const prop='reservation:'+eventId_(key);
  const digest=signed_(cfg.secret,JSON.stringify([id,start,d]));
  return locked_(()=>{
    let r=JSON.parse(cfg.p.getProperty(prop)||'null');
    if(r && r.digest!==digest)throw Error('Request changed. Choose a time again.');
    if(!r){
      const slot=openings_(cfg,item,start,start+1).find(s=>s.start===start);
      if(!slot)throw Error('That time is unavailable. Please choose another.');
      r={id:eventId_(key),service:id,digest,start,end:slot.end,status:'pending'};
      cfg.p.setProperty(prop,JSON.stringify(r));
    }
    if(r.status==='cancelled')throw Error('This booking was cancelled.');
    const token=r.id+'.'+signed_(cfg.secret,'manage:'+r.id);
    if(r.status==='confirmed')return {token,start:r.start};
    let event=findEvent_(cfg,r.id);
    if(!event){
      const eventData={id:r.id,summary:(cfg.live?'':'[QA] ')+item.name,
        description:'Service Boost · $'+item.price+' · Pay after '+(item.kind==='local'?'your visit':'the session')+'.',
        start:{dateTime:new Date(start).toISOString()},end:{dateTime:new Date(r.end).toISOString()},
        attendees:[...new Set([d.email,...guests])].map(email=>({email})),guestsCanInviteOthers:false,
        extendedProperties:{private:{service:id,requestDigest:digest,customerName:d.name,phone:d.phone||'',notes1:d.notes.slice(0,950),notes2:d.notes.slice(950,1900),notes3:d.notes.slice(1900)}}};
      if(d.address)eventData.location=d.address;
      if(item.kind==='remote')eventData.conferenceData={createRequest:{requestId:r.id,conferenceSolutionKey:{type:'hangoutsMeet'}}};
      event=Calendar.Events.insert(eventData,cfg.calendar,{sendUpdates:'all',conferenceDataVersion:1});
    }
    if(event.status==='cancelled'||event.extendedProperties?.private?.requestDigest!==digest)throw Error('Booking needs review. Please contact Kyle.');
    if(item.kind==='remote'&&!event.hangoutLink)throw Error('Google Meet is being prepared. Retry the same request.');
    const manage=ScriptApp.getService().getUrl()+'?service='+encodeURIComponent(id)+'#'+token;
    MailApp.sendEmail(d.email,'Manage your Service Boost appointment','Use your private link to manage this appointment: '+manage);
    r.status='confirmed';cfg.p.setProperty(prop,JSON.stringify(r));
    return {token,start:r.start};
  });
}
function management_(cfg,token){
  const [id,sig]=String(token).split('.');
  if(!/^[a-f0-9]{64}$/.test(id)||sig!==signed_(cfg.secret,'manage:'+id))throw Error('Invalid management link.');
  const prop='reservation:'+id,r=JSON.parse(cfg.p.getProperty(prop)||'null');
  if(!r)throw Error('Booking not found.');
  return {r,prop};
}
function bookingStatus(token){
  const {r}=management_(settings_(),token);
  return {service:r.service,start:r.start,status:r.status};
}
function cancelVisit(token){
  return locked_(()=>{
    const cfg=settings_(),{r,prop}=management_(cfg,token);
    if(r.status==='cancelled')return true;
    const event=findEvent_(cfg,r.id);
    if(event&&event.status!=='cancelled'){
      if(event.extendedProperties?.private?.requestDigest!==r.digest)throw Error('Please contact Kyle.');
      Calendar.Events.remove(cfg.calendar,r.id,{sendUpdates:'all'});
    }
    r.status='cancelled';cfg.p.setProperty(prop,JSON.stringify(r));return true;
  });
}
function moveVisit(token,start) {
  if (!Number.isSafeInteger(start)) throw Error('Invalid appointment time.');
  return locked_(()=>{
    const cfg=settings_(),{r,prop}=management_(cfg,token);
    if(r.status!=='confirmed')throw Error('Please contact Kyle to change this appointment.');
    if(r.start===start && !r.move)return true;
    if(r.move && r.move.start!==start)throw Error('A previous change is still processing.');
    const event=findEvent_(cfg,r.id);
    if(!event || event.status==='cancelled' || event.extendedProperties?.private?.requestDigest!==r.digest)
      throw Error('Please contact Kyle to check this appointment.');
    if(!r.move){
      const slot=openings_(cfg,service_(r.service),start,start+1).find(s=>s.start===start);
      if(!slot)throw Error('That time is unavailable.');
      r.move={start,end:slot.end};
      cfg.p.setProperty(prop,JSON.stringify(r));
    }
    if(Date.parse(event.start.dateTime)!==start){
      Calendar.Events.patch({start:{dateTime:new Date(start).toISOString()},end:{dateTime:new Date(r.move.end).toISOString()}},
        cfg.calendar,r.id,{sendUpdates:'all'});
    }
    r.start=start;r.end=r.move.end;delete r.move;
    cfg.p.setProperty(prop,JSON.stringify(r));return true;
  });
}
