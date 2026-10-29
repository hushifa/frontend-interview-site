var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户点了后退，页面一下子就回来了，滚动位置、输入框里的字、JS 里的变量都还在，这就是 bfcache，也叫往返缓存。浏览器在用户离开时把整个页面冻结在内存里，后退或前进时直接解冻。</p>
<p>HTTP 缓存不一样，它存的是一个个响应，比如 HTML、JS、图片。命中缓存能省掉下载，可页面还是要重新解析、重新执行脚本、重新渲染。</p>
<p>所以从 bfcache 回来时，<code>load</code> 不会再触发，触发的是 <code>pageshow</code>，而且 <code>event.persisted</code> 是 <code>true</code>。页面可能在缓存里待了好几分钟，回来后要刷新登录状态、购物车这类会过期的数据。</p>
<p>要注意，有些写法会让页面进不了 bfcache。常见的是注册了 <code>unload</code> 监听器、离开时还开着 IndexedDB 连接或请求、主文档带 <code>Cache-Control: no-store</code>。具体原因可以在 DevTools 里查。</p>
</blockquote>
<h2>两种缓存到底差在哪</h2>
<table><thead><tr><th></th><th>HTTP 缓存</th><th>bfcache</th></tr></thead><tbody><tr><td>保存内容</td><td>单个响应</td><td>整个页面和 JS 状态</td></tr><tr><td>存放位置</td><td>磁盘或内存</td><td>内存</td></tr><tr><td>适用导航</td><td>所有请求</td><td>只有后退、前进</td></tr><tr><td>恢复时脚本</td><td>重新执行</td><td>不重新执行，从冻结点继续</td></tr></tbody></table>
<p>HTTP 缓存省的是网络，bfcache 省的是整个加载过程。命中 HTTP 缓存时，脚本还会从头跑一遍，所以页面状态是全新的。命中 bfcache 时，脚本根本不重跑，代码从冻结的那一刻接着往下走，所以你离开前的状态全都还在。</p>
<h2>页面从 bfcache 回来时要做什么</h2>
<p>因为不会重新执行脚本，写在 <code>load</code> 里的初始化逻辑这时不会跑。要处理恢复，就监听 <code>pageshow</code>，用 <code>persisted</code> 判断是不是从 bfcache 回来的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pageshow&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">persisted</span>) {
    <span class="hljs-title function_">refreshCartCount</span>();
    <span class="hljs-title function_">reconnectRealtime</span>();
  }
});

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pagehide&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-title function_">closeRealtime</span>();
});
</code></pre></div>
<p>离开时在 <code>pagehide</code> 里把实时连接关掉，回来时在 <code>pageshow</code> 里重新连上，顺便把购物车数量这类可能已经过期的数据刷新一下。页面可能在缓存里停了几分钟，这期间服务端的数据早就变了。</p>
<h2>怎样让页面能进入 bfcache</h2>
<p>最常见的问题是用了 <code>unload</code>。桌面版 Chrome 和 Firefox 看到页面注册了 <code>unload</code> 监听器，就会放弃缓存这个页面。Chrome 也在逐步弃用 <code>unload</code> 事件。所以离开页面时要做的事，改放到 <code>pagehide</code> 或 <code>visibilitychange</code> 里。</p>
<p>离开时还开着的连接也会挡住缓存。打开着的 IndexedDB 连接、进行中的 fetch 或 XHR、没关的 WebSocket 或 WebRTC 连接，在部分浏览器里都会让页面进不了 bfcache。所以在 <code>pagehide</code> 里把 WebSocket、WebRTC 关掉，把进行中的 IndexedDB 事务结束掉。</p>
<p>主文档带 <code>Cache-Control: no-store</code> 也会阻止缓存，不过 Chrome 正在逐步放宽这一条。普通页面不要设这个头，只在确实含敏感信息的页面上用。</p>
<p>另外，页面保留着 <code>window.opener</code> 引用关系时，也可能进不了 bfcache，具体规则各浏览器不一样。</p>
<h2>怎么知道页面为什么没被缓存</h2>
<p>打开 Chrome DevTools，进 Application → Back/forward cache，点测试按钮，它会列出这个页面不能缓存的具体原因。线上想收集数据，可以读 <code>PerformanceNavigationTiming.notRestoredReasons</code>，这个字段目前只有 Chromium 支持。</p>
<h2>常见追问</h2>
<p><strong>从 bfcache 恢复时，<code>load</code> 事件会触发吗？</strong></p>
<blockquote>
<p>不会。页面没有重新加载，脚本也没重跑，所以 <code>load</code> 和 <code>DOMContentLoaded</code> 都不会再来。要处理恢复，监听 <code>pageshow</code>，看 <code>event.persisted</code> 是不是 <code>true</code>。</p>
</blockquote>
<p><strong>为什么不能在 <code>unload</code> 里做清理？</strong></p>
<blockquote>
<p>因为桌面版 Chrome 和 Firefox 只要看到页面注册了 <code>unload</code> 监听器，就不会把它放进 bfcache，Chrome 也在逐步弃用这个事件。清理工作放到 <code>pagehide</code> 或 <code>visibilitychange</code> 里就行。</p>
</blockquote>`};export{e as default};