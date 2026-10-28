var e={answerHtml:`<h2>简答</h2>
<ul>
<li>攻击者页面向目标站点发请求或嵌入页面，观察结果差异，从而推断跨站状态。同源策略阻止读内容，但不阻止这些副作用被观察。</li>
<li>常见信号：<code>&lt;img&gt;</code>、<code>&lt;script&gt;</code> 的 <code>onload</code> 与 <code>onerror</code>，请求耗时，<code>window.length</code>（iframe 数量），弹窗是否发生了跳转，缓存是否命中。</li>
<li>前提通常是请求带上了用户的 Cookie，所以 <code>SameSite=Lax</code> 或 <code>Strict</code> 是第一道防线。</li>
<li><code>Cross-Origin-Opener-Policy: same-origin</code> 切断攻击者通过 <code>window.open</code> 拿到的窗口引用；<code>frame-ancestors</code> 阻止被嵌入；<code>Cross-Origin-Resource-Policy</code> 阻止资源被跨站加载。</li>
<li>服务端检查 <code>Sec-Fetch-Site</code> 等 Fetch Metadata 请求头，拒绝来自跨站的非导航请求。</li>
</ul>
<h2>一个例子</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 攻击者页面</span>
<span class="hljs-keyword">const</span> img = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Image</span>();
img.<span class="hljs-property">onload</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">report</span>(<span class="hljs-string">&#x27;已登录&#x27;</span>);   <span class="hljs-comment">// 登录后返回头像</span>
img.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">report</span>(<span class="hljs-string">&#x27;未登录&#x27;</span>);  <span class="hljs-comment">// 未登录时 302 到登录页（HTML，不是图片）</span>
img.<span class="hljs-property">src</span> = <span class="hljs-string">&#x27;https://target.example/api/me/avatar&#x27;</span>;
</code></pre></div>
<p>攻击者看不到头像，但从加载成功还是失败知道了登录状态。同理，搜索接口在&quot;有结果&quot;和&quot;无结果&quot;时返回不同状态码，就能逐字符探测私密数据。</p>
<h2>防护</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-session=...; Secure; HttpOnly; SameSite=Lax; Path=/
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: frame-ancestors &#x27;self&#x27;
Cross-Origin-Resource-Policy: same-origin
</code></pre></div>
<p>资源隔离策略（服务端中间件示意）：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">isolationPolicy</span>(<span class="hljs-params">req, res, next</span>) {
  <span class="hljs-keyword">const</span> site = req.<span class="hljs-property">headers</span>[<span class="hljs-string">&#x27;sec-fetch-site&#x27;</span>];
  <span class="hljs-keyword">if</span> (!site || site === <span class="hljs-string">&#x27;same-origin&#x27;</span> || site === <span class="hljs-string">&#x27;same-site&#x27;</span> || site === <span class="hljs-string">&#x27;none&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">next</span>();
  <span class="hljs-comment">// 允许跨站的顶层页面导航，例如用户点击外部链接进入</span>
  <span class="hljs-keyword">if</span> (req.<span class="hljs-property">headers</span>[<span class="hljs-string">&#x27;sec-fetch-mode&#x27;</span>] === <span class="hljs-string">&#x27;navigate&#x27;</span> &amp;&amp; req.<span class="hljs-property">method</span> === <span class="hljs-string">&#x27;GET&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">next</span>();
  res.<span class="hljs-title function_">status</span>(<span class="hljs-number">403</span>).<span class="hljs-title function_">end</span>();
}
</code></pre></div>
<p>缺少 Fetch Metadata 头的旧浏览器直接放行，因此它是增强措施，不替代鉴权和 CSRF 防护。</p>
<h2>让响应难以区分</h2>
<ul>
<li>敏感接口在有权限和无权限时返回相同的状态码和结构，避免&quot;存在与否&quot;本身泄露信息。</li>
<li>私有响应不要进入共享缓存，缓存命中与否也可能成为信号。</li>
<li>不必给所有响应填充到相同大小或人为加延迟，代价高且难以完全消除差异，优先阻止请求带上凭据和阻止被嵌入。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 CORS 有什么关系？CORS 决定脚本能否读取响应内容；XS-Leaks 根本不读内容，所以 CORS 配置再严格也防不住。</li>
<li>跨源隔离（COOP 加 COEP）有什么帮助？COOP 本身就能阻断窗口引用类的探测，两者合用还会限制跨源资源的嵌入；配置细节见<a href="/questions/browser-cross-origin-isolation/">《crossOriginIsolated 为 true 需要哪些条件？》</a>。</li>
</ul>`};export{e as default};