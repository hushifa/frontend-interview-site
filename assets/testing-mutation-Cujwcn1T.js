var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>变异测试就是故意往源代码里埋小 bug，看测试能不能发现。工具每次只改一处，比如改算术运算符、改比较运算符、改条件、改字面量、删一条语句，每改一处得到的代码叫一个变异体，然后跑一遍测试。</p>
<p>测试失败了，说明测试发现了这个 bug，叫“杀死”变异体；测试还通过，叫“存活”。变异分数就是被杀死的数量除以总数。</p>
<p>它比覆盖率更能说明测试质量，因为存活的变异体会具体指出哪一行、哪种改动没被断言发现。</p>
<p>有两点要注意。一是有些改动跟原代码行为完全一样，叫等价变异，它们必然存活，要人工判断后忽略。二是变异测试要把测试套件跑很多遍，很慢，一般只对核心模块或改动过的文件运行。</p>
</blockquote>
<h2>覆盖率 100% 的测试漏了什么</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">canCheckout</span>(<span class="hljs-params"><span class="hljs-attr">total</span>: <span class="hljs-built_in">number</span>, <span class="hljs-attr">limit</span>: <span class="hljs-built_in">number</span></span>) {
  <span class="hljs-keyword">return</span> total &gt; <span class="hljs-number">0</span> &amp;&amp; total &lt;= limit;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;总额在限额内可以结账&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">canCheckout</span>(<span class="hljs-number">50</span>, <span class="hljs-number">100</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-literal">true</span>);
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">canCheckout</span>(<span class="hljs-number">0</span>, <span class="hljs-number">100</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-literal">false</span>);
});
</code></pre></div>
<p>这个测试有断言，覆盖率也是 100%。可是变异测试会生成一个把 <code>&lt;=</code> 改成 <code>&lt;</code> 的变异体。代进去看，<code>canCheckout(50, 100)</code> 还是 <code>true</code>，<code>canCheckout(0, 100)</code> 还是 <code>false</code>，测试照样通过，变异体存活了。</p>
<p>这说明什么？说明“总额刚好等于限额”这个边界没人测过。把 <code>&lt;=</code> 写成 <code>&lt;</code> 是很常见的手误，现在的测试发现不了。补上 <code>expect(canCheckout(100, 100)).toBe(true)</code> 以后，这个变异体返回 <code>false</code>，测试失败，它就被杀死了。</p>
<h2>在项目里怎样用</h2>
<p>前端项目常用的工具是 Stryker，配合 Vitest 运行：</p>
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
<p><code>mutate</code> 限定了要变异哪些文件。这里只选纯逻辑模块，因为界面胶水代码产生的变异体大多不值得处理。<code>incremental</code> 只重新测试变化过的代码，适合放在 CI 里跑。跑完以后，报告会列出每个存活的变异体和它对应的代码位置。</p>
<h2>存活的变异体怎样处理</h2>
<p>拿到一个存活的变异体，先判断它属于哪种情况。</p>
<p>最常见的是测试真的漏了，那就补边界值或者补断言，就像上面补的 <code>canCheckout(100, 100)</code>。</p>
<p>第二种是等价变异，也就是改完以后程序能观察到的行为完全没变。比如循环条件 <code>i &lt; arr.length</code> 被改成 <code>i !== arr.length</code>，而 <code>i</code> 每次只加 1，两种写法结束的时机一模一样，任何测试都杀不死它。这时用 <code>// Stryker disable next-line EqualityOperator: 原因</code> 标记，写明禁用的是哪个变异器、为什么。</p>
<p>第三种是这段代码本身不重要，那就把它从 <code>mutate</code> 范围里排除。</p>
<h2>常见追问</h2>
<p><strong>变异分数要达到多少？</strong></p>
<blockquote>
<p>和覆盖率一样，不适合追一个固定数字。更有意义的做法是盯住核心逻辑里存活的变异体，每个都给出“补测试”或者“可以忽略”的结论，这比把总分提上去更有用。</p>
</blockquote>`};export{e as default};