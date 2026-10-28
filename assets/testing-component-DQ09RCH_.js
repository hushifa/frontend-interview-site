var e={answerHtml:`<p>组件测试最容易写成“找一个 class，调用一个内部函数，再断言 state”。这种测试可能在实现重构后大量失败，却没有告诉你用户是否还能完成任务。</p>
<p>更稳定的目标是组件对用户提供的契约：能否找到字段、输入内容、点击提交、看到加载状态、收到错误提示、重新尝试，以及键盘和可访问名称是否正常。实现细节只有在它本身是公共契约时才值得直接断言。</p>
<h2>先把组件当成用户可操作的边界</h2>
<p>下面是一个简化的搜索组件，接收 <code>search</code> 函数，失败时显示错误，成功时显示结果：</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Props</span> = {
  <span class="hljs-attr">search</span>: <span class="hljs-function">(<span class="hljs-params"><span class="hljs-attr">keyword</span>: <span class="hljs-built_in">string</span></span>) =&gt;</span> <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">string</span>[]&gt;;
};

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">SearchBox</span>(<span class="hljs-params">{ search }: <span class="hljs-title class_">Props</span></span>) {
  <span class="hljs-keyword">const</span> [keyword, setKeyword] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [state, setState] = useState&lt;{ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;idle&#x27;</span> | <span class="hljs-string">&#x27;loading&#x27;</span> | <span class="hljs-string">&#x27;success&#x27;</span> | <span class="hljs-string">&#x27;error&#x27;</span>; <span class="hljs-attr">items</span>?: <span class="hljs-built_in">string</span>[] }&gt;({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;idle&#x27;</span> });

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">submit</span>(<span class="hljs-params"><span class="hljs-attr">event</span>: <span class="hljs-title class_">React</span>.<span class="hljs-title class_">FormEvent</span></span>) {
    event.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-title function_">setState</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;loading&#x27;</span> });
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> items = <span class="hljs-keyword">await</span> <span class="hljs-title function_">search</span>(keyword);
      <span class="hljs-title function_">setState</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;success&#x27;</span>, items });
    } <span class="hljs-keyword">catch</span> {
      <span class="hljs-title function_">setState</span>({ <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;error&#x27;</span> });
    }
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">onSubmit</span>=<span class="hljs-string">{submit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">htmlFor</span>=<span class="hljs-string">&quot;search-keyword&quot;</span>&gt;</span>关键词<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;search-keyword&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{keyword}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(event)</span> =&gt;</span> setKeyword(event.target.value)} /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{state.kind</span> === <span class="hljs-string">&#x27;loading&#x27;</span>}&gt;</span>搜索<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      {state.kind === &#x27;loading&#x27; &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>搜索中<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      {state.kind === &#x27;error&#x27; &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>搜索失败，请重试。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      {state.kind === &#x27;success&#x27; &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>{state.items?.map((item) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{item}</span>&gt;</span>{item}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>)}<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>}
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>测试应该通过 label、button、status、alert 和列表内容与它交互，而不是依赖 <code>SearchBox</code> 里面用了几个 state 或某个 CSS 类。</p>
<h2>用可访问查询表达用户行为</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">import</span> { render, screen } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/react&#x27;</span>;
<span class="hljs-keyword">import</span> userEvent <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/user-event&#x27;</span>;
<span class="hljs-keyword">import</span> { expect, test, vi } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;提交关键词后显示结果&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> user = userEvent.<span class="hljs-title function_">setup</span>();
  <span class="hljs-keyword">const</span> search = vi.<span class="hljs-title function_">fn</span>().<span class="hljs-title function_">mockResolvedValue</span>([<span class="hljs-string">&#x27;事件循环&#x27;</span>]);
  <span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">SearchBox</span> <span class="hljs-attr">search</span>=<span class="hljs-string">{search}</span> /&gt;</span></span>);

  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">type</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;textbox&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;关键词&#x27;</span> }), <span class="hljs-string">&#x27;事件&#x27;</span>);
  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;搜索&#x27;</span> }));

  <span class="hljs-title function_">expect</span>(search).<span class="hljs-title function_">toHaveBeenCalledWith</span>(<span class="hljs-string">&#x27;事件&#x27;</span>);
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByRole</span>(<span class="hljs-string">&#x27;listitem&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;事件循环&#x27;</span> })).<span class="hljs-title function_">toBeVisible</span>();
});
</code></pre></div>
<p><code>getByRole</code> 和可访问名称同时验证了用户能否找到控件。<code>findBy...</code> 等待异步结果，避免用不确定的固定 sleep。<code>userEvent</code> 通常比直接调用 <code>fireEvent.change</code> 更接近真实输入和键盘事件，但也会让测试暴露组件没有正确处理焦点或提交行为的问题。</p>
<p>查询优先级应从用户能看到和操作的语义开始，例如角色、标签、文本和明确的测试标识；不要默认使用内部 class、组件实例或 <code>data-testid</code>。测试标识在没有用户可见语义时可以作为最后的稳定入口，但不应让所有测试都绕开可访问结构。</p>
<h2>Loading、失败和重试要有独立用例</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;搜索失败后可以重试并恢复&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> user = userEvent.<span class="hljs-title function_">setup</span>();
  <span class="hljs-keyword">const</span> search = vi.<span class="hljs-title function_">fn</span>()
    .<span class="hljs-title function_">mockRejectedValueOnce</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;暂时失败&#x27;</span>))
    .<span class="hljs-title function_">mockResolvedValueOnce</span>([<span class="hljs-string">&#x27;闭包&#x27;</span>]);
  <span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">SearchBox</span> <span class="hljs-attr">search</span>=<span class="hljs-string">{search}</span> /&gt;</span></span>);

  <span class="hljs-keyword">const</span> input = screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;textbox&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;关键词&#x27;</span> });
  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">type</span>(input, <span class="hljs-string">&#x27;闭包&#x27;</span>);
  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;搜索&#x27;</span> }));
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByRole</span>(<span class="hljs-string">&#x27;alert&#x27;</span>)).<span class="hljs-title function_">toHaveTextContent</span>(<span class="hljs-string">&#x27;搜索失败&#x27;</span>);

  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;搜索&#x27;</span> }));
  <span class="hljs-title function_">expect</span>(<span class="hljs-keyword">await</span> screen.<span class="hljs-title function_">findByRole</span>(<span class="hljs-string">&#x27;listitem&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;闭包&#x27;</span> })).<span class="hljs-title function_">toBeVisible</span>();
  <span class="hljs-title function_">expect</span>(search).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">2</span>);
});
</code></pre></div>
<p>这个测试不依赖错误对象的具体文本，因为用户看到的是组件定义的稳定文案；它验证了失败后仍保留输入、按钮可再次操作，并且第二次成功能恢复正常状态。若产品要求在请求失败后保留旧结果，同时显示错误，则应把该状态写进契约并单独测试，不要为了让测试简单而把旧内容清空。</p>
<p>异步测试要等待真正的可观察结果，并在测试超时时检查 Promise 是否被正确解决或拒绝。不要用 <code>await new Promise(resolve =&gt; setTimeout(resolve, 100))</code> 猜测渲染完成，也不要在测试中使用永远 pending 的 Mock。</p>
<h2>Mock 外部依赖，但保留组件自己的契约</h2>
<p>组件测试通常把网络请求、时钟、路由或存储通过 props、Context 或模块 Mock 替换成受控依赖。Mock 应模拟真实边界的成功、错误和数据结构，不能为了让断言简单而返回组件实际上不会收到的对象。</p>
<p>如果组件本身负责请求，Mock <code>fetch</code> 时要检查 URL、方法和请求体；如果请求由数据层负责，组件测试可以传入一个 <code>search</code> 函数，把网络契约留给数据层的集成或契约测试。让测试依赖越少，失败原因越容易定位。</p>
<h2>不要过度断言渲染实现</h2>
<p>下面这些断言通常脆弱：</p>
<ul>
<li>组件内部 state 的字段名字；</li>
<li>具体 HTML 层级和无意义的 class 名；</li>
<li><code>useEffect</code> 被调用了几次；</li>
<li>某个私有函数被调用，而用户结果没有变化；</li>
<li>React/Vue 内部实例或框架生成的属性。</li>
</ul>
<p>如果一个 DOM 结构本身是可访问性或布局契约，可以断言它；否则应优先断言用户能看到的文本、控件状态、焦点和可操作结果。重构状态机、拆分子组件或换样式工具时，行为测试不应全部失效。</p>
<h2>组件测试仍不能替代更高层验证</h2>
<p>组件测试适合快速覆盖状态和交互组合，但不能证明真实路由、后端认证、CORS、浏览器缓存、字体布局和多个组件组合正确。关键流程还需要集成或端到端测试；复杂控件要结合键盘、无障碍和视觉回归测试。</p>
<p>测试数量也不等于覆盖质量。一个成功用例不能证明错误、空数据、取消、重复点击和权限失败都能恢复。围绕组件契约列出状态和用户任务，再选择最少但有意义的测试，通常比复制大量 DOM 快照更容易长期维护。</p>`};export{e as default};