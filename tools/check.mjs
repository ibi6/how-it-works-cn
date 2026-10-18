import {chromium} from 'playwright-core';
const base=process.argv[2];const shots=process.argv[3];
const pages=['index.html',...['01-url','02-https','03-session','04-cors','05-index','06-sqli','src-1-scope','src-2-vulns','src-3-lab','src-4-report','src-5-roadmap'].map(x=>`lessons/${x}.html`)];
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
  if(act)await act();
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
