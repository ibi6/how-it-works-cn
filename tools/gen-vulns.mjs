// 生成「常见漏洞详解」系列页面：node tools/gen-vulns.mjs
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';
const dir=path.dirname(fileURLToPath(import.meta.url));const out=path.join(dir,'../docs/lessons');
const all=[...(await import('./vulns/data1.mjs')).default,...(await import('./vulns/data2.mjs')).default,...(await import('./vulns/data3.mjs')).default];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const head=(t,d,rel)=>`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(t)} · 图解互联网基本功</title><meta name="description" content="${esc(d)}"><link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 32 32%27%3E%3Crect width=%2732%27 height=%2732%27 rx=%278%27 fill=%27%234f46e5%27/%3E%3Ctext x=%2716%27 y=%2723%27 font-size=%2720%27 text-anchor=%27middle%27 fill=%27white%27%3E%E5%9B%BE%3C/text%3E%3C/svg%3E"><link rel="stylesheet" href="../assets/style.css"><script src="../assets/common.js"></script><script src="../assets/vuln.js"></script></head><body>
<header class="top"><div><a class="logo" href="../index.html">图解<b>互联网</b>基本功</a><span class="sp"></span><a href="vulns.html" style="font-size:14px">漏洞详解目录</a><button id="theme" aria-label="切换主题">☾ 深色</button></div></header><main>`;
const foot='</main><footer>图解互联网基本功 · MIT · 仅供学习与授权范围内的防御/测试 · 所有演示均在浏览器本地模拟，不发出任何真实网络请求</footer></body></html>';
const code=c=>`<pre><code>${esc(c)}</code></pre>`;
all.forEach((v,i)=>{
 const prev=all[i-1],next=all[i+1];
 const types=v.cause[1].map(t=>`<div class="card ctype"><h4>${t[0]}</h4><p>${t[1]}</p>${code(t[2])}</div>`).join('');
 let lab;
 if(v.lab.type==='checklist')lab=`VLAB(${JSON.stringify({type:'checklist',intro:v.lab.intro,items:v.lab.items})});`;
 else{const{run,...rest}=v.lab;lab=`VLAB(Object.assign(${JSON.stringify(rest)},{${run.toString()}}));`}
 if(/<\/script/i.test(lab))throw new Error('script close in '+v.id);
 const r=v.report;
 const html=head(v.title,v.short,'')+`
<span class="tag">漏洞详解 ${i+1}/${all.length}</span><h1>${v.title}</h1><p class="lead">${v.short}</p>
<nav class="chips" aria-label="本课结构"><a href="#s1">定义</a><a href="#s2">类比</a><a href="#s3">成因</a><a href="#s4">危害</a><a href="#s5">防御</a><a href="#s6">审计视角</a><a href="#s7">本地实验</a><a href="#s8">靶场</a><a href="#s9">小测验</a><a href="#s10">误区</a><a href="#s11">报告模板</a></nav>
<div class="tldr"><b>一句话定义</b>${v.one}</div>
<div class="note">本课只讲原理、防御与审计思路。所有演示都是浏览器里的假数据模拟；不提供针对真实目标的攻击载荷清单，也请只在<b>自己搭建的环境或获得授权的范围</b>内验证。</div>
<h2 id="s2">🏠 生活类比</h2><div class="ana">${v.analogy}</div>
<h2 id="s3">🔍 成因：问题到底出在哪</h2><p>${v.cause[0]}</p>${types}
<h2 id="s4">💥 危害与等级</h2><div class="sev">${v.harm.map(h=>`<div class="l-${h[0].replace(/[^严重高中低]/g,'')||'x'}"><b>${h[0]}</b><span>${h[1]}</span></div>`).join('')}</div>
<h2 id="s5">🛡 防御与修复</h2><p>${v.fix[0]}</p>${code(v.fix[1])}
<h2 id="s6">🧐 怎么判断自己安全？代码审计视角</h2><ul>${v.audit.map(a=>`<li>${a}</li>`).join('')}</ul>
<h2 id="s7">🧪 本地小实验</h2><div class="card lab" id="lab"></div>
<h2 id="s8">🎯 本地靶场练习</h2><div class="card"><p>${v.range}</p><p class="note">靶场安装与 127.0.0.1 绑定方法见 <a href="src-3-lab.html">合法练习环境</a> 一课。</p></div>
<h2 id="s9">✅ 小测验</h2><div id="quiz"></div>
<h2 id="s10">⚠ 常见误区</h2><div class="myth">${v.myths.map(m=>`<div><b>${m[0]}</b>${m[1]}</div>`).join('')}</div>
<h2 id="s11">📝 SRC 报告里怎么描述（虚构示例模板）</h2>
<p>下面是<b>完全虚构</b>的示例（example.test 不是真实站点）。注意三点：<b>标题含等级与位置</b>、<b>复现步骤最小化且只用自己的账号</b>、<b>说明影响但不扩大验证</b>。写法细则见 <a href="src-4-report.html">漏洞报告与沟通</a>。</p>
<div class="rpt" id="rpt"><b>标题：</b>${r.title}
<b>目标/接口：</b>${r.asset}
<b>漏洞概述：</b>${r.summary}
<b>复现步骤：</b>
${r.steps.map((s,k)=>(k+1)+'. '+s).join('\n')}
<b>影响：</b>${r.impact}
<b>修复建议：</b>${r.fix}
<b>自评等级：</b>${r.severity}</div>
<div class="ctl"><button id="cp" type="button">复制模板文本</button></div>
<h2>延伸阅读</h2><ul>${v.links.map(l=>`<li><a href="${l[1]}">${l[0]}</a></li>`).join('')}</ul>
<script>${lab}\nVQUIZ(${JSON.stringify(v.quiz)});</script>
<div class="nav2">${prev?`<a href="${prev.id}.html">← ${prev.title.split('（')[0]}</a>`:'<a href="vulns.html">← 漏洞详解目录</a>'} ${next?`<a href="${next.id}.html">${next.title.split('（')[0]} →</a>`:'<a href="vulns.html">回到目录 →</a>'}</div>`+foot;
 fs.writeFileSync(path.join(out,v.id+'.html'),html);
});
const hub=head('常见漏洞详解','15 种常见 Web 漏洞：定义、类比、成因、危害、防御、审计、本地实验、测验与报告模板','')+`
<span class="tag">SRC 专题 · 漏洞详解</span><h1>常见 Web 漏洞详解</h1><p class="lead">每个漏洞一课，结构相同：定义 → 类比 → 成因（含有漏洞的代码）→ 危害分级 → 防御（正确代码）→ 审计视角 → 本地实验 → 靶场 → 小测验 → 误区 → SRC 报告模板。</p>
<div class="note">只讲原理与防御；演示全部是浏览器内的假数据模拟；请只在自己搭建的环境或授权范围内验证。先读 <a href="src-1-scope.html">第 1 课：合法边界</a>。</div>
<h2>建议学习顺序</h2><p>先「注入类」理解"数据变指令"，再「访问控制类」理解"少一道检查"，最后「配置与逻辑类」。</p>
<div class="lessons" id="hub"></div>
<h2>学完怎么办</h2><ul><li>对照 <a href="src-3-lab.html">本地靶场</a>，把每课"靶场练习"做一遍，并尝试读源码找出缺失的那一道检查。</li><li>用每课的"报告模板"，为靶场里的漏洞写一份练习报告。</li><li>再去读 <a href="src-5-roadmap.html">学习路线图</a>。</li></ul>
<script>const L=${JSON.stringify(all.map(v=>[v.id,v.title,v.short]))};document.getElementById('hub').innerHTML=L.map((x,i)=>'<a class="lc" href="'+x[0]+'.html"><div class="n">V'+(i+1)+'</div><h3>'+x[1]+'</h3><p>'+x[2]+'</p></a>').join('')</script>
<div class="nav2"><a href="src-2-vulns.html">← 常见漏洞速览</a> <a href="${all[0].id}.html">开始：XSS →</a></div>`+foot;
fs.writeFileSync(path.join(out,'vulns.html'),hub);
fs.writeFileSync(path.join(dir,'vulns-list.json'),JSON.stringify(all.map(v=>v.id)));
console.log('generated',all.length);
