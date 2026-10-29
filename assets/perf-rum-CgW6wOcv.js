var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>实验室测试就是用 Lighthouse、WebPageTest、DevTools 这些工具，在固定的设备和网络下跑页面。条件可控、结果能重复，还有完整的瀑布图和调用栈，适合找原因，也适合放进 CI 里拦截退化。缺点是设备、网络、缓存状态和用户行为都是假设的。</p>
<p>真实用户监测，简称 RUM，是在用户浏览器里采集数据。它覆盖低端手机、弱网和真实的交互，能发现实验室想不到的问题。可它只有指标和有限的归因，很难直接看出原因。</p>
<p>所以两者回答的是不同的问题：RUM 告诉你谁慢、有多普遍，实验室告诉你为什么慢。Core Web Vitals 按真实用户的 75 分位评估，Chrome 的 CrUX 数据集就是 RUM 数据。</p>
<p>要注意，实验室工具不会模拟用户点击，测不到真实的 INP，一般用总阻塞时间 TBT 作为参考。看数据时也要看 p75、p95 和样本量，不要看平均值。</p>
</blockquote>
<h2>两者各自擅长什么</h2>
<p>把两者放在一起比较：</p>
<table><thead><tr><th></th><th>实验室</th><th>RUM</th></tr></thead><tbody><tr><td>回答的问题</td><td>为什么慢</td><td>谁慢、多慢、多普遍</td></tr><tr><td>条件</td><td>固定</td><td>真实且多样</td></tr><tr><td>详细程度</td><td>瀑布图、调用栈、截图</td><td>指标加有限的归因</td></tr><tr><td>时机</td><td>开发、CI、发布前</td><td>发布后持续</td></tr><tr><td>交互指标</td><td>只有模拟值</td><td>真实 INP</td></tr></tbody></table>
<p>为什么不能只要一个？只有实验室，你测的是自己假设的场景，真实用户的低端手机和弱网你看不到。只有 RUM，你知道某个版本变慢了，却没有调用栈和瀑布图告诉你为什么。</p>
<h2>怎样采集 RUM</h2>
<p>下面用 <code>web-vitals</code> 采集几个核心指标，先放进队列，页面隐藏时一次发出去：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { onCLS, onINP, onLCP, onTTFB } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;web-vitals&#x27;</span>;

<span class="hljs-keyword">const</span> queue = [];

<span class="hljs-keyword">function</span> <span class="hljs-title function_">report</span>(<span class="hljs-params">metric</span>) {
  queue.<span class="hljs-title function_">push</span>({
    <span class="hljs-attr">name</span>: metric.<span class="hljs-property">name</span>,
    <span class="hljs-attr">value</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(metric.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;CLS&#x27;</span> ? metric.<span class="hljs-property">value</span> * <span class="hljs-number">1000</span> : metric.<span class="hljs-property">value</span>),
    <span class="hljs-attr">rating</span>: metric.<span class="hljs-property">rating</span>,
    <span class="hljs-attr">page</span>: location.<span class="hljs-property">pathname</span>,
    <span class="hljs-attr">version</span>: __APP_VERSION__, <span class="hljs-comment">// 构建时注入的版本号</span>
  });
}

<span class="hljs-title function_">onLCP</span>(report);
<span class="hljs-title function_">onINP</span>(report);
<span class="hljs-title function_">onCLS</span>(report);
<span class="hljs-title function_">onTTFB</span>(report);

<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span> &amp;&amp; queue.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span>) {
    navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;/rum&#x27;</span>, <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(queue.<span class="hljs-title function_">splice</span>(<span class="hljs-number">0</span>)));
  }
});
</code></pre></div>
<p>为什么 CLS 要乘 1000？因为 CLS 是 0.1 这种小数，直接 <code>Math.round</code> 就变成 0 了，乘 1000 再取整能保留精度，服务端再除回去。</p>
<p>为什么在页面隐藏时发？因为 INP 和 CLS 要到最后才有最终值，而且 <code>sendBeacon</code> 不会阻塞页面卸载。</p>
<p>带上版本号和页面路由，才能按维度拆开看，设备类型也最好一起带上。另外要按比例采样，不要上报用户输入、完整 URL 查询参数这类个人信息。</p>
<p>还有一点，SPA 切换路由不会产生新的导航，所以“路由切换完成”要自己定义、自己测。</p>
<h2>两者怎样配合</h2>
<p>一个典型的流程是这样的：</p>
<ol>
<li>RUM 发现某个版本以后，低端设备的 LCP 变差了。</li>
<li>实验室按低端设备的条件复现，用瀑布图找到原因。</li>
<li>修复后先在实验室验证，再看 RUM 有没有恢复。</li>
<li>把这个场景加进 CI 的实验室检查，防止再次退化。</li>
</ol>
<h2>常见追问</h2>
<p><strong>Lighthouse 分数很高，CrUX 数据却很差，为什么？</strong></p>
<blockquote>
<p>Lighthouse 只测一次，用的是固定的模拟条件。真实用户的设备更慢、网络更差，还会有交互，所以两边差得远是正常的，应以真实用户数据为准。</p>
</blockquote>
<p><strong>样本量多少才可信？</strong></p>
<blockquote>
<p>没有固定数字。分组以后样本太少，分位数会波动得很厉害，所以展示分位数时要同时展示样本量。</p>
</blockquote>`};export{e as default};