var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>商品价格接口返回的是“分”，页面要显示成 <code>¥19.99</code>。这个转换函数就是最适合写单元测试的对象：给定输入，结果是确定的，不依赖网络和 DOM。测试就三步：准备输入、调用函数、断言输出，再补上 0、负数、非整数这类边界情况。</p>
<p>单元测试的价值是快和准。它一秒能跑几百个，出错时能直接定位到哪个函数的哪种输入。所以要把业务计算从组件里抽成纯函数，组件只负责展示，测试才好写。</p>
<p>Jest 和 Vitest 的写法几乎一样，都是 <code>describe</code>、<code>it</code>、<code>expect</code>，Vitest 官方说它兼容大部分 Jest API。区别主要在配置：Vitest 直接复用项目的 <code>vite.config</code>，原生支持 ESM 和 TypeScript；Jest 要通过 Babel 或 ts-jest 转 TypeScript，ESM 支持官方仍标为实验性。用 Vite 的项目选 Vitest 更省事。</p>
<p>迁移时要注意几个细节：Jest 默认注入全局的 <code>describe</code>、<code>expect</code>，Vitest 默认不注入，要么显式导入，要么开 <code>globals</code>；<code>jest.mock</code> 的工厂函数返回值直接当默认导出，而 <code>vi.mock</code> 的工厂要返回包含每个导出的对象。</p>
</blockquote>
<h2>被测函数长什么样</h2>
<p>下面这个函数把“分”格式化成带货币符号的字符串，不合法的金额直接抛错。它可以直接在 node 里运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">formatPrice</span>(<span class="hljs-params">cents, currency = <span class="hljs-string">&#x27;CNY&#x27;</span></span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(cents) || cents &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;金额必须是非负整数（单位：分）&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> symbol = currency === <span class="hljs-string">&#x27;USD&#x27;</span> ? <span class="hljs-string">&#x27;$&#x27;</span> : <span class="hljs-string">&#x27;¥&#x27;</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-string">\`<span class="hljs-subst">\${symbol}</span><span class="hljs-subst">\${(cents / <span class="hljs-number">100</span>).toFixed(<span class="hljs-number">2</span>)}</span>\`</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatPrice</span>(<span class="hljs-number">1999</span>));        <span class="hljs-comment">// ¥19.99</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">formatPrice</span>(<span class="hljs-number">5</span>, <span class="hljs-string">&#x27;USD&#x27;</span>));     <span class="hljs-comment">// $0.05</span>
<span class="hljs-keyword">try</span> {
  <span class="hljs-title function_">formatPrice</span>(-<span class="hljs-number">1</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>, error.<span class="hljs-property">message</span>); <span class="hljs-comment">// RangeError 金额必须是非负整数（单位：分）</span>
}
</code></pre></div>
<p>为什么金额用整数“分”而不是小数“元”？因为 <code>0.1 + 0.2</code> 在 JavaScript 里不等于 <code>0.3</code>，用整数传、只在展示时除以 100，能避开大部分浮点误差。测试要守住的正是这些约定。</p>
<h2>测试怎样写</h2>
<p>用 Vitest 写，显式从 <code>vitest</code> 导入 API：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { describe, it, expect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;
<span class="hljs-keyword">import</span> { formatPrice } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./formatPrice&#x27;</span>;

<span class="hljs-title function_">describe</span>(<span class="hljs-string">&#x27;formatPrice&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;把分转换成两位小数的元&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">formatPrice</span>(<span class="hljs-number">1999</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;¥19.99&#x27;</span>);
  });

  <span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;不足一元时补零&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">formatPrice</span>(<span class="hljs-number">5</span>, <span class="hljs-string">&#x27;USD&#x27;</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;$0.05&#x27;</span>);
  });

  <span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;0 元也能正常显示&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">formatPrice</span>(<span class="hljs-number">0</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;¥0.00&#x27;</span>);
  });

  it.<span class="hljs-title function_">each</span>([-<span class="hljs-number">1</span>, <span class="hljs-number">1.5</span>, <span class="hljs-title class_">Number</span>.<span class="hljs-property">NaN</span>])(<span class="hljs-string">&#x27;拒绝不合法的金额 %s&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> {
    <span class="hljs-title function_">expect</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">formatPrice</span>(value)).<span class="hljs-title function_">toThrow</span>(<span class="hljs-title class_">RangeError</span>);
  });
});
</code></pre></div>
<p>每个 <code>it</code> 只验证一件事，名字写成“在什么情况下得到什么结果”，失败时一眼就能看出坏在哪里。边界值用 <code>it.each</code> 批量覆盖。断言抛错时要把调用包进箭头函数，写成 <code>expect(formatPrice(-1)).toThrow()</code> 的话，错误在 <code>expect</code> 执行之前就抛出来了，测试会直接失败。</p>
<p>换成 Jest，只要把第一行导入去掉（或者改从 <code>@jest/globals</code> 导入），其余代码基本不用动。</p>
<h2>单元测试应该测什么</h2>
<p>优先测有分支和计算的纯逻辑：格式化、校验、价格计算、状态转换、数据整理。测的是输入和输出的关系，不测函数内部用了哪个变量，这样重构实现时测试不用跟着改。</p>
<p>依赖网络、时间、随机数的代码，要么把这些依赖作为参数传进来，要么在测试里替换掉。什么时候该替换、替换多了有什么问题，见<a href="/questions/test-mocks/">《什么时候应该 mock，mock 太多有什么问题？》</a>；定时器相关的见<a href="/questions/testing-time-and-fake-timers/">《前端怎样测试定时器、重试和超时，避免 Fake Timers 造成假通过？》</a>。和用户交互有关的组件，按用户行为写，见<a href="/questions/testing-component/">《前端组件测试应该围绕哪些用户行为？》</a>。</p>
<h2>Jest 和 Vitest 具体差在哪里</h2>
<table><thead><tr><th>方面</th><th>Jest</th><th>Vitest</th></tr></thead><tbody><tr><td>配置</td><td>独立的 Jest 配置</td><td>复用 <code>vite.config</code>，共享插件和别名</td></tr><tr><td>TypeScript</td><td>经 Babel（只转译不做类型检查）、ts-jest，或 Node 类型擦除</td><td>由 Vite 管线处理</td></tr><tr><td>ESM</td><td>官方标为实验性，需要 <code>--experimental-vm-modules</code></td><td>原生支持</td></tr><tr><td>全局 API</td><td>默认注入</td><td>默认不注入，可开 <code>globals</code></td></tr><tr><td>默认测试环境</td><td><code>node</code></td><td><code>node</code></td></tr><tr><td>模块 mock</td><td><code>jest.mock</code>，<code>__mocks__</code> 目录自动生效</td><td><code>vi.mock</code>，<code>__mocks__</code> 只在调用 <code>vi.mock()</code> 时加载</td></tr></tbody></table>
<p>Vitest 官方的比较文档说得很直接：如果应用基于 Vite，再维护一套 Jest 的转换管线是重复的复杂度；即使不用 Vite，Vitest 默认的监听模式和更快的运行也值得考虑。反过来，Jest 生态更早、资料更多，老项目已经稳定运行在 Jest 上时，没有必要为了换而换。</p>
<p>Jest 文档还提醒，通过 Babel 支持 TypeScript 只是转译，运行测试时不会做类型检查，需要类型检查就用 ts-jest 或单独跑 <code>tsc</code>。Vitest 则另外提供了类型测试：<code>*.test-d.ts</code> 文件里可以用 <code>expectTypeOf</code> 断言类型，官方说明这类文件不会被执行，而是在底层调用 <code>tsc</code> 或 <code>vue-tsc</code> 做静态分析。普通测试照常运行，项目仍然应该单独跑一次 <code>tsc</code>。</p>
<h2>常见追问</h2>
<p><strong>测试环境要用 jsdom 吗？</strong></p>
<blockquote>
<p>两者默认都是 <code>node</code> 环境。只有测试里要访问 <code>document</code>、<code>window</code> 时，才把对应文件或配置切换成 <code>jsdom</code> 或 <code>happy-dom</code>。纯函数测试留在 <code>node</code> 环境更快。</p>
</blockquote>
<p><strong>从 Jest 迁移到 Vitest，最容易踩什么坑？</strong></p>
<blockquote>
<p>官方迁移指南列的几条最常见：全局 API 默认关闭，不开 <code>globals</code> 时 Testing Library 不会自动清理 DOM；<code>vi.mock</code> 的工厂要返回包含所有导出的对象；<code>requireActual</code> 要换成 <code>vi.importActual</code>；<code>mockReset</code> 在 Vitest 里会恢复成 <code>vi.fn(impl)</code> 里传入的原始实现，而不是空函数。</p>
</blockquote>
<p><strong>覆盖率达到多少才够？</strong></p>
<blockquote>
<p>覆盖率只能说明代码被执行过，不能说明断言有没有验证对结果。详见<a href="/questions/test-coverage-limits/">《为什么 100% 代码覆盖率也可能漏掉严重问题？》</a>。</p>
</blockquote>`};export{e as default};