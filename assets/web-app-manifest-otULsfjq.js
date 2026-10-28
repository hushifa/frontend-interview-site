var e={answerHtml:`<h2>简答</h2>
<ul>
<li>通过 <code>&lt;link rel=&quot;manifest&quot; href=&quot;/manifest.webmanifest&quot;&gt;</code> 引用，内容是 JSON。</li>
<li>常用字段：<code>name</code>、<code>short_name</code>、<code>icons</code>、<code>start_url</code>、<code>scope</code>、<code>display</code>、<code>theme_color</code>、<code>background_color</code>、<code>id</code>。</li>
<li><code>display: standalone</code> 让安装后的应用在独立窗口中运行，没有浏览器地址栏。</li>
<li>图标通常提供 192×192 和 512×512 两种尺寸，这是 Chromium 安装条件的要求；<code>purpose: &quot;maskable&quot;</code> 的图标允许系统裁成各种形状。</li>
<li>manifest 只描述安装和启动方式，离线访问、推送等能力需要 Service Worker。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;id&quot;: &quot;/&quot;,
  &quot;name&quot;: &quot;前端面试题库&quot;,
  &quot;short_name&quot;: &quot;题库&quot;,
  &quot;start_url&quot;: &quot;/?source=pwa&quot;,
  &quot;scope&quot;: &quot;/&quot;,
  &quot;display&quot;: &quot;standalone&quot;,
  &quot;theme_color&quot;: &quot;#1f6feb&quot;,
  &quot;background_color&quot;: &quot;#ffffff&quot;,
  &quot;icons&quot;: [
    { &quot;src&quot;: &quot;/icons/192.png&quot;, &quot;sizes&quot;: &quot;192x192&quot;, &quot;type&quot;: &quot;image/png&quot; },
    { &quot;src&quot;: &quot;/icons/512.png&quot;, &quot;sizes&quot;: &quot;512x512&quot;, &quot;type&quot;: &quot;image/png&quot; },
    { &quot;src&quot;: &quot;/icons/maskable-512.png&quot;, &quot;sizes&quot;: &quot;512x512&quot;, &quot;type&quot;: &quot;image/png&quot;, &quot;purpose&quot;: &quot;maskable&quot; }
  ]
}
</code></pre></div>
<h2>字段说明</h2>
<ul>
<li><strong><code>id</code></strong>：应用的唯一标识。不设置时浏览器用 <code>start_url</code> 计算，以后修改 <code>start_url</code> 会被当成另一个应用，所以建议显式设置并保持不变。</li>
<li><strong><code>scope</code></strong>：应用的导航范围，范围外的链接会在浏览器中打开。</li>
<li><strong><code>start_url</code></strong>：可以带参数用于统计从桌面图标启动的次数。</li>
<li><strong><code>display</code></strong>：<code>fullscreen</code>、<code>standalone</code>、<code>minimal-ui</code>、<code>browser</code>；<code>display_override</code> 可以按优先级列出更多模式。</li>
<li><strong><code>shortcuts</code></strong>：长按图标出现的快捷入口。</li>
<li><strong><code>icons</code></strong>：Chromium 的安装条件要求至少有 192×192 和 512×512 的图标，规范本身不规定尺寸。<code>purpose: &quot;maskable&quot;</code> 表示图标四周留有安全区，系统可以裁成圆形、圆角方形等形状；普通图标被这样裁切会缺边。</li>
</ul>
<h2>各平台差异</h2>
<ul>
<li>Chromium 浏览器满足安装条件后会显示安装入口，并触发 <code>beforeinstallprompt</code> 事件，页面可以自定义安装按钮。</li>
<li>iOS Safari 不支持 <code>beforeinstallprompt</code>，用户只能通过分享菜单中的&quot;添加到主屏幕&quot;安装。</li>
<li>iOS 还会读取 <code>&lt;meta name=&quot;apple-mobile-web-app-title&quot;&gt;</code> 等专用标签和 <code>apple-touch-icon</code> 图标。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>修改 manifest 后已安装的应用会更新吗：浏览器会定期检查，更新的时机和范围由浏览器决定，名称和图标的更新可能需要用户确认。</li>
</ul>`};export{e as default};