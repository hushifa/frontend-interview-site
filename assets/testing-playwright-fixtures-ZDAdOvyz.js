var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Fixture 集中声明资源怎样建立、谁依赖它、何时释放。</li>
<li>await use 之前是准备，之后是清理，清理放在 finally 里。</li>
<li>它是按依赖和作用域管理的生命周期，不是隐藏的全局变量。</li>
<li>清理只针对 fixture 自己创建的资源。</li>
</ul>
<p>当多个测试都要创建账号、准备文件或获得 API 客户端时，直接复制初始化代码会带来两个问题：步骤容易分叉，清理容易遗漏。Fixture 把“资源如何建立、谁依赖它、何时释放”集中声明，让测试只使用自己需要的上下文。</p>
<p>它不是一个隐藏的全局变量，而是一套由依赖与作用域决定的生命周期。</p>
<h2>await use 把准备和清理分开</h2>
<p>下面是一个可独立运行的 Playwright Test 文件，不需要启动浏览器。它为每个测试创建独立临时目录：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { test <span class="hljs-keyword">as</span> base, expect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;
<span class="hljs-keyword">import</span> { mkdtemp, readFile, rm, writeFile } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:fs/promises&#x27;</span>;
<span class="hljs-keyword">import</span> { join } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:path&#x27;</span>;
<span class="hljs-keyword">import</span> { tmpdir } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:os&#x27;</span>;

<span class="hljs-keyword">const</span> test = base.<span class="hljs-property">extend</span>&lt;{ <span class="hljs-attr">workspace</span>: <span class="hljs-built_in">string</span> }&gt;({
  <span class="hljs-attr">workspace</span>: <span class="hljs-title function_">async</span> ({}, use) =&gt; {
    <span class="hljs-keyword">const</span> directory = <span class="hljs-keyword">await</span> <span class="hljs-title function_">mkdtemp</span>(<span class="hljs-title function_">join</span>(<span class="hljs-title function_">tmpdir</span>(), <span class="hljs-string">&#x27;playwright-example-&#x27;</span>));
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">use</span>(directory);
    } <span class="hljs-keyword">finally</span> {
      <span class="hljs-comment">// 只清理由本 fixture 创建的目录，不使用测试输入作为删除目标。</span>
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">rm</span>(directory, { <span class="hljs-attr">recursive</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">force</span>: <span class="hljs-literal">true</span> });
    }
  },
});

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;在独立目录里写入结果&#x27;</span>, <span class="hljs-title function_">async</span> ({ workspace }) =&gt; {
  <span class="hljs-keyword">const</span> target = <span class="hljs-title function_">join</span>(workspace, <span class="hljs-string">&#x27;result.txt&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">writeFile</span>(target, <span class="hljs-string">&#x27;测试结果&#x27;</span>, <span class="hljs-string">&#x27;utf8&#x27;</span>);
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">readFile</span>(target, <span class="hljs-string">&#x27;utf8&#x27;</span>)).<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;测试结果&#x27;</span>);
});
</code></pre></div>
<p>use 之前是准备阶段，传给 use 的值会提供给依赖它的测试。等待 use 完成后进入清理阶段。try/finally 明确表达失败时也要释放资源，但进程被强杀、机器断电等情况仍不能保证清理代码运行，需要环境层面的兜底。</p>
<p>资源创建到一半失败也要考虑清理，不能只覆盖测试正文失败。涉及外部账号或订单时，最好保留足够标识，方便测试环境定期清除遗留数据。</p>
<h2>Fixture 按依赖顺序建立和拆除</h2>
<p>如果 authenticatedPage 依赖 page 和 account，那么依赖先准备好，再执行 authenticatedPage 的准备。拆除时先释放使用者，再释放其依赖，避免页面还在使用账号时账号已经被删除。</p>
<p>默认非自动 fixture 通常按需建立，测试没有声明也没有被其他 fixture 依赖时，不必执行昂贵初始化。自动 fixture 可用于统一诊断或清理，但应保持用途明确，避免每个测试背后都暗中运行大量工作。</p>
<h2>test 与 worker 作用域不是“快慢开关”</h2>
<p>测试级 fixture 为单个测试提供隔离资源；worker 级 fixture 在同一工作进程中复用，适合较昂贵且可以安全共享的资源。</p>
<p>worker 级 fixture 不能依赖生命周期更短的测试级 fixture。例如共享服务可以被多个 page 使用，但不能让共享服务的初始化依赖某一个测试专属 page。</p>
<p>worker 也不等于整次运行。并行 worker、失败后的工作进程重启和重试都可能重新建立资源，不能假设“全套测试只登录一次”。账号和临时数据应采用能区分不同 worker 或运行的标识。</p>
<h2>复用认证不等于复用可变业务状态</h2>
<p>把登录态保存成 storageState 可以减少重复登录，但多个上下文仍可能指向同一个后端账号。若测试都修改同一份用户资料，即使浏览器隔离也会互相干扰。</p>
<p>可以为 worker 分配独立账号，为每个测试准备独立业务记录，或者将共享数据限制为只读。认证文件本身包含敏感状态，应按测试凭据保护，不要提交到公开仓库。</p>
<h2>Fixture 与普通辅助函数如何选择</h2>
<p>单纯把字符串变成测试数据，普通函数就足够。涉及资源所有权、准备和清理，或需要组合其他上下文时，fixture 更合适。Page Object 可以作为 fixture 提供的对象，但 Page Object 封装页面操作，fixture 管理生命周期，二者职责不同。</p>
<p>不要把所有业务步骤都塞进 fixture，导致测试正文只剩一个没有含义的断言。用例仍应清楚表达当前场景，fixture 负责稳定准备与释放条件，这样失败时才能知道是环境没建好，还是行为本身错了。</p>`};export{e as default};