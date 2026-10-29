var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>把网站装到手机桌面上，图标是什么、名字叫什么、打开时有没有地址栏，这些都写在 Web App Manifest 里。它是一个 JSON 文件，用 <code>&lt;link rel=&quot;manifest&quot; href=&quot;/manifest.webmanifest&quot;&gt;</code> 引入。</p>
<p>常用字段有 <code>name</code>、<code>short_name</code>、<code>icons</code>、<code>start_url</code>、<code>scope</code>、<code>display</code>、<code>theme_color</code>、<code>background_color</code> 和 <code>id</code>。比如 <code>display: standalone</code> 让应用在独立窗口里运行，没有浏览器地址栏。</p>
<p>图标一般提供 192×192 和 512×512 两种，这是 Chromium 安装条件的要求。<code>purpose: &quot;maskable&quot;</code> 的图标允许系统裁成圆形、圆角方形等各种形状。</p>
<p>要注意 manifest 只描述“怎么安装、怎么启动”。离线访问、推送这些能力要靠 Service Worker。另外最好显式写 <code>id</code>，不然改了 <code>start_url</code>，浏览器会当成另一个应用。</p>
</blockquote>
<h2>一个完整的 manifest</h2>
<p>下面是题库网站的 manifest：</p>
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
<p><code>name</code> 是完整名称，<code>short_name</code> 用在桌面图标下面这种空间小的地方。<code>start_url</code> 带了 <code>?source=pwa</code>，这样服务端就能统计有多少次是从桌面图标启动的。</p>
<h2>为什么要显式写 id</h2>
<p><code>id</code> 是应用的唯一标识。不写的话，浏览器会用 <code>start_url</code> 来算。问题是，以后你改了 <code>start_url</code>，比如换了统计参数，浏览器算出来的 id 也变了，就会把它当成另一个应用。所以建议显式写 <code>id</code>，并且一直不改。</p>
<h2>其他字段是做什么的</h2>
<p><code>scope</code> 是应用的导航范围，点到范围外的链接，会在浏览器里打开，而不是在应用窗口里。<code>display</code> 可以选 <code>fullscreen</code>、<code>standalone</code>、<code>minimal-ui</code>、<code>browser</code>，想按优先级列出更多模式，用 <code>display_override</code>。<code>shortcuts</code> 是长按图标时出现的快捷入口。</p>
<p>关于图标尺寸，规范本身没有规定，192×192 和 512×512 是 Chromium 安装条件的要求。maskable 图标的意思是四周留了安全区，系统怎么裁都不会裁到主体；普通图标如果被裁成圆形，就会缺边。</p>
<h2>各平台有什么不同</h2>
<p>Chromium 浏览器在满足安装条件后会显示安装入口，并触发 <code>beforeinstallprompt</code> 事件，页面可以借此做一个自己的“安装”按钮。</p>
<p>iOS Safari 不支持 <code>beforeinstallprompt</code>，用户只能通过分享菜单里的“添加到主屏幕”安装。iOS 还会读取 <code>&lt;meta name=&quot;apple-mobile-web-app-title&quot;&gt;</code> 这类专用标签和 <code>apple-touch-icon</code> 图标。</p>
<h2>常见追问</h2>
<p><strong>修改 manifest 后，已安装的应用会更新吗？</strong></p>
<blockquote>
<p>浏览器会定期检查。什么时候更新、更新哪些字段，由浏览器决定，名称和图标的变化可能还要用户确认。</p>
</blockquote>
<p><strong>有了 manifest 就能离线使用吗？</strong></p>
<blockquote>
<p>不能。manifest 只描述安装和启动方式，离线访问要靠 Service Worker 缓存资源。</p>
</blockquote>`};export{e as default};