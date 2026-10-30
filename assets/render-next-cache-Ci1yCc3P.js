var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Next.js 16 引入了 Cache Components，配置项是 <code>cacheComponents: true</code>，用推荐配置创建的新 App Router 项目默认开启。在这个模式下，数据请求和组件默认每次请求都执行，不缓存。想缓存，就在函数或组件顶部写 <code>&#x27;use cache&#x27;</code>，它的参数和用到的闭包变量会自动成为缓存键。</p>
<p>缓存多久用 <code>cacheLife(&#x27;hours&#x27;)</code> 这类配置，打标签用 <code>cacheTag(&#x27;posts&#x27;)</code>。数据改了以后，在 Server Action 里调 <code>updateTag</code> 立即失效，或者调 <code>revalidateTag(tag, &#x27;max&#x27;)</code>，先返回旧数据、后台再刷新。</p>
<p>读了 <code>cookies()</code>、<code>headers()</code>、<code>searchParams</code> 或者没缓存的数据的组件，要包在 <code>&lt;Suspense&gt;</code> 里。构建时先生成一个外壳，包含静态内容和已缓存的内容；Suspense 里的部分在请求时再流式补上。这种方式叫部分预渲染，简称 PPR。</p>
<p>没开 Cache Components 的项目用的是旧模型：Next 15 起 <code>fetch</code> 默认不缓存，靠 <code>cache: &#x27;force-cache&#x27;</code>、<code>next.revalidate</code>、<code>unstable_cache</code> 和路由段配置来控制。</p>
</blockquote>
<h2>先看一个博客页</h2>
<p>下面这个页面里，文章列表可以缓存，用户的主题偏好要读 cookie，每个人不一样。</p>
<div class="not-prose code-block"><div class="code-language">TSX</div><pre><code class="hljs language-tsx"><span class="hljs-comment">// app/blog/page.tsx</span>
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">Suspense</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { cookies } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;next/headers&#x27;</span>;
<span class="hljs-keyword">import</span> { cacheLife, cacheTag } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;next/cache&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">BlogPage</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>博客<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Posts</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>加载偏好…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
        <span class="hljs-tag">&lt;<span class="hljs-name">Preferences</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Posts</span>(<span class="hljs-params"></span>) {
  <span class="hljs-string">&#x27;use cache&#x27;</span>;
  <span class="hljs-title function_">cacheLife</span>(<span class="hljs-string">&#x27;hours&#x27;</span>);
  <span class="hljs-title function_">cacheTag</span>(<span class="hljs-string">&#x27;posts&#x27;</span>);
  <span class="hljs-keyword">const</span> posts = <span class="hljs-keyword">await</span> db.<span class="hljs-property">post</span>.<span class="hljs-title function_">findMany</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>{posts.map((p) =&gt; <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{p.id}</span>&gt;</span>{p.title}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>)}<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Preferences</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> theme = (<span class="hljs-keyword">await</span> <span class="hljs-title function_">cookies</span>()).<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;theme&#x27;</span>)?.<span class="hljs-property">value</span> ?? <span class="hljs-string">&#x27;light&#x27;</span>;
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>主题：{theme}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}
</code></pre></div>
<p>标题是静态的，<code>Posts</code> 写了 <code>&#x27;use cache&#x27;</code>，所以这两部分都进了构建时的静态外壳，可以直接从 CDN 返回。<code>Preferences</code> 读了 cookie，构建时没有 cookie 可读，只能在请求时生成，所以要放进 Suspense。用户先看到“加载偏好…”，生成好以后通过流式响应填到这个位置。</p>
<h2>数据改了怎样让缓存失效</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-string">&#x27;use server&#x27;</span>;
<span class="hljs-keyword">import</span> { updateTag } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;next/cache&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createPost</span>(<span class="hljs-params"><span class="hljs-attr">formData</span>: <span class="hljs-title class_">FormData</span></span>) {
  <span class="hljs-keyword">await</span> db.<span class="hljs-property">post</span>.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">data</span>: { <span class="hljs-attr">title</span>: <span class="hljs-title class_">String</span>(formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;title&#x27;</span>)) } });
  <span class="hljs-title function_">updateTag</span>(<span class="hljs-string">&#x27;posts&#x27;</span>);
}
</code></pre></div>
<p><code>Posts</code> 打了 <code>posts</code> 标签，这里一调 <code>updateTag(&#x27;posts&#x27;)</code>，它的缓存就失效了。另一个选择是 <code>revalidateTag</code>，两者的区别是：</p>
<table><thead><tr><th></th><th><code>updateTag</code></th><th><code>revalidateTag</code></th></tr></thead><tbody><tr><td>调用位置</td><td>只能在 Server Action</td><td>Server Action 和 Route Handler</td></tr><tr><td>行为</td><td>立即失效，用户马上看到自己的修改</td><td>先返回旧数据，后台重新生成</td></tr><tr><td>适合</td><td>用户提交后跳转查看结果</td><td>CMS webhook、允许短暂延迟的内容</td></tr></tbody></table>
<p>能用标签时优先用标签。<code>revalidatePath(&#x27;/blog&#x27;)</code> 会让整个路径的缓存都失效，范围更大。</p>
<h2>缓存到底存在哪里</h2>
<p>缓存不是只有一处。预渲染的 HTML 在构建时或 ISR 时生成，可以放在 CDN 上。服务端缓存默认在每个实例的内存里，Serverless 环境下实例随时会换，所以可能存不住；用 <code>&#x27;use cache: remote&#x27;</code> 可以换成共享的缓存处理器。</p>
<p>浏览器里也有一层。客户端导航或预取拿到的结果，会在 <code>cacheLife</code> 的 <code>stale</code> 时间内被复用。<code>&#x27;use cache: private&#x27;</code> 可以读 cookie，因为生产环境里它的结果不会跨请求存进服务端缓存，只在同一次请求内复用；客户端路由会在 <code>stale</code> 时间内把渲染结果留在浏览器内存里，刷新页面就没了。</p>
<p>另外，每次部署后缓存都会从头开始，因为缓存键里包含了构建 ID。</p>
<h2>没开 Cache Components 时怎么控制</h2>
<p>旧模型的写法是这样：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url); <span class="hljs-comment">// Next 15 起默认不缓存</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">cache</span>: <span class="hljs-string">&#x27;force-cache&#x27;</span> }); <span class="hljs-comment">// 缓存</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">next</span>: { <span class="hljs-attr">revalidate</span>: <span class="hljs-number">3600</span>, <span class="hljs-attr">tags</span>: [<span class="hljs-string">&#x27;posts&#x27;</span>] } }); <span class="hljs-comment">// 定时失效 + 标签</span>

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> dynamic = <span class="hljs-string">&#x27;force-dynamic&#x27;</span>; <span class="hljs-comment">// 路由段配置：每次请求都渲染</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> revalidate = <span class="hljs-number">60</span>; <span class="hljs-comment">// 路由默认的重新验证时间</span>
</code></pre></div>
<p>不是 <code>fetch</code> 的数据源，比如直接查数据库，用 <code>unstable_cache</code> 包一层。要特别注意的是，Next 14 里 <code>fetch</code> 默认是缓存的，从 14 升到 15 时这个默认值反过来了。</p>
<h2>个性化数据不能缓存成共享结果</h2>
<p>读 cookie 或用户身份的组件，不要用普通的 <code>&#x27;use cache&#x27;</code> 缓存，否则一个人的结果可能被别人拿到。可以把用户 ID 作为参数传给缓存函数，这样它会成为缓存键的一部分；或者用 <code>&#x27;use cache: private&#x27;</code>。CDN 上 <code>Cache-Control</code>、<code>Vary</code> 怎样设，和框架无关的部分见<a href="/questions/rendering-cache-semantics/">《SSR 和 SSG 中的缓存层应该怎样区分？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>&#x27;use cache&#x27;</code> 和 React 的 <code>cache</code> 有什么区别？</strong></p>
<blockquote>
<p>React 的 <code>cache</code> 只在一次请求里去重，请求结束就没了。<code>&#x27;use cache&#x27;</code> 是跨请求持久保存的，详见<a href="/questions/react-server-cache/">《React 的 cache API 解决什么问题？》</a>。</p>
</blockquote>
<p><strong><code>Math.random()</code>、<code>Date.now()</code> 怎么处理？</strong></p>
<blockquote>
<p>如果需要每次请求都不一样，先 <code>await connection()</code>，再把组件放进 Suspense。如果希望所有用户共享同一个值，就放进 <code>&#x27;use cache&#x27;</code> 里。</p>
</blockquote>`};export{e as default};