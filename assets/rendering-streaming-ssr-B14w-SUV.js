var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>传统 SSR 要等整页的数据都准备好，才能把 HTML 发出去。页面上只要有一个接口慢，整页都得等它，最慢的请求决定了首字节时间。</p>
<p>流式 SSR 就是边渲染边发。它以 <code>&lt;Suspense&gt;</code> 为边界，边界外面的页面外壳先发给浏览器，边界里面先显示 fallback；里面的内容准备好了，再接着往同一个响应里补，替换掉 fallback。Node 里用 <code>renderToPipeableStream</code>，Deno、边缘运行时这类 Web Streams 环境用 <code>renderToReadableStream</code>。</p>
<p>要注意状态码。响应一旦开始发送，状态码就改不了了，所以要在 <code>onShellReady</code> 或 <code>onShellError</code> 里设好。如果是 Suspense 边界里面出错，React 会发送 fallback，再在客户端重试渲染这一块。</p>
<p>React 19.2 又加了 <code>resume</code>、<code>resumeToPipeableStream</code> 等 API。<code>prerender</code> 现在能返回一个 <code>postponed</code> 状态，构建时先把静态部分预渲染好，请求时再从中断的地方接着渲染动态部分。</p>
</blockquote>
<h2>先看页面怎么划边界</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">html</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">body</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">Header</span> /&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>评论加载中…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
          <span class="hljs-tag">&lt;<span class="hljs-name">Comments</span> /&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">body</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">html</span>&gt;</span></span>
  );
}
</code></pre></div>
<p><code>Header</code> 在边界外面，属于外壳，会先发出去。<code>Comments</code> 在边界里面，数据没好之前，浏览器先看到“评论加载中…”。</p>
<h2>服务端怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { renderToPipeableStream } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/server&#x27;</span>;

app.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;*&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">req, res</span>) =&gt;</span> {
  <span class="hljs-keyword">let</span> didError = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> { pipe, abort } = <span class="hljs-title function_">renderToPipeableStream</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>, {
    <span class="hljs-attr">bootstrapScripts</span>: [<span class="hljs-string">&#x27;/main.js&#x27;</span>],
    <span class="hljs-title function_">onShellReady</span>(<span class="hljs-params"></span>) {
      res.<span class="hljs-property">statusCode</span> = didError ? <span class="hljs-number">500</span> : <span class="hljs-number">200</span>;
      res.<span class="hljs-title function_">setHeader</span>(<span class="hljs-string">&#x27;Content-Type&#x27;</span>, <span class="hljs-string">&#x27;text/html&#x27;</span>);
      <span class="hljs-title function_">pipe</span>(res);
    },
    <span class="hljs-title function_">onShellError</span>(<span class="hljs-params"></span>) {
      res.<span class="hljs-property">statusCode</span> = <span class="hljs-number">500</span>;
      res.<span class="hljs-title function_">send</span>(<span class="hljs-string">&#x27;&lt;h1&gt;出错了&lt;/h1&gt;&#x27;</span>);
    },
    <span class="hljs-title function_">onError</span>(<span class="hljs-params">err</span>) {
      didError = <span class="hljs-literal">true</span>;
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(err);
    },
  });
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">abort</span>(), <span class="hljs-number">10_000</span>);
});
</code></pre></div>
<p>这几个回调分别在不同时刻触发：</p>
<ul>
<li><code>onShellReady</code>：外壳渲染完成，可以开始发送了，所以状态码在这里设，然后 <code>pipe</code> 出去。</li>
<li><code>onShellError</code>：外壳渲染失败。这时还一个字节都没发，所以还能换成一个备用页面。</li>
<li><code>onAllReady</code>：全部内容都完成了。适合给爬虫或者静态生成用，但这时就没有渐进显示的效果了。</li>
<li><code>abort()</code>：超时后不再等，把剩下边界的 fallback 发出去，由客户端接着渲染。</li>
</ul>
<h2>浏览器收到了什么</h2>
<p>“补上内容”具体是怎么做到的？浏览器收到的东西分几批：</p>
<ol>
<li>先是外壳 HTML，<code>Comments</code> 的位置是 fallback。</li>
<li>评论数据好了以后，同一个响应里追加一段隐藏的 HTML，再加一小段内联脚本，脚本把这段 HTML 挪到 fallback 的位置。</li>
<li>客户端 JS 加载后，React 可以先 hydration 已经到了的部分。用户如果点了某个还没 hydration 的区域，React 会优先处理那一块。</li>
</ol>
<h2>边界放在哪里，影响状态码</h2>
<p>因为外壳一发出去状态码就定了，所以凡是决定 404 或者重定向的数据，都要放在外壳里加载，不能放进 Suspense。比如“这篇文章存不存在”，要在外壳阶段就查清楚。评论、推荐这种不影响状态码的内容，才放进 Suspense。</p>
<p>另外，React 19.2 起，服务端渲染出来的 Suspense 边界会被短暂地攒一批再显示，和客户端的行为保持一致。</p>
<h2>部分预渲染是怎么回事</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { prerender } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/static&#x27;</span>;
<span class="hljs-keyword">import</span> { resume } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/server&#x27;</span>;

<span class="hljs-comment">// 构建时</span>
<span class="hljs-keyword">const</span> { prelude, postponed } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">prerender</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>, { signal });
<span class="hljs-comment">// 请求时</span>
<span class="hljs-keyword">const</span> stream = <span class="hljs-keyword">await</span> <span class="hljs-title function_">resume</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>, postponed);
</code></pre></div>
<p>构建时得到的 <code>prelude</code> 是静态 HTML，可以缓存到 CDN。<code>postponed</code> 记下了哪些部分要等到请求时才能完成。请求来了，<code>resume</code> 从这里接着渲染。Next.js 的 Cache Components 就基于这种模式，详见<a href="/questions/render-next-cache/">《Next.js App Router 中的几层缓存怎样区分？》</a>。</p>
<p>React 19.2 也让 Web Streams 版本的 API 能在 Node 里用了。不过官方仍然推荐 Node 里用 Node Streams 版本，因为速度更快，而且支持压缩。</p>
<h2>常见追问</h2>
<p><strong>流式输出对 SEO 有影响吗？</strong></p>
<blockquote>
<p>主流爬虫能处理流式 HTML。如果一定要保证爬虫拿到完整内容，可以对爬虫改用 <code>onAllReady</code>，等全部完成再发。</p>
</blockquote>
<p><strong>中间的代理会不会把响应攒起来？</strong></p>
<blockquote>
<p>会有这种情况。某些代理或压缩配置会等完整响应到了再转发，流式就失效了。所以部署时要确认流式输出真的生效了。</p>
</blockquote>`};export{e as default};