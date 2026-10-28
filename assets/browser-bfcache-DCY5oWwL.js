var e={answerHtml:`<h2>简答</h2>
<ul>
<li>HTTP 缓存保存单个资源的响应，恢复页面时仍要重新解析、执行脚本和渲染。</li>
<li>bfcache（往返缓存）把离开时的整个页面连同 JavaScript 堆冻结在内存里，后退或前进时直接恢复，几乎瞬间显示。</li>
<li>从 bfcache 恢复时不触发 <code>load</code>，而是触发 <code>pageshow</code>，<code>event.persisted</code> 为 <code>true</code>。</li>
<li>常见的阻止原因有：注册了 <code>unload</code> 监听器（桌面版 Chrome 和 Firefox 会因此放弃缓存）、离开时还有打开的 IndexedDB 连接、进行中的 fetch 或 XHR、未关闭的 WebSocket 或 WebRTC 连接（部分浏览器会因此放弃缓存）、主文档带 <code>Cache-Control: no-store</code>（Chrome 正在逐步放宽这一条）。</li>
</ul>
<h2>对比</h2>
<table><thead><tr><th></th><th>HTTP 缓存</th><th>bfcache</th></tr></thead><tbody><tr><td>保存内容</td><td>单个响应</td><td>整个页面和 JS 状态</td></tr><tr><td>存放位置</td><td>磁盘或内存</td><td>内存</td></tr><tr><td>适用导航</td><td>所有请求</td><td>只有后退、前进</td></tr><tr><td>恢复时脚本</td><td>重新执行</td><td>不重新执行，从冻结点继续</td></tr></tbody></table>
<h2>恢复时要处理的事</h2>
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
<p>页面可能在 bfcache 里停留几分钟，恢复后要刷新登录状态、购物车数量这类会过期的数据，并重新建立离开时关闭的连接。</p>
<h2>让页面能进入 bfcache</h2>
<ul>
<li>不用 <code>unload</code>，改用 <code>pagehide</code> 或 <code>visibilitychange</code>。Chrome 正在逐步弃用 <code>unload</code> 事件。</li>
<li>在 <code>pagehide</code> 里关闭 WebSocket、WebRTC 连接，结束进行中的 IndexedDB 事务。</li>
<li>不要给普通页面设置 <code>Cache-Control: no-store</code>；只在确实含敏感信息的页面使用。</li>
<li>页面保留着 <code>window.opener</code> 引用关系时，可能无法进入 bfcache，具体规则因浏览器而异；用 Chrome DevTools 的 Back/forward cache 面板查看实际原因。</li>
</ul>
<h2>排查</h2>
<p>Chrome DevTools → Application → Back/forward cache，点击测试后会列出不能缓存的具体原因。线上可以用 <code>PerformanceNavigationTiming.notRestoredReasons</code>（Chromium 支持）收集原因。</p>`};export{e as default};