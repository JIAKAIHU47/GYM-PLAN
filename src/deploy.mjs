import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/mac/Desktop/健身计划';
const DEP = path.join(ROOT, 'deploy');
fs.mkdirSync(DEP, { recursive: true });

let html = fs.readFileSync(path.join(ROOT, 'QB训练卡.html'), 'utf8');

// 注入 Service Worker 注册（首页离线可用）+ iOS 主屏幕元信息
const inject = `
<link rel="manifest" href="data:application/manifest+json,${encodeURIComponent(JSON.stringify({
  name: 'QB 训练卡',
  short_name: 'QB',
  start_url: './',
  display: 'standalone',
  background_color: '#0e1116',
  theme_color: '#0e1116',
}))}">
<script>
if ('serviceWorker' in navigator) {
  addEventListener('load', function(){
    navigator.serviceWorker.register('sw.js').then(function(){
      document.documentElement.setAttribute('data-offline', '1');
    }).catch(function(){});
  });
}
</script>`;

html = html.replace('</body>', inject.trim() + '\n</body>');
fs.writeFileSync(path.join(DEP, 'index.html'), html, 'utf8');

const sw = `/* QB 训练卡 · 离线缓存 Service Worker */
const CACHE = 'qb-card-v2';
const ASSETS = ['./', './index.html', './sw.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});
`;
fs.writeFileSync(path.join(DEP, 'sw.js'), sw, 'utf8');

const readme = `# 上传步骤（GitHub Pages）

目标：手机上有一个 https 链接，Safari 打开后「添加到主屏幕」，像 App 一样全屏运行，
并且**第二次打开起不需要网络**（Service Worker 离线缓存）。

## 一、建仓库并上传（网页操作，不用装 git）

1. 打开 https://github.com/new
2. Repository name 填 \`qb-card\`（随便，记住即可）→ 选 **Public**（私有仓库的 Pages 要付费）
3. 点 **Create repository**
4. 页面上点 **uploading an existing file**（或 Add file → Upload files）
5. 把本文件夹里的两个文件拖进去：**\`index.html\`** 和 **\`sw.js\`**
6. 点绿色 **Commit changes**

> ⚠️ 必须叫 \`index.html\`（不能叫 QB训练卡.html），否则 \`https://用户名.github.io/qb-card/\` 打开是 404。

## 二、打开 Pages

1. 仓库页 → **Settings** → 左侧 **Pages**
2. **Source** 选 **Deploy from a branch**
3. **Branch** 选 \`main\`，目录选 \`/ (root)\` → **Save**
4. 等 30–60 秒，刷新页面，顶部会出现链接：
   \`https://你的用户名.github.io/qb-card/\`

## 三、装到 iPhone 主屏幕

1. iPhone **Safari** 打开上面那个链接（一定要 Safari，微信内打开不行）
2. 底部 **分享** 按钮 → 往下找 **添加到主屏幕** → 添加
3. 回到桌面点「QB」图标：全屏、无地址栏、计时器可用、打勾会记住
4. **练前在家用 wifi 打开一次**，之后 Service Worker 会把整页缓存到本地，健身房没信号也能开

## 四、以后要改计划怎么办

在本机改 \`build/data.mjs\` → 重跑 \`node build/gen-card.mjs\` →
重新执行 \`node build/deploy.mjs\` 生成 deploy/ 里的两个文件 → 在 GitHub 网页上重新上传覆盖。

> Service Worker 的缓存名带版本号（\`qb-card-v2\`），更新页面时把它改成 v3，
> 旧缓存会被自动清掉，避免你看到的是旧版本。

## 不想用 GitHub 的两个替代

- **Netlify Drop**（https://app.netlify.com/drop）：把 deploy 文件夹直接拖进网页，秒出 https 链接，不用 git。
- **Cloudflare Pages**：同上，拖文件夹即可。
- 完全不想上传：直接用 iPhone「文件」App 打开 QB训练卡.html —— 内容和打勾都能用，只是没有计时器、打勾不跨次保留。
`;
fs.writeFileSync(path.join(DEP, 'README-部署.md'), readme, 'utf8');

console.log('deploy/ ✓');
for (const f of fs.readdirSync(DEP)) {
  console.log('  ', f, (fs.statSync(path.join(DEP, f)).size / 1024).toFixed(1), 'KB');
}
