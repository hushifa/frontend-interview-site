var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Next.js 16 引入 Cache Components（<code>cacheComponents: true</code>），用推荐配置创建的新 App Router 项目默认开启。</li>
<li>在 Cache Components 下，数据请求和组件默认在请求时执行；在函数或组件顶部写 <code>&#x27;use cache&#x27;</code> 才缓存结果，参数和闭包变量自动成为缓存键。</li>
<li>用 <code>cacheLife(&#x27;hours&#x27;)</code> 等配置设置缓存时长，用 <code>cacheTag(&#x27;posts&#x27;)</code> 打标签；修改数据后在 Server Action 中调用 <code>updateTag</code>（立即失效）或 <code>revalidateTag(tag, &#x27;max&#x27;)</code>（先返回旧数据、后台刷新）。</li>
<li>读取 <code>cookies()</code>、<code>headers()</code>、<code>searchParams</code> 或未缓存数据的组件要包在 <code>&lt;Suspense&gt;</code> 中：构建时生成包含静态和已缓存内容的外壳，这部分在请求时流式输出，这种方式称为部分预渲染（PPR）。</li>
<li>未开启 Cache Components 的项目使用旧模型：Next 15 起 <code>fetch</code> 默认不缓存，用 <code>cache: &#x27;force-cache&#x27;</code>、<code>next.revalidate</code>、<code>unstable_cache</code> 和路由段配置控制。</li>
</ul>
<h2>Cache Components 示例</h2>
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
<ul>
<li>标题和 <code>Posts</code> 的结果进入静态外壳，可以直接从 CDN 返回。</li>
<li><code>Preferences</code> 读取 cookie，在请求时生成，通过流式响应填充到 fallback 的位置。</li>
</ul>
<h2>修改后失效</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-string">&#x27;use server&#x27;</span>;
<span class="hljs-keyword">import</span> { updateTag } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;next/cache&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">createPost</span>(<span class="hljs-params"><span class="hljs-attr">formData</span>: <span class="hljs-title class_">FormData</span></span>) {
  <span class="hljs-keyword">await</span> db.<span class="hljs-property">post</span>.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">data</span>: { <span class="hljs-attr">title</span>: <span class="hljs-title class_">String</span>(formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;title&#x27;</span>)) } });
  <span class="hljs-title function_">updateTag</span>(<span class="hljs-string">&#x27;posts&#x27;</span>);
}
</code></pre></div>
<table><thead><tr><th></th><th><code>updateTag</code></th><th><code>revalidateTag</code></th></tr></thead><tbody><tr><td>调用位置</td><td>只能在 Server Action</td><td>Server Action 和 Route Handler</td></tr><tr><td>行为</td><td>立即失效，用户马上看到自己的修改</td><td>先返回旧数据，后台重新生成</td></tr><tr><td>适合</td><td>用户提交后跳转查看结果</td><td>CMS webhook、允许短暂延迟的内容</td></tr></tbody></table>
<p>能用标签时优先用标签；<code>revalidatePath(&#x27;/blog&#x27;)</code> 会失效整个路径的缓存，范围更大。</p>
<h2>缓存存在哪里</h2>
<ul>
<li>预渲染的 HTML：构建时或 ISR 时生成，可以由 CDN 提供。</li>
<li>服务端缓存：默认在每个实例的内存中，Serverless 环境下可能不持久；<code>&#x27;use cache: remote&#x27;</code> 使用共享的缓存处理器。</li>
<li>浏览器：客户端导航或预取得到的结果，在 <code>cacheLife</code> 的 <code>stale</code> 时间内被复用。<code>&#x27;use cache: private&#x27;</code> 的结果只保存在浏览器中，可以读取 cookie。</li>
</ul>
<p>每次部署后缓存都会重新开始，因为缓存键包含构建 ID。</p>
<h2>旧模型（未开启 Cache Components）</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url); <span class="hljs-comment">// Next 15 起默认不缓存</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">cache</span>: <span class="hljs-string">&#x27;force-cache&#x27;</span> }); <span class="hljs-comment">// 缓存</span>
<span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">next</span>: { <span class="hljs-attr">revalidate</span>: <span class="hljs-number">3600</span>, <span class="hljs-attr">tags</span>: [<span class="hljs-string">&#x27;posts&#x27;</span>] } }); <span class="hljs-comment">// 定时失效 + 标签</span>

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> dynamic = <span class="hljs-string">&#x27;force-dynamic&#x27;</span>; <span class="hljs-comment">// 路由段配置：每次请求都渲染</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> revalidate = <span class="hljs-number">60</span>; <span class="hljs-comment">// 路由默认的重新验证时间</span>
</code></pre></div>
<p>非 <code>fetch</code> 的数据源用 <code>unstable_cache</code> 包装。在 Next 14 中，<code>fetch</code> 默认是缓存的，从 14 升级到 15 时要注意这个变化。</p>
<h2>个性化数据</h2>
<p>读取 cookie 或用户身份的组件不要用普通的 <code>&#x27;use cache&#x27;</code> 缓存成共享结果；把用户 ID 作为参数传给缓存函数时，它会成为缓存键的一部分，或者使用 <code>&#x27;use cache: private&#x27;</code>。CDN 层的个性化缓存问题见《SSR 和 SSG 中的缓存层应该怎样区分？》。</p>
<h2>常见追问</h2>
<ul>
<li><code>&#x27;use cache&#x27;</code> 和 React <code>cache</code> 的区别？React <code>cache</code> 只在一次请求内去重，<code>&#x27;use cache&#x27;</code> 跨请求持久化，见《React 的 cache API 解决什么问题？》。</li>
<li><code>Math.random()</code>、<code>Date.now()</code> 怎么处理？需要每次请求不同的值，先 <code>await connection()</code> 并放进 Suspense；希望所有用户共享同一个值，放进 <code>&#x27;use cache&#x27;</code> 中。</li>
</ul>`};export{e as default};