var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>攻击者的网站向目标网站发请求，或者把目标页面嵌进来，然后观察结果有什么不同，以此推断用户在目标网站上的状态，比如有没有登录、搜索有没有结果。这叫 XS-Leaks，跨站泄露。</p>
<p>同源策略能阻止攻击者读响应内容，但阻止不了这些副作用被观察到。常见的信号有 <code>&lt;img&gt;</code>、<code>&lt;script&gt;</code> 的 <code>onload</code> 和 <code>onerror</code>、请求耗时、<code>window.length</code> 也就是 iframe 数量、弹窗有没有跳转、缓存是否命中。</p>
<p>这类攻击通常要求请求带上用户的 Cookie，所以 <code>SameSite=Lax</code> 或 <code>Strict</code> 是第一道防线。再往上，COOP 切断攻击者通过 <code>window.open</code> 拿到的窗口引用，<code>frame-ancestors</code> 阻止被嵌入，CORP 阻止资源被跨站加载，服务端还可以检查 <code>Sec-Fetch-Site</code> 拒绝跨站的非导航请求。</p>
<p>要注意，CORS 配得再严格也防不住它，因为 XS-Leaks 根本不读内容。</p>
</blockquote>
<h2>先看一个例子</h2>
<p>下面是攻击者页面上的代码。它看不到头像长什么样，只关心图片加载成功还是失败：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 攻击者页面</span>
<span class="hljs-keyword">const</span> img = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Image</span>();
img.<span class="hljs-property">onload</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">report</span>(<span class="hljs-string">&#x27;已登录&#x27;</span>);   <span class="hljs-comment">// 登录后返回头像</span>
img.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">report</span>(<span class="hljs-string">&#x27;未登录&#x27;</span>);  <span class="hljs-comment">// 未登录时 302 到登录页（HTML，不是图片）</span>
img.<span class="hljs-property">src</span> = <span class="hljs-string">&#x27;https://target.example/api/me/avatar&#x27;</span>;
</code></pre></div>
<p>用户登录了，接口返回一张图片，触发 <code>onload</code>；没登录，接口跳到登录页，返回的是 HTML，不是图片，触发 <code>onerror</code>。攻击者一个字节的内容都没读到，可是从“成功还是失败”这一个信号里，就知道了用户的登录状态。</p>
<p>同样的思路能走得更远。如果搜索接口在“有结果”和“无结果”时返回不同的状态码，攻击者就可以一个字符一个字符地试，慢慢探测出私密数据。</p>
<h2>怎么防</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Set-Cookie: __Host-session=...; Secure; HttpOnly; SameSite=Lax; Path=/
Cross-Origin-Opener-Policy: same-origin
Content-Security-Policy: frame-ancestors &#x27;self&#x27;
Cross-Origin-Resource-Policy: same-origin
</code></pre></div>
<p>为什么 SameSite 排在第一？因为上面例子里的请求如果不带 Cookie，接口对所有人都返回“未登录”，差异就消失了。COOP 让别的网站打开你的页面时拿不到窗口引用，<code>window.length</code> 这类探测就用不了。<code>frame-ancestors</code> 不让别人嵌入你的页面。CORP 不让别的网站把你的资源当 <code>&lt;img&gt;</code>、<code>&lt;script&gt;</code> 加载。</p>
<p>服务端还可以加一层资源隔离，下面是中间件示意：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">isolationPolicy</span>(<span class="hljs-params">req, res, next</span>) {
  <span class="hljs-keyword">const</span> site = req.<span class="hljs-property">headers</span>[<span class="hljs-string">&#x27;sec-fetch-site&#x27;</span>];
  <span class="hljs-keyword">if</span> (!site || site === <span class="hljs-string">&#x27;same-origin&#x27;</span> || site === <span class="hljs-string">&#x27;same-site&#x27;</span> || site === <span class="hljs-string">&#x27;none&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">next</span>();
  <span class="hljs-comment">// 允许跨站的顶层页面导航，例如用户点击外部链接进入</span>
  <span class="hljs-keyword">if</span> (req.<span class="hljs-property">headers</span>[<span class="hljs-string">&#x27;sec-fetch-mode&#x27;</span>] === <span class="hljs-string">&#x27;navigate&#x27;</span> &amp;&amp; req.<span class="hljs-property">method</span> === <span class="hljs-string">&#x27;GET&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">next</span>();
  res.<span class="hljs-title function_">status</span>(<span class="hljs-number">403</span>).<span class="hljs-title function_">end</span>();
}
</code></pre></div>
<p><code>Sec-Fetch-Site</code> 这类请求头叫 Fetch Metadata，是浏览器自动加上的，告诉服务端这个请求从哪来。这段代码放行同源、同站和用户直接输入地址的请求，跨站的只放行顶层的 <code>GET</code> 导航，其余一律 403。</p>
<p>可是缺少这些请求头的旧浏览器会被直接放行，所以它只是增强措施，不能替代鉴权和 CSRF 防护。</p>
<h2>让响应难以区分</h2>
<p>另一个思路是让有差异的地方变得没差异。敏感接口在有权限和无权限时，返回相同的状态码和结构，避免“存在不存在”本身泄露信息。私有响应不要进入共享缓存，因为缓存命中与否也可能是一个信号。</p>
<p>那要不要把所有响应都填充到相同大小，或者人为加点延迟？不必。这样代价高，也很难完全消除差异。更有效的是从源头上阻止请求带上凭据、阻止页面被嵌入。</p>
<h2>常见追问</h2>
<p><strong>XS-Leaks 和 CORS 有什么关系？</strong></p>
<blockquote>
<p>CORS 决定的是脚本能不能读取响应内容。XS-Leaks 根本不读内容，只看副作用，所以 CORS 配得再严格也防不住它。</p>
</blockquote>
<p><strong>跨源隔离（COOP 加 COEP）有什么帮助？</strong></p>
<blockquote>
<p>COOP 单独就能阻断窗口引用这类探测。和 COEP 一起用，还会限制跨源资源的嵌入。具体配置见<a href="/questions/browser-cross-origin-isolation/">《crossOriginIsolated 为 true 需要哪些条件？》</a>。</p>
</blockquote>`};export{e as default};