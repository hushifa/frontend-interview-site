var e={answerHtml:`<h2>简答</h2>
<ul>
<li>推荐顺序：<code>getByRole</code> → <code>getByLabelText</code> → <code>getByPlaceholderText</code> → <code>getByText</code> → <code>getByDisplayValue</code> → <code>getByAltText</code>、<code>getByTitle</code> → <code>getByTestId</code>。</li>
<li><code>getBy*</code> 找不到或找到多个时立即抛错；<code>queryBy*</code> 找不到返回 <code>null</code>，用于断言“不存在”；<code>findBy*</code> 返回 Promise，等待元素出现（默认 1000ms）。</li>
<li><code>getByRole(&#x27;button&#x27;, { name: &#x27;保存&#x27; })</code> 同时检查了角色和名称；用 div 做的按钮查不到，测试失败就暴露了无障碍问题。</li>
<li>有些角色的名称不能从内容计算，例如 <code>listitem</code>，按名称查询会得到空名称，应该改用 <code>getByText</code> 或 <code>within(list)</code>。</li>
<li>选择器越接近实现细节（类名、DOM 层级），重构时越容易误报失败。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-keyword">import</span> { render, screen, within } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/react&#x27;</span>;
<span class="hljs-keyword">import</span> userEvent <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@testing-library/user-event&#x27;</span>;

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;添加任务后出现在列表中&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> user = userEvent.<span class="hljs-title function_">setup</span>();
  <span class="hljs-title function_">render</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">TodoApp</span> /&gt;</span></span>);

  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">type</span>(screen.<span class="hljs-title function_">getByLabelText</span>(<span class="hljs-string">&#x27;新任务&#x27;</span>), <span class="hljs-string">&#x27;写周报&#x27;</span>);
  <span class="hljs-keyword">await</span> user.<span class="hljs-title function_">click</span>(screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;button&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;添加&#x27;</span> }));

  <span class="hljs-keyword">const</span> list = screen.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;list&#x27;</span>, { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;待办&#x27;</span> });
  <span class="hljs-title function_">expect</span>(<span class="hljs-title function_">within</span>(list).<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;写周报&#x27;</span>)).<span class="hljs-title function_">toBeInTheDocument</span>();
  <span class="hljs-title function_">expect</span>(screen.<span class="hljs-title function_">queryByText</span>(<span class="hljs-string">&#x27;暂无任务&#x27;</span>)).<span class="hljs-property">not</span>.<span class="hljs-title function_">toBeInTheDocument</span>();
});
</code></pre></div>
<h2>三类查询</h2>
<table><thead><tr><th></th><th>找不到</th><th>找到多个</th><th>异步</th></tr></thead><tbody><tr><td><code>getBy</code></td><td>抛错</td><td>抛错</td><td>否</td></tr><tr><td><code>queryBy</code></td><td><code>null</code></td><td>抛错</td><td>否</td></tr><tr><td><code>findBy</code></td><td>超时后 reject</td><td>reject</td><td>是</td></tr><tr><td><code>*AllBy</code></td><td>同上</td><td>返回数组</td><td></td></tr></tbody></table>
<h2>常见错误</h2>
<ul>
<li>用 <code>queryBy</code> 断言元素存在：找不到时只返回 <code>null</code>，错误信息不如 <code>getBy</code> 清楚。</li>
<li>在 <code>waitFor</code> 里放 <code>getBy</code>，又在外面用 <code>findBy</code>，重复等待；<code>findBy</code> 本身就是 <code>getBy</code> 加 <code>waitFor</code>。</li>
<li>用 <code>container.querySelector</code>：绕开了 Testing Library 的错误提示和语义查询。</li>
</ul>
<h2>什么时候用 test id</h2>
<p>文本会频繁变化（多语言、A/B 测试），或元素确实没有可访问的角色和名称（例如图表的 Canvas）时，才使用 <code>data-testid</code>。</p>
<h2>常见追问</h2>
<ul>
<li>怎样找到合适的查询？报错信息会列出页面上所有可访问角色；<code>screen.logTestingPlaygroundURL()</code> 可以在浏览器里点选元素生成推荐查询。</li>
</ul>`};export{e as default};