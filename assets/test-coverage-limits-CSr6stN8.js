var e={answerHtml:`<p>覆盖率回答的是“测试执行过哪些代码”，不是“这些代码的结果都正确吗”。一个测试调用完函数却不检查返回值，也可能把很多行标成已覆盖。</p>
<p>因此 100% 是相对于某个统计范围与覆盖维度的执行记录，不是产品正确性的证明。</p>
<h3>执行到错误代码，也能得到高覆盖率</h3>
<p>下面故意写错了数量计算：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lineTotal</span>(<span class="hljs-params">unitPrice, quantity</span>) {
  <span class="hljs-keyword">return</span> unitPrice + quantity;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">lineTotal</span>(<span class="hljs-number">10</span>, <span class="hljs-number">3</span>)); <span class="hljs-comment">// 13，业务要求应为 30</span>
</code></pre></div>
<p>只调用 lineTotal(10, 3)，函数体就被执行了。若测试只断言结果是 number，错误实现仍可能通过；如果断言结果为 30，才会抓住这里的乘法错误。</p>
<p>更隐蔽的是测试把实现重复一遍，断言结果等于 unitPrice + quantity。代码与测试一起理解错业务，覆盖率再高也没有独立判断能力。预期结果应来自需求、可核验例子或独立性质，而不是照抄当前实现。</p>
<h3>不同覆盖维度有不同盲区</h3>
<p>语句覆盖看语句是否执行，函数覆盖看函数是否调用，分支覆盖看条件分支是否走到。把 if 的两边都运行一次，比只看函数被调用更有信息，但仍不等于所有输入与路径组合都测试过。</p>
<p>例如价格校验分别测试一个正数和一个负数，仍可能漏掉 0、NaN、Infinity、字符串或精度问题。多个分支按不同顺序执行，还可能产生单个分支测试看不到的状态错误。</p>
<p>异步问题尤其如此：请求成功与失败分支都覆盖了，也可能没有验证“旧请求晚返回时不得覆盖新结果”。执行过相同代码，不代表测试过相同的时序组合。</p>
<h3>先确认报告统计了哪些文件</h3>
<p>Vitest 可配置 coverage.include 与 coverage.exclude。若只统计本次测试导入过的文件，一整个未被测试引用的模块可能根本没进入分母，报告仍然很好看。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { defineConfig } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest/config&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-title function_">defineConfig</span>({
  <span class="hljs-attr">test</span>: {
    <span class="hljs-attr">coverage</span>: {
      <span class="hljs-attr">include</span>: [<span class="hljs-string">&#x27;src/**/*.{ts,tsx}&#x27;</span>],
      <span class="hljs-attr">exclude</span>: [<span class="hljs-string">&#x27;src/**/*.d.ts&#x27;</span>],
    },
  },
});
</code></pre></div>
<p>示例只是说明统计范围。实际项目要根据所用 Vitest 版本、覆盖率 provider 和目录结构配置相应依赖与运行命令，不能复制后就认为生产代码全部被纳入。</p>
<p>生成代码、第三方代码、测试文件和业务源码是否计入应有明确理由。通过扩大 exclude 或随意添加忽略注释让百分比上涨，通常不会减少真实缺陷。</p>
<h3>用风险选择断言和场景</h3>
<p>对于付款、权限和数据修改，优先验证正确结果、拒绝路径、重复提交与异常恢复；对于筛选界面，检查输入、空结果、重置和过期响应；对于底层算法，覆盖边界与必须成立的性质。</p>
<p>变异测试可以进一步检查断言是否敏感：把乘法变加法、把大于改为大于等于，看测试是否失败。但变异测试也有等价变异和运行成本问题，不是另一种万能质量百分比。</p>
<p>覆盖率适合帮助发现“这里完全没碰过”或防止测试范围明显退步。它不能代替用例审查、接口契约测试、浏览器交互或安全验证。</p>
<p>评审一个高覆盖率测试时，可以问：删掉关键行为它会失败吗？错误结果会被发现吗？重构内部实现但行为不变时，它还应通过吗？这些问题比单独追求整数百分比更接近测试的实际价值。</p>`};export{e as default};