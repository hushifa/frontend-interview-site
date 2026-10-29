var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端权限只做展示控制：把没权限的菜单、按钮藏起来，拦住进不去的路由。它的目的是体验，不是安全。</p>
<p>为什么说不是安全？因为代码、接口地址、请求全都在用户手里，前端的判断随时可以绕过。真正的授权必须由服务端对每个请求做，而且不光要看用户有没有这个操作权限，还要看这条具体的数据是不是属于他。</p>
<p>权限数据由服务端下发，一般是角色或权限码列表。前端不要写死“某个角色能做什么”，这样权限调整时只改服务端配置就行。</p>
<p>接口层要统一处理两种状态码。401 表示没登录或登录过期，跳转登录页；403 表示登录了但没权限，给出提示，并刷新一下权限数据。</p>
</blockquote>
<h2>权限数据长什么样</h2>
<p>登录后从服务端拿到权限码列表，前端用一个函数判断：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 登录后从服务端获取</span>
<span class="hljs-keyword">const</span> session = { <span class="hljs-attr">userId</span>: <span class="hljs-string">&#x27;u1&#x27;</span>, <span class="hljs-attr">permissions</span>: [<span class="hljs-string">&#x27;order:read&#x27;</span>, <span class="hljs-string">&#x27;order:export&#x27;</span>] };
<span class="hljs-keyword">const</span> <span class="hljs-title function_">can</span> = (<span class="hljs-params">code</span>) =&gt; session.<span class="hljs-property">permissions</span>.<span class="hljs-title function_">includes</span>(code);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">can</span>(<span class="hljs-string">&#x27;order:export&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">can</span>(<span class="hljs-string">&#x27;order:delete&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>为什么用细粒度的权限码，而不是直接判断角色名？因为页面只关心“能不能导出订单”，不关心用户是管理员还是运营。角色和权限码怎么对应，留在服务端管。</p>
<p>列表里没有的权限码，<code>can</code> 一律返回 <code>false</code>，也就是默认不可见、不可进。这和 OWASP 建议的“默认拒绝”是一致的。</p>
<h2>路由层怎么做</h2>
<p>在路由配置上声明每个页面需要的权限码，在全局导航守卫里检查，不满足就跳到 403 页或首页。</p>
<p>菜单也从同一份路由配置生成。否则很容易出现菜单能看见、点进去却被拦住的情况。</p>
<p>还有一种做法是动态添加路由，只注册有权限的路由，没权限的路由在前端根本不存在。但对应页面的代码分包仍然可能被下载、被阅读，所以这也不算安全保障。</p>
<p>用户用着用着权限被管理员收回了，或者几次导航同时进行时怎么办，见<a href="/questions/state-route-concurrency/">《路由并发导航和权限变化应该怎样处理？》</a>。</p>
<h2>按钮层怎么做</h2>
<p>把判断封装成一个组件：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Can</span>(<span class="hljs-params">{ code, children, fallback = <span class="hljs-literal">null</span> }</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">can</span>(code) ? children : fallback;
}

&lt;<span class="hljs-title class_">Can</span> code=<span class="hljs-string">&quot;order:export&quot;</span>&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{exportOrders}</span>&gt;</span>导出<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
&lt;/<span class="hljs-title class_">Can</span>&gt;;
</code></pre></div>
<p>封装成组件或者指令，权限判断就不会散落在代码各处。对于重要但当前没权限的操作，也可以显示成禁用状态并说明原因，而不是让功能莫名其妙地消失，具体按产品需求选择。</p>
<h2>接口层能做什么</h2>
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
<p>前端在接口层能做的，是统一处理错误，不是授权。</p>
<p>授权是服务端的事，每个请求都要校验两件事：当前用户有没有这个操作的权限，目标数据在不在他的范围内。很多越权漏洞就出在只校验了“已登录”，没校验“这张订单是不是你的”，结果改一下 URL 里的订单 ID，就能看到别人的订单。</p>
<h2>隐藏字段不等于保护字段</h2>
<p>如果接口把手机号、成本价返回给了没权限的用户，前端就算不显示，用户打开开发者工具照样能看到。所以敏感字段要由服务端按权限裁剪掉再返回。</p>
<h2>常见追问</h2>
<p><strong>权限数据存在 <code>localStorage</code> 里，被用户改了怎么办？</strong></p>
<blockquote>
<p>改了也只是多看到几个按钮，点下去接口照样返回 403。这恰好说明授权必须在服务端做。</p>
</blockquote>
<p><strong>页面级权限能用 JWT 里的声明吗？</strong></p>
<blockquote>
<p>可以用来做展示判断。但服务端校验时要以服务端的权限数据为准，还要考虑令牌没过期、权限却已经变了的情况。</p>
</blockquote>
<p><strong>多租户系统要注意什么？</strong></p>
<blockquote>
<p>服务端的每个查询都要带上租户条件，前端传上来的租户 ID 不能直接信任。</p>
</blockquote>`};export{e as default};