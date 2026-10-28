var e={answerHtml:`<h2>简答</h2>
<ul>
<li>应该放进 URL 的状态：页面身份（<code>/questions/42</code>）、可分享的筛选、排序和页码（<code>?tag=react&amp;page=2</code>）；临时状态（弹窗里未提交的输入、悬停）不需要。</li>
<li>hash 模式（<code>/#/questions/42</code>）：hash 变化不会请求服务器，监听 <code>hashchange</code>，无需服务器配置；hash 部分不会发送给服务器。</li>
<li>history 模式：用 <code>history.pushState</code> 改变地址、监听 <code>popstate</code> 响应前进后退；刷新时服务器收到完整路径，需要回退到 <code>index.html</code>。</li>
<li>查询参数是外部输入，要解析和校验：页码可能是负数或非数字，标签可能不存在。</li>
<li>导航后要更新 <code>document.title</code>、把焦点移到新内容、处理滚动位置，否则屏幕阅读器用户不知道页面已经变化。</li>
</ul>
<h2>原理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// history 模式的最小实现</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">navigate</span>(<span class="hljs-params">path</span>) {
  history.<span class="hljs-title function_">pushState</span>(<span class="hljs-literal">null</span>, <span class="hljs-string">&#x27;&#x27;</span>, path);
  <span class="hljs-title function_">render</span>(path);
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;popstate&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">render</span>(location.<span class="hljs-property">pathname</span>));

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">e</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> a = e.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;a[href^=&quot;/&quot;]&#x27;</span>);
  <span class="hljs-keyword">if</span> (!a || e.<span class="hljs-property">metaKey</span> || e.<span class="hljs-property">ctrlKey</span> || e.<span class="hljs-property">shiftKey</span> || e.<span class="hljs-property">altKey</span> || e.<span class="hljs-property">button</span> !== <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 保留新标签页、新窗口和下载</span>
  <span class="hljs-keyword">if</span> (a.<span class="hljs-property">target</span> &amp;&amp; a.<span class="hljs-property">target</span> !== <span class="hljs-string">&#x27;_self&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (a.<span class="hljs-title function_">hasAttribute</span>(<span class="hljs-string">&#x27;download&#x27;</span>)) <span class="hljs-keyword">return</span>;
  e.<span class="hljs-title function_">preventDefault</span>();
  <span class="hljs-title function_">navigate</span>(a.<span class="hljs-title function_">getAttribute</span>(<span class="hljs-string">&#x27;href&#x27;</span>));
});
</code></pre></div>
<p><code>pushState</code> 不会触发 <code>popstate</code>，只有浏览器前进后退才会触发，所以 <code>navigate</code> 中要自己调用 <code>render</code>。</p>
<h2>解析并规范化查询参数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseQuery</span>(<span class="hljs-params">search, knownTags</span>) {
  <span class="hljs-keyword">const</span> params = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(search);
  <span class="hljs-keyword">const</span> page = <span class="hljs-title class_">Number</span>(params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;page&#x27;</span>));
  <span class="hljs-keyword">const</span> tag = params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;tag&#x27;</span>);
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">page</span>: <span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(page) &amp;&amp; page &gt; <span class="hljs-number">0</span> ? page : <span class="hljs-number">1</span>,
    <span class="hljs-attr">tag</span>: knownTags.<span class="hljs-title function_">includes</span>(tag) ? tag : <span class="hljs-literal">null</span>,
  };
}
</code></pre></div>
<p>参数非法时使用默认值，必要时用 <code>history.replaceState</code> 把地址改成规范形式，避免同一内容有多种 URL。</p>
<h2>导航时的其他工作</h2>
<ul>
<li><strong>数据加载</strong>：进入路由时开始请求，快速切换时取消旧请求，见<a href="/questions/state-route-concurrency/">《路由并发导航和权限变化应该怎样处理？》</a>。</li>
<li><strong>错误与 404</strong>：参数指向的数据不存在时显示 404 页面；SSR 或静态托管时还要返回真实的 404 状态码，见<a href="/questions/render-seo-deploy/">《前端渲染方式怎样影响 SEO 和部署？》</a>。</li>
<li><strong>标题与焦点</strong>：更新 <code>document.title</code>，把焦点移到新页面的 <code>&lt;h1&gt;</code>（加 <code>tabindex=&quot;-1&quot;</code>），或用 <code>aria-live</code> 区域播报。</li>
<li><strong>滚动</strong>：新页面滚动到顶部，后退时恢复原来的位置。Vue Router 用 <code>scrollBehavior</code>，React Router 用 <code>&lt;ScrollRestoration&gt;</code>。</li>
</ul>
<h2>路由守卫</h2>
<p>前端路由守卫（如未登录跳转到登录页）只改善体验。用户可以直接调用接口，权限必须由服务端在每个请求中校验。</p>
<h2>常见追问</h2>
<ul>
<li><code>pushState</code> 和 <code>replaceState</code> 的区别？前者新增一条历史记录，后者替换当前记录，适合修正参数、筛选条件实时变化等不希望堆积历史的场景。</li>
<li>Navigation API 是什么？浏览器提供的新路由 API，用一个 <code>navigate</code> 事件统一拦截链接点击、表单提交和前进后退，可以替代手动拦截点击和监听 <code>popstate</code>。</li>
</ul>`};export{e as default};