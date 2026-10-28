var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>use(context)</code>：等同于 <code>useContext</code>，但可以写在 <code>if</code> 和循环里。</li>
<li><code>use(promise)</code>：Promise 未完成时组件挂起，显示最近 Suspense 的 fallback；成功时返回结果；失败时交给最近的 Error Boundary。</li>
<li><code>use</code> 不是 Hook，可以条件调用，但仍然只能在组件或 Hook 中调用，也不能包在 <code>try/catch</code> 里。</li>
<li>传入的 Promise 必须在多次渲染间保持同一个实例，通常来自 Server Component 的 props、数据请求库或缓存；在渲染中写 <code>use(fetch(url))</code> 会不断重新请求。</li>
<li>Server Components 中直接用 <code>await</code>；<code>use(context)</code> 不能在 Server Components 中使用。</li>
</ul>
<h2>服务端创建 Promise，客户端读取</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// app/page.jsx（Server Component）</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Suspense</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Comments</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./comments&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params">{ params }</span>) {
  <span class="hljs-keyword">const</span> commentsPromise = <span class="hljs-title function_">getComments</span>(params.<span class="hljs-property">id</span>); <span class="hljs-comment">// 不 await，立即开始请求</span>
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>评论加载中…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">Comments</span> <span class="hljs-attr">commentsPromise</span>=<span class="hljs-string">{commentsPromise}</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span></span>
  );
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// app/comments.jsx</span>
<span class="hljs-string">&#x27;use client&#x27;</span>;

<span class="hljs-keyword">import</span> { use } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Comments</span>(<span class="hljs-params">{ commentsPromise }</span>) {
  <span class="hljs-keyword">const</span> comments = <span class="hljs-title function_">use</span>(commentsPromise);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>{comments.map((c) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{c.id}</span>&gt;</span>{c.text}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>)}<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>;
}
</code></pre></div>
<p>页面其余部分先显示，评论数据到达后再填充。Promise 的结果必须可序列化。</p>
<h2>条件读取 Context</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Heading</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">if</span> (children == <span class="hljs-literal">null</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> theme = <span class="hljs-title function_">use</span>(<span class="hljs-title class_">ThemeContext</span>); <span class="hljs-comment">// 提前 return 之后调用，useContext 做不到</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">color:</span> <span class="hljs-attr">theme.color</span> }}&gt;</span>{children}<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span></span>;
}
</code></pre></div>
<h2>为什么 Promise 要缓存</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 错误：每次渲染都创建新 Promise，组件反复挂起</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ id }</span>) {
  <span class="hljs-keyword">const</span> user = <span class="hljs-title function_">use</span>(<span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${id}</span>\`</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>()));
}
</code></pre></div>
<p>挂起后重新渲染时又会创建一个新 Promise，永远等不到结果，React 会警告 &quot;A component was suspended by an uncached promise&quot;。客户端组件中需要发起请求时，在事件处理器或路由 loader 中创建 Promise，存入 state，或者使用支持 Suspense 的数据请求库。</p>
<h2>错误处理</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">ErrorBoundary</span> fallback={<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>加载失败<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>}&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>加载中…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
    <span class="hljs-tag">&lt;<span class="hljs-name">Comments</span> <span class="hljs-attr">commentsPromise</span>=<span class="hljs-string">{commentsPromise}</span> /&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span></span>
&lt;/<span class="hljs-title class_">ErrorBoundary</span>&gt;
</code></pre></div>
<p>不想显示错误界面时，可以在创建 Promise 的地方 <code>.catch(() =&gt; [])</code> 提供兜底值。</p>
<h2>常见追问</h2>
<ul>
<li>和 <code>await</code> 的区别？<code>await</code> 只能在 async 函数中使用，客户端组件不能是 async 函数；<code>use</code> 在普通组件函数中实现等待。</li>
<li>刷新数据怎么办？在 <code>startTransition</code> 中创建新的 Promise 并存入 state，组件读取新 Promise，期间保留旧内容。</li>
</ul>`};export{e as default};