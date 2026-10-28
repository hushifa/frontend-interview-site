var e={answerHtml:`<h2>简答</h2>
<ul>
<li>SSR 解决&quot;首屏 HTML 怎样在服务端生成&quot;：组件在服务端执行一次生成 HTML，客户端下载同样的组件代码再 hydration。</li>
<li>Server Components 解决&quot;哪些组件只在服务端运行&quot;：它们可以是 async 函数、直接查询数据库，代码和依赖不进入客户端包，也不会 hydration。</li>
<li><code>&#x27;use client&#x27;</code> 标记客户端边界：该文件及其导入的模块进入客户端包，可以使用 state、Effect 和浏览器 API。</li>
<li>Server Component 可以渲染 Client Component，传给它的 props 必须可序列化；Client Component 不能导入 Server Component，但可以通过 <code>children</code> 接收已经渲染好的 Server Component。</li>
<li><code>&#x27;use server&#x27;</code> 标记的是 Server Function（客户端可调用的服务端函数），不是 Server Component；Server Component 不需要任何指令。</li>
</ul>
<h2>示例</h2>
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
<p>浏览器只下载 <code>BookmarkButton</code> 的代码；<code>marked</code> 和数据库客户端都留在服务端。（示例中正文若来自用户输入，渲染为 HTML 前必须先做清洗。）</p>
<h2>一次请求中发生了什么</h2>
<ol>
<li>服务端运行 Server Components，生成 RSC payload：一种描述组件树的序列化格式，其中 Client Component 的位置只是一个引用和它的 props。</li>
<li>框架再用 SSR 把这棵树（含 Client Components）渲染成 HTML，与 RSC payload 一起发送。</li>
<li>浏览器显示 HTML，下载 Client Component 代码并 hydration。</li>
<li>之后的客户端导航只请求新的 RSC payload，不需要整页 HTML。</li>
</ol>
<h2>组合方式</h2>
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
<p><code>ServerRenderedList</code> 在服务端渲染好后作为 props 传入，<code>Tabs</code> 不需要知道它的实现。</p>
<h2>注意点</h2>
<ul>
<li>传给 Client Component 的 props 会发送到浏览器，不要直接传整个数据库记录，只传需要的字段。</li>
<li>只能在服务端使用的模块，可以导入 <code>server-only</code> 包，被客户端误导入时构建会报错。</li>
<li>Server Components 需要框架支持打包和路由，例如 Next.js App Router，单独使用 React 无法直接启用。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Server Components 能用 Hook 吗？不能用 <code>useState</code>、<code>useEffect</code> 这类有状态或副作用的 Hook。</li>
<li>和 Server Functions 的区别，见<a href="/questions/react-server-actions/">《React Server Functions/Actions 的边界是什么？》</a>。</li>
</ul>`};export{e as default};