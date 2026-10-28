var e={answerHtml:`<h2>简答</h2>
<ul>
<li>传统 SSR 要等整页数据都准备好才能发送 HTML，最慢的请求决定首字节时间。</li>
<li>流式 SSR 以 <code>&lt;Suspense&gt;</code> 为边界：外壳先发送，边界内的内容就绪后再流式补上，替换掉 fallback。</li>
<li>Node 中用 <code>renderToPipeableStream</code>，Web Streams 环境（Deno、边缘运行时）用 <code>renderToReadableStream</code>。</li>
<li>状态码只能在开始发送前确定，所以在 <code>onShellReady</code> 或 <code>onShellError</code> 中设置；边界内出错时 React 发送 fallback，并在客户端重试渲染该部分。</li>
<li>React 19.2 新增 <code>resume</code>、<code>resumeToPipeableStream</code> 等 API：<code>prerender</code> 现在可以返回 <code>postponed</code> 状态，构建时预渲染静态部分，请求时再从中断处继续渲染动态部分。</li>
</ul>
<h2>示例</h2>
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
<ul>
<li><code>onShellReady</code>：外壳渲染完成，开始发送。</li>
<li><code>onShellError</code>：外壳渲染失败，还没有发送任何内容，可以返回备用页面。</li>
<li><code>onAllReady</code>：全部内容完成，适合给爬虫或静态生成使用，此时没有渐进效果。</li>
<li><code>abort()</code>：超时后把剩余边界的 fallback 发送出去，由客户端继续渲染。</li>
</ul>
<h2>浏览器收到什么</h2>
<ol>
<li>外壳 HTML，<code>Comments</code> 的位置是 fallback。</li>
<li>评论数据就绪后，同一个响应中追加一段隐藏的 HTML 和一小段内联脚本，脚本把它移到 fallback 的位置。</li>
<li>客户端 JS 加载后，React 可以先 hydration 已到达的部分；用户点击某个未 hydration 的区域时，优先 hydration 该区域。</li>
</ol>
<h2>状态码与边界放置</h2>
<p>由于外壳发出后就不能再改状态码，决定 404、重定向的数据应在外壳中加载（不放进 Suspense），例如&quot;文章是否存在&quot;。评论、推荐这类不影响状态码的内容放进 Suspense。</p>
<p>React 19.2 起，服务端渲染的 Suspense 边界会被短暂地批量显示，与客户端行为保持一致。</p>
<h2>部分预渲染</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { prerender } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/static&#x27;</span>;
<span class="hljs-keyword">import</span> { resume } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom/server&#x27;</span>;

<span class="hljs-comment">// 构建时</span>
<span class="hljs-keyword">const</span> { prelude, postponed } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">prerender</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>, { signal });
<span class="hljs-comment">// 请求时</span>
<span class="hljs-keyword">const</span> stream = <span class="hljs-keyword">await</span> <span class="hljs-title function_">resume</span>(<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">App</span> /&gt;</span></span>, postponed);
</code></pre></div>
<p>构建时得到的 <code>prelude</code> 是可以缓存到 CDN 的静态 HTML，<code>postponed</code> 记录了哪些部分需要在请求时完成。Next.js 的 Cache Components 就基于这种模式，见《Next.js App Router 中的几层缓存怎样区分？》。</p>
<p>React 19.2 也让 Web Streams 版本的 API 可以在 Node 中使用，但官方仍推荐在 Node 中使用 Node Streams 版本，速度更快且支持压缩。</p>
<h2>常见追问</h2>
<ul>
<li>流式输出对 SEO 有影响吗？主流爬虫能处理流式 HTML；需要保证完整内容时，可以对爬虫使用 <code>onAllReady</code>。</li>
<li>中间代理会缓冲响应吗？某些代理或压缩配置会等待完整响应再转发，部署时要确认流式输出确实生效。</li>
</ul>`};export{e as default};