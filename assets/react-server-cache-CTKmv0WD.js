var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端渲染一个页面时，头部要用户名，侧边栏要用户头像，两个组件各查一次数据库，就重复了。<code>cache(fn)</code> 返回一个带缓存的新函数，同一次服务端渲染里，参数相同的调用只执行一次 <code>fn</code>，后面直接复用结果。</p>
<p>它缓存的可以是返回值、Promise，也可以是抛出的错误。因为能缓存 Promise，还可以提前调用一次、不等待，让请求早点开始。</p>
<p>缓存的范围是一次请求，请求结束就失效，不会在不同用户或不同请求之间共享。它只能在 Server Components 里用，客户端组件要缓存值用 <code>useMemo</code>。</p>
<p>有两个容易犯的错。每调用一次 <code>cache</code> 就得到一个独立的缓存，所以要在模块顶层调用一次再导出，大家导入同一个函数。参数用 <code>Object.is</code> 比较，每次新建的对象参数永远命中不了。</p>
</blockquote>
<h2>两个组件读同一个用户</h2>
<p>先在模块顶层用 <code>cache</code> 包好查询函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// lib/data.js</span>
<span class="hljs-keyword">import</span> { cache } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { db } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./db&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> getUser = <span class="hljs-title function_">cache</span>(<span class="hljs-title function_">async</span> (id) =&gt; {
  <span class="hljs-keyword">return</span> db.<span class="hljs-property">user</span>.<span class="hljs-title function_">findUnique</span>({ <span class="hljs-attr">where</span>: { id } });
});
</code></pre></div>
<p>页面里的两个组件都调用它：</p>
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
<p>一次请求里，<code>Header</code> 先调 <code>getUser(id)</code>，真正查了数据库。<code>Sidebar</code> 再用同样的 <code>id</code> 调用时，直接拿到第一次的结果，只查了一次。下一个请求进来，缓存已经清空，会重新查。</p>
<p>这样组件各自取自己要的数据就行，不用在顶层查好再一层层往下传。</p>
<h2>为什么会命中不了</h2>
<p>下面两种写法看起来用了 <code>cache</code>，其实一次都没缓存上：</p>
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
<p>第一种，<code>cache</code> 每调用一次就新建一个缓存。写在组件里，每次渲染都是一个新缓存，别的组件也拿不到它，等于没缓存。</p>
<p>第二种，缓存按参数是否 <code>Object.is</code> 相等来判断。两次 <code>{ id: 1 }</code> 内容一样，但是两个不同的对象，所以被当成不同的参数。</p>
<p>改法是把 <code>cache</code> 挪到模块顶层，参数改成基本类型，比如 <code>getProduct(1)</code>。</p>
<h2>提前开始请求</h2>
<p>因为缓存的是 Promise，可以先调用、不 <code>await</code>，让请求在后台先跑起来：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-title function_">getUser</span>(id); <span class="hljs-comment">// 立即开始请求</span>
  <span class="hljs-keyword">const</span> posts = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getPosts</span>(id);
  <span class="hljs-keyword">const</span> user = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getUser</span>(id); <span class="hljs-comment">// 复用上面的 Promise</span>
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<p>等 <code>getPosts</code> 的时候，用户数据也在同时加载。后面 <code>await getUser(id)</code> 拿到的是同一个 Promise，不会再发一次请求。</p>
<h2>取消用不上的请求</h2>
<p>React 19.2 新增了 <code>cacheSignal()</code>。它在 Server Components 里返回一个 AbortSignal，这次渲染完成、中止或失败时会触发。把它传给 <code>fetch</code>，就能取消已经用不上的请求：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { cache, cacheSignal } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> getData = <span class="hljs-title function_">cache</span>(<span class="hljs-function">(<span class="hljs-params">url</span>) =&gt;</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">signal</span>: <span class="hljs-title function_">cacheSignal</span>() }));
</code></pre></div>
<h2>和框架的缓存是什么关系</h2>
<p><code>cache</code> 只做一次请求内的去重。跨请求的数据缓存、按时间或按标签失效，是框架提供的功能，例如 Next.js 的 <code>&#x27;use cache&#x27;</code>、<code>cacheLife</code>、<code>cacheTag</code>。详见<a href="/questions/render-next-cache/">《Next.js App Router 中的几层缓存怎样区分？》</a>。</p>
<h2>常见追问</h2>
<p><strong>和 <code>useMemo</code> 有什么区别？</strong></p>
<blockquote>
<p><code>useMemo</code> 在客户端，缓存的是一个组件实例在多次渲染之间的一个值。<code>cache</code> 在服务端，让一次请求里的多个组件共享同一个函数的结果。</p>
</blockquote>
<p><strong>缓存了错误怎么办？</strong></p>
<blockquote>
<p>同一次请求里再调用，会拿到同一个错误。下一个请求会重新执行，不受影响。</p>
</blockquote>`};export{e as default};