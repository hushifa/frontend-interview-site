var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户找一个按钮，看的是“这是个按钮，上面写着保存”，读屏软件也是按“角色加名称”来读的。Testing Library 推荐用同样的方式找元素，优先级是 <code>getByRole</code> → <code>getByLabelText</code> → <code>getByPlaceholderText</code> → <code>getByText</code> → <code>getByDisplayValue</code> → <code>getByAltText</code>、<code>getByTitle</code> → <code>getByTestId</code>。</p>
<p>这样做有两个好处。一是 <code>getByRole(&#x27;button&#x27;, { name: &#x27;保存&#x27; })</code> 同时检查了角色和名称，如果有人用 div 做按钮，测试就找不到它，等于顺带发现了无障碍问题。二是选择器离实现细节越远，重构时越不容易误报；按类名、DOM 层级找，结构一调整就挂。</p>
<p>查询还分三类：<code>getBy*</code> 找不到或找到多个时立刻抛错；<code>queryBy*</code> 找不到返回 <code>null</code>，用来断言“不存在”；<code>findBy*</code> 返回 Promise，等元素出现，默认等 1000ms。</p>
<p>要注意，有些角色的名称不能从内容算出来，比如 <code>listitem</code>，按名称查会得到空名称，这时改用 <code>getByText</code> 或者 <code>within(list)</code>。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面的测试找输入框、按钮和列表，用的都是用户能看到的标签和名称：</p>
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
<p>这段测试不知道组件里用了什么类名、套了几层 div。只要界面上还是“新任务”输入框、“添加”按钮和“待办”列表，组件内部怎么重构，测试都不用改。</p>
<p>最后一行用的是 <code>queryByText</code>，因为要断言的是“暂无任务”已经不在了。如果用 <code>getByText</code>，找不到时会直接抛错，测试就没法表达“不存在”这个意思。</p>
<h2>get、query、find 三类查询怎么选</h2>
<table><thead><tr><th></th><th>找不到</th><th>找到多个</th><th>异步</th></tr></thead><tbody><tr><td><code>getBy</code></td><td>抛错</td><td>抛错</td><td>否</td></tr><tr><td><code>queryBy</code></td><td><code>null</code></td><td>抛错</td><td>否</td></tr><tr><td><code>findBy</code></td><td>超时后 reject</td><td>reject</td><td>是</td></tr><tr><td><code>*AllBy</code></td><td>同上</td><td>返回数组</td><td></td></tr></tbody></table>
<p>简单记：元素应该已经在，用 <code>getBy</code>；要断言它不在，用 <code>queryBy</code>；要等它出现，用 <code>findBy</code>。要找多个元素时，换成对应的 <code>getAllBy</code>、<code>queryAllBy</code>、<code>findAllBy</code>。</p>
<h2>常见的用错方式</h2>
<p>一种是用 <code>queryBy</code> 去断言元素存在。找不到时它只返回 <code>null</code>，报错信息远不如 <code>getBy</code> 清楚。</p>
<p>另一种是在 <code>waitFor</code> 里放 <code>getBy</code>，外面又套一个 <code>findBy</code>，等了两遍。<code>findBy</code> 本身就是 <code>getBy</code> 加 <code>waitFor</code>，直接用它就够了。</p>
<p>还有直接用 <code>container.querySelector</code>。这样绕开了 Testing Library 的语义查询，也拿不到它详细的错误提示。</p>
<h2>什么时候才用 test id</h2>
<p>只有两种情况：文本经常变化，比如多语言、A/B 测试；或者元素确实没有可访问的角色和名称，比如图表用的 Canvas。这时才给元素加 <code>data-testid</code>，用 <code>getByTestId</code> 去找。</p>
<h2>常见追问</h2>
<p><strong>不知道该用哪个查询时怎么办？</strong></p>
<blockquote>
<p>看报错信息。查询失败时，Testing Library 会把页面上所有可访问的角色列出来。也可以调用 <code>screen.logTestingPlaygroundURL()</code>，在浏览器里点选元素，它会生成推荐的查询写法。</p>
</blockquote>`};export{e as default};