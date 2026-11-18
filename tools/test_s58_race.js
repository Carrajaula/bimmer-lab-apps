'use strict';
const assert=require('assert'),path=require('path'),fs=require('fs'),Module=require('module');
const root=path.resolve(__dirname,'..'),load=Module._load;
Module._load=function(r,p,m){return load.call(this,r==='./kit/pack'?path.join(root,'kit/runtime/pack'):r,p,m);};
const Layouts=require('../shared/layouts');Module._load=load;
const L=require('../apps/cluster_themes/hud/layouts/s58_race.json');
Layouts.prototype._validate.call({size:[1920,720]},L,'s58_race');
const sensors=require('../shared/sensors'),visible=require('../shared/visible');
assert(L.slots.every(s=>sensors.get(s.default)));
assert.deepEqual(L.slots.map(s=>s.default),['intake','torque','boost','fuel','coolant','oil']);
assert.equal(visible.check(L.widgets.filter(w=>w.id!=='bg'&&w.id!=='revs'),'panel').length,0,'readouts stay in the library visibility model');
const arc=L.widgets.find(w=>w.id==='revs');
assert.equal(arc.type,'revarc','reuse Rally RPM renderer');
assert(arc.raceProfile[2]>=110,'entire band clears the driver camera');
assert(!L.widgets.some(w=>w.type==='gmeter'||/g_best|position/.test(w.id)));
const gear=L.widgets.find(w=>w.id==='gear'),frame=L.widgets.find(w=>w.id==='gear_frame');
assert(frame.x<=gear.x&&frame.y<=gear.y&&frame.x+frame.w>=gear.x+gear.w&&frame.y+frame.h>=gear.y+gear.h);
assert(arc.raceProfile && arc.x===0 && arc.y===0 && arc.w===1920,'full-width race-profile renderer');
const overlap=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
const texts=L.widgets.filter(w=>w.type==='text');
for(const w of texts){
 const font=require('../apps/cluster_themes/hud/fonts/'+w.font+'.json');
 for(const ch of w.text.replace(/\{\{.*?\}\}/g,''))
  assert(ch===' '||font.glyphs[ch],w.id+' has an unsupported glyph: '+ch);
}
for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
 const a=texts[i],b=texts[j];
 if(a.toggle&&b.toggle&&a.toggle!==b.toggle)continue;
 assert(!overlap(a,b),'text rectangles overlap: '+a.id+' / '+b.id);
}
const profile=arc.raceProfile;
const curve=x=>profile[2]+profile[3]*Math.pow(1-Math.max(0,Math.min(1,(x-profile[0])/(profile[1]-profile[0]))),4);
assert(curve(profile[0])-curve(profile[1])>=300,'deep left entry');
assert(curve(profile[1]-200)-curve(profile[1])<1,'nearly horizontal right end');
for(const w of texts.filter(w=>!w.toggle&&w.id!=='title'))
 assert(w.y>curve(w.x)+arc.band+8,'RPM band covers '+w.id);
for(const max of [6,7,8])for(const camera of ['', 'c']){
 const marks=L.widgets.filter(w=>w.toggle==='ribScale='+max+camera);
 assert.equal(marks.length,max+1);
 marks.forEach((w,i)=>{
  assert.equal(w.text,String(i));
  const expectedX=profile[0]+(profile[1]-profile[0])*i/max;
  assert(Math.abs(w.x+w.w/2-expectedX)<=1,'RPM marks advance linearly left to right');
  assert(Math.abs(w.y+48-profile[2])<=1);
  assert.equal(w.color,'ink','scale uses the contrasting text colour');
 });
}
assert(L.widgets.every(w=>!w.exclusive));
const spec=require('../apps/cluster_themes/app.json');
for(const s of spec.settings.filter(s=>(s.options||[]).some(o=>Array.isArray(o)&&o[0]==='gt3')))assert(s.options.some(o=>o[0]==='s58_race'));
const bad=JSON.parse(JSON.stringify(L));bad.slots[0].default='inventedAFR';
assert.throws(()=>Layouts.prototype._validate.call({size:[1920,720]},bad,'bad'),/not a sensor/);
console.log('S58 Race: schema, supported readouts, registration, redline-aware arc markings, framed gear, camera clearance, panel boundaries and visibility checks passed.');
