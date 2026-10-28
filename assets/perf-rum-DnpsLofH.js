var e={answerHtml:`<h2>简答</h2>
<ul>
<li>实验室：条件可控、结果可重复，有完整的瀑布图和调用栈，适合定位原因和在 CI 中拦截退化；但设备、网络、缓存状态和用户行为都是假设的。</li>
<li>RUM：数据来自真实用户，覆盖低端设备、弱网和真实交互，能发现实验室想不到的问题；但只有指标和有限的归因，难以直接定位原因。</li>
<li>Core Web Vitals 按真实用户的 75 分位评估；Chrome 的 CrUX 数据集就是 RUM 数据。</li>
<li>实验室工具不模拟用户交互，测不到真实 INP，通常用 Total Blocking Time 作为参考。</li>
<li>看分布：p75、p95 和样本量，不看平均值。</li>
</ul>
<h2>对比</h2>
<table><thead><tr><th></th><th>实验室</th><th>RUM</th></tr></thead><tbody><tr><td>回答的问题</td><td>为什么慢</td><td>谁慢、多慢、多普遍</td></tr><tr><td>条件</td><td>固定</td><td>真实且多样</td></tr><tr><td>详细程度</td><td>瀑布图、调用栈、截图</td><td>指标加有限的归因</td></tr><tr><td>时机</td><td>开发、CI、发布前</td><td>发布后持续</td></tr><tr><td>交互指标</td><td>只有模拟值</td><td>真实 INP</td></tr></tbody></table>
<h2>采集 RUM</h2>
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
<ul>
<li>在页面隐藏时批量发送，<code>sendBeacon</code> 不阻塞页面卸载。</li>
<li>带上版本号、页面路由、设备类型，才能按维度拆分。</li>
<li>按比例采样，不上报用户输入、完整 URL 查询参数等个人信息。</li>
<li>SPA 路由切换不会产生新的导航，需要另外定义并测量&quot;路由切换完成&quot;。</li>
</ul>
<h2>怎样配合</h2>
<ol>
<li>RUM 发现某个版本后低端设备的 LCP 变差。</li>
<li>实验室按低端设备条件复现，用瀑布图找到原因。</li>
<li>修复后实验室验证，再看 RUM 是否恢复。</li>
<li>把这个场景加入 CI 的实验室检查，防止再次退化。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>Lighthouse 分数高但 CrUX 数据差？Lighthouse 只测一次、用固定的模拟条件；真实用户的设备更慢、网络更差，还会有交互。</li>
<li>样本量多少才可信？没有固定数字，分组后样本太少时分位数波动很大，要同时展示样本量。</li>
</ul>`};export{e as default};