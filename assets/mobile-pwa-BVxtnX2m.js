var e={answerHtml:`<h2>简答</h2>
<ul>
<li>PWA 不是单一技术，而是一组能力：Web App Manifest 描述名称、图标和启动方式，Service Worker 提供离线和网络控制，HTTPS 是前提。</li>
<li>安装体验因平台而异：Chromium 浏览器支持 <code>beforeinstallprompt</code> 自定义安装按钮，iOS 不支持，只能由用户在分享菜单中&quot;添加到主屏幕&quot;。</li>
<li>iOS 16.4 起，Safari 之外的浏览器也能从分享菜单安装 PWA；Web Push 同样从 16.4 起支持，但只对添加到主屏幕的应用有效。</li>
<li>后台同步、文件处理等能力主要在 Chromium 中可用，要用特性检测逐项启用。</li>
<li>不支持的环境仍应是一个正常可用的网站，PWA 能力只是增强。</li>
</ul>
<h2>组成部分</h2>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">// manifest.webmanifest
{
  &quot;name&quot;: &quot;前端面试题库&quot;,
  &quot;short_name&quot;: &quot;题库&quot;,
  &quot;start_url&quot;: &quot;/&quot;,
  &quot;display&quot;: &quot;standalone&quot;,
  &quot;background_color&quot;: &quot;#ffffff&quot;,
  &quot;theme_color&quot;: &quot;#2563eb&quot;,
  &quot;icons&quot;: [
    { &quot;src&quot;: &quot;/icon-192.png&quot;, &quot;sizes&quot;: &quot;192x192&quot;, &quot;type&quot;: &quot;image/png&quot; },
    { &quot;src&quot;: &quot;/icon-512.png&quot;, &quot;sizes&quot;: &quot;512x512&quot;, &quot;type&quot;: &quot;image/png&quot; }
  ]
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;manifest&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/manifest.webmanifest&quot;</span> /&gt;</span>
</code></pre></div>
<ul>
<li><strong>Manifest</strong>：决定安装后的名称、图标、启动地址和显示模式（<code>standalone</code> 不显示浏览器地址栏）。</li>
<li><strong>Service Worker</strong>：拦截请求、缓存资源、接收推送。注册、更新和缓存策略见<a href="/questions/mobile-serviceworker/">《Service Worker 的安装、激活与缓存更新有哪些坑？》</a>。</li>
<li><strong>HTTPS</strong>：Service Worker 和大多数相关 API 只在安全上下文中可用，localhost 例外。</li>
</ul>
<h2>安装</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> deferred = <span class="hljs-literal">null</span>;

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;beforeinstallprompt&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">preventDefault</span>();
  deferred = event;
  installButton.<span class="hljs-property">hidden</span> = <span class="hljs-literal">false</span>;
});

installButton.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">if</span> (!deferred) <span class="hljs-keyword">return</span>;
  deferred.<span class="hljs-title function_">prompt</span>();
  <span class="hljs-keyword">await</span> deferred.<span class="hljs-property">userChoice</span>;
  deferred = <span class="hljs-literal">null</span>;
  installButton.<span class="hljs-property">hidden</span> = <span class="hljs-literal">true</span>;
});
</code></pre></div>
<p>这段代码只在 Chromium 系浏览器中生效。iOS 上检测不到这个事件时，可以显示一段说明：&quot;点击分享按钮，选择&#x27;添加到主屏幕&#x27;&quot;。用 <code>matchMedia(&#x27;(display-mode: standalone)&#x27;)</code> 判断当前是否已在安装后的窗口中运行，避免重复提示。</p>
<h2>平台差异</h2>
<table><thead><tr><th>能力</th><th>Chromium（Android / 桌面）</th><th>iOS / iPadOS</th></tr></thead><tbody><tr><td>自定义安装按钮</td><td>支持 <code>beforeinstallprompt</code></td><td>不支持，只能通过分享菜单；16.4 起 Safari 之外的浏览器也能从分享菜单添加</td></tr><tr><td>Web Push</td><td>支持</td><td>16.4 起，仅限添加到主屏幕的应用</td></tr><tr><td>离线缓存</td><td>支持</td><td>支持</td></tr><tr><td>Background Sync</td><td>支持</td><td>不支持</td></tr></tbody></table>
<p>iOS 上请求推送权限必须由用户手势触发（如点击按钮），不能页面加载时直接申请。</p>
<h2>渐进增强</h2>
<ul>
<li>先保证网站在普通浏览器标签中完整可用。</li>
<li>逐项检测：<code>&#x27;serviceWorker&#x27; in navigator</code>、<code>&#x27;PushManager&#x27; in window</code>、<code>&#x27;sync&#x27; in registration</code>。</li>
<li>离线时给出明确提示，说明哪些内容可以离线查看，哪些操作需要联网。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>PWA 能上架应用商店吗？Android 可以用 Trusted Web Activity 打包后上架 Google Play；iOS 要上架 App Store 需要提供原生应用价值，只把网站包一层外壳通常过不了审核，以 Apple 的审核指南为准。</li>
<li>安装后的 PWA 怎么更新？由 Service Worker 更新流程决定，Manifest 的部分字段（图标、名称）由浏览器定期检查更新。</li>
</ul>`};export{e as default};