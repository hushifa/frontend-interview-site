var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Dedicated Worker 跟随创建它的页面，页面关闭它就终止。</li>
<li>SharedWorker 由同源、同脚本 URL、同名称的所有页面共享一个实例，最后一个连接的页面关闭后才终止。</li>
<li>每个页面通过 <code>worker.port</code> 通信，Worker 里在 <code>connect</code> 事件中拿到每个页面的端口。</li>
<li>适合多个标签页共用一个 WebSocket 连接、一份内存缓存或统一的请求去重。</li>
<li>MDN 标为 Baseline 2026（2026 年 5 月起主流浏览器可用），旧浏览器需要降级。</li>
</ul>
<h2>示例：多标签页共用一个 WebSocket</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// shared.worker.js</span>
<span class="hljs-keyword">const</span> ports = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
<span class="hljs-keyword">const</span> socket = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WebSocket</span>(<span class="hljs-string">&#x27;wss://example.com/live&#x27;</span>);

socket.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> port <span class="hljs-keyword">of</span> ports) port.<span class="hljs-title function_">postMessage</span>(event.<span class="hljs-property">data</span>);
};

<span class="hljs-variable language_">self</span>.<span class="hljs-property">onconnect</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> port = event.<span class="hljs-property">ports</span>[<span class="hljs-number">0</span>];
  ports.<span class="hljs-title function_">add</span>(port);
  port.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">message</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (message.<span class="hljs-property">data</span>.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;close&#x27;</span>) ports.<span class="hljs-title function_">delete</span>(port);
    <span class="hljs-keyword">else</span> socket.<span class="hljs-title function_">send</span>(<span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(message.<span class="hljs-property">data</span>));
  };
};
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面</span>
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">SharedWorker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./shared.worker.js&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), {
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span>,
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;live&#x27;</span>,
});
worker.<span class="hljs-property">port</span>.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-title function_">render</span>(event.<span class="hljs-property">data</span>);
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pagehide&#x27;</span>, <span class="hljs-function">() =&gt;</span> worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;close&#x27;</span> }));
</code></pre></div>
<p>页面关闭时端口没有自动通知，所以页面在 <code>pagehide</code> 主动告知 Worker 移除端口。页面直接崩溃时这条消息发不出去，<code>ports</code> 里会残留失效端口，向失效端口发消息不会报错，影响有限。</p>
<h2>注意事项</h2>
<ul>
<li>用 <code>addEventListener(&#x27;message&#x27;, ...)</code> 时要调用 <code>port.start()</code>，用 <code>onmessage</code> 赋值则自动开始。</li>
<li>SharedWorker 的 <code>console.log</code> 不在页面控制台里，Chrome 中要到 <code>chrome://inspect/#workers</code> 调试。</li>
<li>修改了 Worker 脚本后，只要还有页面连着旧实例，新页面仍会连到旧实例。</li>
</ul>
<h2>和其他方案对比</h2>
<ul>
<li>只需要广播通知：BroadcastChannel 更简单。</li>
<li>需要拦截请求、离线缓存：Service Worker。</li>
<li>需要一个共享的状态中心或共享连接：SharedWorker。</li>
</ul>`};export{e as default};