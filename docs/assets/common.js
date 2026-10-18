(function(){
const root=document.documentElement;
const saved=localStorage.getItem('hiw-theme');
root.dataset.theme=saved||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');
window.HIW={
 reduced:()=>matchMedia('(prefers-reduced-motion:reduce)').matches,
 sleep:ms=>new Promise(r=>setTimeout(r,HIW.reduced()?0:ms)),
 $:(s,e)=>(e||document).querySelector(s),
 /* 通用分步控制器：steps=[{html}], onStep(i,step) */
 stepper(el,steps,onStep,opt){
  opt=opt||{};let i=-1,timer=null,speed=1;
  el.classList.add('stp');
  el.innerHTML=`<button data-a=reset>⟲ 重置</button><button data-a=prev>◀ 上一步</button><button class=primary data-a=next>下一步 ▶</button><button data-a=play>▶ 自动播放</button><label>速度 <input type=range min=0.5 max=3 step=0.5 value=1 aria-label=速度></label><div class=prog><i></i></div><div class=info aria-live=polite>点「下一步」开始。</div>`;
  const q=s=>el.querySelector(s),info=q('.info'),bar=q('.prog i');
  function go(n){i=Math.max(-1,Math.min(steps.length-1,n));
   bar.style.width=((i+1)/steps.length*100)+'%';
   info.innerHTML=i<0?'点「下一步」开始。':`<b>第 ${i+1}/${steps.length} 步</b>　${steps[i].html}`;
   q('[data-a=prev]').disabled=i<0;q('[data-a=next]').disabled=i>=steps.length-1;
   onStep(i,steps[i]);if(i>=steps.length-1)stop();}
  function stop(){clearInterval(timer);timer=null;q('[data-a=play]').textContent='▶ 自动播放'}
  function play(){if(timer)return stop();if(i>=steps.length-1)go(-1);
   q('[data-a=play]').textContent='⏸ 暂停';
   const tick=()=>{if(i>=steps.length-1)return stop();go(i+1)};
   const set=()=>{clearInterval(timer);timer=setInterval(tick,(opt.interval||2200)/speed)};
   tick();set();el._resched=set}
  el.addEventListener('click',e=>{const a=e.target.dataset&&e.target.dataset.a;if(!a)return;
   if(a==='next'){stop();go(i+1)}else if(a==='prev'){stop();go(i-1)}else if(a==='reset'){stop();go(-1)}else if(a==='play')play()});
  q('input').addEventListener('input',e=>{speed=+e.target.value;if(timer)el._resched()});
  go(-1);return{go,get i(){return i}};
 }
};
document.addEventListener('DOMContentLoaded',()=>{
 const b=document.getElementById('theme');
 const lab=()=>b.textContent=root.dataset.theme==='dark'?'☀ 浅色':'☾ 深色';
 b.onclick=()=>{root.dataset.theme=root.dataset.theme==='dark'?'light':'dark';localStorage.setItem('hiw-theme',root.dataset.theme);lab()};lab();
});

/* 无障碍兜底：给没有可见 label 的控件补 aria-label（取邻近文字） */
window.addEventListener('load',()=>{document.querySelectorAll('input,select,textarea').forEach(i=>{
 if(i.type==='hidden'||i.closest('label')||i.getAttribute('aria-label')||i.getAttribute('aria-labelledby')||(i.id&&document.querySelector('label[for="'+i.id+'"]')))return;
 let t=i.title||i.placeholder||'';
 if(!t){let p=i.previousSibling;while(p&&!t){t=(p.textContent||'').trim();p=p.previousSibling}}
 if(!t&&i.parentElement)t=(i.parentElement.textContent||'').trim();
 i.setAttribute('aria-label',(t||i.id||'输入').replace(/\s+/g,' ').slice(0,30))})});
})();
