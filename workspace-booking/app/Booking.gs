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
// The first-party picker calls these same booking operations without Google account cookies.
function doPost(request) {
  let response;
  try {
    if (!request.postData || request.postData.length > 32000) throw Error('Invalid booking request.');
    const {method,args} = JSON.parse(request.postData.contents);
    const actions = {availability,reserve,bookingStatus,cancelVisit,moveVisit};
    if (!Array.isArray(args) || !Object.prototype.hasOwnProperty.call(actions,method)) throw Error('Invalid booking request.');
    response = {result:actions[method](...args)};
  } catch (error) {
    response = {error:'Unable to complete this request. Please retry or contact Kyle.'};
  }
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
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
// Keep the travel/protection tail on the managed calendar, outside the customer's invitation.
function attendedEnd_(item,slot) {
  if(item.kind==='remote')return slot.end;
  return slot.start+(slot.window ? 3 : 2)*HOUR;
}
function holdId_(r,slot) {
  return slot.holdId || r.holdId || eventId_('protection:'+r.id);
}
function clearHold_(cfg,r,id) {
  const hold=findEvent_(cfg,id);
  if(!hold || hold.status==='cancelled')return;
  if(hold.extendedProperties?.private?.reservation!==r.id)throw Error('Calendar protection needs review.');
  Calendar.Events.remove(cfg.calendar,id,{sendUpdates:'none'});
}
function limitNewRequests_(cfg,email) {
  const hour=Math.floor(Date.now()/HOUR);
  const key='requests:'+hour;
  const counts=JSON.parse(cfg.p.getProperty(key)||'{"total":0}');
  const address=signed_(cfg.secret,email.trim().toLowerCase());
  if(counts.total>=12 || (counts[address]||0)>=3)throw Error('Too many booking requests. Please try again later or ask Kyle.');
  counts.total++;
  counts[address]=(counts[address]||0)+1;
  cfg.p.setProperty(key,JSON.stringify(counts));
}
function protection_(cfg,r,slot,item) {
  const begin=attendedEnd_(item,slot);
  if(begin===slot.end)return;
  const id=holdId_(r,slot);
  const interval={start:{dateTime:new Date(begin).toISOString()},end:{dateTime:new Date(slot.end).toISOString()}};
  const existing=findEvent_(cfg,id);
  if(existing){
    if(existing.extendedProperties?.private?.reservation!==r.id)throw Error('Calendar protection needs review.');
    if(Date.parse(existing.start.dateTime)!==begin || Date.parse(existing.end.dateTime)!==slot.end)
      Calendar.Events.patch(interval,cfg.calendar,id,{sendUpdates:'none'});
  } else {
    Calendar.Events.insert({id,...interval,summary:'Busy',visibility:'private',transparency:'opaque',
      extendedProperties:{private:{reservation:r.id}}},cfg.calendar,{sendUpdates:'none'});
  }
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
      limitNewRequests_(cfg,d.email);
      const slot=openings_(cfg,item,start,start+1).find(s=>s.start===start);
      if(!slot)throw Error('That time is unavailable. Please choose another.');
      r={id:eventId_(key),service:id,digest,start,end:slot.end,status:'pending',created:Date.now(),shared:guests.length>0,delivery:d};
      cfg.p.setProperty(prop,JSON.stringify(r));
    }
    if(r.status==='pending' && r.attempted && !findEvent_(cfg,r.id))throw Error('Checking the previous booking request. Please contact Kyle before trying again.');
    if(r.status==='pending'){r.attempted=true;cfg.p.setProperty(prop,JSON.stringify(r));}
    return finishReservation_(cfg,r,prop);
  });
}
function finishReservation_(cfg,r,prop) {
    const {service:id,start,digest}=r,item=service_(id);
    if(['cancelled','cancelling'].includes(r.status))throw Error('This booking was cancelled.');
    const token=r.id+'.'+signed_(cfg.secret,'manage:'+r.id);
    if(r.status==='confirmed')return {token,start:r.start};
    const d=r.delivery,guests=(d.guests||'').split(',').map(x=>x.trim()).filter(Boolean);
    const base=(cfg.p.getProperty('CUSTOMER_PAGE') || ScriptApp.getService().getUrl())+'?service='+encodeURIComponent(id);
    const reference=guests.length ? 'shared.'+r.id : token;
    const links='\n\nReschedule: '+base+'&action=move#'+reference+'\nCancel: '+base+'&action=cancel#'+reference;
    const interval={start:r.start,end:r.end,window:r.end-r.start===6*HOUR};
    protection_(cfg,r,interval,item);
    let event=findEvent_(cfg,r.id);
    if(!event){
      const eventData={id:r.id,summary:(cfg.live?'':'[QA] ')+item.name+(interval.window?' · 5–8 p.m. Pacific arrival window':''),
        description:'Service Boost · $'+item.price+' · Pay after '+(item.kind==='local'?'your visit':'the session')+'.'+links,
        start:{dateTime:new Date(start).toISOString()},end:{dateTime:new Date(attendedEnd_(item,interval)).toISOString()},
        attendees:[...new Set([d.email,...guests])].map(email=>({email})),guestsCanInviteOthers:false,
        extendedProperties:{private:{service:id,requestDigest:digest,customerName:d.name,phone:d.phone||'',notes1:d.notes.slice(0,950),notes2:d.notes.slice(950,1900),notes3:d.notes.slice(1900)}}};
      if(d.address)eventData.location=d.address;
      if(item.kind==='remote')eventData.conferenceData={createRequest:{requestId:r.id,conferenceSolutionKey:{type:'hangoutsMeet'}}};
      event=Calendar.Events.insert(eventData,cfg.calendar,{sendUpdates:'all',conferenceDataVersion:1});
    }
    if(event.status==='cancelled'||event.extendedProperties?.private?.requestDigest!==digest)throw Error('Booking needs review. Please contact Kyle.');
    if(item.kind==='remote'&&!event.hangoutLink)return {token,start:r.start};
    r.status='confirmed';r.shared=guests.length>0;delete r.delivery;cfg.p.setProperty(prop,JSON.stringify(r));
    return {token,start:r.start};
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
  return {service:r.service,item:service_(r.service),shared:r.shared,start:r.start,status:r.status};
}
function cancelVisit(token){
  return locked_(()=>{
    const cfg=settings_(),{r,prop}=management_(cfg,token);
    if(r.status==='cancelled')return true;
    r.status='cancelling';cfg.p.setProperty(prop,JSON.stringify(r));
    const event=findEvent_(cfg,r.id);
    if(event&&event.status!=='cancelled'){
      if(event.extendedProperties?.private?.requestDigest!==r.digest)throw Error('Please contact Kyle.');
      Calendar.Events.remove(cfg.calendar,r.id,{sendUpdates:'all'});
    }
    if(service_(r.service).kind==='local'){
      clearHold_(cfg,r,holdId_(r,{}));
      if(r.move)clearHold_(cfg,r,r.move.holdId);
    }
    r.status='cancelled';delete r.delivery;cfg.p.setProperty(prop,JSON.stringify(r));return true;
  });
}
function moveVisit(token,start){return moveVisit_(token,start,null);}
function moveVisit_(token,start,expectedHold) {
  if (!Number.isSafeInteger(start)) throw Error('Invalid appointment time.');
  return locked_(()=>{
    const cfg=settings_(),{r,prop}=management_(cfg,token);
    if(expectedHold && (r.status!=='confirmed' || r.move?.holdId!==expectedHold))return;
    if(r.status!=='confirmed')throw Error('Please contact Kyle to change this appointment.');
    if(r.start===start && !r.move)return true;
    if(r.move && r.move.start!==start)throw Error('A previous change is still processing.');
    const event=findEvent_(cfg,r.id);
    if(!event || event.status==='cancelled' || event.extendedProperties?.private?.requestDigest!==r.digest)
      throw Error('Please contact Kyle to check this appointment.');
    if(!r.move){
      const slot=openings_(cfg,service_(r.service),start,start+1).find(s=>s.start===start);
      if(!slot)throw Error('That time is unavailable.');
      r.move={...slot,holdId:Utilities.getUuid().replace(/-/g,'')};
      cfg.p.setProperty(prop,JSON.stringify(r));
    }
    const item=service_(r.service);
    protection_(cfg,r,r.move,item);
    if(Date.parse(event.start.dateTime)!==start){
      Calendar.Events.patch({summary:(cfg.live?'':'[QA] ')+item.name+(r.move.window?' · 5–8 p.m. Pacific arrival window':''),start:{dateTime:new Date(start).toISOString()},end:{dateTime:new Date(attendedEnd_(item,r.move)).toISOString()}},
        cfg.calendar,r.id,{sendUpdates:'all'});
    }
    if(item.kind==='local')clearHold_(cfg,r,holdId_(r,{}));
    r.start=start;r.end=r.move.end;r.holdId=r.move.holdId;delete r.move;
    cfg.p.setProperty(prop,JSON.stringify(r));return true;
  });
}

// Install a time-driven trigger on this private function in each enabled deployment.
function recoverBookings_() {
  const cfg=settings_(),entries=Object.entries(cfg.p.getProperties());
  let failures=0;
  for(const [key,value] of entries) {
    if(key.startsWith('requests:') && Number(key.slice(9)) < Math.floor(Date.now()/HOUR)-1)cfg.p.deleteProperty(key);
    if(!key.startsWith('reservation:'))continue;
    const snapshot=JSON.parse(value);
    try {
      if(snapshot.move && snapshot.status==='confirmed'){
        moveVisit_(snapshot.id+'.'+signed_(cfg.secret,'manage:'+snapshot.id),snapshot.move.start,snapshot.move.holdId);
      }
      if(snapshot.status==='cancelling')cancelVisit(snapshot.id+'.'+signed_(cfg.secret,'manage:'+snapshot.id));
      if(snapshot.status==='pending')locked_(()=>{
      const r=JSON.parse(cfg.p.getProperty(key)||'null');
      if(!r || r.status!=='pending')return;
      // An insert may have timed out after Google committed. Reconcile by stable ID.
      const existing=findEvent_(cfg,r.id);
      if(existing)finishReservation_(cfg,r,key);
      else if(Date.now()-(r.created||Date.now())>15*60000){
        if(service_(r.service).kind==='local')clearHold_(cfg,r,holdId_(r,{}));
        r.status='cancelled';delete r.delivery;cfg.p.setProperty(key,JSON.stringify(r));
      }
      });
    } catch {
      // Leave the durable operation queued for the next run. Never log booking details.
      failures++;
    }
  }
  if(failures)throw Error('Booking recovery has unfinished operations.');
}
