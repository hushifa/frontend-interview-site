var e={answerHtml:`<h2>简答</h2>
<ul>
<li>采样按会话或用户 ID 做一致性采样：同一会话要么全采要么全不采，事件链才完整；性能数据可以低采样，错误数据应全量或单独设置更高采样率。</li>
<li>客户端先去重和限流：同一错误短时间内只报一次，单页面设上报条数上限，防止死循环报错打爆接口。</li>
<li>服务端按错误指纹聚合：用错误类型、规范化后的消息和栈顶帧生成指纹，同指纹的事件归为一个问题。</li>
<li>告警看比率和影响面：错误率、影响用户数、相对基线的突增，并标注发布版本；按单条错误或绝对数量告警会被流量波动淹没。</li>
</ul>
<h2>采样</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">hash</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">let</span> h = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> text) h = (h * <span class="hljs-number">31</span> + char.<span class="hljs-title function_">charCodeAt</span>(<span class="hljs-number">0</span>)) &gt;&gt;&gt; <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> h;
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">isSampled</span> = (<span class="hljs-params">sessionId, rate</span>) =&gt; <span class="hljs-title function_">hash</span>(sessionId) % <span class="hljs-number">10000</span> &lt; rate * <span class="hljs-number">10000</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isSampled</span>(<span class="hljs-string">&#x27;session-a&#x27;</span>, <span class="hljs-number">0.1</span>) === <span class="hljs-title function_">isSampled</span>(<span class="hljs-string">&#x27;session-a&#x27;</span>, <span class="hljs-number">0.1</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>用 <code>Math.random()</code> 逐条决定会让同一会话的事件散落，无法回放用户路径。按 ID 哈希后得到稳定结果，这与 OpenTelemetry 中按 trace ID 一致性采样的思路相同。</p>
<p>决定在采集开始时做出（头部采样），实现简单，但事后无法&quot;把出错的会话补采回来&quot;。需要&quot;出错的会话全保留&quot;时，可以在客户端缓存最近事件，出错时连同上下文一起上报。</p>
<p>上报时带上采样率，服务端统计总量时除以采样率还原估算值。</p>
<h2>客户端去重与限流</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> seen = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">MAX_PER_PAGE</span> = <span class="hljs-number">50</span>;
<span class="hljs-keyword">let</span> sent = <span class="hljs-number">0</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">shouldReport</span>(<span class="hljs-params">fingerprint, now = <span class="hljs-built_in">Date</span>.now()</span>) {
  <span class="hljs-keyword">if</span> (sent &gt;= <span class="hljs-variable constant_">MAX_PER_PAGE</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> last = seen.<span class="hljs-title function_">get</span>(fingerprint);
  <span class="hljs-keyword">if</span> (last &amp;&amp; now - last &lt; <span class="hljs-number">60_000</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>; <span class="hljs-comment">// 一分钟内同指纹只报一次</span>
  seen.<span class="hljs-title function_">set</span>(fingerprint, now);
  sent += <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
}
</code></pre></div>
<p>数据先放入队列批量发送，页面隐藏时再刷出，发送方式见<a href="/questions/monitoring-beacon/">《页面关闭时怎样可靠上报？sendBeacon 和 keepalive 怎么选？》</a>。</p>
<h2>指纹与聚合</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">fingerprint</span> = (<span class="hljs-params">e</span>) =&gt; <span class="hljs-string">\`<span class="hljs-subst">\${e.name}</span>|<span class="hljs-subst">\${e.message.replace(/\\d+/g, <span class="hljs-string">&#x27;{n}&#x27;</span>)}</span>|<span class="hljs-subst">\${e.frame}</span>\`</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">fingerprint</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;TypeError&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;id 123 not found&#x27;</span>, <span class="hljs-attr">frame</span>: <span class="hljs-string">&#x27;app.js:10:5&#x27;</span> }));
<span class="hljs-comment">// TypeError|id {n} not found|app.js:10:5</span>
</code></pre></div>
<p>消息里的 ID、时间戳、URL 参数要先规范化，否则同一 bug 会被拆成成千上万个问题。栈顶帧最好用 Source Map 还原后的源码位置，这样文件哈希变化不会让同一个问题在每次发布后都&quot;重新出现&quot;，还原方式见<a href="/questions/monitoring-source-map/">《线上报错怎样用 Source Map 还原，又不把 map 文件公开？》</a>。</p>
<p>聚合后每个问题记录首次出现版本、最近出现时间、事件数和影响用户数，作为排期依据。</p>
<h2>告警</h2>
<ul>
<li>以比率为主：JS 错误率 = 出错会话数 / 总会话数，避免流量高峰误报、低谷漏报。</li>
<li>以基线对比：与上周同时段或上一版本比较，突增超过阈值才触发。</li>
<li>新问题告警：新版本首次出现且影响用户数超过阈值的指纹。</li>
<li>设置持续时间和静默期：连续几个统计窗口超标才发，同一问题告警后静默一段时间，防止刷屏。</li>
<li>告警中附带版本、浏览器分布和示例堆栈，方便判断是否需要回滚。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不能全量采集？流量大时存储、带宽和用户端开销都不可接受，且大部分重复数据没有额外价值。</li>
<li>浏览器扩展、爬虫的错误怎么处理？按来源文件和 User-Agent 过滤，不计入错误率。</li>
<li>采样会不会漏掉罕见错误？会，这是错误数据要单独提高采样率的原因。</li>
</ul>`};export{e as default};