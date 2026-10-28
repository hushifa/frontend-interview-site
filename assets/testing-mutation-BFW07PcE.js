var e={answerHtml:`<p>一个计费函数的分支覆盖率达到 100%，但把 <code>&gt;=</code> 改成 <code>&gt;</code> 后所有测试仍然通过，线上恰好在边界金额出错。覆盖率只能说明哪些代码被执行过，不能说明断言是否能区分正确结果和错误结果。变异测试会自动对代码做小幅、可控的修改（mutant），然后运行测试；测试能失败，说明这个变异被杀死，测试对该行为有约束。</p>
<h2>变异测试测的是断言强度</h2>
<p>常见变异包括：</p>
<ul>
<li><code>===</code> 改成 <code>!==</code> 或反转条件；</li>
<li><code>&gt;</code> 改成 <code>&gt;=</code>；</li>
<li>删除函数调用或返回值；</li>
<li>把布尔值改成 <code>true</code>/<code>false</code>；</li>
<li>改变算术运算符或数组边界。</li>
</ul>
<p>例如原代码规定满 100 元才免运费：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">shippingFee</span>(<span class="hljs-params">total</span>) {
  <span class="hljs-keyword">return</span> total &gt;= <span class="hljs-number">100</span> ? <span class="hljs-number">0</span> : <span class="hljs-number">10</span>;
}
</code></pre></div>
<p>如果测试只有 50 元和 200 元，<code>&gt;=</code> 变成 <code>&gt;</code> 仍然通过；加入恰好 100 元的断言，才能杀死这个边界变异。测试应验证用户能观察到的规则和结果，而不是只断言函数被调用或分支执行。</p>
<h2>等价变异不能简单算失败</h2>
<p>等价变异是在约定的有效输入域与可观察行为下，与原程序没有行为差别的变异。仅仅对当前测试输入结果相同不叫等价：上面的 50 元和 200 元恰好无法区分 &gt;= 与 &gt;，100 元却能区分。这是测试缺口，不能按等价变异排除。确认等价通常需要人工分析，不能假设工具总能自动判定；使用忽略配置时应注明适用输入域和理由。</p>
<p>前端代码还可能产生大量与构建工具、框架编译和 CSS 相关的变异。优先对纯函数、权限规则、金额计算、状态机和数据转换运行变异测试；不要一开始对整个应用和所有第三方依赖运行，成本会迅速失控。</p>
<h2>交互测试要选择可观察行为</h2>
<p>对组件变异时，删除一个 <code>aria-disabled</code>、改变按钮文案或跳过错误状态更新，测试应从用户角度发现差异：按钮是否不能提交、错误是否被读屏器感知、焦点是否回到安全位置。只比较内部 state 或组件快照，可能让真实行为变异存活。</p>
<p>网络请求和异步状态的变异也要覆盖：把成功改成失败、把旧请求结果错误地应用、删除取消逻辑或改变重试次数。测试应控制请求顺序、断网和取消，并断言最终界面、请求数量和可访问状态。</p>
<h2>如何在工程中落地</h2>
<p>通常流程是先运行普通单元测试，再对选定目录生成变异；变异测试只在基线测试通过后运行。报告应区分 killed、survived、timeout 和 no coverage，并按代码路径和风险排序。长时间运行的变异可以在 CI 夜间任务执行，Pull Request 只检查关键规则或增量文件。</p>
<p>变异测试失败时不要为了让分数上升而增加无意义断言。先问“这个变异是否代表真实回归”，再补边界、错误、权限或用户操作测试。变异分数是诊断信号，不是产品质量的单一指标。</p>
<h2>性能与稳定性边界</h2>
<p>每个变异都可能触发构建和测试，时间通常远高于普通测试。工具可以利用覆盖关系选择相关测试，具体成本取决于配置。可以限制并发、按目录筛选和设置超时。测试必须控制网络、时间、随机数和全局状态，否则变异结果会受到顺序和环境波动影响。</p>
<p>按 Stryker 官方报告口径，Timeout 与 Killed 是不同状态，但两者都计入 Detected；变异造成死循环，测试超时也能阻止这段代码进入正常交付流程。Mutation score = (Killed + Timeout) / (Killed + Timeout + Survived + No coverage) × 100，编译错误和运行错误不计入这一分母。不能把 Timeout 擅自改记为 Killed，也不能说它必然不计入得分。若大量超时源于测试环境过载或超时阈值过小，则应先修复环境，避免把不稳定运行误当成测试有效。</p>
<h2>常见误区</h2>
<ul>
<li>用覆盖率替代变异测试：执行过不等于断言有效。</li>
<li>追求 100% 变异分数：等价变异和非关键代码需要合理排除。</li>
<li>只测试内部实现：用户可见的错误可能仍然存活。</li>
<li>对全仓库一次性运行：成本和噪声会让结果不可用。</li>
<li>把超时当作断言命中：工具会计入检测结果，但必须区分变异导致的死循环与环境故障。</li>
</ul>
<h2>参考资料</h2>
<ul>
<li><a href="https://stryker-mutator.io/docs/mutation-testing-elements/supported-mutators/">Stryker Mutator · Supported mutators</a></li>
<li><a href="https://stryker-mutator.io/docs/mutation-testing-elements/mutant-states-and-metrics/">Stryker Mutator · Mutant states and metrics</a></li>
<li><a href="https://stryker-mutator.io/docs/mutation-testing-elements/">Stryker Mutator · Mutation testing</a></li>
<li><a href="https://vitest.dev/guide/">Vitest · Testing</a></li>
</ul>`};export{e as default};