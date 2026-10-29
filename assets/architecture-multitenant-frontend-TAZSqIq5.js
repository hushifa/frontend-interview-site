var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>多租户就是一套系统同时给好几家公司用，每家是一个租户，数据必须互相看不到。前端最怕的就是“串租户”：A 公司的人看到了 B 公司的数据。</p>
<p>第一条原则是，租户身份由服务端根据登录会话来定。前端传上去的租户 ID 只能用来“选择”，不能当成授权的依据。</p>
<p>第二条是缓存。请求缓存、本地存储、Service Worker 缓存、CDN，所有缓存的键都要带上租户，切换租户时把上一个租户的数据清掉。租户放在 URL 里最清楚，比如子域名或路径前缀，刷新、分享链接、开多个标签页都不会乱。</p>
<p>还要注意两点。主题、功能开关这些租户配置在启动时加载，加载完之前不要渲染业务内容。最后要用两个租户的测试账号做自动化测试，确认彼此看不到对方的数据。</p>
</blockquote>
<h2>租户从哪里来</h2>
<table><thead><tr><th>方式</th><th>示例</th><th>特点</th></tr></thead><tbody><tr><td>子域名</td><td><code>acme.app.com</code></td><td>每个子域名是独立的源，存储天然隔离；Cookie 只要不设置父域 <code>Domain</code> 也互不共享。需要通配证书</td></tr><tr><td>路径前缀</td><td><code>app.com/t/acme/</code></td><td>部署简单，同源共享存储，需要在键中区分</td></tr><tr><td>登录后选择</td><td>同一 URL，账号属于多个租户</td><td>URL 中看不出租户，分享链接容易出错</td></tr></tbody></table>
<p>子域名的隔离最好，因为浏览器把每个子域名当成不同的源，localStorage 这类存储天然分开。路径前缀部署简单，但所有租户同源，存储是共享的，只能自己在键里区分。</p>
<p>不管选哪种，服务端每次请求都要校验两件事：当前用户是不是属于这个租户，有没有权限访问这条记录。前端把菜单藏起来，只影响显示，挡不住人。</p>
<h2>缓存键为什么要带租户</h2>
<p>先看请求缓存。用 TanStack Query 时，把租户 ID 放进查询的 key：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// TanStack Query 示例</span>
<span class="hljs-title function_">useQuery</span>({
  <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;tenant&#x27;</span>, tenantId, <span class="hljs-string">&#x27;orders&#x27;</span>, filters],
  <span class="hljs-attr">queryFn</span>: <span class="hljs-function">() =&gt;</span> api.<span class="hljs-title function_">getOrders</span>(tenantId, filters),
});
</code></pre></div>
<p>如果 key 里没有租户，切到另一个租户后，同样的 <code>[&#x27;orders&#x27;, filters]</code> 就会命中上一个租户的缓存，数据就串了。</p>
<p>切换租户时，最稳妥的办法是把缓存清掉，整页跳过去：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">switchTenant</span>(<span class="hljs-params">nextId</span>) {
  queryClient.<span class="hljs-title function_">clear</span>();
  <span class="hljs-variable language_">sessionStorage</span>.<span class="hljs-title function_">clear</span>();
  location.<span class="hljs-title function_">assign</span>(<span class="hljs-string">\`/t/<span class="hljs-subst">\${nextId}</span>/\`</span>); <span class="hljs-comment">// 整页切换，丢弃内存中的旧状态</span>
}
</code></pre></div>
<p>其他缓存也一样。本地存储的键加租户前缀，比如 <code>acme:draft:123</code>。Service Worker 缓存接口响应时，缓存键或缓存名里带上租户。CDN 缓存接口响应时，要按租户或会话区分，比如用 <code>Vary</code> 或 <code>Cache-Control: private</code>，最安全的做法是租户数据干脆不进共享缓存。</p>
<h2>切换租户时为什么还会串</h2>
<p>用户从 A 切到 B 的时候，A 的请求可能还没回来。等它回来了，结果写进状态，A 的数据就出现在 B 的页面上了。</p>
<p>整页跳转是最简单可靠的办法，旧页面的内存状态和进行中的请求都跟着没了。如果非要在单页里切换，就得取消所有进行中的请求，并且让旧请求的结果失效，不能写进新租户的状态。</p>
<h2>租户配置怎样加载</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">bootstrap</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> config = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/tenants/<span class="hljs-subst">\${tenantId}</span>/config\`</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>());
  <span class="hljs-title function_">applyTheme</span>(config.<span class="hljs-property">theme</span>);   <span class="hljs-comment">// 设置 CSS 自定义属性</span>
  <span class="hljs-title function_">setFeatureFlags</span>(config.<span class="hljs-property">features</span>);
  <span class="hljs-title function_">renderApp</span>();
}
</code></pre></div>
<p>先拿到配置，应用主题和功能开关，再渲染应用。这样不会出现先按默认主题渲染、再闪一下变成租户主题的情况。</p>
<p>主题用 CSS 自定义属性实现就行，不用给每个租户单独打包。另外，租户自定义的文案、Logo 链接也是外部输入，要做转义和 URL 校验，不能直接插进 HTML。</p>
<h2>怎样测试租户隔离</h2>
<ol>
<li>准备两个租户，各自有测试账号和测试数据。</li>
<li>用 A 的账号去访问 B 的资源 ID，期望服务端返回 403 或 404。</li>
<li>在同一个浏览器里先后登录两个租户，检查页面、本地存储和缓存里没有上一个租户的残留。</li>
<li>检查日志和错误上报里也带租户字段，出问题时能分清是哪个租户。</li>
</ol>
<h2>常见追问</h2>
<p><strong>不同租户需要不同的功能版本怎么办？</strong></p>
<blockquote>
<p>用租户级的功能开关控制。同一份代码部署，不要给每个租户维护一个分支。</p>
</blockquote>
<p><strong>白标域名怎么处理？</strong></p>
<blockquote>
<p>服务端根据请求的 Host 映射到租户，前端从配置接口拿到结果。不要信任前端自己解析出来的域名。</p>
</blockquote>`};export{e as default};