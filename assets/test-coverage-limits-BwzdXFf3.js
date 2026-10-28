var e={answerHtml:`<h2>简答</h2>
<ul>
<li>覆盖率只回答测试运行时经过了哪些代码，不回答结果是否符合需求。</li>
<li>语句、函数、分支覆盖各有盲区，都覆盖不了所有输入组合和状态顺序。</li>
<li>断言预期值应来自需求或独立规则，不能照抄实现。</li>
<li>覆盖率是未触达区域的提示，看报告前先确认统计的分母。</li>
</ul>
<h2>覆盖率回答的问题很有限</h2>
<p>覆盖率报告回答的是“测试运行时经过了哪些代码”。它不能回答“这个结果是否符合需求”“错误输入是否被拒绝”“两个异步请求乱序时是否安全”。</p>
<p>例如实现本应计算总价，却写成了加法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lineTotal</span>(<span class="hljs-params">unitPrice, quantity</span>) {
  <span class="hljs-keyword">return</span> unitPrice + quantity;
}

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;计算总价&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">lineTotal</span>(<span class="hljs-number">10</span>, <span class="hljs-number">3</span>)).<span class="hljs-title function_">toEqual</span>(expect.<span class="hljs-title function_">any</span>(<span class="hljs-title class_">Number</span>));
});
</code></pre></div>
<p>函数体被执行了，覆盖率也会上升，但测试没有验证 30 这个业务结果。更糟的是，如果测试预期值直接照抄实现里的 <code>unitPrice + quantity</code>，代码和测试会一起犯错。正确断言应来自需求、示例或独立的业务规则。</p>
<h2>不同覆盖维度有不同盲区</h2>
<p>语句覆盖看某行是否执行，函数覆盖看函数是否调用，分支覆盖看条件的不同方向是否走过。分支覆盖比只调用函数更有信息，但仍不能覆盖所有输入组合、状态顺序和数据关系。</p>
<p>价格校验即使测试了正数和负数，也可能漏掉 0、<code>NaN</code>、<code>Infinity</code>、字符串、超大数和小数精度。请求成功和失败都走过，也可能没有测试旧请求晚返回时不能覆盖新结果。</p>
<p>因此覆盖率是“未触达区域”的提示，不是“所有行为已证明”的结论。重要的是测试删掉关键行为后是否会失败。</p>
<h2>先确认报告的分母是谁</h2>
<p>覆盖率工具可能只统计被测试导入的文件，也可能按配置把整个 <code>src</code> 纳入分母。若一个完全没有测试的模块没有进入统计范围，报告仍可能显示很高：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">test</span>: {
    <span class="hljs-attr">coverage</span>: {
      <span class="hljs-attr">include</span>: [<span class="hljs-string">&#x27;src/**/*.{ts,tsx}&#x27;</span>],
      <span class="hljs-attr">exclude</span>: [<span class="hljs-string">&#x27;src/**/*.d.ts&#x27;</span>, <span class="hljs-string">&#x27;src/test/**&#x27;</span>],
    },
  },
});
</code></pre></div>
<p>具体字段和 provider 要按项目使用的 Vitest 版本核对。生成文件、第三方代码、测试辅助代码是否排除，都应有理由。通过扩大 <code>exclude</code> 或到处添加忽略注释提高百分比，只是改变分母。</p>
<h2>断言应从风险反推</h2>
<p>付款、权限和数据修改应优先验证正确结果、拒绝路径、重复提交、幂等和恢复；筛选界面要验证空结果、重置、过期响应和键盘操作；底层函数要覆盖边界和必须成立的性质。</p>
<p>测试可以写成外部行为：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 测试辅助：可从外部控制完成时机的 Promise</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">deferred</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> resolve;
  <span class="hljs-keyword">const</span> promise = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> { resolve = r; });
  <span class="hljs-keyword">return</span> { promise, resolve };
}

<span class="hljs-comment">// 被测实现：只接受最新一次查询的结果</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">createSearch</span>(<span class="hljs-params">{ request }</span>) {
  <span class="hljs-keyword">let</span> latest = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> results = [];
  <span class="hljs-keyword">return</span> {
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">run</span>(<span class="hljs-params">query</span>) {
      <span class="hljs-keyword">const</span> id = ++latest;
      <span class="hljs-keyword">const</span> items = <span class="hljs-keyword">await</span> <span class="hljs-title function_">request</span>(query);
      <span class="hljs-keyword">if</span> (id === latest) results = items;
    },
    <span class="hljs-attr">currentResults</span>: <span class="hljs-function">() =&gt;</span> results,
  };
}

<span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;旧搜索结果不能覆盖较新的查询&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> first = <span class="hljs-title function_">deferred</span>();
  <span class="hljs-keyword">const</span> second = <span class="hljs-title function_">deferred</span>();
  <span class="hljs-keyword">const</span> search = <span class="hljs-title function_">createSearch</span>({ <span class="hljs-attr">request</span>: <span class="hljs-function">(<span class="hljs-params">q</span>) =&gt;</span> q === <span class="hljs-string">&#x27;a&#x27;</span> ? first.<span class="hljs-property">promise</span> : second.<span class="hljs-property">promise</span> });

  search.<span class="hljs-title function_">run</span>(<span class="hljs-string">&#x27;a&#x27;</span>);
  search.<span class="hljs-title function_">run</span>(<span class="hljs-string">&#x27;ab&#x27;</span>);
  second.<span class="hljs-title function_">resolve</span>([<span class="hljs-string">&#x27;about&#x27;</span>]);
  <span class="hljs-keyword">await</span> second.<span class="hljs-property">promise</span>;
  first.<span class="hljs-title function_">resolve</span>([<span class="hljs-string">&#x27;apple&#x27;</span>]);
  <span class="hljs-keyword">await</span> first.<span class="hljs-property">promise</span>;
  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(); <span class="hljs-comment">// 让 run 中 await 之后的赋值先执行</span>

  <span class="hljs-title function_">expect</span>(search.<span class="hljs-title function_">currentResults</span>()).<span class="hljs-title function_">toEqual</span>([<span class="hljs-string">&#x27;about&#x27;</span>]);
});
</code></pre></div>
<p>这个用例验证的是用户能观察到的时序契约，而不是某个内部变量恰好被赋值。重构内部实现但保持行为不变时，好的测试仍应通过。</p>
<h2>变异测试和人工审查补足另一层证据</h2>
<p>把乘法改成加法、把 <code>&gt;</code> 改成 <code>&gt;=</code>、删除错误分支，看测试是否失败，可以发现断言过弱的问题。变异测试仍有等价变异和运行成本，不能替代测试设计。</p>
<p>审查高覆盖率用例时，可以问：删掉关键行为它会失败吗？错误结果会被发现吗？异常和取消是否有可观察结果？测试是否依赖实现细节？这些问题比追求一个整数百分比更接近测试价值。</p>
<p>覆盖率适合做回归信号和风险提示，不能替代接口契约、浏览器交互、安全验证、性能测试和人工验收。真正可靠的结论来自风险驱动的场景、独立的预期结果和可解释的失败信息。</p>`};export{e as default};