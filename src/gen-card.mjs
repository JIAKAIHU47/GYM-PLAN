import fs from 'node:fs';
import path from 'node:path';
import { meta, days, dessert, forbidden, redFlags, painTree, tests, phases, weekly } from './data.mjs';

const ROOT = '/Users/mac/Desktop/健身计划';
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* =========================================================
   交互训练卡 —— 全静态优先（iOS「文件」预览会禁用 JS）
   1) 所有内容直接写在 HTML 里，不依赖脚本渲染
   2) 打勾用原生 <input type=checkbox>，无需 JS
   3) 四种分期参数全部同时显示（只读你当前那一档）
   4) 导航用锚点 + 原生滚动，无需 JS
   5) 计时器 / 进度 / 记住打勾 = JS 增强，脚本被禁时自动隐藏，不会出现空壳
   ========================================================= */

const allDays = [...days, dessert];

const PHASE_LABEL = ['B1', 'B2', 'B3', 'B4'];

function itemHTML(d, bi, ii, it) {
  const id = `${d.id}b${bi}i${ii}`;
  const ps = it.p.map((x, i) => `<span class="p"><i>${PHASE_LABEL[i]}</i>${esc(x)}</span>`).join('');
  return `<label class="item">
<input type="checkbox" id="${id}" data-k="${id}">
<div class="body">
<div class="nm">${esc(it.n)}</div>
<div class="ps">${ps}</div>
<div class="cue"><b>${esc(it.t)}</b>${esc(it.c)}</div>
${it.a ? `<div class="alt">替代：${esc(it.a)}</div>` : ''}
</div>
</label>`;
}

function daySection(d) {
  const blocks = d.blocks.map((b, bi) => `<div class="blk">
<div class="blkhead"><span>${esc(b.name)}</span><em>${esc(b.time)}</em></div>
${b.items.map((it, ii) => itemHTML(d, bi, ii, it)).join('\n')}
</div>`).join('\n');
  return `<section id="${d.id}">
<div class="daytop">
  <div class="code">${esc(d.code)}</div>
  <div>
    <h2>${esc(d.name)}</h2>
    <div class="meta">⏱ ${esc(d.time)} ｜ ${d.tags ? d.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('') : ''}</div>
  </div>
</div>
${d.note ? `<p class="note">${esc(d.note)}</p>` : ''}
${blocks}
</section>`;
}

const safetySection = `<section id="safety">
<div class="daytop"><div class="code">!</div><div><h2>安全闸门 · 红线 · 自查</h2><div class="meta">每周看一次，练前 60 秒看一次</div></div></div>
<div class="blk">
<div class="blkhead"><span>三级决策树（决定这周加不加量）</span></div>
${painTree.map(([a, b]) => `<div class="srow"><div class="sa">${esc(a)}</div><div class="sb">${esc(b)}</div></div>`).join('')}
</div>
<div class="blk">
<div class="blkhead"><span>红线清单 · 出现即停</span></div>
${redFlags.map(([a, b]) => `<div class="srow"><div class="sa red">${esc(a)}</div><div class="sb">${esc(b)}</div></div>`).join('')}
</div>
<div class="blk">
<div class="blkhead"><span>永久排除的动作</span></div>
${forbidden.map(([a, b]) => `<div class="srow"><div class="sa">× ${esc(a)}</div><div class="sb">${esc(b)}</div></div>`).join('')}
</div>
<div class="blk">
<div class="blkhead"><span>开练前 60 秒自查</span></div>
<div class="srow"><div class="sb">① 今天腰的感觉（NRS 0-10）比上周一高还是低？<br>② 有没有新的腿部症状（麻 / 刺 / 放射 / 无力）？<br>③ 昨晚睡够 6.5 小时了吗？不够 → 主项 -1 组、RPE -1。<br>④ 90/90 呼吸能不能 360° 撑开肋骨？不能 → 先做 5 分钟猫牛 + 呼吸。</div></div>
</div>
</section>`;

const testSection = `<section id="test">
<div class="daytop"><div class="code">T</div><div><h2>测试电池 · 分期</h2><div class="meta">W1 / W8 / W16 各测一次</div></div></div>
<div class="blk">
<div class="blkhead"><span>测试项目</span></div>
${tests.map((t) => `<div class="srow"><div class="sa">${esc(t.n)}</div><div class="sb"><b>${esc(t.d)}</b><br>${esc(t.base)}</div></div>`).join('')}
</div>
<div class="blk">
<div class="blkhead"><span>十六周分期（到点就换一档看）</span></div>
${phases.map((p) => `<div class="srow"><div class="sa">${esc(p.id)} · ${esc(p.weeks)} · ${esc(p.name)}</div><div class="sb">${esc(p.goal)}<br><b style="color:var(--am)">${esc(p.key)}</b><br>${esc(p.deload)}</div></div>`).join('')}
</div>
</section>`;

const weeklyBar = `<div class="week">
${weekly.map((w) => `<div class="wd${w.w === '—' ? ' off' : ''}"><b>${esc(w.d.slice(-1))}</b><span>${w.w === '—' ? '休息' : esc(w.w)}</span></div>`).join('')}
</div>`;

const cardHTML = `<!DOCTYPE html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="format-detection" content="telephone=no">
<meta name="theme-color" content="#0e1116">
<title>QB 训练卡</title>
<style>
:root{--bg:#0e1116;--card:#171c23;--card2:#1d242d;--line:#2a333f;--tx:#e9eef4;--dim:#8b98a6;--am:#ffb02e;--rd:#ff5c47;--gn:#3ec98a;}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html{scroll-behavior:smooth;}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.5 -apple-system,"PingFang SC","Hiragino Sans GB",sans-serif;padding-bottom:40px;}
h1{font-size:15px;margin:0;letter-spacing:.5px;color:var(--tx);font-weight:800;}
.top{padding:calc(env(safe-area-inset-top) + 10px) 14px 10px;border-bottom:1px solid var(--line);}
.top .sub{font-size:12px;color:var(--dim);margin-top:4px;line-height:1.5;}
.top .sub b{color:var(--am);}
nav{position:sticky;top:0;z-index:30;display:flex;gap:6px;overflow-x:auto;padding:8px 12px;background:rgba(14,17,22,.97);-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);scrollbar-width:none;}
nav::-webkit-scrollbar{display:none;}
nav a{flex:0 0 auto;background:var(--card);border:1px solid var(--line);color:var(--tx);text-decoration:none;font-size:13px;font-weight:700;padding:9px 13px;border-radius:10px;}
nav a.on{background:var(--am);border-color:var(--am);color:#161a1f;}
nav a.sf{border-color:#4a2a26;color:#ff8f7d;}
.week{display:flex;gap:6px;padding:10px 12px 4px;overflow-x:auto;scrollbar-width:none;}
.week::-webkit-scrollbar{display:none;}
.wd{flex:0 0 auto;text-align:center;background:var(--card);border:1px solid var(--line);border-radius:9px;padding:5px 9px;font-size:11px;color:var(--dim);line-height:1.35;}
.wd b{display:block;color:var(--am);font-size:13px;}
.wd.off b{color:#5c6874;}
main{padding:6px 12px 0;}
section{scroll-margin-top:58px;padding-bottom:18px;}
.daytop{display:flex;gap:12px;align-items:flex-start;padding:16px 2px 10px;border-bottom:2px solid var(--am);margin-bottom:12px;}
.code{flex:0 0 auto;font-size:22px;font-weight:800;color:var(--am);line-height:1.1;min-width:44px;}
h2{font-size:17px;margin:0;line-height:1.3;font-weight:800;}
.meta{font-size:11.5px;color:var(--dim);margin-top:5px;}
.tag{background:#233040;color:#9fb3c6;padding:1px 6px;border-radius:8px;font-size:10.5px;margin-right:3px;}
.note{margin:0 0 12px;font-size:13px;color:var(--dim);background:var(--card);border:1px solid var(--line);border-left:3px solid var(--am);border-radius:10px;padding:10px 12px;}
.blk{margin-bottom:14px;background:var(--card);border:1px solid var(--line);border-radius:14px;overflow:hidden;}
.blkhead{display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:11px 13px;background:var(--card2);font-size:13.5px;font-weight:800;color:var(--am);border-bottom:1px solid var(--line);}
.blkhead em{font-style:normal;font-size:11.5px;color:var(--dim);font-weight:400;flex:0 0 auto;}
.item{display:flex;gap:10px;padding:12px 13px;border-bottom:1px solid var(--line);align-items:flex-start;cursor:pointer;}
.item:last-of-type{border-bottom:none;}
.item input{flex:0 0 auto;width:26px;height:26px;margin:1px 0 0;accent-color:#3ec98a;}
.body{flex:1;min-width:0;}
.nm{font-size:16px;font-weight:700;line-height:1.35;margin-bottom:7px;}
.ps{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:7px;}
.p{display:inline-block;background:#2b3644;color:#cfe0ef;font-size:13px;font-weight:700;padding:3px 8px;border-radius:7px;white-space:nowrap;}
.p i{font-style:normal;color:#7d8fa1;font-weight:800;font-size:10.5px;margin-right:5px;letter-spacing:.5px;}
.cue{font-size:13px;color:#a9b6c4;line-height:1.5;}
.cue b{color:var(--am);font-weight:800;font-size:11.5px;background:#2b3644;padding:1px 6px;border-radius:5px;margin-right:5px;}
.alt{font-size:11.5px;color:#6f7d8b;margin-top:5px;}
.item input:checked ~ .body{opacity:.4;}
.item input:checked ~ .body .nm{text-decoration:line-through;}
.srow{padding:11px 13px;border-bottom:1px solid var(--line);}
.srow:last-child{border-bottom:none;}
.sa{font-size:14px;font-weight:700;color:var(--tx);margin-bottom:4px;line-height:1.4;}
.sa.red{color:var(--rd);}
.sb{font-size:13px;color:var(--dim);line-height:1.55;}
footer{font-size:12px;color:#5c6874;padding:14px 16px 30px;line-height:1.7;border-top:1px solid var(--line);margin-top:8px;}
footer b{color:#8b98a6;}
/* —— JS 增强部分：默认隐藏，脚本可用时才出现 —— */
#topen{position:fixed;left:14px;bottom:calc(env(safe-area-inset-bottom) + 14px);z-index:40;background:var(--am);color:#161a1f;border:none;font:800 15px/1 inherit;padding:14px 16px;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.45);}
#topen,#timer,#prog{display:none;}
body.js #topen{display:block;}
body.js #prog{display:flex;}
body.js #timer.ready{display:none;}
body.js #timer.ready.open{display:block;}
#prog{position:fixed;left:0;right:0;bottom:0;z-index:39;background:rgba(23,28,35,.97);border-top:1px solid var(--line);padding:8px 14px calc(env(safe-area-inset-bottom) + 8px);align-items:center;gap:10px;font-size:12px;color:var(--dim);}
.track{flex:1;height:6px;background:#2a333f;border-radius:3px;overflow:hidden;}
.fill{height:100%;width:0;background:linear-gradient(90deg,var(--am),#ff7a2e);transition:width .25s;}
#pnum{color:var(--am);font-weight:800;font-size:13px;}
#timer{position:fixed;left:0;right:0;bottom:0;z-index:50;background:#0b0e12;border-top:2px solid var(--am);padding:18px 16px calc(env(safe-area-inset-bottom) + 16px);text-align:center;}
#tt{font:800 58px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:-2px;margin-bottom:14px;}
#tt.warn{color:var(--rd);}
#tt.done{color:var(--gn);}
.tbtns{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;}
.tbtns button{background:var(--card2);border:1px solid var(--line);color:var(--tx);font:700 15px/1 inherit;padding:14px 15px;border-radius:12px;min-width:62px;font-family:inherit;}
.tbtns button.pri{background:var(--am);color:#161a1f;border-color:var(--am);}
</style></head><body>

<div class="top">
  <h1>QB 训练卡 <span style="color:#5c6874;font-weight:600;font-size:12px">· ${esc(meta.ver)}</span></h1>
  <div class="sub">点一下动作就打勾 ｜ 参数四档全列出，<b>只读你当前分期那一档</b>（B1=W1-4，B2=W5-8，B3=W9-12，B4=W13-16）</div>
</div>

<nav>
${allDays.map((d) => `<a href="#${d.id}">${esc(d.code)}</a>`).join('\n')}
<a href="#safety" class="sf">安全</a>
<a href="#test">测试</a>
</nav>
${weeklyBar}

<main>
${allDays.map(daySection).join('\n')}
${safetySection}
${testSection}
</main>

<footer>
<b>打勾</b>：点整行即可（原生复选框，不依赖脚本）。<br>
<b>计时器</b>：右下角「⏱」只在脚本可用的环境出现；如果这里没有那个按钮（例如 iOS「文件」预览禁用了脚本），用系统「时钟 → 计时器」代替，或者把本文件放到 Safari / 主屏幕打开。<br>
<b>参数写法</b>：4×8/腿 = 4 组 × 每腿 8 次；RPE 7-8 = 留 1-2 次余力；节奏 3-1-2 = 下放 3 秒·底停 1 秒·举起 2 秒。<br>
<b>免责</b>：不构成医疗建议。出现腿部麻木 / 放射痛 / 无力 / 鞍区症状 → 停练就医。
</footer>

<div id="prog"><span>今日</span><div class="track"><div class="fill" id="fill"></div></div><span id="pnum">0/0</span></div>
<button id="topen">⏱ 计时</button>
<div id="timer">
  <div id="tt">--:--</div>
  <div class="tbtns">
    <button data-s="45">45s</button>
    <button data-s="60">60s</button>
    <button data-s="90">90s</button>
    <button data-s="120">120s</button>
    <button data-s="180">180s</button>
    <button id="treset">清空打勾</button>
    <button class="pri" id="tclose">关闭</button>
  </div>
</div>

<script>
(function(){
  var body = document.body;
  try { body.classList.add('js'); } catch(e){}
  var KEY = 'qb-card-v2', store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch(e){ store = {}; }
  var boxes = [].slice.call(document.querySelectorAll('.item input[data-k]'));

  function save(){ try { localStorage.setItem(KEY, JSON.stringify(store)); } catch(e){} }
  function progress(){
    var done = boxes.filter(function(b){ return b.checked; }).length;
    var f = document.getElementById('fill'), n = document.getElementById('pnum');
    if (f) f.style.width = boxes.length ? (done / boxes.length * 100) + '%' : '0%';
    if (n) n.textContent = done + '/' + boxes.length;
  }
  boxes.forEach(function(b){
    if (store[b.dataset.k]) b.checked = true;
    b.addEventListener('change', function(){
      if (b.checked) store[b.dataset.k] = 1; else delete store[b.dataset.k];
      save(); progress();
    });
  });
  progress();

  /* 高亮当前正在看的训练日 */
  var links = [].slice.call(document.querySelectorAll('nav a[href^="#"]'));
  function hl(){
    var y = window.scrollY + 90, best = links[0];
    links.forEach(function(a){
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el && el.offsetTop <= y) best = a;
    });
    links.forEach(function(a){ a.classList.toggle('on', a === best); });
  }
  window.addEventListener('scroll', hl, { passive: true });
  hl();

  /* 计时器 */
  var timer = document.getElementById('timer'), tt = document.getElementById('tt');
  var left = 0, tid = null, ac = null;
  if (timer && tt) {
    timer.classList.add('ready');
    function fmt(s){ var m = Math.floor(s / 60), r = s % 60; return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r; }
    function beep(){
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        [0, .28, .56].forEach(function(d){
          var o = ac.createOscillator(), g = ac.createGain();
          o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
          var t0 = ac.currentTime + d;
          g.gain.setValueAtTime(.0001, t0);
          g.gain.exponentialRampToValueAtTime(.35, t0 + .02);
          g.gain.exponentialRampToValueAtTime(.0001, t0 + .22);
          o.start(t0); o.stop(t0 + .24);
        });
      } catch(e){}
      if (navigator.vibrate) navigator.vibrate([120, 80, 120, 80, 200]);
    }
    function tick(){
      left--;
      if (left <= 0){ clearInterval(tid); tid = null; tt.textContent = 'GO'; tt.className = 'done'; beep(); return; }
      tt.textContent = fmt(left);
      tt.className = left <= 10 ? 'warn' : '';
    }
    [].forEach.call(timer.querySelectorAll('button[data-s]'), function(b){
      b.addEventListener('click', function(){
        if (tid) clearInterval(tid);
        left = parseInt(b.dataset.s, 10);
        tt.textContent = fmt(left); tt.className = '';
        tid = setInterval(tick, 1000);
      });
    });
    document.getElementById('topen').addEventListener('click', function(){ timer.classList.add('open'); });
    document.getElementById('tclose').addEventListener('click', function(){
      timer.classList.remove('open');
      if (tid){ clearInterval(tid); tid = null; }
      tt.textContent = '--:--'; tt.className = '';
    });
    document.getElementById('treset').addEventListener('click', function(){
      if (!confirm('清空所有打勾？')) return;
      boxes.forEach(function(b){ b.checked = false; });
      store = {}; save(); progress();
    });
  }
})();
</script>
</body></html>`;

fs.writeFileSync(path.join(ROOT, 'QB训练卡.html'), cardHTML, 'utf8');
console.log('QB训练卡.html ✓', (cardHTML.length / 1024).toFixed(1), 'KB  (静态内容，无需 JS 即可阅读/打勾)');

/* ======================= 手机速查卡 txt ======================= */
const L = [];
const pad = (n) => n;
L.push('QB 训练速查卡 ' + meta.ver);
L.push('L5-S1 术后 10 个月 · 16 周 · 每周 4 练 + 1 甜点日');
L.push('');
L.push('【参数怎么看】');
L.push('B1/B2/B3/B4 = 第1-4周 / 5-8 / 9-12 / 13-16 周');
L.push('照你当前那一档练，只做那一档。');
L.push('例：4×8/腿 = 4 组 × 每腿 8 次');
L.push('RPE 7-8 = 还能再做 1-2 次就停（永不力竭）');
L.push('节奏 3-1-2 = 下放3秒·底停1秒·举起2秒');
L.push('');
L.push('【每周排程】');
weekly.forEach((w) => {
  L.push(w.w === '—' ? (w.d + ' 休息 ｜ ' + w.t.replace(/^休息 \/ /, '')) : (w.d + ' ' + w.w + ' ' + w.t));
});
L.push('');
L.push('【每天开场 3 分钟（雷打不动）】');
L.push('90/90 呼吸 2×5 呼吸 → 单腿臀桥 2×8/侧');
L.push('这两项就不舒服 → 今天降一档，别硬上。');
L.push('');
L.push('【腿部单腿的三个例外（都零压缩，放行）】');
L.push('雪橇推 / 站姿提踵 / 器械髋外展');
L.push('');

allDays.forEach((d) => {
  L.push('━━━━━━━━━━━━━━');
  L.push(d.code + '｜' + d.name);
  L.push('⏱ ' + d.time);
  if (d.note) L.push('※ ' + d.note);
  L.push('');
  d.blocks.forEach((b) => {
    L.push('· ' + b.name + '（' + b.time + '）');
    b.items.forEach((it) => {
      const p = it.p.join(' / ');
      L.push('  □ ' + it.n);
      L.push('     ' + p);
      L.push('     ' + it.t + '｜' + it.c);
      if (it.a) L.push('     替代：' + it.a);
    });
    L.push('');
  });
});

L.push('━━━━━━━━━━━━━━');
L.push('【安全闸门 · 记死这几条】');
L.push('');
L.push('每周决策：');
painTree.forEach(([a, b]) => { L.push('· ' + a); L.push('  → ' + b); });
L.push('');
L.push('红线（出现即停，别扛）：');
redFlags.forEach(([a, b]) => { L.push('· ' + a); L.push('  → ' + b); });
L.push('');
L.push('永久不做的动作：');
forbidden.forEach(([a]) => L.push('× ' + a));
L.push('');
L.push('【测试】W1 / W8 / W16 各测一次');
tests.forEach((t) => { L.push('· ' + t.n + '（' + t.d + '）'); });
L.push('');
L.push('【每天练完填 3 行】');
L.push('日期 / 主项重量×次数 / 腰的感觉 NRS 0-10');
L.push('');
L.push('生成于本地 · 不构成医疗建议 · 有新神经症状请就医');

fs.writeFileSync(path.join(ROOT, '手机速查卡.txt'), L.join('\n'), 'utf8');
console.log('手机速查卡.txt ✓', (L.join('\n').length / 1024).toFixed(1), 'KB');
