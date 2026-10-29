var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>监控数据量很大，不可能全收全存，所以要采样。采样要按会话或用户 ID 来定，同一个会话要么全采、要么全不采，这样一个用户的事件链才是完整的，这叫一致性采样。性能数据可以低比例采样，错误数据要全量，或者单独设一个更高的采样率。</p>
<p>客户端先去重和限流。同一个错误短时间内只报一次，每个页面设一个上报条数上限，防止代码死循环报错把接口打爆。</p>
<p>服务端再按错误指纹聚合。指纹由错误类型、规范化后的消息和栈顶位置拼成，指纹相同的事件归成同一个问题。</p>
<p>告警要看比率和影响面，比如错误率、影响用户数、比平时突增了多少，并且标上发布版本。按单条错误或者绝对数量告警，会被流量的高低波动淹没。</p>
</blockquote>
<h2>为什么要按会话采样</h2>
<p>最直观的做法是每条事件用 <code>Math.random()</code> 决定要不要上报。可是这样同一个会话的事件会东一条西一条，想还原一个用户出错前做了什么，就拼不起来了。</p>
<p>改法是对会话 ID 做哈希，哈希值决定采不采，同一个 ID 每次算出来的结果都一样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">hash</span>(<span class="hljs-params">text</span>) {
  <span class="hljs-keyword">let</span> h = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> text) h = (h * <span class="hljs-number">31</span> + char.<span class="hljs-title function_">charCodeAt</span>(<span class="hljs-number">0</span>)) &gt;&gt;&gt; <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> h;
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">isSampled</span> = (<span class="hljs-params">sessionId, rate</span>) =&gt; <span class="hljs-title function_">hash</span>(sessionId) % <span class="hljs-number">10000</span> &lt; rate * <span class="hljs-number">10000</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isSampled</span>(<span class="hljs-string">&#x27;session-a&#x27;</span>, <span class="hljs-number">0.1</span>) === <span class="hljs-title function_">isSampled</span>(<span class="hljs-string">&#x27;session-a&#x27;</span>, <span class="hljs-number">0.1</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>hash % 10000</code> 把每个会话映射到 0 到 9999 之间的一个固定数字，小于 <code>rate * 10000</code> 就采。采样率 0.1 时，大约十分之一的会话会落进来，而且同一个会话不管调用多少次，结论都一样。OpenTelemetry 按 trace ID 做一致性采样，也是这个思路。</p>
<p>这种在采集一开始就做决定的方式叫头部采样，实现简单。缺点是事后没法反悔：一个会话没被采中，后来它出错了，也补不回来。如果需要“出错的会话全保留”，可以在客户端缓存最近的一批事件，出错时连同这些上下文一起上报。</p>
<p>上报时要带上采样率。服务端统计总量时除以采样率，才能还原出估算的真实数量。</p>
<h2>客户端怎样去重和限流</h2>
<p>下面的函数决定一条错误该不该报：同一个指纹一分钟内只报一次，整个页面最多报 50 条。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> seen = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">MAX_PER_PAGE</span> = <span class="hljs-number">50</span>;
<span class="hljs-keyword">let</span> sent = <span class="hljs-number">0</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">shouldReport</span>(<span class="hljs-params">fingerprint, now = <span class="hljs-built_in">Date</span>.now()</span>) {
  <span class="hljs-keyword">if</span> (sent &gt;= <span class="hljs-variable constant_">MAX_PER_PAGE</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> last = seen.<span class="hljs-title function_">get</span>(fingerprint);
  <span class="hljs-keyword">if</span> (last !== <span class="hljs-literal">undefined</span> &amp;&amp; now - last &lt; <span class="hljs-number">60_000</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>; <span class="hljs-comment">// 一分钟内同指纹只报一次</span>
  seen.<span class="hljs-title function_">set</span>(fingerprint, now);
  sent += <span class="hljs-number">1</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
}
</code></pre></div>
<p>连着调用三次 <code>shouldReport(&#x27;A&#x27;, 0)</code>、<code>shouldReport(&#x27;A&#x27;, 30_000)</code>、<code>shouldReport(&#x27;A&#x27;, 61_000)</code>，结果是 <code>true</code>、<code>false</code>、<code>true</code>。第二次离上次只有 30 秒，被拦下了；第三次离上次已经超过一分钟，又放行了。</p>
<p>为什么要有总上限？因为有些错误发生在 <code>requestAnimationFrame</code> 或者定时器里，一秒能报几十次。就算每个指纹都限了频，指纹一多照样能刷爆接口。</p>
<p>通过检查的数据先放进队列，批量发送，页面隐藏时再把剩下的发出去，发送方式见<a href="/questions/monitoring-beacon/">《页面关闭时怎样可靠上报？sendBeacon 和 keepalive 怎么选？》</a>。</p>
<h2>服务端怎样把同一个 bug 聚到一起</h2>
<p>错误指纹就是给错误算一个“身份证号”。下面的写法把类型、消息和栈顶位置拼起来，消息里的数字先替换掉：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">fingerprint</span> = (<span class="hljs-params">e</span>) =&gt; <span class="hljs-string">\`<span class="hljs-subst">\${e.name}</span>|<span class="hljs-subst">\${e.message.replace(/\\d+/g, <span class="hljs-string">&#x27;{n}&#x27;</span>)}</span>|<span class="hljs-subst">\${e.frame}</span>\`</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">fingerprint</span>({ <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;TypeError&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;id 123 not found&#x27;</span>, <span class="hljs-attr">frame</span>: <span class="hljs-string">&#x27;app.js:10:5&#x27;</span> }));
<span class="hljs-comment">// TypeError|id {n} not found|app.js:10:5</span>
</code></pre></div>
<p>为什么要替换数字？因为 <code>id 123 not found</code> 和 <code>id 456 not found</code> 明明是同一个 bug，只是 ID 不同。不规范化的话，每个 ID 都会变成一个单独的问题，同一个 bug 被拆成成千上万条。时间戳、URL 参数也要这样处理。</p>
<p>栈顶位置最好用 Source Map 还原后的源码位置。压缩后的文件名带哈希，每次发布都会变，用它做指纹，同一个问题每发一次版就“重新出现”一次，还原方式见<a href="/questions/monitoring-source-map/">《线上报错怎样用 Source Map 还原，又不把 map 文件公开？》</a>。</p>
<p>聚合以后，每个问题记下首次出现的版本、最近出现的时间、事件数和影响用户数，这些是排优先级的依据。</p>
<h2>告警怎样设才不会乱报</h2>
<p>首先以比率为主。JS 错误率等于出错的会话数除以总会话数。为什么不看绝对数量？因为流量高峰时错误数自然多，会误报；流量低谷时错误数少，又会漏报。</p>
<p>其次和基线对比。拿上周同一时段或者上一个版本来比，突增超过阈值才触发。</p>
<p>新问题要单独告警：新版本里第一次出现、而且影响用户数超过阈值的指纹。</p>
<p>还要设持续时间和静默期。连续几个统计窗口都超标才发；同一个问题告警过一次以后静默一段时间，防止刷屏。</p>
<p>告警内容里要带上版本、浏览器分布和示例堆栈，这样收到的人能马上判断要不要回滚。</p>
<h2>常见追问</h2>
<p><strong>为什么不能全量采集？</strong></p>
<blockquote>
<p>流量大的时候，存储、带宽和用户端的开销都扛不住，而且大部分重复数据并不带来新信息。</p>
</blockquote>
<p><strong>浏览器扩展、爬虫产生的错误怎么处理？</strong></p>
<blockquote>
<p>按来源文件和 User-Agent 过滤掉，不计入错误率。</p>
</blockquote>
<p><strong>采样会不会漏掉罕见的错误？</strong></p>
<blockquote>
<p>会。这正是错误数据要单独提高采样率，甚至全量采集的原因。</p>
</blockquote>`};export{e as default};