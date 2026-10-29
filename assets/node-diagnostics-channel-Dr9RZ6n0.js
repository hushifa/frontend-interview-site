var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>监控工具想知道数据库查询花了多久、缓存有没有命中，以前常见的办法是去改写库里的函数，也就是打补丁。diagnostics_channel 换了个思路：库在关键位置往一个有名字的通道里发布事件，监控工具订阅同名通道，两边不需要互相依赖。它是进程内的发布订阅。</p>
<p>没人订阅的时候，发布几乎没有开销。发布前还可以用 <code>channel.hasSubscribers</code> 判断一下，没人听就连消息都不用构造。</p>
<p>如果要统计一次调用的耗时，可以用 <code>tracingChannel</code>，它为一次调用提供 <code>start</code>、<code>end</code>、<code>asyncStart</code>、<code>asyncEnd</code>、<code>error</code> 五个事件。它自 Node.js 19.9.0、18.19.0 提供，26.8.0 起标为稳定。</p>
<p>要注意，订阅回调是同步执行的，回调里抛错会触发 <code>uncaughtException</code>，回调慢了也会拖慢发布方，所以订阅者只做轻量的提取。另外通道只在当前进程内有效，没有历史记录，订阅之前发布的事件收不到。</p>
</blockquote>
<h2>发布和订阅是怎么写的</h2>
<p>库这边创建一个通道，在缓存未命中时发布事件：</p>
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
<p>观测模块那边订阅同一个名字：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 观测模块</span>
diagnosticsChannel.<span class="hljs-title function_">subscribe</span>(<span class="hljs-string">&#x27;app.cache.miss&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">{ key }</span>) =&gt;</span> {
  missCounter.<span class="hljs-title function_">add</span>(<span class="hljs-number">1</span>, { <span class="hljs-attr">prefix</span>: key });
});
</code></pre></div>
<p>两段代码之间没有任何 <code>import</code> 关系，靠的只是通道名 <code>app.cache.miss</code>。</p>
<p>你可能注意到，示例只发布了键的前缀，没有发布完整的键。因为完整的键里可能有用户 ID，变成指标标签以后取值太多（这叫高基数），也可能把敏感数据带进日志。消息里只放统计需要的字段。</p>
<p>Node.js 的内置模块自己也发布诊断事件，例如 <code>http.client.request.start</code>、<code>undici:request:create</code>。OpenTelemetry 等工具就是订阅这些通道来采集 HTTP 请求的，不用改应用代码。可用的通道名和消息结构以对应版本的文档为准。</p>
<h2>怎样统计一次调用的耗时</h2>
<p>只有一个事件的话，没法知道调用什么时候开始、什么时候结束。<code>tracingChannel</code> 把一次调用拆成了几个固定的事件：</p>
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
<p><code>tracePromise</code> 会把同一个 context 对象传给这五个事件。所以订阅者可以在 <code>start</code> 里往 context 上记一个开始时间，到 <code>asyncEnd</code> 里再读出来算耗时。调用失败时，context 上会带着 <code>error</code>。同步调用和回调式调用，分别用 <code>traceSync</code> 和 <code>traceCallback</code>。</p>
<h2>它和日志、指标、追踪怎么分工</h2>
<table><thead><tr><th>机制</th><th>用途</th></tr></thead><tbody><tr><td>diagnostics_channel</td><td>进程内事件入口，连接库和观测工具</td></tr><tr><td>日志</td><td>需要人阅读的事实和错误详情</td></tr><tr><td>指标</td><td>计数、延迟、错误率的聚合和告警</td></tr><tr><td>追踪</td><td>跨服务关联一次请求</td></tr><tr><td>审计记录</td><td>支付、权限变更等必须留存的业务事实</td></tr></tbody></table>
<p>诊断通道完全可能没有订阅者，事件发了也就丢了，所以审计记录不能依赖它。需要关联请求时，订阅者在回调里通过 AsyncLocalStorage 读当前请求 ID，见<a href="/questions/node-async-local-storage/">《AsyncLocalStorage 如何在 Node.js 请求链路中传递上下文？》</a>。</p>
<h2>常见追问</h2>
<p><strong>订阅者怎样避免影响业务请求？</strong></p>
<blockquote>
<p>回调里只提取字段，放进一个有上限的队列，由后台批量发送；回调内部自己捕获异常，不让错误冒出去。</p>
</blockquote>
<p><strong>测试里要注意什么？</strong></p>
<blockquote>
<p>每个用例结束时调用 <code>unsubscribe</code>，否则后面的用例会重复收到事件。</p>
</blockquote>
<p><strong>浏览器里有这个模块吗？</strong></p>
<blockquote>
<p>没有。同时跑在浏览器和 Node.js 里的库，应该把诊断代码做成可选的。</p>
</blockquote>`};export{e as default};