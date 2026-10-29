var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>列表页的筛选条件要放进网址，比如 <code>?q=react&amp;tag=a&amp;tag=b&amp;page=2</code>，这样刷新和分享都能保留。读写这串参数就用 <code>URLSearchParams</code>。</p>
<p>同名参数可以有多个。<code>get(key)</code> 只返回第一个值，没有时返回 <code>null</code>；<code>getAll(key)</code> 返回所有值组成的数组。写的时候，<code>set</code> 覆盖同名参数，<code>append</code> 再追加一个值。所以多选标签用 <code>append</code> 写、<code>getAll</code> 读。</p>
<p>编码上，<code>toString()</code> 按表单格式编码，空格变成 <code>+</code>，而 <code>encodeURIComponent</code> 编成 <code>%20</code>。两种写法解析出来都是空格。</p>
<p>要注意读出来的全是字符串。页码要转成数字并校验，不合法就回退到默认值。另外 <code>sort()</code> 按键排序，同样的筛选条件能生成同样的网址，方便缓存。</p>
</blockquote>
<h2>筛选状态和网址互相转换</h2>
<p>下面两个函数，一个把网址解析成筛选条件，一个把筛选条件写回网址。</p>
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
<p>为什么 <code>page=abc</code> 变成了 1？因为读到的是字符串 <code>&#x27;abc&#x27;</code>，用正则检查不是正整数，就回退成默认的第 1 页。不校验的话，<code>Number(&#x27;abc&#x27;)</code> 是 <code>NaN</code>，后面分页就会出错。</p>
<p>写回网址时，第 1 页和空关键词这些默认值不写进去，地址更短。<code>sort()</code> 把参数按键排好，而且是稳定排序，两个 <code>tag</code> 保持原来的先后顺序。</p>
<h2>空格为什么变成了加号</h2>
<p>下面几行可以在 Node 里直接运行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>({ <span class="hljs-attr">q</span>: <span class="hljs-string">&#x27;a b&amp;c&#x27;</span> }).<span class="hljs-title function_">toString</span>()); <span class="hljs-comment">// q=a+b%26c</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(<span class="hljs-string">&#x27;q=a%20b&#x27;</span>).<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>)); <span class="hljs-comment">// a b</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(<span class="hljs-string">&#x27;q=a+b&#x27;</span>).<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;q&#x27;</span>)); <span class="hljs-comment">// a b</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-built_in">encodeURIComponent</span>(<span class="hljs-string">&#x27;a b&#x27;</span>)); <span class="hljs-comment">// a%20b</span>
</code></pre></div>
<p><code>URLSearchParams</code> 用的是 <code>application/x-www-form-urlencoded</code> 编码，也就是表单提交的格式，规定空格写成 <code>+</code>。<code>encodeURIComponent</code> 是另一套规则，写成 <code>%20</code>。所以生成的字符串不一样，但解析时 <code>+</code> 和 <code>%20</code> 都会还原成空格。</p>
<p>第一行里 <code>&amp;</code> 被编码成了 <code>%26</code>。如果自己用字符串拼接参数，<code>&amp;</code>、<code>=</code>、<code>#</code> 这些字符不编码，就会把查询字符串的结构弄坏，所以不要手拼。</p>
<p>还有一点，修改 <code>URL</code> 对象的 <code>url.searchParams</code>，会同步更新 <code>url.search</code>，两者是联动的。</p>
<h2>常见追问</h2>
<p><strong>数组参数用 <code>tag=a&amp;tag=b</code> 还是 <code>tag=a,b</code>？</strong></p>
<blockquote>
<p>前者和表单提交的格式一样，用 <code>getAll</code> 直接就能读。后者网址更短，但值里不能出现逗号。两种都行，和后端约定好一种。</p>
</blockquote>
<p><strong>怎样更新网址而不刷新页面？</strong></p>
<blockquote>
<p>用 <code>history.replaceState(null, &#x27;&#x27;, toSearch(filters))</code>。如果是翻页这种用户希望能后退回去的操作，用 <code>pushState</code>。</p>
</blockquote>`};export{e as default};