var e={answerHtml:`<h2>简答</h2>
<ul>
<li>执行到不等于验证到：测试调用了函数但没有断言返回值，覆盖率照样是 100%。</li>
<li>覆盖率只统计已有的代码，漏写的逻辑（例如缺少空值判断）没有对应代码，也就不会显示为未覆盖。</li>
<li>行覆盖率高时分支覆盖率可能很低，<code>a &amp;&amp; b</code> 只测了一种情况也算这一行已覆盖。</li>
<li>报告只包含被加载的文件；没有任何测试导入的文件可能根本不在报告里，需要配置 <code>coverage.include</code>。</li>
<li>用覆盖率找出没测的高风险代码，用变异测试检查断言是否有效。</li>
</ul>
<h2>执行但没验证</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">discount</span>(<span class="hljs-params"><span class="hljs-attr">price</span>: <span class="hljs-built_in">number</span>, <span class="hljs-attr">vip</span>: <span class="hljs-built_in">boolean</span></span>) {
  <span class="hljs-keyword">return</span> vip ? price * <span class="hljs-number">0.8</span> : price;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;计算折扣&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">discount</span>(<span class="hljs-number">100</span>, <span class="hljs-literal">true</span>);
  <span class="hljs-title function_">discount</span>(<span class="hljs-number">100</span>, <span class="hljs-literal">false</span>);
});
</code></pre></div>
<p>两个分支都执行了，覆盖率 100%，但把 <code>0.8</code> 改成 <code>0.5</code> 测试也能通过。</p>
<h2>漏写的逻辑</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">average</span>(<span class="hljs-params"><span class="hljs-attr">values</span>: <span class="hljs-built_in">number</span>[]</span>) {
  <span class="hljs-keyword">return</span> values.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, v</span>) =&gt;</span> sum + v, <span class="hljs-number">0</span>) / values.<span class="hljs-property">length</span>;
}

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;求平均值&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">average</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])).<span class="hljs-title function_">toBe</span>(<span class="hljs-number">2</span>);
});
</code></pre></div>
<p>覆盖率 100%，但空数组返回 <code>NaN</code> 的问题完全没有被发现，因为处理空数组的代码根本不存在。</p>
<h2>配置</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// vitest.config.ts</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">test</span>: {
    <span class="hljs-attr">coverage</span>: {
      <span class="hljs-attr">provider</span>: <span class="hljs-string">&#x27;v8&#x27;</span>,
      <span class="hljs-attr">include</span>: [<span class="hljs-string">&#x27;src/**/*.{ts,tsx}&#x27;</span>],
      <span class="hljs-attr">thresholds</span>: { <span class="hljs-attr">branches</span>: <span class="hljs-number">80</span> },
    },
  },
});
</code></pre></div>
<p><code>include</code> 让没有被测试导入的文件也出现在报告里，显示为 0%。门槛可以防止覆盖率明显下降，但单纯追求数字会催生“只调用、不断言”的测试。</p>
<h2>覆盖率看不到的问题</h2>
<ul>
<li>并发和竞态：两个请求返回顺序颠倒。</li>
<li>浏览器差异和布局问题。</li>
<li>与真实后端的契约不一致。</li>
<li>性能和内存泄漏。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>覆盖率目标定多少合适？没有统一的数字。核心业务逻辑和工具函数追求高分支覆盖，界面胶水代码依靠组件和端到端测试，比统一要求 100% 更有效。断言质量可以用变异测试检查，见<a href="/questions/testing-mutation/">《变异测试如何发现“覆盖率很高但测试没测到重点”？》</a>。</li>
</ul>`};export{e as default};