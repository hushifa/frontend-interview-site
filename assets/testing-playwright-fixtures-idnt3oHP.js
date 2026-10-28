var e={answerHtml:`<h2>简答</h2>
<ul>
<li>内置的 <code>page</code>、<code>context</code>、<code>request</code> 都是 fixture，每个测试拿到全新的实例。</li>
<li>自定义 fixture 用 <code>test.extend</code>：<code>await use(value)</code> 之前是准备，之后是清理，测试失败也会执行清理。</li>
<li>fixture 按需创建：测试参数里没写的 fixture 不会被初始化。</li>
<li>fixture 可以依赖其他 fixture，Playwright 按依赖顺序创建、按相反顺序拆除。</li>
<li><code>{ scope: &#x27;worker&#x27; }</code> 让同一个工作进程中的测试共享一份，适合启动成本高、测试不会修改的资源，例如只读的测试账号；会被修改的数据应该用 test 作用域。</li>
</ul>
<h2>自定义 fixture</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { test <span class="hljs-keyword">as</span> base, expect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@playwright/test&#x27;</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Fixtures</span> = {
  <span class="hljs-attr">todo</span>: { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span> };
};

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> test = base.<span class="hljs-property">extend</span>&lt;<span class="hljs-title class_">Fixtures</span>&gt;({
  <span class="hljs-attr">todo</span>: <span class="hljs-title function_">async</span> ({ request }, use) =&gt; {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> request.<span class="hljs-title function_">post</span>(<span class="hljs-string">&#x27;/api/test/todos&#x27;</span>, {
      <span class="hljs-attr">data</span>: { <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;测试任务&#x27;</span> },
    });
    <span class="hljs-keyword">const</span> todo = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();

    <span class="hljs-keyword">await</span> <span class="hljs-title function_">use</span>(todo);

    <span class="hljs-keyword">await</span> request.<span class="hljs-title function_">delete</span>(<span class="hljs-string">\`/api/test/todos/<span class="hljs-subst">\${todo.id}</span>\`</span>);
  },
});

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;完成任务&#x27;</span>, <span class="hljs-title function_">async</span> ({ page, todo }) =&gt; {
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">\`/todos/<span class="hljs-subst">\${todo.id}</span>\`</span>);
  <span class="hljs-keyword">await</span> page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;checkbox&#x27;</span>, { <span class="hljs-attr">name</span>: todo.<span class="hljs-property">title</span> }).<span class="hljs-title function_">check</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;已完成&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
});
</code></pre></div>
<p>和在 <code>beforeEach</code> 里创建、<code>afterEach</code> 里删除相比，准备和清理写在一起，只有用到 <code>todo</code> 的测试才会创建它。</p>
<h2>worker 作用域</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> test = base.<span class="hljs-property">extend</span>&lt;{}, { <span class="hljs-attr">account</span>: { <span class="hljs-attr">email</span>: <span class="hljs-built_in">string</span> } }&gt;({
  <span class="hljs-attr">account</span>: [
    <span class="hljs-title function_">async</span> ({}, use, workerInfo) =&gt; {
      <span class="hljs-keyword">const</span> email = <span class="hljs-string">\`user-<span class="hljs-subst">\${workerInfo.workerIndex}</span>@test.local\`</span>;
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">createAccount</span>(email);
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">use</span>({ email });
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">deleteAccount</span>(email);
    },
    { <span class="hljs-attr">scope</span>: <span class="hljs-string">&#x27;worker&#x27;</span> },
  ],
});
</code></pre></div>
<p>每个工作进程一个账号，并行的进程之间互不干扰。同一进程里的测试是串行执行的，所以它们共享这个账号时，不能有测试修改它的状态。</p>
<h2>自动 fixture</h2>
<p><code>{ auto: true }</code> 让 fixture 对每个测试自动运行，即使测试没有声明它，适合统一的日志收集或在失败时附加额外信息。</p>
<h2>和普通辅助函数怎么选</h2>
<p>只是封装一组操作（例如“填写登录表单”）用普通函数或页面对象即可。需要生命周期管理（创建后必须清理）或要在多个测试间按作用域共享时，才用 fixture。</p>
<h2>常见追问</h2>
<ul>
<li>登录状态怎样复用？常见做法是一个 setup 项目登录后保存 <code>storageState</code> 文件，其他项目在配置里引用它；需要多个角色时，为每个角色保存一个文件。</li>
</ul>`};export{e as default};