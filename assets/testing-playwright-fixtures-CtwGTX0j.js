var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>测试函数参数里写的 <code>page</code>、<code>context</code>、<code>request</code>，其实都是 fixture。fixture 就是测试要用的一份准备好的东西，Playwright 负责创建它、交给测试、用完再清理，每个测试拿到的都是全新的一份。</p>
<p>自己写 fixture 用 <code>test.extend</code>。在 fixture 函数里，<code>await use(value)</code> 之前写准备，之后写清理，就算测试失败了，清理也会执行。</p>
<p>它的好处是按需创建：测试参数里没写的 fixture 不会被初始化。fixture 之间还可以互相依赖，Playwright 按依赖顺序创建，按相反顺序拆除。</p>
<p>默认每个测试一份。加上 <code>{ scope: &#x27;worker&#x27; }</code>，同一个工作进程里的测试就共享一份，适合启动成本高、测试又不会去改的资源，比如只读的测试账号；会被修改的数据还是要用 test 作用域。</p>
</blockquote>
<h2>自定义一个 fixture</h2>
<p>下面的 <code>todo</code> fixture 在测试前通过接口建一条任务，测试结束后再删掉它：</p>
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
<p><code>await use(todo)</code> 这一行把任务交给测试，然后停在这里等测试跑完，测试结束后才继续执行下面的删除。</p>
<p>和 <code>beforeEach</code> 里创建、<code>afterEach</code> 里删除相比，好处在哪？一是准备和清理写在同一个地方，不会只改了一半。二是只有参数里写了 <code>todo</code> 的测试才会去创建它，其他测试不受影响。</p>
<h2>worker 作用域怎样共享资源</h2>
<p>“工作进程”是 Playwright 并行跑测试时开的进程，每个进程依次执行分给它的测试。</p>
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
<p>这里每个工作进程用 <code>workerIndex</code> 建一个自己的账号，并行的进程之间互不干扰。同一个进程里的测试是一个接一个串行跑的，它们共享这个账号，所以不能有哪个测试去改它的状态，否则后面的测试会受影响。</p>
<h2>自动 fixture</h2>
<p>给 fixture 加上 <code>{ auto: true }</code>，它会对每个测试自动运行，测试不声明也会跑。适合放统一的日志收集，或者在测试失败时附加额外的信息。</p>
<h2>什么时候用普通函数就够了</h2>
<p>如果只是封装一组操作，比如“填写登录表单”，写个普通函数或页面对象就行。只有需要生命周期管理，也就是创建了就必须清理，或者要按作用域在多个测试间共享时，才值得写成 fixture。</p>
<h2>常见追问</h2>
<p><strong>登录状态怎样复用？</strong></p>
<blockquote>
<p>常见做法是写一个 setup 项目，登录一次后把 <code>storageState</code> 保存成文件，其他项目在配置里引用这个文件。需要多个角色时，每个角色各保存一个文件。</p>
</blockquote>`};export{e as default};