var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>cache(fn)</code> 返回一个带缓存的新函数；同一次服务端渲染中，参数相同的调用只执行一次 <code>fn</code>，之后直接复用结果。</li>
<li>被缓存的可以是返回值、Promise，也可以是抛出的错误。</li>
<li>缓存的作用域是一次请求，请求结束就失效，不会跨用户或跨请求共享。</li>
<li>每次调用 <code>cache</code> 都会得到一个独立的缓存函数，所以要在模块级调用一次并导出，所有组件导入同一个函数。参数按 <code>Object.is</code> 比较，每次新建的对象参数不会命中。</li>
<li>只能在 Server Components 中使用；客户端组件的缓存用 <code>useMemo</code>。</li>
</ul>
<h2>示例：多个组件读同一个用户</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// lib/data.js</span>
<span class="hljs-keyword">import</span> { cache } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { db } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./db&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> getUser = <span class="hljs-title function_">cache</span>(<span class="hljs-title function_">async</span> (id) =&gt; {
  <span class="hljs-keyword">return</span> db.<span class="hljs-property">user</span>.<span class="hljs-title function_">findUnique</span>({ <span class="hljs-attr">where</span>: { id } });
});
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 页面中的两个组件都调用 getUser(id)</span>
<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Header</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getUser</span>(id);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>{user.name}<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span></span>;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Sidebar</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getUser</span>(id);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">{user.avatar}</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;&quot;</span> /&gt;</span></span>;
}
</code></pre></div>
<p>一次请求中，<code>Header</code> 和 <code>Sidebar</code> 只触发一次数据库查询。下一次请求会重新查询。</p>
<h2>常见错误</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 错误：在组件内调用 cache，每次渲染都生成新的缓存函数</span>
<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Header</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> getUserCached = <span class="hljs-title function_">cache</span>(getUserFromDb);
  <span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getUserCached</span>(id);
  <span class="hljs-comment">// ...</span>
}

<span class="hljs-comment">// 错误：对象参数每次都是新引用，不会命中</span>
<span class="hljs-title function_">getProduct</span>({ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> });
<span class="hljs-title function_">getProduct</span>({ <span class="hljs-attr">id</span>: <span class="hljs-number">1</span> });
</code></pre></div>
<p>把 <code>cache</code> 调用移到模块顶层，参数改成基本类型 <code>getProduct(1)</code>。</p>
<h2>预加载</h2>
<p>缓存的是 Promise，所以可以先调用、不等待，让请求提前开始：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-title function_">getUser</span>(id); <span class="hljs-comment">// 立即开始请求</span>
  <span class="hljs-keyword">const</span> posts = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getPosts</span>(id);
  <span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getUser</span>(id); <span class="hljs-comment">// 复用上面的 Promise</span>
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<h2>取消不再需要的工作</h2>
<p>React 19.2 新增 <code>cacheSignal()</code>，在 Server Components 中返回一个 AbortSignal，当这次渲染完成、中止或失败时触发，可以传给 <code>fetch</code> 取消多余的请求：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { cache, cacheSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> getData = <span class="hljs-title function_">cache</span>(<span class="hljs-function">(<span class="hljs-params">url</span>) =&gt;</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">signal</span>: <span class="hljs-title function_">cacheSignal</span>() }));
</code></pre></div>
<h2>和框架缓存的关系</h2>
<p><code>cache</code> 只做请求内去重。跨请求的数据缓存、按时间或按标签失效，由框架提供，例如 Next.js 的 <code>&#x27;use cache&#x27;</code>、<code>cacheLife</code>、<code>cacheTag</code>，见<a href="/questions/render-next-cache/">《Next.js App Router 中的几层缓存怎样区分？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>和 <code>useMemo</code> 有什么区别？<code>useMemo</code> 在一个客户端组件实例中跨渲染缓存一个值；<code>cache</code> 在服务端一次请求内跨组件共享函数结果。</li>
<li>缓存了错误怎么办？同一请求内再次调用会得到同一个错误；下一个请求会重新执行。</li>
</ul>`};export{e as default};