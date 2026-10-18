import {chromium} from 'playwright-core';
const base=process.argv[2];const shots=process.argv[3];
import fs from 'node:fs';
const VL=JSON.parse(fs.readFileSync(new URL('./vulns-list.json',import.meta.url)));
const pages=['index.html','lessons/vulns.html',...VL.map(x=>`lessons/${x}.html`),...['01-url','02-https','03-session','04-cors','05-index','06-sqli','src-1-scope','src-2-vulns','src-3-lab','src-4-report','src-5-roadmap'].map(x=>`lessons/${x}.html`)];
async function vulnCheck(pg,errs,name){
 const labtype=await pg.evaluate(()=>!!document.querySelector('#lab .ckl'));
 if(labtype){const n=await pg.$$eval('#lab .ckl input',x=>x.length);for(const c of await pg.$$('#lab .ckl input'))await c.check();if(!(await pg.textContent('#lab')).includes('全部修复'))errs.push('checklist');}
 else{
  const sets=[];const pc=await pg.$$('#lab .ctl button');
  for(let i=0;i<pc.length;i++)sets.push(async()=>{await (await pg.$$('#lab .ctl button'))[i].click()});
  if(!pc.length){const opts=await pg.$$eval('#lab select:first-of-type option',o=>o.map(x=>x.value));for(const o of opts)sets.push(async()=>{await pg.selectOption('#lab select',o)})}
  let badOff=0;
  for(const mode of [false,true])for(const f of sets){await f();await pg.setChecked('#safe',mode);const o=await pg.textContent('#lo');if(!o.trim())errs.push('empty out');const bad=(await pg.getAttribute('.verdict','class')).includes('bad');
   if(mode&&bad)errs.push('safe mode still bad: '+o.slice(0,60));if(!mode&&bad)badOff++}
  if(!badOff)errs.push('no unsafe case demonstrates bug');
  await pg.setChecked('#safe',false)}
 const qb=await pg.$$('#quiz .card');for(const c of qb){await (await c.$('button[data-v="0"]')||await c.$('button')).click()}
 if(!(await pg.textContent('#quiz')).includes('得分'))errs.push('quiz score');
 if(!(await pg.textContent('#rpt')).includes('复现步骤'))errs.push('report');
 for(const id of ['s2','s3','s4','s5','s6','s7','s8','s9','s10','s11'])if(!(await pg.$('#'+id)))errs.push('missing section '+id);
}
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
let bad=0;
for(const dark of [false,true]){
 const ctx=await b.newContext({viewport:{width:1100,height:900},colorScheme:dark?'dark':'light'});
 for(const p of pages){const pg=await ctx.newPage();const errs=[];
  pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});pg.on('pageerror',e=>errs.push(String(e)));
  pg.on('requestfailed',r=>errs.push('reqfail '+r.url()));
  await pg.goto(base+p,{waitUntil:'load'});
  const name=p.replace(/.*\//,'').replace('.html','');
  const act={
   '01-url':async()=>{for(let i=0;i<6;i++)await pg.click('[data-a=next]');await pg.waitForTimeout(1200)},
   '02-https':async()=>{await pg.click('#ms');await pg.click('#send');for(let i=0;i<3;i++)await pg.click('#stp [data-a=next]');await pg.click('#c1')},
   '03-session':async()=>{await pg.click('#jn');await pg.waitForTimeout(300);await pg.fill('#jp','{"role":"admin"}');await pg.click('#jv');await pg.waitForTimeout(300);if(!(await pg.textContent('#jr')).includes('不匹配'))errs.push('jwt verify wrong');await pg.click('#stp [data-a=next]')},
   '04-cors':async()=>{await pg.selectOption('#me','PUT');await pg.click('#go');if(!(await pg.textContent('#vd')).includes('拦截'))errs.push('cors verdict');await pg.selectOption('#ao','https://app.example.com');await pg.selectOption('#am','GET, POST, PUT, DELETE');await pg.click('#go');if(!(await pg.textContent('#vd')).includes('通过'))errs.push('cors pass: '+await pg.textContent('#vd'))},
   '05-index':async()=>{for(const k of [36,37,38,39,40,1,2]){await pg.fill('#k',String(k));await pg.click('#ins')}await pg.fill('#k','39');await pg.click('#fnd');await pg.waitForTimeout(2200);const lv=await pg.$$eval('#tree > div',d=>d.length);if(lv<2)errs.push('tree levels '+lv)},
   '06-sqli':async()=>{await pg.click('[data-n^="x"]');const t=await pg.textContent('#r1');if(!t.includes('行'))errs.push('sqli r1 '+t);const t2=await pg.textContent('#r2');if(!t2.includes('0 行'))errs.push('param r2 '+t2);await pg.click('[data-n^="O"]');if(!(await pg.textContent('#r1')).includes('语法错误'))errs.push('obrien concat');if(!(await pg.textContent('#r2')).includes('登录通过'))errs.push('obrien param '+await pg.textContent('#r2'))},
   'src-1-scope':async()=>{for(const b of await pg.$$('#q .card button[data-v="1"]'))await b.click()},
   'src-2-vulns':async()=>{await pg.click('#oid button:nth-child(3)');await pg.click('#tabs button:nth-child(3)')},
   'src-3-lab':async()=>{await pg.selectOption('#lab','webgoat');await pg.click('#ck input')},
   'src-4-report':async()=>{await pg.selectOption('#q2','3')},
   'src-5-roadmap':async()=>{await pg.click('#rm input')}}[name];
  if(/^v\d\d-/.test(name)){await vulnCheck(pg,errs,name)}
  if(act)await act();
  if(!(await pg.title()))errs.push('no title');
  const a11y=await pg.evaluate(()=>{const e=[];if(document.documentElement.lang!=='zh-CN')e.push('lang');document.querySelectorAll('input,select,textarea').forEach(i=>{if(!(i.closest('label')||i.getAttribute('aria-label')||(i.id&&document.querySelector('label[for="'+i.id+'"]'))))e.push('unlabeled '+(i.id||i.type))});document.querySelectorAll('button').forEach(b=>{if(!b.textContent.trim()&&!b.getAttribute('aria-label'))e.push('empty button')});document.querySelectorAll('iframe').forEach(f=>{if(!f.title&&!f.id)e.push('iframe no title')});if(document.querySelectorAll('h1').length!==1)e.push('h1 count');return e});
  if(a11y.length)errs.push('a11y '+a11y.join(','));
  await pg.waitForTimeout(300);
  if(shots&&!dark&&['index','01-url','05-index','06-sqli','src-4-report','04-cors'].includes(name))await pg.screenshot({path:`${shots}/${name}.png`,fullPage:false});
  // horizontal overflow on mobile checked below
  if(errs.length){bad++;console.log('FAIL',dark?'dark':'light',p,errs)}else console.log('ok',dark?'dark':'light',p);
  await pg.close()}
}
// mobile overflow
const m=await b.newContext({viewport:{width:390,height:800}});
for(const p of pages){const pg=await m.newPage();await pg.goto(base+p);const o=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);if(o>2){console.log('overflow',p,o)}await pg.close()}
// reduced motion
const r=await b.newContext({reducedMotion:'reduce'});const pg=await r.newPage();await pg.goto(base+'lessons/01-url.html');await pg.click('[data-a=next]');await pg.click('[data-a=next]');console.log('reduced ok');
await b.close();console.log(bad?'FAILED '+bad:'ALL PASS');process.exit(bad?1:0)
