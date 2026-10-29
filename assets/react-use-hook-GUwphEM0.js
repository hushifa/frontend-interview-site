var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>use</code> 能读两种东西。<code>use(context)</code> 跟 <code>useContext</code> 一样，读最近的 Context 值。<code>use(promise)</code> 读一个 Promise 的结果。</p>
<p>读 Promise 时，如果它还没完成，组件就会暂停渲染，这叫挂起，最近的 Suspense 会显示 fallback。完成后组件继续渲染，<code>use</code> 返回结果；失败了，错误交给最近的 Error Boundary。</p>
<p>它的特别之处是它不是 Hook，可以写在 <code>if</code> 和循环里。但也只能在组件或 Hook 中调用，而且不能包在 <code>try/catch</code> 里。</p>
<p>最要注意的是 Promise 必须在多次渲染之间保持同一个实例，通常来自 Server Component 传下来的 props、数据请求库或缓存。在渲染里写 <code>use(fetch(url))</code> 会不断重新请求。另外，Server Components 里直接用 <code>await</code> 就行，<code>use(context)</code> 也不能在 Server Components 里用。</p>
</blockquote>
<h2>服务端发请求，客户端读结果</h2>
<p>常见用法是在 Server Component 里发起请求，但不等它，把 Promise 直接传给客户端组件：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// app/page.jsx（Server Component）</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Suspense</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Comments</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./comments&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params">{ params }</span>) {
  <span class="hljs-keyword">const</span> { id } = <span class="hljs-keyword">await</span> params; <span class="hljs-comment">// Next.js 15 起 params 是 Promise</span>
  <span class="hljs-keyword">const</span> commentsPromise = <span class="hljs-title function_">getComments</span>(id); <span class="hljs-comment">// 不 await，立即开始请求</span>
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>评论加载中…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">Comments</span> <span class="hljs-attr">commentsPromise</span>=<span class="hljs-string">{commentsPromise}</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>客户端组件用 <code>use</code> 读它：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// app/comments.jsx</span>
<span class="hljs-string">&#x27;use client&#x27;</span>;

<span class="hljs-keyword">import</span> { use } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Comments</span>(<span class="hljs-params">{ commentsPromise }</span>) {
  <span class="hljs-keyword">const</span> comments = <span class="hljs-title function_">use</span>(commentsPromise);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>{comments.map((c) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{c.id}</span>&gt;</span>{c.text}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>)}<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>;
}
</code></pre></div>
<p>为什么不在 Page 里 <code>await</code> 完再传？因为那样整个页面都要等评论回来。现在页面其他部分先显示，评论区先显示“评论加载中”，数据到了再填进去。注意 Promise 的结果要从服务端传到客户端，所以必须可序列化。</p>
<h2>在提前 return 之后读 Context</h2>
<p><code>useContext</code> 是 Hook，必须在顶层调用。<code>use</code> 没有这个限制：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Heading</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">if</span> (children == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> theme = <span class="hljs-title function_">use</span>(<span class="hljs-title class_">ThemeContext</span>); <span class="hljs-comment">// 提前 return 之后调用，useContext 做不到</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">color:</span> <span class="hljs-attr">theme.color</span> }}&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span></span>;
}
</code></pre></div>
<p><code>use</code> 能这样写，是因为它读的是你传进去的 Context 本身，不需要靠调用顺序去找自己的状态，详见<a href="/questions/react-hooks-rules/">《为什么 Hook 通常必须在组件顶层调用？》</a>。</p>
<h2>为什么 Promise 必须缓存</h2>
<p>下面这种写法看起来很自然，却永远加载不出来：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 错误：每次渲染都创建新 Promise，组件反复挂起</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> user = <span class="hljs-title function_">use</span>(<span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${id}</span>\`</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>()));
}
</code></pre></div>
<p>第一次渲染时创建了一个 Promise，没完成，组件挂起。等 React 重新渲染这个组件，又执行了一遍 <code>fetch</code>，得到另一个新的 Promise，还是没完成，又挂起。就这样一直在等新请求，React 会警告 “A component was suspended by an uncached promise”。</p>
<p>客户端组件里要发请求，可以在事件处理器或路由 loader 里创建 Promise，存进 state；或者用支持 Suspense 的数据请求库，由它负责缓存。</p>
<h2>失败了怎么处理</h2>
<p>在 Suspense 外面再包一层 Error Boundary，Promise 失败时显示错误界面：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">ErrorBoundary</span> fallback={<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>加载失败<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>}&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>加载中…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
    <span class="hljs-tag">&lt;<span class="hljs-name">Comments</span> <span class="hljs-attr">commentsPromise</span>=<span class="hljs-string">{commentsPromise}</span> /&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span></span>
&lt;/<span class="hljs-title class_">ErrorBoundary</span>&gt;
</code></pre></div>
<p>如果不想显示错误界面，可以在创建 Promise 的地方加 <code>.catch(() =&gt; [])</code>，失败时给一个兜底值。</p>
<h2>常见追问</h2>
<p><strong>和 <code>await</code> 有什么区别？</strong></p>
<blockquote>
<p><code>await</code> 只能在 async 函数里用，而客户端组件不能是 async 函数。<code>use</code> 让普通的组件函数也能“等”一个 Promise。</p>
</blockquote>
<p><strong>数据要刷新怎么办？</strong></p>
<blockquote>
<p>在 <code>startTransition</code> 里创建一个新的 Promise 存进 state，组件读到新 Promise。因为在 Transition 里，等待期间会保留旧内容，不会退回 fallback。</p>
</blockquote>`};export{e as default};