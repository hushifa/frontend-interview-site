var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>get(key)</code> 返回第一个值，没有时返回 <code>null</code>；<code>getAll(key)</code> 返回所有值组成的数组。</li>
<li><code>set</code> 覆盖同名参数，<code>append</code> 追加一个新值，多选筛选用 <code>append</code> 写入、<code>getAll</code> 读取。</li>
<li><code>toString()</code> 使用表单编码，空格编码为 <code>+</code>，这和 <code>encodeURIComponent</code> 的 <code>%20</code> 不同，但两者解析结果一致。</li>
<li>读出来的都是字符串，页码、数量要转换并校验，非法值回退到默认值。</li>
<li><code>sort()</code> 按键排序，能让同样的筛选条件生成同样的 URL，便于缓存。</li>
</ul>
<h2>示例：筛选状态和 URL 互转</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseFilters</span>(<span class="hljs-params">search</span>) {
  <span class="hljs-keyword">const</span> params = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(search);
  <span class="hljs-keyword">const</span> page = <span class="hljs-title class_">Number</span>(params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;page&#x27;</span>));
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">keyword</span>: params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>)?.<span class="hljs-title function_">trim</span>() ?? <span class="hljs-string">&#x27;&#x27;</span>,
    <span class="hljs-attr">tags</span>: params.<span class="hljs-title function_">getAll</span>(<span class="hljs-string">&#x27;tag&#x27;</span>),
    <span class="hljs-attr">page</span>: <span class="hljs-regexp">/^[1-9]\\d*$/</span>.<span class="hljs-title function_">test</span>(params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;page&#x27;</span>) ?? <span class="hljs-string">&#x27;&#x27;</span>) ? page : <span class="hljs-number">1</span>,
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">toSearch</span>(<span class="hljs-params">{ keyword, tags, page }</span>) {
  <span class="hljs-keyword">const</span> params = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>();
  <span class="hljs-keyword">if</span> (keyword) params.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;q&#x27;</span>, keyword);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> tag <span class="hljs-keyword">of</span> tags) params.<span class="hljs-title function_">append</span>(<span class="hljs-string">&#x27;tag&#x27;</span>, tag);
  <span class="hljs-keyword">if</span> (page &gt; <span class="hljs-number">1</span>) params.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;page&#x27;</span>, <span class="hljs-title class_">String</span>(page));
  params.<span class="hljs-title function_">sort</span>();
  <span class="hljs-keyword">const</span> text = params.<span class="hljs-title function_">toString</span>();
  <span class="hljs-keyword">return</span> text ? <span class="hljs-string">\`?<span class="hljs-subst">\${text}</span>\`</span> : <span class="hljs-string">&#x27;&#x27;</span>;
}

<span class="hljs-title function_">parseFilters</span>(<span class="hljs-string">&#x27;?q=react+hooks&amp;tag=a&amp;tag=b&amp;page=abc&#x27;</span>);
<span class="hljs-comment">// { keyword: &#x27;react hooks&#x27;, tags: [&#x27;a&#x27;, &#x27;b&#x27;], page: 1 }</span>

<span class="hljs-title function_">toSearch</span>({ <span class="hljs-attr">keyword</span>: <span class="hljs-string">&#x27;react hooks&#x27;</span>, <span class="hljs-attr">tags</span>: [<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>], <span class="hljs-attr">page</span>: <span class="hljs-number">2</span> });
<span class="hljs-comment">// &#x27;?page=2&amp;q=react+hooks&amp;tag=a&amp;tag=b&#x27;</span>
</code></pre></div>
<ul>
<li>默认值（第 1 页、空关键词）不写进 URL，地址更短。</li>
<li><code>sort()</code> 是稳定排序，两个 <code>tag</code> 保持原来的先后顺序。</li>
</ul>
<h2>编码细节</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>({ <span class="hljs-attr">q</span>: <span class="hljs-string">&#x27;a b&amp;c&#x27;</span> }).<span class="hljs-title function_">toString</span>(); <span class="hljs-comment">// &#x27;q=a+b%26c&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(<span class="hljs-string">&#x27;q=a%20b&#x27;</span>).<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>); <span class="hljs-comment">// &#x27;a b&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(<span class="hljs-string">&#x27;q=a+b&#x27;</span>).<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>); <span class="hljs-comment">// &#x27;a b&#x27;</span>
</code></pre></div>
<ul>
<li>不要自己用字符串拼接查询参数，<code>&amp;</code>、<code>=</code>、<code>#</code> 等字符会破坏结构。</li>
<li>修改 <code>URL</code> 对象的 <code>url.searchParams</code> 会同步更新 <code>url.search</code>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>数组参数用 <code>tag=a&amp;tag=b</code> 还是 <code>tag=a,b</code>：前者和表单提交的格式一致，<code>getAll</code> 直接读取；后者 URL 更短，但值里不能出现逗号。和后端约定一种即可。</li>
<li>更新 URL 不刷新页面：<code>history.replaceState(null, &#x27;&#x27;, toSearch(filters))</code>，翻页这类需要后退返回的操作用 <code>pushState</code>。</li>
</ul>`};export{e as default};