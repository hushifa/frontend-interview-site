var e={answerHtml:`<h2>简答</h2>
<ul>
<li>前端权限只做展示控制：隐藏无权访问的菜单、按钮，拦截无权进入的路由，目的是体验，不是安全。</li>
<li>代码、接口地址和请求都在用户手里，前端判断可以被绕过；服务端必须对每个请求做授权，并检查具体资源是否属于当前用户。</li>
<li>权限数据由服务端下发（角色或权限码列表），前端不硬编码&quot;某角色能做什么&quot;，权限变化时只改服务端配置。</li>
<li>接口层统一处理 401 和 403：401 表示未登录或登录过期，跳转登录；403 表示无权限，给出提示并刷新权限数据。</li>
</ul>
<h2>权限数据</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 登录后从服务端获取</span>
<span class="hljs-keyword">const</span> session = { <span class="hljs-attr">userId</span>: <span class="hljs-string">&#x27;u1&#x27;</span>, <span class="hljs-attr">permissions</span>: [<span class="hljs-string">&#x27;order:read&#x27;</span>, <span class="hljs-string">&#x27;order:export&#x27;</span>] };
<span class="hljs-keyword">const</span> <span class="hljs-title function_">can</span> = (<span class="hljs-params">code</span>) =&gt; session.<span class="hljs-property">permissions</span>.<span class="hljs-title function_">includes</span>(code);
</code></pre></div>
<p>用细粒度权限码而不是角色名做判断：页面只关心&quot;能否导出订单&quot;，不关心用户是管理员还是运营。角色与权限码的映射留在服务端。</p>
<p>缺少权限码时默认不可见、不可进，与 OWASP 建议的&quot;默认拒绝&quot;一致。</p>
<h2>路由层</h2>
<ul>
<li>路由配置上声明所需权限码，全局导航守卫中检查，不满足则跳转 403 页或首页。</li>
<li>菜单从同一份路由配置生成，避免菜单可见但进入后被拦的不一致。</li>
<li>动态添加路由（只注册有权限的路由）可以让无权路由彻底不存在，但对应的代码分包仍可能被下载和阅读，因此也不构成安全保障。</li>
</ul>
<p>权限在使用中变化（被管理员收回）或导航并发时的处理见<a href="/questions/state-route-concurrency/">《路由并发导航和权限变化应该怎样处理？》</a>。</p>
<h2>按钮层</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Can</span>(<span class="hljs-params">{ code, children, fallback = <span class="hljs-literal">null</span> }</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">can</span>(code) ? children : fallback;
}

&lt;<span class="hljs-title class_">Can</span> code=<span class="hljs-string">&quot;order:export&quot;</span>&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{exportOrders}</span>&gt;</span>导出<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
&lt;/<span class="hljs-title class_">Can</span>&gt;;
</code></pre></div>
<p>封装成组件或指令，避免权限判断散落在各处。对重要但无权限的操作，可以显示禁用状态并说明原因，而不是让功能神秘消失，按产品需求选择。</p>
<h2>接口层</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">request</span>(<span class="hljs-params">url, init</span>) {
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, init);
  <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> === <span class="hljs-number">401</span>) <span class="hljs-title function_">redirectToLogin</span>();
  <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> === <span class="hljs-number">403</span>) {
    <span class="hljs-title function_">toast</span>(<span class="hljs-string">&#x27;没有权限执行该操作&#x27;</span>);
    <span class="hljs-title function_">refreshPermissions</span>(); <span class="hljs-comment">// 权限可能已变化，同步最新数据</span>
  }
  <span class="hljs-keyword">return</span> res;
}
</code></pre></div>
<p>前端在接口层能做的是统一的错误处理，不是授权。服务端要在每个请求上校验：当前用户是否有该操作权限，以及目标对象是否在其范围内。只校验&quot;已登录&quot;而不校验&quot;这张订单是不是你的&quot;，会产生越权访问漏洞。</p>
<h2>数据层面的限制</h2>
<p>隐藏字段不等于保护字段。接口如果把手机号、成本价返回给无权用户，前端不显示也能在开发者工具里看到。敏感字段应由服务端按权限裁剪后再返回。</p>
<h2>常见追问</h2>
<ul>
<li>权限数据存在 <code>localStorage</code> 被改了怎么办？只会让用户看到更多按钮，点击后接口仍会返回 403，这正说明授权必须在服务端。</li>
<li>页面级权限能用 JWT 里的声明吗？可以用于展示判断，但服务端校验时以服务端的权限数据为准，并考虑令牌未过期但权限已变更的情况。</li>
<li>多租户系统要注意什么？服务端每个查询都要带租户条件，前端传来的租户 ID 不能直接信任。</li>
</ul>`};export{e as default};