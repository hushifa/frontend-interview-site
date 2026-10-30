var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如写一个 Node 的工具库，只想测几个纯函数和一个调接口的模块，不想为此装 Jest 和一堆配置。Node.js 自带了测试运行器 <code>node:test</code>，v18 加入、v20 起稳定，写好测试文件运行 <code>node --test</code> 就行。</p>
<p>它覆盖了单元测试的基本需求：<code>test</code>、<code>describe</code>、<code>it</code> 和 <code>before</code>、<code>afterEach</code> 等钩子；<code>mock.fn</code>、<code>mock.method</code> 能记录调用，<code>mock.timers</code> 能模拟定时器和 <code>Date</code>，通过测试上下文 <code>t.mock</code> 创建的 mock 在测试结束后自动还原；快照测试从 v23.4 起不再是实验性功能；报告器内置 <code>spec</code>、<code>tap</code>、<code>dot</code>、<code>junit</code> 和 <code>lcov</code>。断言用 <code>node:assert</code>。</p>
<p>所以纯 Node 的库、CLI 和服务端代码，用它替代 Jest 是可行的，少一个依赖，也不需要转译。</p>
<p>可是前端项目一般不适合换。它没有内置 jsdom 这类浏览器环境，组件测试要的生态也在 Jest 和 Vitest 那边；模块 mock 要加 <code>--experimental-test-module-mocks</code> 参数，还处于早期开发阶段，代码覆盖率要加 <code>--experimental-test-coverage</code>，也是实验性的。只能用 <code>node:test</code> 这个带前缀的名字导入。</p>
</blockquote>
<h2>一个最小的测试文件</h2>
<p>下面测一个购物车的合计函数，它会调用接口取单价。测试里用 <code>t.mock.method</code> 监听接口方法，检查调用次数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { describe, it } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:test&#x27;</span>;
<span class="hljs-keyword">import</span> assert <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:assert/strict&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">createCart</span>(<span class="hljs-params">api</span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">total</span>(<span class="hljs-params">ids</span>) {
      <span class="hljs-keyword">const</span> prices = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(ids.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">id</span>) =&gt;</span> api.<span class="hljs-title function_">price</span>(id)));
      <span class="hljs-keyword">return</span> prices.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">a, b</span>) =&gt;</span> a + b, <span class="hljs-number">0</span>);
    },
  };
}

<span class="hljs-title function_">describe</span>(<span class="hljs-string">&#x27;购物车&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-title function_">it</span>(<span class="hljs-string">&#x27;合计价格&#x27;</span>, <span class="hljs-title function_">async</span> (t) =&gt; {
    <span class="hljs-keyword">const</span> api = { <span class="hljs-attr">price</span>: <span class="hljs-title function_">async</span> (id) =&gt; (id === <span class="hljs-string">&#x27;a&#x27;</span> ? <span class="hljs-number">10</span> : <span class="hljs-number">5</span>) };
    t.<span class="hljs-property">mock</span>.<span class="hljs-title function_">method</span>(api, <span class="hljs-string">&#x27;price&#x27;</span>);
    <span class="hljs-keyword">const</span> cart = <span class="hljs-title function_">createCart</span>(api);
    assert.<span class="hljs-title function_">equal</span>(<span class="hljs-keyword">await</span> cart.<span class="hljs-title function_">total</span>([<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>]), <span class="hljs-number">15</span>);
    assert.<span class="hljs-title function_">equal</span>(api.<span class="hljs-property">price</span>.<span class="hljs-property">mock</span>.<span class="hljs-title function_">callCount</span>(), <span class="hljs-number">2</span>);
  });
});
</code></pre></div>
<p>把它存成 <code>cart.test.mjs</code>，运行 <code>node --test</code> 就会执行，用 Node.js 22.23 实测通过。</p>
<p>读者可能会问，为什么不写成 <code>import { test } from &#x27;test&#x27;</code>？因为这个模块只能通过 <code>node:</code> 前缀访问，不带前缀会去找 npm 上叫 <code>test</code> 的包。</p>
<p><code>t.mock</code> 和顶层的 <code>mock</code> 用法一样，区别在于通过测试上下文创建的 mock，测试结束时会自动还原，不用手动 <code>restore</code>。</p>
<h2>node --test 会找哪些文件</h2>
<p>不传参数时，<code>node --test</code> 按约定匹配文件，包括 <code>**/*.test.{cjs,mjs,js}</code>、<code>**/*-test.*</code>、<code>**/*_test.*</code>、<code>**/test-*.*</code>、<code>**/test.*</code>，以及 <code>test</code> 目录下的所有脚本。当前文档里，在没有加 <code>--no-strip-types</code> 的情况下，<code>.ts</code>、<code>.mts</code>、<code>.cts</code> 后缀也会匹配。也可以自己传 glob，记得加引号，避免被 shell 展开：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">node --test &quot;**/*.spec.js&quot;
</code></pre></div>
<p><code>--watch</code> 可以监听测试文件和它的依赖，改动后重跑受影响的测试，这个功能目前是实验性的。默认每个测试文件在单独的子进程里运行。任何测试失败，进程退出码都会被设为 1，CI 能直接据此判断。</p>
<h2>和 Jest 比还差什么</h2>
<p>第一是浏览器环境。Jest 和 Vitest 都可以切到 <code>jsdom</code> 环境测组件，<code>node:test</code> 没有这一层，前端组件测试要自己接，或者干脆用 Vitest，见<a href="/questions/testing-unit-jest-vitest/">《前端单元测试怎么写？Jest 和 Vitest 有什么区别？》</a>。</p>
<p>第二是模块 mock。Jest 的 <code>jest.mock</code> 很常用，<code>node:test</code> 对应的 <code>mock.module</code> 要加 <code>--experimental-test-module-mocks</code> 参数，稳定性标记是 1.0，也就是早期开发阶段。</p>
<p>第三是覆盖率。要加 <code>--experimental-test-coverage</code> 参数，同样是实验性的；可以配合 <code>lcov</code> 报告器输出给其他工具。</p>
<p>另外文档提醒，内置报告器的输出格式在不同 Node 版本之间可能变化，不要让程序去解析它。v23 起非 TTY 输出的默认报告器也从 <code>tap</code> 改成了 <code>spec</code>。</p>
<p>定时器测试本身容易出的问题，见<a href="/questions/testing-time-and-fake-timers/">《前端怎样测试定时器、重试和超时，避免 Fake Timers 造成假通过？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>t.test()</code> 写的子测试和 <code>describe</code> 里的 <code>it</code> 有什么区别？</strong></p>
<blockquote>
<p>文档特别提醒过，用 <code>t.test()</code> 创建的子测试，父测试不会自动等它完成，父测试结束时还没跑完的子测试会被取消并算作失败，所以要 <code>await t.test(...)</code>。写在 <code>describe</code>（也就是 <code>suite</code>）里的测试没有这个问题。</p>
</blockquote>
<p><strong>快照测试怎样更新？</strong></p>
<blockquote>
<p>用 <code>t.assert.snapshot(value)</code> 断言，第一次或需要更新时，带上 <code>--test-update-snapshots</code> 参数运行，快照默认写到测试文件旁边的 <code>.snapshot</code> 文件里。</p>
</blockquote>
<p><strong>只想跑某一个测试怎么办？</strong></p>
<blockquote>
<p>可以用 <code>test.only</code>、<code>it.only</code>，再用 <code>--test-only</code> 参数运行；<code>test.skip</code> 跳过，<code>test.todo</code> 标记待完成。也可以用 <code>--test-name-pattern</code> 按名字过滤。</p>
</blockquote>`};export{e as default};