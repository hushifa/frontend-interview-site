var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>PWA 是让一个网站能像应用一样装到桌面或主屏幕上、断网也能打开的一组能力，不是某一项单独的技术。</p>
<p>它主要靠三样东西：Web App Manifest 写名称、图标和启动方式；Service Worker 负责离线缓存和拦截网络请求；HTTPS 是前提，没有它 Service Worker 用不了。</p>
<p>各平台体验并不一致。Chromium 浏览器有 <code>beforeinstallprompt</code>，可以做自定义安装按钮；iOS 没有，只能让用户从分享菜单“添加到主屏幕”。iOS 16.4 起支持 Web Push，但只对添加到主屏幕的应用有效。后台同步这类能力主要在 Chromium 里能用。</p>
<p>所以要做渐进增强：先保证它是个正常可用的网站，再逐项检测能力，支持的才启用。</p>
</blockquote>
<h2>PWA 由哪几部分组成</h2>
<p>先看 Manifest。它是一个 JSON 文件，告诉浏览器“装好以后叫什么、用什么图标、从哪个地址打开”。</p>
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
<p><code>display: &quot;standalone&quot;</code> 表示装好以后打开时不显示浏览器地址栏，看起来像独立应用。</p>
<p>第二部分是 Service Worker。它是一段在页面背后运行的脚本，能拦截请求、缓存资源、接收推送，离线能力就靠它。注册和更新见<a href="/questions/mobile-serviceworker/">《Service Worker 的安装、激活与缓存更新有哪些坑？》</a>，缓存策略见<a href="/questions/network-service-worker-cache/">《Service Worker 有哪些缓存策略？HTML、静态资源和接口分别怎么缓存？》</a>。</p>
<p>第三部分是 HTTPS。Service Worker 和大多数相关 API 只在安全上下文里能用，本地开发用的 localhost 是例外。</p>
<h2>怎样做一个安装按钮</h2>
<p>Chromium 浏览器在页面满足安装条件时，会发一个 <code>beforeinstallprompt</code> 事件。下面的代码先把它拦下来存着，等用户点按钮时再弹出安装提示。</p>
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
<p>可是这段代码只在 Chromium 系浏览器里有效。iOS 上收不到这个事件，就可以改成显示一段说明：“点击分享按钮，选择‘添加到主屏幕’”。</p>
<p>另外，用 <code>matchMedia(&#x27;(display-mode: standalone)&#x27;)</code> 可以判断当前是不是已经在安装后的窗口里运行，是的话就别再提示安装了。</p>
<h2>各平台差在哪里</h2>
<table><thead><tr><th>能力</th><th>Chromium（Android / 桌面）</th><th>iOS / iPadOS</th></tr></thead><tbody><tr><td>自定义安装按钮</td><td>支持 <code>beforeinstallprompt</code></td><td>不支持，只能通过分享菜单；16.4 起 Safari 之外的浏览器也能从分享菜单添加</td></tr><tr><td>Web Push</td><td>支持</td><td>16.4 起，仅限添加到主屏幕的应用</td></tr><tr><td>离线缓存</td><td>支持</td><td>支持</td></tr><tr><td>Background Sync</td><td>支持</td><td>不支持</td></tr></tbody></table>
<p>iOS 上申请推送权限，必须由用户的操作触发，比如点一个按钮。页面一加载就直接申请是不行的。</p>
<h2>怎样做渐进增强</h2>
<p>渐进增强的意思是：先做出一个所有浏览器都能正常用的网站，再在支持的环境里加上更好的能力。</p>
<p>所以第一步是保证网站在普通浏览器标签里完整可用。然后逐项检测能力，比如 <code>&#x27;serviceWorker&#x27; in navigator</code>、<code>&#x27;PushManager&#x27; in window</code>、<code>&#x27;sync&#x27; in registration</code>，检测到了才启用对应功能。离线时也要给出明确提示，说清哪些内容能离线看，哪些操作要联网。</p>
<h2>常见追问</h2>
<p><strong>PWA 能上架应用商店吗？</strong></p>
<blockquote>
<p>Android 可以用 Trusted Web Activity 打包以后上架 Google Play。iOS 要上 App Store，需要提供原生应用的价值，只把网站包一层壳通常过不了审核，具体以 Apple 的审核指南为准。</p>
</blockquote>
<p><strong>安装后的 PWA 怎么更新？</strong></p>
<blockquote>
<p>页面代码和资源的更新由 Service Worker 的更新流程决定。Manifest 里的部分字段，比如图标和名称，由浏览器定期检查更新。</p>
</blockquote>`};export{e as default};