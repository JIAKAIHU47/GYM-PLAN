import fs from 'node:fs';
import path from 'node:path';
import {
  meta, advisors, decisions, budget, phases, weekly, coreLib, days, dessert,
  forbidden, redFlags, painTree, tests, nutrition, phoneMethods, sources,
} from './data.mjs';

const ROOT = '/Users/mac/Desktop/健身计划';
const OUT = path.join(ROOT, 'build/out');
fs.mkdirSync(OUT, { recursive: true });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------------- 核心类别 × 训练日 分布矩阵 ---------------- */
const coreMatrix = {
  head: ['D1', 'D2', 'D3', 'D4', 'D5'],
  rows: [
    ['① 抗伸展', '负重死虫', '半跪腹轮 / 平板肩拍', '死虫（长杠杆）', '平板肩拍', '死虫 8/侧'],
    ['② 抗侧屈', '手提箱行走', '侧板 + 上举腿', '手提箱等长 / 单臂农夫走', '—', '侧板 20s/侧'],
    ['③ 抗旋转', '半跪 Pallof', '半跪 Cable Chop', '单臂农夫走（旋转控制）', '半跪 Pallof / 单臂下拉', '鸟狗 8/侧'],
    ['④ 旋转爆发', '药球旋转抛', '—', '药球旋转抛 / 侧抛', '分腿姿药球旋转抛', '四向药球全谱'],
    ['⑤ 髋伸后链', '单腿臀桥 / 鸟狗', '90/90 呼吸重置', '俯卧背伸等长', '单腿臀桥', '手提箱走 20m'],
    ['每日核心时长', '28 分钟', '22 分钟', '22 分钟', '22 分钟', '20 分钟'],
  ],
};

/* ---------------- 长文内容 ---------------- */
const intro = [
  '这份计划是给「术后 10 个月、已经恢复传球与腰旗、但仍有异样感、已经跟康复教练做过大量核心与臀中/臀小肌稳定性训练」的人写的。它不是一个「生病的人慢慢养」的康复计划，也不是一个「健康人冲大重量」的健身计划——它是一个**术后运动员的力量与爆发力重建方案**。',
  '你给了三个约束：① 保护 L5-S1；② 把核心爆发力练到能服务传球；③ 全身肌肉均衡发展。这三件事在训练场上经常互相打架（体能教练要负荷，康复师要保守，四分卫教练要旋转），所以本计划的写法是：**先开会，再排课**。三位顾问各自表态，我作为总教练做裁决，然后才落成每周四张训练表。',
  '比例上按你说的 30:70 ~ 40:60 执行：每天核心占 22–28 分钟（总时长 72–75 分钟），也就是 **30%–38%**，并且核心训练**每天都有、均匀摊开**，不做「今天核心日、明天腿日」那种安排——因为对腰椎来说，稳定性是每天都需要的东西，不是一周一次的仪式。',
  '腿部全部走单腿路线（保加利亚分腿蹲、单腿 RDL、单腿腿举、反向箭步蹲、雪橇、Cossack），主线里没有任何一个高轴向压缩的杠铃动作。这不是妥协，这是用更少的总负荷拿到更好的单腿力量和更好的传球专项性——四分卫本来就是一个单腿项目。',
  '频率是每周 4 练（周一/二/四/六）+ 1 个「甜点日」（周日，可做可不做），你的判断标准只有一个：**做完甜点日应该比开始更有精神；如果它让你第二天腿沉、腰紧，那它今天就不该存在。**',
];

const rules42 = [
  ['先过关，再上量', '任何一天开练前先做 90/90 呼吸 2×5 与单腿臀桥 2×8。若这两项就已经出现腰部不适或「异样感」加重，今天降一档（见文末三级决策树）。'],
  ['RIR 1-2，永不力竭', '每组在「还能再做 1-2 次标准动作」时停。核心与腰椎的损伤几乎都发生在动作变形的最后两次。'],
  ['速度是爆发力的唯一标准', '药球、跳箱、爆发俯卧撑：只要动作速度明显下降，这一组立刻结束，不追次数。慢的爆发力训练等于没有训练。'],
  ['每第 4 周降量', 'W4 / W8 / W12 组数减半、RPE -1；W16 减量并复测。降量周不是休息周，是让结缔组织追上肌肉的一周。'],
  ['记录一切', '每周至少记：主项重量×次数、腰部感觉 NRS、晨僵时长。4 个月后再看，这张表比任何教练都诚实。'],
  ['髋和胸椎是「替腰打工」的两个部门', '每天热身必须包含髋屈肌拉伸、胸椎旋转、踝背屈。这三处一紧，腰椎当天就要多干活。'],
];

/* ---------------- 打印版 HTML ---------------- */
function printHTML() {
  const dayTable = (d) => {
    const blocks = d.blocks.map((b) => {
      const rows = b.items.map((it) => {
        const p = it.p.map((x) => `<td class="pp">${esc(x)}</td>`).join('');
        return `<tr><td class="ex"><b>${esc(it.n)}</b>${it.a ? `<div class="alt">替代：${esc(it.a)}</div>` : ''}</td>${p}<td class="cue"><span class="tempo">${esc(it.t)}</span> ${esc(it.c)}</td></tr>`;
      }).join('');
      return `<tr class="blockrow"><td colspan="6">${esc(b.name)} <span class="bt">· ${esc(b.time)}</span></td></tr>${rows}`;
    }).join('');
    return `<table class="daytbl">
<colgroup><col style="width:21%"><col style="width:10.5%"><col style="width:10.5%"><col style="width:10.5%"><col style="width:10.5%"><col style="width:37%"></colgroup>
<thead><tr><th>动作</th><th>B1<br><span>W1-4</span></th><th>B2<br><span>W5-8</span></th><th>B3<br><span>W9-12</span></th><th>B4<br><span>W13-16</span></th><th>节奏 / 关键要点</th></tr></thead>
<tbody>${blocks}</tbody></table>`;
  };

  const daySection = (d, i) => `
<section class="day">
  <div class="dayhead">
    <div class="dayno">${esc(d.code)}</div>
    <div>
      <h3>${esc(d.name)}</h3>
      <div class="daymeta">⏱ ${esc(d.time)} ｜ ${d.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join(' ')}</div>
    </div>
  </div>
  ${dayTable(d)}
</section>`;

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<title>QB 核心强化 · 全身力量 · 16 周计划</title>
<style>
@page { size: A4; margin: 14mm 13mm 15mm 13mm; }
* { box-sizing: border-box; }
body { font-family: "STHeiti", "PingFang SC", -apple-system, "Hiragino Sans GB", sans-serif; color:#1b2530; font-size:10pt; line-height:1.62; margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
h1 { font-size:26pt; line-height:1.15; margin:0 0 6px; letter-spacing:-0.5px; }
h2 { font-size:15pt; margin:0 0 10px; padding:0 0 6px; border-bottom:2.5px solid #16324f; color:#16324f; page-break-after:avoid; }
h3 { font-size:12pt; margin:0; color:#16324f; }
h4 { font-size:10.5pt; margin:14px 0 6px; color:#0f4c81; page-break-after:avoid; }
p { margin:0 0 8px; text-align:justify; }
section.sec { page-break-before:always; }
.cover { height:262mm; display:flex; flex-direction:column; justify-content:space-between; page-break-after:always; }
.cover .top { padding-top:14mm; }
.kicker { font-size:9pt; letter-spacing:3px; color:#c2452d; font-weight:700; text-transform:uppercase; }
.cover .sub { font-size:11pt; color:#4a5a6a; margin-top:10px; line-height:1.9; }
.cover .box { border:1.5px solid #16324f; border-radius:10px; padding:14px 16px; background:#f6f8fa; font-size:9.5pt; }
.cover .box b { color:#16324f; }
.rule { height:4px; background:linear-gradient(90deg,#16324f 0%,#16324f 62%,#c2452d 62%,#c2452d 100%); margin:16px 0 18px; }
table { width:100%; border-collapse:collapse; font-size:8.6pt; margin:8px 0 14px; }
th { background:#16324f; color:#fff; text-align:left; padding:6px 7px; font-size:8.4pt; font-weight:600; }
th span { font-weight:400; opacity:.75; font-size:7.4pt; }
td { padding:5px 7px; border-bottom:0.6px solid #dde3ea; vertical-align:top; }
tr:nth-child(even) td { background:#f7f9fb; }
table.plain th { background:#eef2f6; color:#16324f; }
.blockrow td { background:#e8eef4 !important; font-weight:700; color:#16324f; font-size:8.6pt; padding:4px 7px; }
.blockrow .bt { font-weight:400; color:#5b6b7a; }
.daytbl { table-layout:fixed; }
.daytbl td.pp { font-size:8.1pt; color:#26414f; }
.daytbl td.ex { font-size:8.8pt; }
.daytbl td.cue { font-size:8.2pt; color:#3d4d5c; }
.alt { font-size:7.6pt; color:#8a94a0; margin-top:2px; }
.tempo { display:inline-block; background:#fff2ef; color:#c2452d; font-size:7.4pt; padding:0 4px; border-radius:3px; font-weight:700; margin-right:3px; }
.day { margin-bottom:18px; }
.dayhead, .blockrow { page-break-after:avoid; }
thead { display:table-header-group; }
tr { page-break-inside:avoid; }
.dayhead { display:flex; gap:12px; align-items:center; border-left:5px solid #c2452d; padding:4px 0 6px 10px; margin-bottom:6px; }
.dayno { font-size:19pt; font-weight:800; color:#c2452d; line-height:1; }
.daymeta { font-size:8.4pt; color:#5b6b7a; margin-top:3px; }
.tag { background:#e8eef4; color:#16324f; padding:1px 6px; border-radius:8px; font-size:7.6pt; }
.card { border:1px solid #dde3ea; border-radius:8px; padding:10px 13px; margin:0 0 10px; background:#fafbfc; page-break-inside:avoid; }
.card .who { font-size:12.5pt; font-weight:800; color:#16324f; }
.card .rl { font-size:8.6pt; color:#4a5a6a; }
.card .q { font-style:italic; color:#c2452d; font-size:9.5pt; margin:6px 0; }
.card ol { margin:6px 0 0; padding-left:18px; font-size:8.8pt; }
.card li { margin-bottom:4px; }
ul { margin:6px 0 10px; padding-left:18px; }
li { margin-bottom:4px; font-size:9.2pt; }
.two { display:flex; gap:12px; }
.two > div { flex:1; }
.badge { display:inline-block; background:#16324f; color:#fff; font-size:7.6pt; padding:1px 7px; border-radius:3px; margin-right:4px; }
.warn { border-left:4px solid #c2452d; background:#fdf4f2; padding:9px 12px; margin:10px 0; font-size:9pt; page-break-inside:avoid; }
.ok { border-left:4px solid #2f7d5b; background:#f2f8f5; padding:9px 12px; margin:10px 0; font-size:9pt; page-break-inside:avoid; }
.step { counter-reset:none; font-size:8.8pt; }
.toc { columns:2; column-gap:22px; font-size:9.4pt; }
.toc div { margin-bottom:5px; padding-bottom:4px; border-bottom:0.5px dotted #c8d2dc; }
.toc b { color:#16324f; }
.foot { font-size:7.6pt; color:#8a94a0; border-top:0.8px solid #dde3ea; padding-top:6px; margin-top:8px; }
.nb { font-size:8.2pt; color:#5b6b7a; }
</style></head><body>

<div class="cover">
  <div class="top">
    <div class="kicker">Quarterback Training System · Post-Op Edition</div>
    <div class="rule"></div>
    <h1>核心强化 × 全身力量<br>16 周四分卫重建计划</h1>
    <div class="sub">L5-S1 微创术后 10 个月 ｜ 每周 4 练 + 1 个可选甜点日<br>单腿主导 · 旋转爆发 · 核心每日均摊（约占 30-38%）</div>
  </div>
  <div class="box">
    <b>这份计划怎么用</b><br>
    ① 先读「安全闸门」一章，把红线记死；<br>
    ② 找到当前处于哪个分期（B1/B2/B3/B4），只看对应的那一列；<br>
    ③ 每天只做那天的一张表，练完记录；<br>
    ④ 手机端用 <b>QB训练卡.html</b> 打勾和计时，用 <b>PDF</b> 看细节与要点。<br><br>
    <b>版本</b> ${esc(meta.ver)} ｜ <b>周期</b> 16 周（3 个月版：停在第 12 周） ｜ <b>输出</b> 计划书 PDF + 交互训练卡 + 记录表
  </div>
</div>

<section class="sec">
<h2>目录与前提</h2>
<div class="toc">
  <div><b>01</b> 写在前面：这份计划为什么这样写</div>
  <div><b>02</b> 三位顾问的名片</div>
  <div><b>03</b> 三人决策会议：五场冲突的裁决</div>
  <div><b>04</b> 设计逻辑：时间预算、分期、每周安排</div>
  <div><b>05</b> 安全闸门：红线、禁忌、三级决策树</div>
  <div><b>06</b> 四个训练日详表（B1–B4 参数）</div>
  <div><b>07</b> 甜点日（可选第五天）</div>
  <div><b>08</b> 核心动作库：五大类别</div>
  <div><b>09</b> 负荷推进、降量与进阶规则</div>
  <div><b>10</b> 测试电池与记录方法</div>
  <div><b>11</b> 营养与恢复</div>
  <div><b>12</b> 把计划装进手机（iPhone 四种方案）</div>
  <div><b>13</b> 参考文献</div>
</div>

<h4>前提与免责</h4>
<div class="warn">
<b>这不是医疗建议。</b>本计划假设你已经获得手术医生或主治康复师的运动许可，并且当前没有进行性神经症状。任何新出现的小腿麻木、放射痛、单侧无力、鞍区麻木或大小便功能改变，是<b>立即停止训练并就医</b>的信号，不是「练一练就好」的问题。开始前请把本计划交给你的手术医生或康复师过一遍。
</div>
<p class="nb">关于「依然有异样感」：术后 10 个月残余的紧绷、牵扯、轻微异常感觉相当常见，来源可能是瘢痕组织、神经适应、深层稳定肌耐力不足，也可能只是你对这一段的过度关注。判断标准不是「今天感觉如何」，而是<b>趋势</b>：以周为单位，异样感是否在下降、发作频率是否减少、功能（久坐、弯腰、系鞋带、睡眠）是否在改善。若趋势在恶化，减量并复诊——这不是训练能解决的事。</p>
</section>

<section class="sec">
<h2>01 写在前面</h2>
${intro.map((t) => `<p>${t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</p>`).join('')}
<h4>六条贯穿全程的规矩</h4>
<table class="plain"><colgroup><col style="width:22%"><col style="width:78%"></colgroup>
<thead><tr><th>规矩</th><th>具体怎么做</th></tr></thead><tbody>
${rules42.map(([a, b]) => `<tr><td><b>${esc(a)}</b></td><td>${b.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</td></tr>`).join('')}
</tbody></table>
</section>

<section class="sec">
<h2>02 三位顾问的名片</h2>
<p class="nb">以下三位是这份计划的「人格化」分工：他们各自代表一套已被公开文献与职业实践反复验证的知识体系。我给他们的名字是虚构的，但他们说的话都是这套体系里的原话逻辑。</p>
${advisors.map((a) => `
<div class="card">
  <div class="who">${esc(a.name)} <span class="badge">${esc(a.id)}</span></div>
  <div class="rl">${esc(a.role)} ｜ ${esc(a.cred)}</div>
  <div class="q">「${esc(a.quote)}」</div>
  <ol>${a.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>
</div>`).join('')}
</section>

<section class="sec">
<h2>03 三人决策会议：五场冲突的裁决</h2>
<p>三个角色凑一起必然吵架。下面五件事就是他们真正冲突的地方，以及我作为总教练的裁决——<b>这些裁决构成了整份计划的骨架</b>。</p>
<table><colgroup><col style="width:17%"><col style="width:34%"><col style="width:49%"></colgroup>
<thead><tr><th>议题</th><th>冲突</th><th>裁决（执行方案）</th></tr></thead><tbody>
${decisions.map((d) => `<tr><td><b>${esc(d.topic)}</b></td><td>${esc(d.conf)}</td><td>${esc(d.res)}</td></tr>`).join('')}
</tbody></table>
<div class="ok"><b>一句话总结：</b>用「单腿 + 器械 + 雪橇」拿走下肢负荷，用「髋驱动 + 轻药球 + 低次数」拿走旋转爆发，用「RIR 1-2 + 每日核心 + 疼痛趋势」守住腰椎。<b>你不需要在保护和变强之间选，你需要把负荷换个方向装。</b></div>
</section>

<section class="sec">
<h2>04 设计逻辑</h2>
<h4>4.1 时间预算：核心 30-38%，其余 62-70%</h4>
<table><colgroup><col style="width:34%"><col style="width:15%"><col style="width:15%"><col style="width:18%"><col style="width:18%"></colgroup>
<thead><tr><th>训练日</th><th>总时长</th><th>核心时长</th><th>核心占比</th><th>备注</th></tr></thead><tbody>
${budget.map((b) => `<tr><td><b>${esc(b.day)}</b></td><td>${b.total} 分钟</td><td>${b.core} 分钟</td><td><b>${Math.round((b.core / b.total) * 100)}%</b></td><td>${esc(b.note || '—')}</td></tr>`).join('')}
</tbody></table>
<p class="nb">核心时长 = 热身中的呼吸/臀桥激活 + 主核心块 + 收尾的行走/等长类。想更接近 40:60，就在每天核心块后追加一个 3×30m 的负重行走，约 +6 分钟。</p>

<h4>4.2 十六周分期</h4>
<table><colgroup><col style="width:11%"><col style="width:20%"><col style="width:34%"><col style="width:35%"></colgroup>
<thead><tr><th>分期</th><th>名称</th><th>目标</th><th>关键参数 / 降量</th></tr></thead><tbody>
${phases.map((p) => `<tr><td><b>${p.id}</b><br><span class="nb">${esc(p.weeks)}</span></td><td><b>${esc(p.name)}</b></td><td>${esc(p.goal)}</td><td>${esc(p.key)}<div class="alt">${esc(p.deload)}</div></td></tr>`).join('')}
</tbody></table>

<h4>4.3 每周怎么排</h4>
<table class="plain"><colgroup><col style="width:11%"><col style="width:9%"><col style="width:56%"><col style="width:24%"></colgroup>
<thead><tr><th>星期</th><th>日号</th><th>安排</th><th>强度</th></tr></thead><tbody>
${weekly.map((w) => `<tr><td>${esc(w.d)}</td><td><b>${esc(w.w)}</b></td><td>${esc(w.t)}</td><td>${w.must ? '必修' : (w.w === 'D5' ? '可选（甜点）' : '恢复')}</td></tr>`).join('')}
</tbody></table>
<div class="warn"><b>排程铁律：</b>D1（下肢 A）与 D3（下肢 B）之间至少隔 48 小时。如果你只能连着练，宁可改成「D1 → D2 → D3 → D4」四天连排，也不要一天练两个下肢日。上肢日可以夹在两个下肢日之间当恢复。</div>

<h4>4.4 为什么腿部全部走单腿</h4>
<ul>
<li><b>压缩负荷立减：</b>同样的刺激，单腿动作的杠铃/哑铃重量只要双腿的一半左右，而脊柱承受的轴向压缩远低于背蹲与双腿大重量腿举。</li>
<li><b>直击传球专项：</b>四分卫出手是「前腿承重 + 后腿蹬转」，单腿训练直接复刻这个姿态；双腿训练没有这个迁移。</li>
<li><b>把「防变形」练进去：</b>单腿深蹲/单腿 RDL 天然要求核心抗侧屈与抗旋转，等于下肢训练同时练了核心。</li>
<li><b>不对称负荷更安全：</b>哑铃/壶铃对侧手持，重心在身体两侧对称分布，不像杠铃那样把压缩直上直下压到节段。</li>
</ul>

<h4>4.5 核心怎么「均匀放到每天」</h4>
<table><colgroup><col style="width:15%"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:17%"><col style="width:17%"></colgroup>
<thead><tr><th>类别</th>${coreMatrix.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>
${coreMatrix.rows.map((r) => `<tr><td><b>${esc(r[0])}</b></td>${r.slice(1).map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')}
</tbody></table>
<p class="nb">读法：横向看是「今天练了什么」，纵向看是「这一类一周被练了几次」。抗伸展与抗旋转每周 4 次以上，抗侧屈 3 次，旋转爆发 3-4 次，后链每天都有影子——这就是「均匀摊开」的意思。</p>
</section>

<section class="sec">
<h2>05 安全闸门</h2>
<h4>5.1 三级决策树（每周看这个决定加不加量）</h4>
<table class="plain"><colgroup><col style="width:44%"><col style="width:56%"></colgroup>
<thead><tr><th>本周情况</th><th>怎么做</th></tr></thead><tbody>
${painTree.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}
</tbody></table>

<h4>5.2 红线清单（出现即停，别硬扛）</h4>
<table><colgroup><col style="width:42%"><col style="width:58%"></colgroup>
<thead><tr><th>信号</th><th>处置</th></tr></thead><tbody>
${redFlags.map(([a, b]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td></tr>`).join('')}
</tbody></table>

<h4>5.3 永久排除的动作清单</h4>
<table><colgroup><col style="width:40%"><col style="width:60%"></colgroup>
<thead><tr><th>动作</th><th>为什么排除</th></tr></thead><tbody>
${forbidden.map(([a, b]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td></tr>`).join('')}
</tbody></table>

<h4>5.4 每天开练前 60 秒自查</h4>
<ul>
<li>今天早上起床，腰的感觉（NRS 0-10）是多少？比上周一高还是低？</li>
<li>今天有没有新的腿部症状（麻、刺、放射、无力）？</li>
<li>昨晚睡眠是否 ≥6.5 小时？如果不足，今天主项全部降 1 组、RPE -1。</li>
<li>第一项 90/90 呼吸时，能不能顺畅地 360° 撑开肋骨？如果憋、紧、痛，先做 5 分钟猫牛+呼吸再开始。</li>
</ul>
</section>

<section class="sec">
<h2>06 四个训练日详表</h2>
<p class="nb">读表方式：左边一列是动作，中间四列是四个分期（B1 = 第 1-4 周，B2 = 5-8 周，B3 = 9-12 周，B4 = 13-16 周）。<b>你只需要看自己当前那一列</b>，别的列是后面几周要去的地方。最后两列是节奏代码和要点/替代动作。</p>
<p class="nb"><b>关于「腿部全是单腿」的三个例外</b>（它们都不产生轴向压缩，所以放行）：① <b>雪橇推</b>——身体前倾蹬地，脊柱几乎零压缩，是我给你留的唯一「双腿发力」的下肢功率动作；② <b>站姿提踵</b>——只是踝关节，腰椎零负荷；③ <b>器械髋外展/髋后伸</b>——固定轨迹、坐着做，压缩量可忽略。除此之外，所有下肢主动作都是单腿。</p>
</section>
${days.map(daySection).join('')}

<section class="sec">
<h2>07 甜点日（可选第五天）</h2>
<div class="card"><div class="rl">${esc(dessert.name)} ｜ ${esc(dessert.time)}</div>
<p class="nb" style="margin-top:6px">${esc(dessert.note)}</p></div>
${dessert.blocks.map((b) => `
<h4>${esc(b.name)} · ${esc(b.time)}</h4>
<table class="daytbl"><colgroup><col style="width:26%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:10%"><col style="width:34%"></colgroup>
<thead><tr><th>动作</th><th>B1</th><th>B2</th><th>B3</th><th>B4</th><th>要点</th></tr></thead><tbody>
${b.items.map((it) => `<tr><td class="ex"><b>${esc(it.n)}</b></td>${it.p.map((x) => `<td class="pp">${esc(x)}</td>`).join('')}<td class="cue"><span class="tempo">${esc(it.t)}</span> ${esc(it.c)}</td></tr>`).join('')}
</tbody></table>`).join('')}
</section>

<section class="sec">
<h2>08 核心动作库（五大类别）</h2>
<p class="nb">这张库是「备用零件」：当某个动作器械被占、或者你今天腰感觉不对，从这里挑同类别的一个替换。类别不能换（抗旋转不能拿抗伸展替代），动作可以换。</p>
${coreLib.map((c) => `
<h4>${esc(c.cat)}</h4>
<p class="nb">${esc(c.why)}</p>
<table><colgroup><col style="width:30%"><col style="width:22%"><col style="width:48%"></colgroup>
<thead><tr><th>动作</th><th>建议组次</th><th>要点</th></tr></thead><tbody>
${c.items.map((i) => `<tr><td><b>${esc(i.n)}</b></td><td>${esc(i.p)}</td><td>${esc(i.c)}</td></tr>`).join('')}
</tbody></table>`).join('')}
</section>

<section class="sec">
<h2>09 负荷推进、降量与进阶</h2>
<h4>9.1 什么时候加重量</h4>
<ul>
<li><b>双重渐进：</b>先加次数（在下限到上限之间加），到达上限且最后 1 组仍留 1-2 次余力 → 下次加重 2.5kg（单侧动作）或加 1 片（器械）。</li>
<li><b>加不动的信号：</b>连续 2 周同一重量、次数没涨、RPE 反而上升 → 这不是意志问题，是容量/恢复问题，做一周降量再回来。</li>
<li><b>爆发动作不加重量：</b>药球只在「速度还很快」的前提下换更重的球；速度慢了就换回轻球。爆发力的进步标准是<b>距离/速度</b>，不是公斤数。</li>
</ul>
<h4>9.2 降量周（W4 / W8 / W12 / W16）</h4>
<ul>
<li>组数减半，RPE 降到 6-7，爆发动作全部减半。</li>
<li>降量周保留核心与单腿技术动作（质量最高），删掉的是辅助孤立与最后一组。</li>
<li>W16 是测试周：先减量 3 天，第 4 天做测试电池。</li>
</ul>
<h4>9.3 组间休息</h4>
<table class="plain"><colgroup><col style="width:34%"><col style="width:22%"><col style="width:44%"></colgroup>
<thead><tr><th>动作类型</th><th>休息</th><th>原因</th></tr></thead><tbody>
<tr><td>单腿主项（保加利亚蹲 / 单腿腿举 / 反向箭步蹲）</td><td>90-120 秒</td><td>单腿本身心肺负担高，休息短会先崩在呼吸上</td></tr>
<tr><td>药球 / 跳箱 / 爆发俯卧撑</td><td>60-120 秒</td><td>磷酸原恢复需要时间；休息不够＝练的是耐力不是爆发</td></tr>
<tr><td>核心（死虫 / Pallof / 侧板）</td><td>45-60 秒</td><td>训练目标是控制与耐力</td></tr>
<tr><td>行走类核心（手提箱 / 农夫走）</td><td>60 秒</td><td>让对侧也「尝到」同样的工作</td></tr>
<tr><td>辅助孤立（腿屈伸 / 面拉 / 弯举）</td><td>60 秒</td><td>泵感与时间效率</td></tr>
</tbody></table>
</section>

<section class="sec">
<h2>10 测试电池与记录</h2>
<p>在 <b>W1（开始前）、W8（半程）、W16（结束）</b> 各做一次。同一时间、同一器械、同一动作标准，否则数字没有意义。</p>
<table><colgroup><col style="width:33%"><col style="width:32%"><col style="width:35%"></colgroup>
<thead><tr><th>测试项</th><th>测什么</th><th>怎么做</th></tr></thead><tbody>
${tests.map((t) => `<tr><td><b>${esc(t.n)}</b></td><td>${esc(t.d)}</td><td>${esc(t.base)}</td></tr>`).join('')}
</tbody></table>
<div class="ok"><b>4 个月后你应该看到：</b>单腿动作重量 +20-35%、手提箱行走重量 +5-10kg、侧板与 Pallof 保持时间 +30% 以上、药球旋转抛距离 +10-20%、腰部异样感的发作频率下降。<b>力量数据涨了但腰的感觉变差 = 计划失败，要退回去。</b></div>
<h4>记录什么（用「训练记录表.xlsx」）</h4>
<ul>
<li>每个主项：重量 × 次数 × 组数 × RPE（一行一个动作）。</li>
<li>每天一行「腰部感觉 NRS（0-10）」，以及「练完 24 小时后」再填一次。</li>
<li>每周一早上填「晨僵时长」和「异样感发作频率」。</li>
<li>任何一次动作被降级或跳过，写一句原因——4 个月后回头看，这些备注比重量更有信息量。</li>
</ul>
</section>

<section class="sec">
<h2>11 营养与恢复</h2>
<table><colgroup><col style="width:20%"><col style="width:26%"><col style="width:54%"></colgroup>
<thead><tr><th>项目</th><th>建议</th><th>执行细节 / 注意</th></tr></thead><tbody>
${nutrition.map(([a, b, c]) => `<tr><td><b>${esc(a)}</b></td><td>${esc(b)}</td><td>${esc(c)}</td></tr>`).join('')}
</tbody></table>
<div class="warn"><b>关于补剂：</b>肌酸、蛋白粉这类东西不是必需品，先保证吃饭与睡眠。任何补剂在你这个情况下都建议先问一句手术医生/康复师，尤其是消炎镇痛类药物——<b>它们会掩盖你最重要的信号（疼痛）</b>，练前吃止痛药是本计划明令禁止的行为。</div>
<h4>恢复日做什么（周三/周五）</h4>
<ul>
<li>20-30 分钟快走或单车（能说话的速度）：促进椎间盘的营养交换，这是有循证支持的低成本干预。</li>
<li>90/90 呼吸 2×5 + 猫牛 + 胸椎旋转 + 髋屈肌拉伸，10 分钟。</li>
<li>睡眠优先于一切：睡不够的那一周，别加重量。</li>
</ul>
</section>

<section class="sec">
<h2>12 把计划装进手机（iPhone 四种方案）</h2>
<p>你只带一个手机去健身房，所以这件事必须做到「一次成功、零摩擦」。下面四个方案按「推荐度」排序，<b>建议方案一 + 方案二同时用</b>：手机看今天练什么（方案一），细节和要点翻 PDF（方案二），记录回填（方案四），备忘录当紧急备份（方案三）。</p>
${phoneMethods.map((m) => `
<div class="card">
  <div class="who" style="font-size:10.5pt">${esc(m.n)}</div>
  <div class="rl">最适合：${esc(m.best)}</div>
  <ol class="step">${m.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  <div class="alt">${esc(m.note)}</div>
</div>`).join('')}
<div class="ok"><b>健身房里的极简流程（每天 60 秒准备）：</b>① 手机打开训练卡，点今天那个日号；② 头盔/耳机放好，第一项永远是 90/90 呼吸；③ 每做完一组点一下打勾，休息计时器点一下就走；④ 练完在记录表里填 3 行；⑤ 走之前做收尾拉伸——收尾是整个计划里最容易被跳过、但最不该被跳过的一段。</div>
</section>

<section class="sec">
<h2>13 参考文献与依据</h2>
<p class="nb">本计划的原则来自以下公开资料与职业训练实践。它们是「为什么这样练」的依据，不是医疗建议。</p>
<ul>
${sources.map((s) => `<li style="font-size:8.8pt">${esc(s.l)}<br><span class="nb">${esc(s.u)}</span></li>`).join('')}
</ul>
<h4>术语表</h4>
<table class="plain"><colgroup><col style="width:22%"><col style="width:78%"></colgroup><tbody>
<tr><td><b>RPE</b></td><td>主观用力程度，1-10。计划里 6-7 = 还能做 3-4 次；7-8 = 还能做 1-2 次；9-10 = 极限。</td></tr>
<tr><td><b>RIR</b></td><td>余力次数。RIR 1-2 = 停的时候还能再做 1-2 次标准动作。</td></tr>
<tr><td><b>节奏 3-1-2</b></td><td>离心 3 秒 → 底部停 1 秒 → 向心 2 秒。数字越大，肌肉受力时间越长、重量越要降。</td></tr>
<tr><td><b>B1–B4</b></td><td>四个分期（W1-4 / W5-8 / W9-12 / W13-16）。只做你当前所在的那一列。</td></tr>
<tr><td><b>轴向压缩</b></td><td>沿脊柱长轴方向的挤压力量（背蹲、双腿大重量腿举）。你的手术节段对这类负荷最敏感。</td></tr>
<tr><td><b>抗伸展 / 抗侧屈 / 抗旋转</b></td><td>核心的三种「不做什么」的能力：不被拉成后伸、不被压塌到侧面、不被扭转。这是术后核心训练的主战场。</td></tr>
</tbody></table>
<div class="foot">QB CORE &amp; POWER · 16 周重建计划 ${esc(meta.ver)} · 生成于本地 · 本文件不构成医疗建议</div>
</section>

</body></html>`;
}

fs.writeFileSync(path.join(OUT, 'print.html'), printHTML(), 'utf8');
console.log('print.html ✓', fs.statSync(path.join(OUT, 'print.html')).size, 'bytes');

export { printHTML };
