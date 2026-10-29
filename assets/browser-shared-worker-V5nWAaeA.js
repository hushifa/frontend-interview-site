var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户开了五个标签页，每个页面都建一条 WebSocket 连接，服务端就得扛五条连接。如果让这五个页面共用一条，就要一个大家都能访问的“中心”，SharedWorker 就是这个中心。</p>
<p>平时说的 Worker 一般是 Dedicated Worker，它跟着创建它的页面走，页面关了它就终止。SharedWorker 不一样，同源、同脚本 URL、同名称的所有页面共用一个实例，最后一个连着它的页面关掉以后，它才终止。</p>
<p>通信方式也不同。每个页面通过 <code>worker.port</code> 和它说话，Worker 那边在 <code>connect</code> 事件里拿到每个页面的端口。</p>
<p>它适合多个标签页共用一条 WebSocket、一份内存缓存，或者统一做请求去重。MDN 标为 Baseline 2026，也就是 2026 年 5 月起主流浏览器都能用，旧浏览器还要降级。</p>
</blockquote>
<h2>先看多标签页共用一条 WebSocket</h2>
<p>Worker 这边，维护一个端口集合，把服务端推来的消息转发给每个页面：</p>
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
<p>每当有页面连上来，就会触发一次 <code>connect</code>，从 <code>event.ports[0]</code> 拿到这个页面的端口，存进集合。页面发来的消息转给服务端；页面说要关闭，就把它的端口删掉。</p>
<p>页面这边，创建 SharedWorker 并通过 <code>port</code> 收发消息：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面</span>
<span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">SharedWorker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./shared.worker.js&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), {
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span>,
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;live&#x27;</span>,
});
worker.<span class="hljs-property">port</span>.<span class="hljs-property">onmessage</span> = <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-title function_">render</span>(event.<span class="hljs-property">data</span>);
<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pagehide&#x27;</span>, <span class="hljs-function">() =&gt;</span> worker.<span class="hljs-property">port</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;close&#x27;</span> }));
</code></pre></div>
<h2>为什么页面要主动说“我要走了”</h2>
<p>页面关闭时，端口不会自动通知 Worker。所以页面要在 <code>pagehide</code> 里主动发一条 <code>close</code>，让 Worker 把它的端口移出集合。</p>
<p>如果页面是直接崩溃的，这条消息发不出去，<code>ports</code> 里会残留一个失效的端口。好在往失效端口发消息不会报错，影响有限。</p>
<h2>用的时候容易踩的坑</h2>
<p>如果用 <code>addEventListener(&#x27;message&#x27;, ...)</code> 监听端口，要手动调用 <code>port.start()</code>；用 <code>onmessage</code> 赋值则会自动开始。</p>
<p>SharedWorker 里的 <code>console.log</code> 不会出现在页面的控制台里。在 Chrome 里要到 <code>chrome://inspect/#workers</code> 去调试。</p>
<p>还有一个更新的坑。你改了 Worker 脚本，可只要还有页面连着旧实例，新打开的页面仍然会连到旧实例上。</p>
<h2>和其他方案怎么选</h2>
<p>只需要广播一下通知，用 BroadcastChannel 更简单。需要拦截网络请求、做离线缓存，用 Service Worker。需要一个共享的状态中心或者共享连接，才用 SharedWorker。</p>
<h2>常见追问</h2>
<p><strong>SharedWorker 什么时候终止？</strong></p>
<blockquote>
<p>最后一个连着它的页面关闭以后才终止。只要还有一个页面连着，它就一直活着，所以改了脚本以后，新页面也可能连到旧实例上。</p>
</blockquote>
<p><strong>为什么用 addEventListener 监听端口收不到消息？</strong></p>
<blockquote>
<p>因为用 <code>addEventListener(&#x27;message&#x27;, ...)</code> 时，端口不会自动开始接收，要手动调用 <code>port.start()</code>。用 <code>onmessage</code> 赋值就会自动开始。</p>
</blockquote>`};export{e as default};