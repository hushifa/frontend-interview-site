var e={answerHtml:`<h2>简答</h2>
<ul>
<li>库通过 <code>diagnostics_channel.channel(name)</code> 发布事件，观测工具订阅同名通道，双方不需要互相依赖，APM 不必再对库的函数打补丁。</li>
<li>发布前用 <code>channel.hasSubscribers</code> 判断，没有订阅者时可以跳过构造消息。</li>
<li>订阅回调同步执行，回调里抛出的错误会触发 <code>uncaughtException</code>，耗时操作会拖慢发布方，订阅者应只做轻量的提取。</li>
<li><code>tracingChannel</code> 为一次调用提供 <code>start</code>、<code>end</code>、<code>asyncStart</code>、<code>asyncEnd</code>、<code>error</code> 五个事件，自 Node.js 19.9.0、18.19.0 提供，26.8.0 起标为稳定。</li>
<li>通道只在当前进程内有效，没有历史记录和持久化；订阅之前发布的事件收不到。</li>
</ul>
<h2>发布与订阅</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> diagnosticsChannel <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:diagnostics_channel&#x27;</span>;

<span class="hljs-keyword">const</span> cacheMiss = diagnosticsChannel.<span class="hljs-title function_">channel</span>(<span class="hljs-string">&#x27;app.cache.miss&#x27;</span>);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">getFromCache</span>(<span class="hljs-params">key</span>) {
  <span class="hljs-keyword">const</span> value = cache.<span class="hljs-title function_">get</span>(key);
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">undefined</span> &amp;&amp; cacheMiss.<span class="hljs-property">hasSubscribers</span>) {
    cacheMiss.<span class="hljs-title function_">publish</span>({ <span class="hljs-attr">key</span>: key.<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;:&#x27;</span>)[<span class="hljs-number">0</span>] });
  }
  <span class="hljs-keyword">return</span> value;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 观测模块</span>
diagnosticsChannel.<span class="hljs-title function_">subscribe</span>(<span class="hljs-string">&#x27;app.cache.miss&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">{ key }</span>) =&gt;</span> {
  missCounter.<span class="hljs-title function_">add</span>(<span class="hljs-number">1</span>, { <span class="hljs-attr">prefix</span>: key });
});
</code></pre></div>
<p>消息里只放统计需要的字段。示例只发布键的前缀，避免把用户 ID 等高基数的值变成指标标签，也避免敏感数据进入日志。</p>
<p>Node.js 内置模块也发布诊断事件，例如 <code>http.client.request.start</code>、<code>undici:request:create</code>，OpenTelemetry 等工具通过订阅这些通道采集 HTTP 请求，不需要修改应用代码。可用的通道名和消息结构以对应版本的文档为准。</p>
<h2>tracingChannel</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> queryChannel = diagnosticsChannel.<span class="hljs-title function_">tracingChannel</span>(<span class="hljs-string">&#x27;app.db.query&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">query</span>(<span class="hljs-params">sql</span>) {
  <span class="hljs-keyword">return</span> queryChannel.<span class="hljs-title function_">tracePromise</span>(<span class="hljs-function">() =&gt;</span> db.<span class="hljs-title function_">execute</span>(sql), { sql });
}

queryChannel.<span class="hljs-title function_">subscribe</span>({
  <span class="hljs-title function_">start</span>(<span class="hljs-params">context</span>) {
    context.<span class="hljs-property">startedAt</span> = performance.<span class="hljs-title function_">now</span>();
  },
  <span class="hljs-title function_">asyncEnd</span>(<span class="hljs-params">context</span>) {
    histogram.<span class="hljs-title function_">record</span>(performance.<span class="hljs-title function_">now</span>() - context.<span class="hljs-property">startedAt</span>, {
      <span class="hljs-attr">status</span>: context.<span class="hljs-property">error</span> ? <span class="hljs-string">&#x27;error&#x27;</span> : <span class="hljs-string">&#x27;ok&#x27;</span>,
    });
  },
  <span class="hljs-title function_">end</span>(<span class="hljs-params"></span>) {},
  <span class="hljs-title function_">asyncStart</span>(<span class="hljs-params"></span>) {},
  <span class="hljs-title function_">error</span>(<span class="hljs-params"></span>) {},
});
</code></pre></div>
<p><code>tracePromise</code> 会把同一个 context 对象传给五个事件，订阅者可以在 <code>start</code> 中记录时间，在 <code>asyncEnd</code> 中计算耗时。失败时 context 上会带有 <code>error</code>。同步调用和回调式调用分别使用 <code>traceSync</code>、<code>traceCallback</code>。</p>
<h2>与日志、指标、追踪的分工</h2>
<table><thead><tr><th>机制</th><th>用途</th></tr></thead><tbody><tr><td>diagnostics_channel</td><td>进程内事件入口，连接库和观测工具</td></tr><tr><td>日志</td><td>需要人阅读的事实和错误详情</td></tr><tr><td>指标</td><td>计数、延迟、错误率的聚合和告警</td></tr><tr><td>追踪</td><td>跨服务关联一次请求</td></tr><tr><td>审计记录</td><td>支付、权限变更等必须留存的业务事实</td></tr></tbody></table>
<p>诊断通道可以没有订阅者，所以审计记录不能依赖它。需要关联请求时，订阅者在回调中通过 AsyncLocalStorage 读取当前请求 ID，见<a href="/questions/node-async-local-storage/">《AsyncLocalStorage 如何在 Node.js 请求链路中传递上下文？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li><strong>订阅者怎样避免影响业务请求？</strong> 回调里只提取字段放进有界队列，由后台批量发送；回调内部自己捕获异常。</li>
<li><strong>测试里要注意什么？</strong> 每个用例结束时 <code>unsubscribe</code>，否则后续用例会重复收到事件。</li>
<li><strong>浏览器里有这个模块吗？</strong> 没有。同时运行在浏览器和 Node.js 的库应把诊断代码做成可选的。</li>
</ul>`};export{e as default};