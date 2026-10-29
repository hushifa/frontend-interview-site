var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Speculation Rules 是让页面提前告诉浏览器：用户接下来很可能点这些链接，你可以先准备。准备的程度有两种。</p>
<p><code>prefetch</code> 是预取，只把目标页面的 HTML 取回来，不取图片、脚本这些子资源，成本低，可以用得比较广。<code>prerender</code> 是预渲染，把目标页面的文档和所有子资源都加载好，JavaScript 也执行了，用户点过去几乎立刻显示，但资源消耗接近渲染一个 iframe，只适合用户很可能访问的页面。</p>
<p>什么时候开始准备由 <code>eagerness</code> 控制。<code>immediate</code> 是立即；<code>eager</code> 在有一点迹象时就开始，比如鼠标移向链接、短暂悬停；<code>moderate</code> 是桌面端悬停约 200 毫秒或者按下指针时；<code>conservative</code> 是按下指针或触摸时。列表规则默认 <code>immediate</code>，文档规则默认 <code>conservative</code>。</p>
<p>要注意两点。第一，预渲染默认只限同源，同站跨源需要目标页面返回 <code>Supports-Loading-Mode: credentialed-prerender</code>，跨站不支持。第二，预渲染的页面会真的执行代码，统计、广告曝光这类副作用要等页面真正被用户看到再执行。</p>
</blockquote>
<h2>规则怎么写</h2>
<p>规则写在一个特殊的 <code>&lt;script&gt;</code> 标签里，内容是 JSON。下面的例子对 <code>/questions/</code> 下的链接做预渲染，排除带 <code>.no-prerender</code> 类的链接，同时立即预取目录页：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;speculationrules&quot;</span>&gt;</span><span class="javascript">
  {
    <span class="hljs-string">&quot;prerender&quot;</span>: [
      {
        <span class="hljs-string">&quot;where&quot;</span>: {
          <span class="hljs-string">&quot;and&quot;</span>: [
            { <span class="hljs-string">&quot;href_matches&quot;</span>: <span class="hljs-string">&quot;/questions/*&quot;</span> },
            { <span class="hljs-string">&quot;not&quot;</span>: { <span class="hljs-string">&quot;selector_matches&quot;</span>: <span class="hljs-string">&quot;.no-prerender&quot;</span> } }
          ]
        },
        <span class="hljs-string">&quot;eagerness&quot;</span>: <span class="hljs-string">&quot;moderate&quot;</span>
      }
    ],
    <span class="hljs-string">&quot;prefetch&quot;</span>: [{ <span class="hljs-string">&quot;urls&quot;</span>: [<span class="hljs-string">&quot;/questions/&quot;</span>], <span class="hljs-string">&quot;eagerness&quot;</span>: <span class="hljs-string">&quot;immediate&quot;</span> }]
  }
</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p><code>urls</code> 写死网址列表，叫列表规则；<code>where</code> 按条件匹配页面上的链接，叫文档规则。两者默认的 <code>eagerness</code> 不一样，前面简答里说过。</p>
<p>为什么一定要排除某些链接？因为预取和预渲染都会真的发请求。退出登录、加入购物车这类一访问就改变状态的链接，提前请求一次就出事了，所以必须排除。</p>
<p>页面开了 CSP 的话，内联规则需要 <code>&#x27;inline-speculation-rules&#x27;</code>、nonce 或 hash 才能生效。规则也可以不写在页面里，而是通过响应头 <code>Speculation-Rules: &quot;/rules.json&quot;</code> 下发，这个文件的类型是 <code>application/speculationrules+json</code>。</p>
<h2>预渲染的副作用怎么处理</h2>
<p>预渲染的页面用户还没看到，代码却已经跑了。如果在这时候发送页面浏览统计，用户最后没点过去，统计就多算了一次。所以要判断页面是否正在预渲染，等它真正显示时再执行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">whenVisible</span>(<span class="hljs-params">callback</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">prerendering</span>) {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;prerenderingchange&#x27;</span>, callback, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-title function_">callback</span>();
  }
}

<span class="hljs-title function_">whenVisible</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">sendPageView</span>());
</code></pre></div>
<p><code>document.prerendering</code> 为 <code>true</code> 说明还在预渲染，页面被激活时会触发 <code>prerenderingchange</code>。</p>
<p>浏览器自己也会拦一部分。预渲染期间，地理位置、通知、<code>getUserMedia</code> 这类 API 会延迟到激活后才执行。</p>
<p>服务器那边，可以通过请求头 <code>Sec-Purpose: prefetch</code> 或 <code>Sec-Purpose: prefetch;prerender</code> 认出这是推测请求。页面激活以后，想知道它是不是经过了预渲染，可以看 <code>performance.getEntriesByType(&#x27;navigation&#x27;)[0].activationStart &gt; 0</code>。</p>
<h2>浏览器不支持怎么办</h2>
<p>MDN 标注它为实验性、有限可用。可以这样检测：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-title class_">HTMLScriptElement</span>.<span class="hljs-property">supports</span>?.(<span class="hljs-string">&#x27;speculationrules&#x27;</span>)) {
  <span class="hljs-comment">// 动态插入规则</span>
}
</code></pre></div>
<p>不过不检测也不会出错，不支持的浏览器会直接忽略规则，页面照常工作。下一页的资源可以用 <code>&lt;link rel=&quot;prefetch&quot;&gt;</code> 作为降级。</p>
<p>即使支持，浏览器也可能不执行，比如开了省电、省流量模式，或者内存不足。所以它只能当作加速手段。</p>
<h2>怎样验证有没有生效</h2>
<p>DevTools 的 Application 面板里有 Speculative loads 视图，能看到规则和每个 URL 的状态。</p>
<p>还要注意状态码：目标页面返回 2xx 以外的状态码时，预取或预渲染不会生效，204 和 205 还会阻止预渲染。</p>
<p>效果最终要看真实用户数据，对比经过预渲染的导航和普通导航的 LCP。</p>
<h2>常见追问</h2>
<p><strong>和 <code>&lt;link rel=&quot;prefetch&quot;&gt;</code> 有什么区别？</strong></p>
<blockquote>
<p><code>&lt;link rel=&quot;prefetch&quot;&gt;</code> 可以预取任意资源，结果放进 HTTP 缓存。Speculation Rules 针对的是整页导航，结果存在按文档隔离的内存缓存里。</p>
</blockquote>
<p><strong>会不会浪费流量？</strong></p>
<blockquote>
<p><code>prerender</code> 会，因为它把整个页面都加载了，用户不点就白费了。所以要配合 <code>moderate</code> 或 <code>conservative</code>，并且限制匹配范围。</p>
</blockquote>`};export{e as default};