export default [
{id:'v01-xss',title:'XSS 跨站脚本（反射 / 存储 / DOM）',short:'数据被当成代码执行在别人的浏览器里',
one:'XSS 是指：网站把「不可信的内容」未经处理就输出到页面里，浏览器把它当成了网页代码执行，于是攻击者的脚本以受害者的身份在该网站里运行。',
analogy:'小区公告栏允许住户贴纸条。如果物业不检查，有人贴一张「纸条」，上面写着「看到本条的人请把家门钥匙放到门口」，并盖上物业的章——大家以为是物业发的，就照做了。XSS 里，「盖物业章」就是脚本借用了网站的身份。',
cause:['根因只有一个：<b>输出时没有按"输出位置"做转义</b>。浏览器分不清哪些是网站作者写的结构，哪些是用户提供的文字。按数据"来自哪、落在哪"，分成三种：',[
['反射型','输入来自当前请求（如 URL 参数），服务端立刻把它拼进响应。只影响点击了特制链接的人。','// 伪代码：搜索页\nrender("<h2>搜索结果：" + request.query["q"] + "</h2>")'],
['存储型','输入被保存进数据库（评论、昵称、工单），之后每个查看该页面的人都会中招，危害最大。','// 伪代码：评论列表\nfor c in db.comments:\n    render("<li>" + c.content + "</li>")   // 直接拼接'],
['DOM 型','整个过程发生在前端：前端 JS 读取 URL / 存储里的数据，用 innerHTML 等"当作 HTML"的接口写入页面，服务器甚至看不到。','// 前端 JS\nconst name = new URLSearchParams(location.search).get("name");\ndocument.getElementById("hi").innerHTML = "你好，" + name;']]],
harm:[['高','存储型且出现在高访问页面（后台、客服工单）：可在管理员浏览器里以其身份操作，等于账号权限被借用。'],['中','反射型 / DOM 型：需要诱导点击；可伪造页面内容、钓鱼、读取页面上的数据。'],['低','仅影响自己（Self-XSS）、或页面无敏感数据且有严格 CSP：通常 SRC 不收或低危。'],['决定等级的因素','① 页面是否带登录态 ② 谁会看到（普通用户/管理员）③ 是否有 HttpOnly、CSP 等缓解 ④ 页面上有什么数据。']],
fix:['修复原则：<b>输入校验是辅助，输出转义是主力，CSP 是兜底</b>。','// 1) 服务端模板：使用自动转义的模板引擎（默认开启，不要关）\n//    {{ comment.content }}        → 自动转义\n//    {{ comment.content | safe }}  → 危险：只给可信内容用\n\n// 2) 前端：需要"当文字"写入时，用 textContent，而不是 innerHTML\ndocument.getElementById("hi").textContent = "你好，" + name;\n\n// 3) 确需富文本：用成熟的净化库白名单过滤（如 DOMPurify），不要自己写正则\nel.innerHTML = DOMPurify.sanitize(userHtml);\n\n// 4) 响应头兜底\nContent-Security-Policy: default-src \'self\'; script-src \'self\'; object-src \'none\'\nSet-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax'],
audit:['全局搜索危险接口：<code>innerHTML</code>、<code>outerHTML</code>、<code>document.write</code>、<code>v-html</code>、<code>dangerouslySetInnerHTML</code>、模板里的 <code>|safe</code> / <code>raw</code>。','每处用户可控数据，追问：它最终落在 HTML 正文、属性、JS 字符串还是 URL？是否用了对应场景的转义？','富文本功能是否使用白名单净化？链接是否限制了 <code>javascript:</code> 协议？','检查 CSP 是否真的有效（不要 <code>unsafe-inline</code> 一把梭），Cookie 是否 HttpOnly。'],
lab:{intro:'左边输入一段「用户留言」。选择它被放进页面的位置，再切换「输出转义」。结果显示在<b>禁用脚本的沙箱</b>里，安全；重点看浏览器如何<i>解析</i>它。',inputs:[{id:'t',label:'用户输入',value:'<b>你好</b> <i>世界</i>'},{id:'ctx',label:'输出位置',type:'select',options:[['body','HTML 正文'],['attr','HTML 属性（value="…"）']]}],safeLabel:'输出时转义',presets:[['普通文字',{t:'你好，世界'}],['带标记的文字',{t:'<b>加粗</b>'}],['含双引号（属性场景）',{t:'x" style="background:red'}]],
run(v,safe){var t=safe?esc(v.t):v.t;var html=v.ctx==='attr'?'<input value="'+t+'" style="width:90%">':'<p>留言：'+t+'</p>';var changed=esc(v.t)!==v.t;var bad=!safe&&changed;return{out:html,html:html,bad:bad,note:bad?'❌ 用户输入里的特殊字符改变了页面结构：数据变成了代码。真实场景里，把标记换成可执行脚本，就是 XSS。':(changed?'✅ 特殊字符被转义，只当文字显示。':'输入里没有特殊字符，两种方式看起来一样——所以只测"正常输入"永远发现不了问题。')}}},
range:'本地靶场：<b>DVWA</b> 的 XSS (Reflected / Stored / DOM) 三个模块，把安全等级从 Low 调到 High，对照源码看每一级多了什么转义；<b>pikachu</b> 有 XSS 全套；<b>WebGoat</b> 有交互式讲解。',
quiz:[['下面哪个做法最能从根上防住存储型 XSS？',['在前端用正则过滤 script 关键字','输出到页面时按位置做转义（或用自动转义模板）','把 Cookie 设成 HttpOnly 就够了','禁止用户输入 < 和 >'],1,'输入黑名单容易被绕过，且影响正常内容；HttpOnly 只能限制偷 Cookie，脚本仍能代用户操作。'],['DOM 型 XSS 和反射型最大的区别是？',['危害更大','服务器可能完全看不到恶意数据，问题在前端 JS','只存在于旧浏览器','需要登录才能触发'],1,'DOM 型的数据流在浏览器内：来源（location 等）到汇点（innerHTML 等）。'],['输出到 HTML 属性时，必须特别处理的字符是？',['引号','中文','空格以外的一切','什么都不用'],0,'属性值靠引号闭合，输入里的引号会"跳出"属性，开启新的属性。所以属性场景要转义引号并始终给属性值加引号。']],
myths:[['「过滤掉 script 标签就行」','脚本能通过事件属性、伪协议等许多途径执行，黑名单永远列不完。'],['「HttpOnly 能防 XSS」','它只防止脚本读 Cookie，脚本依然能以你的身份发请求。'],['「只有搜索框才有 XSS」','昵称、头像 URL、文件名、HTTP 头里的内容、错误提示都可能被输出。']],
report:{title:'【中危】example.test 个人资料页昵称存储型 XSS（虚构示例）',asset:'https://app.example.test/profile （虚构目标，已在授权范围内）',summary:'个人资料页的"昵称"字段保存后在好友列表页被原样输出到 HTML，未做转义。',steps:['使用测试账号 A 登录，进入"设置—昵称"。','在昵称中输入一段无害的标记文本，例如加粗标签，保存。','使用测试账号 B 打开好友列表，发现 A 的昵称被渲染为加粗，说明输入被当作 HTML 解析（概念验证仅用无害标记，未执行任何脚本，未接触他人数据）。'],impact:'好友列表是高访问页面；若将标记替换为可执行脚本，可在任意查看者的会话中执行操作。',fix:'服务端模板对昵称做 HTML 转义；启用 CSP；Cookie 增加 HttpOnly。',severity:'中危（需用户查看页面触发，页面含登录态）。'},
links:[['OWASP：XSS 防护速查表','https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html'],['OWASP：DOM XSS 防护速查表','https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html'],['MDN：CSP','https://developer.mozilla.org/zh-CN/docs/Web/HTTP/CSP']]},

{id:'v02-sqli',title:'SQL 注入',short:'输入被拼进 SQL，数据变成了指令',
one:'SQL 注入是指：程序把用户输入直接拼接进 SQL 语句文本，导致输入里的内容被数据库当作"指令"的一部分执行。',
analogy:'你在点餐单上写"一份炒饭"。如果服务员不加思考地把整张单子大声念给后厨，而你写的是"一份炒饭；另外把今天的收入全给我"，后厨就可能真的照做。问题不在厨师，在于"点单内容"与"指令"没有分开。',
cause:['数据库收到的是一串文本，它自己要<b>解析</b>这串文本。拼接让"用户的数据"与"开发者的结构"混在同一串文本里，解析器无法区分。',[
['登录场景','输入影响了条件逻辑。','// 有漏洞：字符串拼接\nsql = "SELECT * FROM users WHERE name=\'" + name + "\' AND pwd=\'" + pwd + "\'"\n// 当 name 里出现单引号，就能提前结束字符串，改写后面的条件'],
['数字/排序场景','没有引号也一样，数字位置同样可被拼接。','sql = "SELECT * FROM goods WHERE id=" + request.id + " ORDER BY " + request.sort\n// 注意：ORDER BY 的列名、表名无法参数化，必须用白名单'],
['二次注入','输入第一次被安全地存下，但之后被程序取出再拼接进另一条 SQL。','// 注册时安全入库（用了参数化）\n// 但后台导出功能：\nsql = "SELECT * FROM log WHERE user=\'" + stored_name + "\'"   // 取出后又拼接']]],
harm:[['严重','能读取全库（用户表、密码哈希、订单）、篡改或删除数据；某些数据库配置下还可能进一步控制服务器。'],['高','只能读取部分表，或认证绕过（不输密码登录任意账号）。'],['中','仅能造成报错、信息泄露（库名、版本）。'],['决定等级的因素','① 数据库账号权限 ② 能读到什么数据 ③ 是否需要登录 ④ 是否影响他人数据。']],
fix:['修复原则：<b>代码与数据分离——参数化查询（预编译）</b>。','// 正确：占位符，输入永远只是"值"\ncursor.execute("SELECT * FROM users WHERE name=%s AND pwd_hash=%s", (name, hash))\n\n// ORM 也要小心原生拼接\nUser.objects.filter(name=name)                 // 安全\nUser.objects.raw("... WHERE name=\'%s\'" % name)  // 又拼接了！\n\n// 无法参数化的位置（表名/列名/排序方向）：白名单\nALLOWED = {"price", "created_at"}\nif sort not in ALLOWED: sort = "created_at"\n\n// 纵深：数据库账号最小权限（应用账号不能 DROP、不能读无关表）；错误信息不回显'],
audit:['搜索所有执行 SQL 的地方：看有没有字符串 <code>+</code>、<code>format</code>、<code>f"..."</code>、<code>%</code> 拼接。','ORM 的 <code>raw</code> / <code>execute</code> / <code>extra</code> / <code>Sequelize.query</code> 是重点。','ORDER BY、表名、列名、LIMIT 是否做了白名单或强转数字？','应用数据库账号是否是 root / DBA？错误页是否把 SQL 报错原样返回？'],
lab:{intro:'一个<b>假的</b>登录表，只存在于本页面的内存里。试试正常登录、输入带单引号的名字，对比两种写法。',inputs:[{id:'n',label:'用户名',value:'alice'},{id:'p',label:'密码',value:'wrong'}],safeLabel:'使用参数化查询',presets:[['正确密码',{n:'alice',p:'alice123'}],['名字里有单引号（O\'Brien 式）',{n:"o'brien",p:'x'}],['教科书例子：恒真条件',{n:"x' OR '1'='1",p:'x'}]],
run(v,safe){var U=[['alice','alice123'],['bob','bob456'],["o'brien",'ob789']];var n=v.n,p=v.p;if(safe){var ok=U.filter(function(r){return r[0]===n&&r[1]===p});return{out:'执行：SELECT * FROM users WHERE name=? AND pwd=?\n参数：['+JSON.stringify(n)+', '+JSON.stringify(p)+']\n结果：'+(ok.length?'登录成功：'+ok[0][0]:'0 行，登录失败'),bad:false,note:'✅ 输入永远只是"值"，包括带引号的合法名字（O\'Brien 能正常登录）。'}}
var sql="SELECT * FROM users WHERE name='"+n+"' AND pwd='"+p+"'";var res;var hit=null;
if(/'\s*or\s+'?\w+'?\s*=\s*'?\w+/i.test(n)){res='全部 '+U.length+' 行（条件恒真）→ 以第一行 alice 的身份登录';hit='bypass'}
else if(/--/.test(n)){res='注释截断了密码条件 → 仅按用户名匹配';hit='bypass'}
else if((n.split("'").length-1)%2===1){res='💥 SQL 语法错误：引号不匹配（连正常的人名都登不上了）';hit='err'}
else{var ok2=U.filter(function(r){return r[0]===n&&r[1]===p});res=ok2.length?'1 行，登录成功':'0 行，登录失败'}
return{out:'执行：'+sql+'\n结果：'+res,bad:!!hit,note:hit==='bypass'?'❌ 输入改变了 SQL 的逻辑结构：没有密码也登录了。':hit==='err'?'❌ 输入破坏了语句结构。这是注入存在的信号之一：合法输入也会报错。':'正常输入时看不出区别。'}}},
range:'本地靶场：<b>DVWA</b> 的 SQL Injection（含 Blind），Low → High 对比源码；<b>pikachu</b> 的数字型/字符型/搜索型注入；<b>WebGoat</b> 的 SQL Injection 系列课。<i>不要对任何非自己搭建的站点尝试。</i>',
quiz:[['下面哪种写法能真正防住 SQL 注入？',['把单引号替换成两个单引号','参数化查询（预编译）','在前端校验输入','只允许字母数字'],1,'转义是补丁、容易漏；参数化让数据库在语法层面区分代码与数据。'],['ORDER BY 后的列名能参数化吗？',['能，占位符就行','不能，应该用白名单','不用管，ORM 会处理','用 trim 去空格'],1,'占位符只能代表"值"，不能代表标识符，所以用白名单映射。'],['发现输入单引号会报 SQL 语法错误，说明？',['数据库坏了','很可能存在拼接，需要进一步确认并报告','网站有防火墙','没有问题'],1,'这是常见的信号，但是否可利用还要在授权范围内谨慎确认，不要读取真实数据。']],
myths:[['「用了 ORM 就不会有注入」','ORM 的原生 SQL 接口、排序字段、动态过滤同样会拼接。'],['「过滤 select、union 等关键字」','黑名单易被绕过，且常误伤正常内容。'],['「内部系统不用管」','内网一旦失守，注入就是最短的数据窃取路径。']],
report:{title:'【高危】example.test 订单查询接口 id 参数 SQL 注入（虚构示例）',asset:'GET https://shop.example.test/api/orders?id=（虚构）',summary:'id 参数在服务端被拼接进 SQL；传入不匹配的引号时接口返回数据库语法错误。',steps:['登录测试账号，访问 /api/orders?id=1，返回自己的订单。','将 id 改为 1 后接一个单引号，接口返回 500 及数据库语法错误信息。','改为 1 后接恒等式条件，返回条数与原先不同，证明条件被拼入 SQL。<b>到此为止</b>：未读取任何其他用户的数据，未尝试提取库内容。'],impact:'可进一步读取订单与用户表（需遵守规则，未验证）。',fix:'改用参数化查询；应用数据库账号降权；生产环境关闭 SQL 报错回显。',severity:'高危（无需特殊权限；影响面为全库，未实际读取）。'},
links:[['OWASP：SQL 注入防护速查表','https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html'],['本站第 6 课：参数化查询','06-sqli.html']]},

{id:'v03-access',title:'越权：水平 / 垂直 / IDOR',short:'少了一道「这是不是你的」检查',
one:'越权（访问控制失效）是指：用户做了本不该被允许的事——看了别人的数据（水平越权 / IDOR），或用了更高权限的功能（垂直越权）。',
analogy:'酒店刷卡电梯：认证 = 你有房卡（证明你是住客）；授权 = 房卡只能到你那一层。IDOR 就是"房卡能进电梯，但电梯没检查你要去的楼层"。',
cause:['"登录了"≠"有权限"。许多接口只验证了前者。越权在 OWASP Top 10 2021 中排名第一，因为它是<b>逻辑缺失</b>，扫描器很难发现。',[
['水平越权 / IDOR','同级别用户之间互相访问。IDOR（不安全的直接对象引用）指接口直接用客户端传来的 ID 取对象。','// 有漏洞：只验证登录，不验证归属\n@login_required\ndef get_order(order_id):\n    return db.orders.get(order_id)      // 谁的订单都给'],
['垂直越权','低权限用户调用高权限功能。前端隐藏了按钮，但接口没校验角色。','@app.route("/admin/users/delete")   // 没有 @admin_required\ndef delete_user(uid): ...'],
['多步流程越权','直接请求流程的后一步，绕过前面的审批/支付检查。','// 第 3 步"确认发货"接口只检查登录，不检查第 2 步"已付款"状态']]],
harm:[['严重','垂直越权到管理功能；批量读取/修改全站用户敏感信息（身份证、手机号、订单）。'],['高','水平越权可读取或修改他人隐私、资金相关数据。'],['中','只能读取非敏感数据，或需要极难猜测的 ID。'],['决定等级的因素','数据敏感度、读还是写、是否可批量、是否需要登录。']],
fix:['修复原则：<b>每个接口、每次访问、服务端都做授权；默认拒绝</b>。','// 对象级：查询时就带上属主条件\ndef get_order(order_id):\n    order = db.orders.get(order_id, owner=current_user.id)\n    if order is None: abort(404)       // 既不存在也无权 → 统一返回，防止探测\n    return order\n\n// 功能级：集中式的权限装饰器/中间件，路由默认要求权限\n@require_role("admin")\ndef delete_user(uid): ...\n\n// 不要信任客户端传来的 role / userId / isAdmin 字段\n// ID 用不可预测的 UUID 只是加分项，不能代替授权'],
audit:['列出所有"带 ID 的接口"，逐个问：服务端有没有把这个 ID 和当前用户关联校验？','有没有接受客户端传来 <code>userId</code>/<code>role</code> 这类字段的写接口（批量赋值/Mass Assignment）？','管理接口是否与普通接口隔离，权限校验是集中还是靠各处手写？','测试方法（在授权范围内用两个自己的测试账号）：A 的资源用 B 的会话访问，看返回。'],
lab:{intro:'你是用户<b>小明</b>（普通用户）。选一个请求，分别在"服务端有授权检查/没有"两种情况下看结果。数据全部是页面内的假数据。',inputs:[{id:'r',label:'请求',type:'select',options:[['o101','GET /api/orders/101（小明的）'],['o103','GET /api/orders/103（小红的）'],['o104','GET /api/orders/104（小刚的）'],['adm','GET /admin/users（管理接口）']]}],safeLabel:'服务端做授权检查',presets:[],
run(v,safe){var O={o101:['小明','键盘'],o103:['小红','手机'],o104:['小刚','耳机']};if(v.r==='adm'){if(safe)return{out:'HTTP 403 Forbidden\n{"error":"需要管理员角色"}',bad:false,note:'✅ 功能级授权：角色不足被拒绝。'};return{out:'HTTP 200 OK\n[{"id":1,"name":"小明","phone":"138****"},{"id":2,"name":"管理员"}…]',bad:true,note:'❌ 垂直越权：普通用户拿到了管理数据。"前端没有按钮"不等于"接口没人能调"。'}}
var o=O[v.r];var mine=o[0]==='小明';if(safe&&!mine)return{out:'HTTP 404 Not Found',bad:false,note:'✅ 对象级授权：非本人订单一律当不存在，也不泄露"该订单是否存在"。'};return{out:'HTTP 200 OK\n{"id":"'+v.r.slice(1)+'","owner":"'+o[0]+'","item":"'+o[1]+'"}',bad:!mine,note:mine?'这是自己的订单，正常。':'❌ 水平越权（IDOR）：小明看到了别人的订单。'}}},
range:'本地靶场：<b>pikachu</b> 的"越权"模块（水平/垂直）；<b>WebGoat</b> 的 Insecure Direct Object References；<b>DVWA</b> 的 Authorisation Bypass。重点练习"用两个账号互相测"的思路。',
quiz:[['"订单号用随机 UUID，所以不需要权限检查"。对吗？',['对，猜不到就安全','不对，ID 会泄露、被分享，授权才是根本','对，除非有人爆破','不对，但 UUID 没任何帮助'],1,'不可猜测是加分项，但链接分享、日志、Referer 都可能泄露 ID。'],['哪个是垂直越权？',['小明读小红的订单','普通用户调用删除用户接口','小明改自己的昵称','管理员读订单'],1,'垂直 = 跨越角色层级。'],['接口对越权请求，推荐返回？',['403 并说明"该订单属于别人"','404 / 统一的无权限响应，不泄露信息','200 空对象','500'],1,'说明"属于别人"会泄露资源存在性。']],
myths:[['「前端隐藏了就没人能调」','抓包或直接构造请求，完全不经过前端。'],['「登录就有权限」','认证与授权是两件事。'],['「隐藏的接口地址别人不知道」','靠隐蔽性不是安全；前端代码、文档、日志都能暴露地址。']],
report:{title:'【高危】example.test 订单详情接口水平越权（虚构示例）',asset:'GET https://shop.example.test/api/orders/{id}（虚构）',summary:'接口只校验登录，未校验订单归属，可通过修改 id 读取其他用户订单（姓名、手机号、地址）。',steps:['注册两个测试账号 A、B，分别各下一单，记下订单号 a、b。','以 A 的会话请求 /api/orders/b，返回 B 的订单详情。','<b>仅使用自己的两个账号验证</b>，未遍历或读取任何真实用户数据。'],impact:'订单号为自增整数，理论上可被批量遍历，涉及全部用户的收货信息。',fix:'查询时加入属主条件；非属主返回 404；订单号改用不可预测标识作为附加措施。',severity:'高危（涉及个人敏感信息，可批量）。'},
links:[['OWASP：授权速查表','https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html'],['OWASP：IDOR 防护','https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html'],['OWASP Top 10 A01 访问控制失效','https://owasp.org/Top10/A01_2021-Broken_Access_Control/']]},

{id:'v04-csrf',title:'CSRF 跨站请求伪造',short:'借你的登录态，替你做了你没想做的事',
one:'CSRF 是指：你登录了 A 网站后，访问了恶意的 B 网站，B 让你的浏览器向 A 发出一个请求；浏览器会自动附上 A 的 Cookie，A 以为是你本人操作。',
analogy:'你在银行有一张"自动盖章的授权卡"（Cookie），只要有人拿着你的名义的单子到柜台，卡就会自动盖章。骗子给你寄一张看似无害的传单，传单背面其实是"转账单"，你一"翻面"（点击/加载），章就盖上了。',
cause:['根因：<b>浏览器自动携带 Cookie</b>，而服务器仅凭 Cookie 判断"是不是你"，无法区分"你主动发的"与"别的网站诱导你发的"。',[
['改状态用 GET','GET 请求会被图片、链接等无需交互地触发。','// 有漏洞\nGET /transfer?to=bob&amount=100   // 仅靠 Cookie 认证'],
['POST 无令牌','外站的表单可以自动提交到你的站点。','// 有漏洞：POST 改密码，只验证 Cookie\nPOST /user/password   body: new=...'],
['Cookie 无 SameSite','老的默认行为是跨站也会带 Cookie；现代浏览器默认 Lax 但不应依赖默认值。','Set-Cookie: sid=abc   // 未显式声明']]],
harm:[['高','资金/账号相关操作（转账、改密码绑定邮箱）可被伪造 → 账号接管。'],['中','修改资料、发帖、关注等有一定影响的写操作。'],['低','登出、无关紧要的偏好设置（多数 SRC 不收）。'],['决定等级的因素','被伪造的操作有多敏感、是否需要额外验证（原密码/验证码）、有无现成防护被绕过。']],
fix:['修复原则：<b>让服务器能确认"这个请求确实来自我自己的页面"</b>。','// 1) SameSite：跨站请求不带 Cookie（首选的第一层）\nSet-Cookie: sid=...; HttpOnly; Secure; SameSite=Lax   // 敏感站可用 Strict\n\n// 2) CSRF Token：表单里嵌入随机令牌，服务端比对（外站读不到你的页面）\n<input type="hidden" name="csrf" value="{{ session.csrf_token }}">\nif request.form["csrf"] != session["csrf_token"]: abort(403)\n\n// 3) 校验 Origin / Referer 是否为本站\n// 4) 改状态绝不用 GET；敏感操作二次验证（原密码/短信）\n// 5) 纯 JSON API：要求自定义头（跨站无法在不触发预检的情况下带）'],
audit:['所有"改状态"的接口：是 GET 吗？有没有 CSRF Token / Origin 校验？','Cookie 是否显式设置 SameSite？是否存在 <code>SameSite=None</code> 的必要性？','Token 是否绑定会话、是否可预测、是否可被其他接口泄露？','CORS 是否错误地允许任意来源并带凭证（会放大风险，见第 4 课）。'],
lab:{intro:'模拟：你已登录 bank.example。选择"请求从哪里发出"、请求方式，以及 Cookie 的 SameSite 设置，看银行服务器是否会执行转账。（纯本地逻辑模拟。）',inputs:[{id:'o',label:'请求来源',type:'select',options:[['same','bank.example 自己的页面'],['cross','evil.example 的页面（外站）']]},{id:'m',label:'方式',type:'select',options:[['POST','POST 表单'],['GET','GET（点链接/加载图片）']]},{id:'s',label:'Cookie SameSite',type:'select',options:[['None','None'],['Lax','Lax'],['Strict','Strict']]}],safeLabel:'服务端校验 CSRF Token',presets:[['本站页面提交',{o:'same',m:'POST',s:'Lax'}],['外站 POST，Cookie 为 None',{o:'cross',m:'POST',s:'None'}],['外站 POST，Cookie 为 Lax',{o:'cross',m:'POST',s:'Lax'}],['外站 GET 链接，Cookie 为 Lax',{o:'cross',m:'GET',s:'Lax'}]],
run(v,safe){var cross=v.o==='cross';var sent=!cross||v.s==='None'||(v.s==='Lax'&&v.m==='GET');var lines=['Cookie 是否被浏览器附带：'+(sent?'是':'否（被 SameSite 拦截）')];if(!sent){return{out:lines.join('\n')+'\n结果：服务器看到未登录请求 → 拒绝',bad:false,note:'✅ SameSite 起了作用。注意：Lax 下"顶级导航的 GET"仍会带 Cookie，所以改状态不能用 GET。'}}
if(cross&&safe){return{out:lines.join('\n')+'\nCSRF Token：外站拿不到 → 缺失/不匹配\n结果：403 拒绝',bad:false,note:'✅ 双重保险：即使 Cookie 被带上，没有 Token 也不会执行。'}}
return{out:lines.join('\n')+'\n结果：'+(cross?'已执行转账 100 元（用户毫不知情）':'已执行转账（这是用户自己点的）'),bad:cross,note:cross?'❌ 外站诱导成功：服务器无法区分这是不是用户本意。':'来自本站，正常。'}}},
range:'本地靶场：<b>DVWA</b> 的 CSRF 模块；<b>pikachu</b> 的 CSRF（get/post/token）。练习：对比 Low 与 High 的源码，看 High 加了什么。',
quiz:[['防 CSRF 最核心的思路是？',['隐藏接口地址','让服务端能验证请求确实来自本站页面','加验证码在登录页','使用 HTTPS'],1,'HTTPS 不影响浏览器自动带 Cookie。'],['SameSite=Lax 下，哪种跨站请求仍带 Cookie？',['跨站 POST 表单','顶级导航的 GET（点链接）','跨站图片加载','XHR'],1,'这就是"改状态不用 GET"的原因。'],['纯 JSON API，必须带自定义头 + CORS 严格，为什么有帮助？',['头越多越安全','跨站带自定义头会触发预检，被 CORS 拦截','服务器喜欢','没帮助'],1,'这依赖 CORS 配置正确，见第 4 课。']],
myths:[['「用 POST 就不会有 CSRF」','外站表单可以自动提交 POST。'],['「有 Referer 检查就够」','Referer 可能为空，须定义空值策略；仍建议配合 Token。'],['「CSRF Token 放在 Cookie 里就行」','需要服务端比对且来源不可被攻击者设置，否则失效。']],
report:{title:'【中危】example.test 修改绑定邮箱接口缺少 CSRF 防护（虚构示例）',asset:'POST https://account.example.test/api/email/bind（虚构）',summary:'绑定邮箱接口仅依赖 Cookie，无 Token，Cookie 无 SameSite；外站页面可诱导已登录用户提交。',steps:['登录自己的测试账号，抓取绑定邮箱请求，确认没有 Token、Referer 校验。','在<b>自己控制的本地页面</b>放置一个指向该接口、字段为自己第二个测试邮箱的表单，用同一浏览器打开并提交。','账号绑定邮箱被修改（只在自己的测试账号上验证）。'],impact:'配合"邮箱找回密码"可接管账号。',fix:'加入 CSRF Token；Cookie 设置 SameSite=Lax；绑定需二次验证。',severity:'中危~高危（取决于可否接管账号）。'},
links:[['OWASP：CSRF 防护速查表','https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html'],['MDN：SameSite','https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Cookies#samesite_属性']]},

{id:'v05-ssrf',title:'SSRF 服务端请求伪造',short:'让服务器替你去访问"你自己访问不了"的地方',
one:'SSRF 是指：服务端会根据用户提供的 URL 去发起请求，攻击者借此让服务器去访问内网、本机或云元数据等"外部无法直接访问"的资源。',
analogy:'公司前台有一条规矩："访客说想要哪份文件，我就进内部档案室去拿"。如果访客说"请把保险柜里的文件拿来"，前台照办了。前台有内部通行证，而访客没有。',
cause:['常见于"远程拉取"类功能：URL 预览/抓取、图片转存、Webhook、导入、PDF 生成、第三方登录回调。服务器所处的网络位置有特权。',[
['直接使用 URL','没做任何限制。','// 有漏洞\nurl = request.args["url"]\nimg = http_get(url)        // 想访问谁就访问谁\nreturn img'],
['弱校验','只检查字符串，如"URL 以 example.com 开头"或黑名单 127.0.0.1。','if "127.0.0.1" not in url:      // 字符串黑名单\n    http_get(url)\n// 域名解析、进制写法、跳转都可能绕过字符串检查'],
['跟随跳转','校验了第一个 URL，但允许 302 跳到别处。','http_get(url, follow_redirects=True)   // 跳转目的地未校验']]],
harm:[['严重','访问云厂商元数据服务取得临时凭证，进而控制云资源；访问内网管理后台。'],['高','探测内网存活服务、读取内网接口数据。'],['中','只能访问外网、且无回显（Blind SSRF），可用于端口/存活探测。'],['决定等级的因素','能否回显响应内容、能访问的内网是什么、是否在云环境、能否使用非 HTTP 协议。']],
fix:['修复原则：<b>只允许访问明确列出的目标；解析后校验 IP；不跟随未校验的跳转</b>。','// 1) 能用白名单就用白名单（只允许已知域名）\nALLOW = {"img.example.com", "cdn.example.com"}\n\n// 2) 必须开放时：自己解析 DNS，对"解析后的 IP"做校验，再用该 IP 连接（防 DNS 重绑定）\nip = resolve(host)\nif ip.is_private or ip.is_loopback or ip.is_link_local: abort(400)\n\n// 3) 仅允许 http/https，禁止 file/gopher 等\n// 4) 禁用自动跳转，或每一跳都重复校验\n// 5) 出站网络隔离：抓取服务放在无内网访问权限的子网；云上启用更安全的元数据访问方式（如 IMDSv2）\n// 6) 不把响应原样回显给用户'],
audit:['找所有"服务器去请求用户给的地址"的功能：预览、导入、回调、截图、文件转存。','校验是在字符串层面，还是解析后的 IP 层面？跳转、IPv6、DNS 重绑定是否考虑？','抓取服务所在网络是否可访问内网与元数据地址？','错误信息是否区分"连得上/连不上"（会变成探测器）？'],
lab:{intro:'一个"网页预览"功能。服务器所在的<b>假网络</b>里有公网图片、内网管理页和云元数据服务（全部是编造的假数据）。看看对不同 URL，两种实现的结果。',inputs:[{id:'u',label:'预览 URL',value:'http://img.example.com/logo.png'}],safeLabel:'白名单 + 内网地址拦截',presets:[['正常外部图片',{u:'http://img.example.com/logo.png'}],['内网管理页',{u:'http://10.0.0.5/admin'}],['本机服务',{u:'http://127.0.0.1:8080/'}],['云元数据（假）',{u:'http://169.254.169.254/latest/meta-data/'}]],
run(v,safe){var NET={'img.example.com':'[图片数据 …PNG…]','10.0.0.5':'内部管理后台（假）：用户管理 / 数据导出','127.0.0.1':'本机调试接口（假）：/status ok','169.254.169.254':'元数据（假）：{"AccessKeyId":"FAKE-ACCESS-KEY","Token":"fake-token"}'};var m=/^https?:\/\/([^\/:]+)/i.exec(v.u);if(!m)return{out:'400 非法 URL',bad:false,note:'仅接受 http/https。'};var h=m[1].toLowerCase();var internal=/^(10\.|127\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h);if(safe){if(h!=='img.example.com')return{out:'403 目标不在白名单：'+h+(internal?'（内网/保留地址）':''),bad:false,note:'✅ 白名单优先；即使开放，也在解析后拦截内网/回环/链路本地地址。'}}
var d=NET[h];return{out:d?'服务器代为请求 '+v.u+'\n响应：'+d:'服务器请求失败：无法连接',bad:!safe&&internal&&!!d,note:(!safe&&internal&&d)?'❌ 服务器把"外部看不到的内部内容"带给了用户：这就是 SSRF。':'正常的外部请求。'}}},
range:'本地靶场：<b>WebGoat</b> 有 SSRF 课；<b>pikachu</b> 的 SSRF（curl / file_get_contents）。可在本机用两个容器搭一个"内部服务"做实验，务必绑 127.0.0.1。',
quiz:[['防 SSRF 最稳妥的做法是？',['拦截含 127.0.0.1 的 URL','域名/目标白名单 + 解析后校验 IP + 出站隔离','只允许 https','限制 URL 长度'],1,'字符串黑名单极易被绕过。'],['为什么要禁止/逐跳校验 HTTP 跳转？',['跳转很慢','合法外部地址可以 302 到内网地址','跳转不安全因为 http','没有原因'],1,'校验的是"最终请求到哪里"。'],['无回显的 SSRF 还有危害吗？',['没有','有：可探测内网、触发内网接口（带副作用的请求）','只有 DoS','仅信息泄露'],1,'Blind SSRF 也能打到内网里"一个 GET 就生效"的接口。']],
myths:[['「只允许 https 就安全」','内网的 https 服务依然存在。'],['「过滤了 localhost / 127.0.0.1 就够了」','IP 有多种写法，域名可解析到内网，应在解析后校验。'],['「内网服务没有认证因为在内网」','SSRF 正是把"可信内网"变成攻击面。']],
report:{title:'【高危】example.test 链接预览功能 SSRF 可访问内网服务（虚构示例）',asset:'POST https://app.example.test/api/preview {"url": ...}（虚构）',summary:'预览接口会由服务端请求用户提供的 URL 并回显内容，未限制目标地址。',steps:['提交指向自己控制的服务器的 URL，在自己服务器日志看到来自目标的出站请求，证明服务端会发起请求。','用<b>规则允许范围内</b>的最小验证：请求一个明确属于测试环境的内部健康检查地址，响应被回显。','未访问元数据、未读取任何凭证或业务数据。'],impact:'可访问内网服务；云环境下可能进一步取得凭证（未验证）。',fix:'目标白名单；解析后 IP 校验；禁用跳转；出站隔离；不回显响应。',severity:'高危（可内网访问且有回显）。'},
links:[['OWASP：SSRF 防护速查表','https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html'],['OWASP Top 10 A10 SSRF','https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/']]}
];
