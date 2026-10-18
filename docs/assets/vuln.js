(function(){
const $=(s,e)=>(e||document).querySelector(s);
window.esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mk(tag,cls,html){const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e}
window.VLAB=function(cfg){
 const box=$('#lab');box.append(mk('p',null,cfg.intro));
 if(cfg.type==='checklist'){
  const tot=cfg.items.reduce((a,i)=>a+i[1],0);
  const ul=mk('div','ck');const score=mk('div','score');const ex=mk('div','note');ex.setAttribute('aria-live','polite');
  cfg.items.forEach((it,k)=>{const l=mk('label','ckl');const c=mk('input');c.type='checkbox';c.dataset.k=k;l.append(c,document.createTextNode(' '+it[0]));const s=mk('small',null,' · 风险 '+it[1]);l.append(s);ul.append(l)});
  const up=()=>{let left=0,open=[];ul.querySelectorAll('input').forEach(c=>{const it=cfg.items[c.dataset.k];if(!c.checked){left+=it[1];open.push(it[2])}});
   const pct=Math.round(left/tot*100);score.innerHTML='剩余风险分：<b class="'+(pct>40?'bad':pct>0?'warn':'ok')+'">'+left+' / '+tot+'</b><div class="prog"><i style="width:'+pct+'%;background:var(--bad)"></i></div>';
   ex.textContent=open.length?'仍可能发生：'+open.join('、'):'✅ 清单全部修复。但配置会漂移，要持续检查。'};
  ul.addEventListener('change',up);box.append(ul,score,ex);up();return}
 const form=mk('div','vl-form');const vals={};
 cfg.inputs.forEach(i=>{const w=mk('label','vl-f');w.append(mk('span',null,i.label));let c;
  if(i.type==='select'){c=mk('select');i.options.forEach(o=>{const op=mk('option',null,esc(o[1]));op.value=o[0];c.append(op)})}
  else if(i.type==='textarea'){c=mk('textarea');c.rows=4;c.value=i.value;c.className='vl-ta'}
  else{c=mk('input');c.type=i.type==='number'?'number':'text';c.value=i.value}
  c.id='in-'+i.id;w.append(c);form.append(w)});
 box.append(form);
 if(cfg.presets&&cfg.presets.length){const pr=mk('div','ctl');pr.append(mk('span',null,'<small>试试：</small>'));cfg.presets.forEach(p=>{const b=mk('button',null,esc(p[0]));b.type='button';b.onclick=()=>{Object.keys(p[1]).forEach(k=>$('#in-'+k).value=p[1][k]);go()};pr.append(b)});box.append(pr)}
 const sw=mk('label','vl-safe');const cb=mk('input');cb.type='checkbox';cb.id='safe';sw.append(cb,document.createTextNode(' 🛡 开启防御：'+cfg.safeLabel));box.append(sw);
 const verdict=mk('div','verdict');verdict.setAttribute('aria-live','polite');const out=mk('pre');const code=mk('code');code.id='lo';out.append(code);
 const note=mk('div','vnote');
 let fr=null;
 box.append(mk('b',null,'服务器视角（模拟）'),out);
 const go=()=>{cfg.inputs.forEach(i=>vals[i.id]=$('#in-'+i.id).value);let r;try{r=cfg.run(vals,cb.checked)}catch(e){r={out:'模拟出错：'+e.message,bad:false,note:''}}
  code.textContent=r.out;verdict.className='verdict '+(r.bad?'bad':'ok');verdict.textContent=r.bad?'❌ 出现安全问题':(cb.checked?'✅ 被防御拦下 / 安全':'✅ 本次输入下表现正常');note.textContent=r.note||'';
  if(r.html!=null){if(!fr){fr=mk('iframe');fr.setAttribute('sandbox','');fr.title='沙箱渲染结果（禁用脚本）';fr.style.cssText='width:100%;height:70px;border:1px solid var(--line);border-radius:8px;background:#fff';box.insertBefore(mk('b',null,'浏览器渲染结果（沙箱）'),verdict);box.insertBefore(fr,verdict)}fr.srcdoc='<body style="font:15px sans-serif;margin:8px">'+r.html}};
 box.append(verdict,note);
 form.addEventListener('input',go);form.addEventListener('change',go);cb.onchange=go;go();
};
window.VQUIZ=function(qs){
 const box=$('#quiz');let done=0,right=0;const sc=mk('div','score');sc.setAttribute('aria-live','polite');
 qs.forEach((q,qi)=>{const c=mk('div','card');c.append(mk('b',null,(qi+1)+'. '+esc(q[0])));const ol=mk('div','qo');const ex=mk('div','qe');
  q[1].forEach((o,oi)=>{const b=mk('button',null,esc(o));b.type='button';b.dataset.v=oi===q[2]?'1':'0';b.onclick=()=>{if(c.dataset.d)return;c.dataset.d=1;done++;if(oi===q[2])right++;b.classList.add(oi===q[2]?'rt':'wr');ol.querySelector('[data-v="1"]').classList.add('rt');ex.textContent=(oi===q[2]?'✅ 正确。':'❌ 不对。')+q[3];if(done===qs.length)sc.textContent='得分：'+right+' / '+qs.length+(right===qs.length?' 🎉 掌握得不错！':'，回头再看看「成因」和「防御」两节。')};ol.append(b)});
  c.append(ol,ex);box.append(c)});box.append(sc)};
document.addEventListener('DOMContentLoaded',()=>{const b=$('#cp');if(b)b.onclick=()=>{const t=$('#rpt').innerText;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>b.textContent='已复制 ✓',()=>{const r=document.createRange();r.selectNodeContents($('#rpt'));getSelection().removeAllRanges();getSelection().addRange(r);b.textContent='已选中，按 Ctrl+C'})}});
})();
