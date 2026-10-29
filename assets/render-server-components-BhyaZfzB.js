var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>不是一回事，它们解决的问题不同。SSR 解决的是“首屏 HTML 怎样在服务端生成”：组件在服务端执行一次，生成 HTML；浏览器再下载同一份组件代码，做 hydration 接上事件。</p>
<p>Server Components 解决的是“哪些组件只在服务端跑”。它们可以写成 async 函数，直接查数据库，代码和依赖都不会进客户端的包，也不需要 hydration。</p>
<p>两种组件靠 <code>&#x27;use client&#x27;</code> 分开。写了它的文件，连同它导入的模块，都会进客户端包，可以用 state、Effect 和浏览器 API。Server Component 可以渲染 Client Component，但传过去的 props 必须能序列化。反过来，Client Component 不能导入 Server Component，但可以通过 <code>children</code> 接收一个已经渲染好的 Server Component。</p>
<p>容易混的一点是 <code>&#x27;use server&#x27;</code>。它标记的是 Server Function，也就是客户端可以调用的服务端函数，不是 Server Component。Server Component 不需要任何指令。</p>
</blockquote>
<h2>先看一个文章页</h2>
<p>文章页本身是 Server Component，收藏按钮需要点击状态，是 Client Component。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// app/article/[id]/page.jsx —— Server Component</span>
<span class="hljs-keyword">import</span> { db } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@/lib/db&#x27;</span>;
<span class="hljs-keyword">import</span> { marked } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;marked&#x27;</span>; <span class="hljs-comment">// 只在服务端使用，不进入客户端包</span>
<span class="hljs-keyword">import</span> <span class="hljs-title class_">BookmarkButton</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./BookmarkButton&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ArticlePage</span>(<span class="hljs-params">{ params }</span>) {
  <span class="hljs-keyword">const</span> { id } = <span class="hljs-keyword">await</span> params;
  <span class="hljs-keyword">const</span> article = <span class="hljs-keyword">await</span> db.<span class="hljs-property">article</span>.<span class="hljs-title function_">findUnique</span>({ <span class="hljs-attr">where</span>: { id } });
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">article</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>{article.title}<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">dangerouslySetInnerHTML</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">__html:</span> <span class="hljs-attr">marked</span>(<span class="hljs-attr">article.body</span>) }} /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">BookmarkButton</span> <span class="hljs-attr">articleId</span>=<span class="hljs-string">{article.id}</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span></span>
  );
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// BookmarkButton.jsx —— Client Component</span>
<span class="hljs-string">&#x27;use client&#x27;</span>;

<span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">BookmarkButton</span>(<span class="hljs-params">{ articleId }</span>) {
  <span class="hljs-keyword">const</span> [saved, setSaved] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> setSaved(!saved)}&gt;{saved ? &#x27;已收藏&#x27; : &#x27;收藏&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}
</code></pre></div>
<p>浏览器最后只下载 <code>BookmarkButton</code> 的代码。<code>marked</code> 这个 Markdown 库和数据库客户端都留在服务端，因为用到它们的组件从来不在浏览器里运行。如果只用 SSR，这些依赖也要打包给浏览器，因为 hydration 时组件要在客户端再跑一遍。</p>
<p>示例里的正文如果来自用户输入，渲染成 HTML 之前必须先做清洗。</p>
<h2>一次请求里发生了什么</h2>
<p>两者配合时，大致是这样的顺序：</p>
<ol>
<li>服务端运行 Server Components，生成 RSC payload。这是一种描述组件树的序列化格式，其中 Client Component 的位置只放一个引用和它的 props。</li>
<li>框架再用 SSR 把这棵树，包括 Client Components，渲染成 HTML，和 RSC payload 一起发出去。</li>
<li>浏览器先显示 HTML，然后下载 Client Component 的代码并 hydration。</li>
<li>之后在客户端导航，只请求新页面的 RSC payload，不用整页 HTML。</li>
</ol>
<p>所以 SSR 负责的是“先给一份 HTML”，Server Components 负责的是“哪些组件只在服务端跑”，两者是叠在一起用的。</p>
<h2>Client Component 怎样包住服务端内容</h2>
<p>Client Component 不能导入 Server Component，可是像标签页这种外壳需要交互、里面内容来自服务端的场景很常见。办法是用 <code>children</code>：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// Client Component 通过 children 接收服务端内容</span>
<span class="hljs-string">&#x27;use client&#x27;</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Tabs</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">const</span> [tab, setTab] = <span class="hljs-title function_">useState</span>(<span class="hljs-number">0</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span>&gt;</span>{/* 切换逻辑 */}{children}<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// Server Component 中</span>
&lt;<span class="hljs-title class_">Tabs</span>&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ServerRenderedList</span> /&gt;</span></span>
&lt;/<span class="hljs-title class_">Tabs</span>&gt;
</code></pre></div>
<p><code>ServerRenderedList</code> 在服务端就渲染好了，作为 props 传给 <code>Tabs</code>。<code>Tabs</code> 只管把它放到某个位置，不需要知道它是怎么实现的，所以也不用导入它。</p>
<h2>有哪些要注意</h2>
<p>传给 Client Component 的 props 会发到浏览器。所以不要把整条数据库记录直接传过去，只传需要的字段。</p>
<p>只能在服务端用的模块，可以导入 <code>server-only</code> 包。万一被客户端代码误导入，构建时就会报错，而不是悄悄把它打包出去。</p>
<p>Server Components 需要框架支持打包和路由，比如 Next.js App Router。单独用 React 没办法直接启用。</p>
<h2>常见追问</h2>
<p><strong>Server Components 能用 Hook 吗？</strong></p>
<blockquote>
<p>不能用 <code>useState</code>、<code>useEffect</code> 这类有状态或者有副作用的 Hook，因为它不在浏览器里运行，也不会重新渲染。</p>
</blockquote>
<p><strong>和 Server Functions 有什么区别？</strong></p>
<blockquote>
<p>Server Function 是客户端可以调用的服务端函数，用 <code>&#x27;use server&#x27;</code> 标记，详见<a href="/questions/react-server-actions/">《React Server Functions/Actions 的边界是什么？》</a>。</p>
</blockquote>`};export{e as default};