var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>覆盖率统计的是测试运行时哪些代码被执行过。执行到不等于验证到：测试调用了函数却不检查返回值，覆盖率照样是 100%。</p>
<p>它还有一个盲区：只能统计已经写出来的代码。比如函数漏了空数组的判断，这段判断根本不存在，报告里也就不会出现“未覆盖”。另外行覆盖率高时分支覆盖率可能很低，<code>a &amp;&amp; b</code> 只测了一种情况，这一行也算覆盖了。</p>
<p>所以覆盖率最有用的地方是找出完全没测过的高风险代码。报告只包含测试加载过的文件，没被任何测试导入的文件可能根本不在报告里，要配置 <code>coverage.include</code> 才能看到。</p>
<p>要检查断言是否真的有效，可以用变异测试。并发、浏览器差异、接口契约和性能问题，覆盖率完全看不到。</p>
</blockquote>
<h2>调用了函数却没检查结果</h2>
<p>下面的测试把两个分支都跑到了：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">discount</span>(<span class="hljs-params"><span class="hljs-attr">price</span>: <span class="hljs-built_in">number</span>, <span class="hljs-attr">vip</span>: <span class="hljs-built_in">boolean</span></span>) {
  <span class="hljs-keyword">return</span> vip ? price * <span class="hljs-number">0.8</span> : price;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;计算折扣&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">discount</span>(<span class="hljs-number">100</span>, <span class="hljs-literal">true</span>);
  <span class="hljs-title function_">discount</span>(<span class="hljs-number">100</span>, <span class="hljs-literal">false</span>);
});
</code></pre></div>
<p>覆盖率报告会显示 100%。可是测试里一个 <code>expect</code> 都没有，把 <code>0.8</code> 改成 <code>0.5</code>，测试还是通过。覆盖率只知道代码“跑过”，不知道结果“对不对”。改法很直接，补上 <code>expect(discount(100, true)).toBe(80)</code> 这样的断言。</p>
<h2>没写的代码不会显示为未覆盖</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">average</span>(<span class="hljs-params"><span class="hljs-attr">values</span>: <span class="hljs-built_in">number</span>[]</span>) {
  <span class="hljs-keyword">return</span> values.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, v</span>) =&gt;</span> sum + v, <span class="hljs-number">0</span>) / values.<span class="hljs-property">length</span>;
}

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;求平均值&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">average</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>])).<span class="hljs-title function_">toBe</span>(<span class="hljs-number">2</span>);
});
</code></pre></div>
<p>这个测试有断言，覆盖率也是 100%。但传一个空数组进去，<code>reduce</code> 的结果是 0，再除以长度 0，得到的是 <code>NaN</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-title function_">average</span> = (<span class="hljs-params">values</span>) =&gt; values.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, v</span>) =&gt;</span> sum + v, <span class="hljs-number">0</span>) / values.<span class="hljs-property">length</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">average</span>([])); <span class="hljs-comment">// NaN</span>
</code></pre></div>
<p>为什么覆盖率发现不了？因为处理空数组的代码压根没写，没有代码可统计。这类问题只能靠写测试的人主动想边界值，或者用属性测试让工具去生成各种输入。</p>
<h2>怎样让没被导入的文件也出现在报告里</h2>
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
<p>配了 <code>include</code> 以后，没有被任何测试导入的文件也会出现在报告里，显示为 0%。<code>thresholds</code> 设了门槛，覆盖率明显下降时测试会失败。门槛能防止退步，可是如果单纯追数字，就会催生前面那种“只调用、不断言”的测试。</p>
<h2>覆盖率完全看不到哪些问题</h2>
<p>有些问题跟哪行代码被执行没有关系。比如两个请求返回的顺序颠倒了，造成竞态；比如某个浏览器上布局错乱；比如前端假设的接口字段和真实后端不一致；再比如性能变差、内存泄漏。这些都要靠端到端测试、契约测试或监控去发现。</p>
<h2>常见追问</h2>
<p><strong>覆盖率目标定多少合适？</strong></p>
<blockquote>
<p>没有统一的数字。核心业务逻辑和工具函数追求高的分支覆盖，界面胶水代码靠组件测试和端到端测试，这比全项目统一要求 100% 更有效。断言质量可以用变异测试检查，见<a href="/questions/testing-mutation/">《变异测试如何发现“覆盖率很高但测试没测到重点”？》</a>。</p>
</blockquote>`};export{e as default};