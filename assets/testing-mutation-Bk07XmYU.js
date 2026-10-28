var e={answerHtml:`<h2>简答</h2>
<ul>
<li>每个变异体是源代码的一个小改动，例如算术运算符、比较运算符、条件、字面量、删除语句。</li>
<li>测试失败称为“杀死”变异体，测试通过称为“存活”；变异分数 = 被杀死的数量 / 总数。</li>
<li>存活的变异体指出了具体哪一行、哪种改动没被断言发现，比覆盖率更能说明测试质量。</li>
<li>有些变异和原代码行为完全相同（等价变异），它们必然存活，需要人工判断后忽略。</li>
<li>变异测试要多次运行测试套件，耗时长，通常只对核心模块或变更的文件运行。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">canCheckout</span>(<span class="hljs-params"><span class="hljs-attr">total</span>: <span class="hljs-built_in">number</span>, <span class="hljs-attr">limit</span>: <span class="hljs-built_in">number</span></span>) {
  <span class="hljs-keyword">return</span> total &gt; <span class="hljs-number">0</span> &amp;&amp; total &lt;= limit;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;总额在限额内可以结账&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">canCheckout</span>(<span class="hljs-number">50</span>, <span class="hljs-number">100</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-literal">true</span>);
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">canCheckout</span>(<span class="hljs-number">0</span>, <span class="hljs-number">100</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-literal">false</span>);
});
</code></pre></div>
<p>覆盖率是 100%。变异测试会生成例如把 <code>&lt;=</code> 改成 <code>&lt;</code> 的变异体，<code>canCheckout(50, 100)</code> 仍为 <code>true</code>，测试仍通过，变异体存活。这说明“总额刚好等于限额”的边界没有测试。补上 <code>expect(canCheckout(100, 100)).toBe(true)</code> 后，这个变异体被杀死。</p>
<h2>在项目中使用</h2>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">npm install --save-dev @stryker-mutator/core @stryker-mutator/vitest-runner
npx stryker run
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;testRunner&quot;: &quot;vitest&quot;,
  &quot;mutate&quot;: [&quot;src/domain/**/*.ts&quot;],
  &quot;thresholds&quot;: { &quot;high&quot;: 80, &quot;low&quot;: 60, &quot;break&quot;: 50 },
  &quot;incremental&quot;: true
}
</code></pre></div>
<ul>
<li><code>mutate</code> 限定在纯逻辑模块，界面胶水代码的变异多数不值得处理。</li>
<li><code>incremental</code> 只重新测试变化过的代码，适合在 CI 中运行。</li>
<li>报告会列出每个存活的变异体和对应的代码位置。</li>
</ul>
<h2>怎样处理存活的变异体</h2>
<ol>
<li>是真实的测试遗漏：补边界值或补断言。</li>
<li>是等价变异：改动后程序的可观察行为完全不变，例如把 <code>i &lt; arr.length</code> 改成 <code>i !== arr.length</code>，而 <code>i</code> 每次只加 1。用 <code>// Stryker disable next-line EqualityOperator: 原因</code> 标记，写明被禁用的变异器和理由。</li>
<li>是不重要的代码：从 <code>mutate</code> 范围中排除。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>变异分数要达到多少？和覆盖率一样不宜追求固定数字。关注核心逻辑中存活的变异体，每个都给出“补测试”或“可以忽略”的结论，比提高总分更有意义。</li>
</ul>`};export{e as default};