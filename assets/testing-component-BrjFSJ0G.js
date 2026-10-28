var e={answerHtml:`<h2>简答</h2>
<ul>
<li>测试越像用户的使用方式，越能证明功能可用；Testing Library 的指导原则就是这句话。</li>
<li>断言用户能感知的结果：显示的文字、控件是否禁用、焦点位置、调用了外部回调。</li>
<li>不断言内部 state、Hook 调用次数、DOM 层级和类名，这些在重构时会变化，用户却感觉不到。</li>
<li>加载、成功、空结果、失败和重试分别写用例，异步结果用 <code>findBy*</code> 等待，不用固定时长的 sleep。</li>
<li>外部依赖（请求、时钟、路由）通过 props、Context 或模块 mock 替换，组件自己的逻辑保持真实。</li>
</ul>
<h2>被测组件</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">import</span> { useState, <span class="hljs-keyword">type</span> <span class="hljs-title class_">FormEvent</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">type</span> <span class="hljs-title class_">State</span> =
  | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;idle&#x27;</span> }
  | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;loading&#x27;</span> }
  | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;success&#x27;</span>; <span class="hljs-attr">items</span>: <span class="hljs-built_in">string</span>[] }
  | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;error&#x27;</span> };

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">SearchBox</span>(<span class="hljs-params">{ search }: { search: (q: <span class="hljs-built_in">string</span>) =&gt; <span class="hljs-built_in">Promise</span>&lt;<span class="hljs-built_in">string</span>[]&gt; }</span>) {
  <span class="hljs-keyword">const</span> [keyword, setKeyword] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [state, setState] = useState&lt;<span class="hljs-title class_">State</span>&gt;({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;idle&#x27;</span> });

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">submit</span>(<span class="hljs-params"><span class="hljs-attr">event</span>: <span class="hljs-title class_">FormEvent</span></span>) {
    event.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-title function_">setState</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;loading&#x27;</span> });
    <span class="hljs-keyword">try</span> {
      <span class="hljs-title function_">setState</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;success&#x27;</span>, <span class="hljs-attr">items</span>: <span class="hljs-keyword">await</span> <span class="hljs-title function_">search</span>(keyword) });
    } <span class="hljs-keyword">catch</span> {
      <span class="hljs-title function_">setState</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;error&#x27;</span> });
    }
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">onSubmit</span>=<span class="hljs-string">{submit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">htmlFor</span>=<span class="hljs-string">&quot;kw&quot;</span>&gt;</span>关键词<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;kw&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{keyword}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setKeyword(e.target.value)} /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{state.kind</span> === <span class="hljs-string">&#x27;loading&#x27;</span>}&gt;</span>搜索<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      {state.kind === &#x27;loading&#x27; &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>搜索中<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      {state.kind === &#x27;error&#x27; &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>搜索失败，请重试。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      {state.kind === &#x27;success&#x27; &amp;&amp; (
        <span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;结果&quot;</span>&gt;</span>
          {state.items.map((item) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{item}</span>&gt;</span>{item}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>)}
        <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
      )}
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<h2>测试</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">import</span> { render, screen, within } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/react&#x27;</span>;
<span class="hljs-keyword">import</span> userEvent <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/user-event&#x27;</span>;
<span class="hljs-keyword">import</span> { expect, test, vi } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;提交关键词后显示结果&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> user = userEvent.<span class="hljs-title function_">setup</span>();
  <span class="hljs-keyword">const</span> search = vi.<span class="hljs-title function_">fn</span>().<span class="hljs-title function_">mockResolvedValue</span>([<span class="hljs-string">&#x27;事件循环&#x27;</span>]);
  <span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">SearchBox</span> <span class="hljs-attr">search</span>=<span class="hljs-string">{search}</span> /&gt;</span></span>);

  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">type</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;textbox&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;关键词&#x27;</span> }), <span class="hljs-string">&#x27;事件&#x27;</span>);
  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;搜索&#x27;</span> }));

  <span class="hljs-keyword">const</span> list = <span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByRole</span>(<span class="hljs-string">&#x27;list&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;结果&#x27;</span> });
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">within</span>(list).<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;事件循环&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
  <span class="hljs-title function_">expect</span>(search).<span class="hljs-title function_">toHaveBeenCalledWith</span>(<span class="hljs-string">&#x27;事件&#x27;</span>);
});

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;失败后保留输入并可以重试&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> user = userEvent.<span class="hljs-title function_">setup</span>();
  <span class="hljs-keyword">const</span> search = vi.<span class="hljs-title function_">fn</span>()
    .<span class="hljs-title function_">mockRejectedValueOnce</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;网络错误&#x27;</span>))
    .<span class="hljs-title function_">mockResolvedValueOnce</span>([<span class="hljs-string">&#x27;闭包&#x27;</span>]);
  <span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">SearchBox</span> <span class="hljs-attr">search</span>=<span class="hljs-string">{search}</span> /&gt;</span></span>);

  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">type</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;textbox&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;关键词&#x27;</span> }), <span class="hljs-string">&#x27;闭包&#x27;</span>);
  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;搜索&#x27;</span> }));
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByRole</span>(<span class="hljs-string">&#x27;alert&#x27;</span>)).<span class="hljs-title function_">toHaveTextContent</span>(<span class="hljs-string">&#x27;搜索失败&#x27;</span>);
  <span class="hljs-title function_">expect</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;textbox&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;关键词&#x27;</span> })).<span class="hljs-title function_">toHaveValue</span>(<span class="hljs-string">&#x27;闭包&#x27;</span>);

  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;搜索&#x27;</span> }));
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByText</span>(<span class="hljs-string">&#x27;闭包&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
});
</code></pre></div>
<p><code>listitem</code> 的名称不能从内容计算，所以先按名称找到列表，再用 <code>within</code> 找文字。查询选择的原则见<a href="/questions/testing-library-queries/">《Testing Library 查询方式为什么优先按用户可见语义？》</a>。</p>
<p><code>userEvent</code> 会依次触发聚焦、键盘、输入等事件，比 <code>fireEvent.change</code> 更接近真实操作，也能发现焦点和提交行为的问题。</p>
<ul>
<li>示例的 <code>search</code> 通过 props 注入，测试直接传 <code>vi.fn()</code>；依赖藏在模块里时用 <code>vi.mock</code>，放在 Context 里时用测试专用的 Provider 包裹。</li>
<li>输入框写成 <code>type=&quot;search&quot;</code> 时角色是 <code>searchbox</code>，查询要改成 <code>getByRole(&#x27;searchbox&#x27;)</code>，不要为了让测试通过而改组件的语义。</li>
<li><code>toBeVisible</code>、<code>toHaveValue</code>、<code>toHaveTextContent</code> 来自 jest-dom，要在 Vitest 的 setup 文件中引入 <code>@testing-library/jest-dom/vitest</code>。</li>
<li><code>findBy*</code> 之外的异步断言可以用 <code>waitFor</code>，回调里只放断言，不要在里面点击或提交。</li>
</ul>
<h2>哪些断言容易变脆</h2>
<ul>
<li><code>expect(wrapper.state.kind).toBe(&#x27;error&#x27;)</code>：内部状态。</li>
<li><code>container.querySelector(&#x27;.search-box__error&#x27;)</code>：类名。</li>
<li><code>expect(useEffectSpy).toHaveBeenCalledTimes(2)</code>：渲染实现。</li>
<li>整个组件的 DOM 快照：任何结构调整都会失败，审查者往往直接更新快照。</li>
</ul>
<h2>组件测试的边界</h2>
<p>组件测试证明组件自身的交互逻辑，不能证明真实路由、后端接口、浏览器布局和多个页面组合正确。关键流程还需要端到端测试，见<a href="/questions/test-e2e/">《如何减少 Playwright 端到端测试的不稳定？》</a>；外观变化用截图测试，见<a href="/questions/test-visual-regression/">《视觉回归测试如何减少无意义的截图差异？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>自定义 Hook 怎样测？优先通过使用它的组件测试；Hook 本身是公共库接口时，用 <code>renderHook</code> 测试返回值和更新。</li>
</ul>`};export{e as default};