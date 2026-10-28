var e={answerHtml:`<h2>简答</h2>
<ul>
<li>租户身份由服务端根据登录会话确定，前端传来的租户 ID 只能用于选择，不能作为授权依据。</li>
<li>所有缓存（请求缓存、本地存储、Service Worker 缓存、CDN）的键都要包含租户，切换租户时清空上一个租户的数据。</li>
<li>租户上下文放在 URL（子域名或路径前缀）中最清晰，刷新、分享链接和多标签页都能保持一致。</li>
<li>主题、功能开关等租户配置在应用启动时加载，加载完成前不要渲染业务内容。</li>
<li>用两个租户的测试账号做自动化测试，验证互相看不到对方的数据。</li>
</ul>
<h2>租户从哪里来</h2>
<table><thead><tr><th>方式</th><th>示例</th><th>特点</th></tr></thead><tbody><tr><td>子域名</td><td><code>acme.app.com</code></td><td>每个子域名是独立的源，存储天然隔离；Cookie 只要不设置父域 <code>Domain</code> 也互不共享。需要通配证书</td></tr><tr><td>路径前缀</td><td><code>app.com/t/acme/</code></td><td>部署简单，同源共享存储，需要在键中区分</td></tr><tr><td>登录后选择</td><td>同一 URL，账号属于多个租户</td><td>URL 中看不出租户，分享链接容易出错</td></tr></tbody></table>
<p>无论哪种方式，服务端每次请求都要校验&quot;当前用户是否属于这个租户、是否有权访问这条记录&quot;。前端隐藏菜单只影响展示。</p>
<h2>缓存键包含租户</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// TanStack Query 示例</span>
<span class="hljs-title function_">useQuery</span>({
  <span class="hljs-attr">queryKey</span>: [<span class="hljs-string">&#x27;tenant&#x27;</span>, tenantId, <span class="hljs-string">&#x27;orders&#x27;</span>, filters],
  <span class="hljs-attr">queryFn</span>: <span class="hljs-function">() =&gt;</span> api.<span class="hljs-title function_">getOrders</span>(tenantId, filters),
});
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">switchTenant</span>(<span class="hljs-params">nextId</span>) {
  queryClient.<span class="hljs-title function_">clear</span>();
  <span class="hljs-variable language_">sessionStorage</span>.<span class="hljs-title function_">clear</span>();
  location.<span class="hljs-title function_">assign</span>(<span class="hljs-string">\`/t/<span class="hljs-subst">\${nextId}</span>/\`</span>); <span class="hljs-comment">// 整页切换，丢弃内存中的旧状态</span>
}
</code></pre></div>
<ul>
<li>本地存储的键加租户前缀：<code>acme:draft:123</code>。</li>
<li>Service Worker 缓存 API 响应时，缓存键或缓存名包含租户。</li>
<li>CDN 缓存接口响应时，响应要按租户或会话区分（如 <code>Vary</code> 或 <code>Cache-Control: private</code>），最安全的做法是租户数据不进共享缓存。</li>
</ul>
<h2>切换租户时的竞态</h2>
<p>用户从 A 切到 B 时，A 的请求可能还在进行，返回后写入状态就会出现 A 的数据显示在 B 的页面里。整页跳转最简单可靠；在单页内切换时，要取消所有进行中的请求并让旧请求的结果失效。</p>
<h2>租户配置</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">bootstrap</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> config = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/tenants/<span class="hljs-subst">\${tenantId}</span>/config\`</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">json</span>());
  <span class="hljs-title function_">applyTheme</span>(config.<span class="hljs-property">theme</span>);   <span class="hljs-comment">// 设置 CSS 自定义属性</span>
  <span class="hljs-title function_">setFeatureFlags</span>(config.<span class="hljs-property">features</span>);
  <span class="hljs-title function_">renderApp</span>();
}
</code></pre></div>
<ul>
<li>主题用 CSS 自定义属性实现，不为每个租户单独打包。</li>
<li>租户自定义的文案、Logo 链接也是外部输入，要做转义和 URL 校验，不能直接插入 HTML。</li>
</ul>
<h2>测试隔离</h2>
<ol>
<li>准备两个租户、各自的测试账号和测试数据。</li>
<li>用 A 的账号访问 B 的资源 ID，期望服务端返回 403 或 404。</li>
<li>在同一浏览器中先后登录两个租户，检查页面、本地存储和缓存中没有残留。</li>
<li>对日志和错误上报也检查租户字段，确保排查时能区分。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>不同租户需要不同功能版本怎么办？用租户级功能开关控制，同一份代码部署，避免为每个租户维护分支。</li>
<li>白标域名怎么处理？服务端根据请求的 Host 映射到租户，前端从配置接口拿到结果，不要信任前端自己解析的域名。</li>
</ul>`};export{e as default};