var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>prefetch</code>：只取目标文档的响应正文，不取子资源，成本低，可以较广泛使用。</li>
<li><code>prerender</code>：取文档、加载所有子资源、执行 JavaScript，资源消耗接近渲染一个 iframe，只用于高概率访问的页面。</li>
<li><code>eagerness</code>：<code>immediate</code> 立即执行，<code>moderate</code> 在桌面端悬停约 200ms 或按下指针时，<code>conservative</code> 在按下指针或触摸时。列表规则默认 <code>immediate</code>，文档规则默认 <code>conservative</code>。</li>
<li>预渲染默认只限同源；同站跨源需要目标页面返回 <code>Supports-Loading-Mode: credentialed-prerender</code>，跨站不支持。</li>
<li>预渲染的页面会执行代码，统计、广告曝光等副作用要等页面真正被用户看到再执行。</li>
</ul>
<h2>规则示例</h2>
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
<ul>
<li>退出登录、加入购物车这类会改变状态的链接必须排除。</li>
<li>使用 CSP 时，内联规则需要 <code>&#x27;inline-speculation-rules&#x27;</code>、nonce 或 hash。</li>
<li>也可以通过响应头 <code>Speculation-Rules: &quot;/rules.json&quot;</code> 下发，文件类型为 <code>application/speculationrules+json</code>。</li>
</ul>
<h2>处理预渲染的副作用</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">whenVisible</span>(<span class="hljs-params">callback</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">prerendering</span>) {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;prerenderingchange&#x27;</span>, callback, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-title function_">callback</span>();
  }
}

<span class="hljs-title function_">whenVisible</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">sendPageView</span>());
</code></pre></div>
<ul>
<li>预渲染期间，地理位置、通知、<code>getUserMedia</code> 等 API 会延迟到激活后执行。</li>
<li>服务器可以通过 <code>Sec-Purpose: prefetch</code> 或 <code>Sec-Purpose: prefetch;prerender</code> 请求头识别推测请求。</li>
<li>判断页面是否经过预渲染：<code>performance.getEntriesByType(&#x27;navigation&#x27;)[0].activationStart &gt; 0</code>。</li>
</ul>
<h2>兼容性</h2>
<p>MDN 标注其为实验性、有限可用。检测支持：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-title class_">HTMLScriptElement</span>.<span class="hljs-property">supports</span>?.(<span class="hljs-string">&#x27;speculationrules&#x27;</span>)) {
  <span class="hljs-comment">// 动态插入规则</span>
}
</code></pre></div>
<p>不支持的浏览器会忽略规则，页面照常工作，可以用 <code>&lt;link rel=&quot;prefetch&quot;&gt;</code> 作为下一页资源的降级方案。浏览器也可能因为省电、省流量模式或内存不足不执行推测。</p>
<h2>验证</h2>
<ul>
<li>DevTools 的 Application 面板有 Speculative loads 视图，可以看到规则和每个 URL 的状态。</li>
<li>用真实用户数据对比被预渲染导航和普通导航的 LCP。</li>
<li>返回 2xx 以外的状态码时预取或预渲染不会生效，204 和 205 还会阻止预渲染。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 <code>&lt;link rel=&quot;prefetch&quot;&gt;</code> 有什么区别？后者预取任意资源并放入 HTTP 缓存；Speculation Rules 针对整页导航，结果存在按文档隔离的内存缓存里。</li>
<li>会不会浪费流量？<code>prerender</code> 会，要配合 <code>moderate</code> 或 <code>conservative</code>，并限制匹配范围。</li>
</ul>`};export{e as default};