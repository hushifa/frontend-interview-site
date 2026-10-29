var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>路由不只是“地址变了换个组件”。它真正的作用，是让 URL 成为界面状态的来源：看路径和查询参数就知道该显示什么，所以刷新、分享链接、前进后退，都能回到同一个界面。</p>
<p>哪些状态该进 URL？页面身份，比如 <code>/questions/42</code>；可以分享的筛选、排序和页码，比如 <code>?tag=react&amp;page=2</code>。弹窗里还没提交的输入、鼠标悬停这类临时状态，就不用放。</p>
<p>实现上有两种模式。hash 模式地址形如 <code>/#/questions/42</code>，hash 部分不会发给服务器，监听 <code>hashchange</code> 就行，不需要服务器配置。history 模式用 <code>history.pushState</code> 改地址、监听 <code>popstate</code> 响应前进后退，地址更干净，但刷新时服务器会收到完整路径，要回退到 <code>index.html</code>。</p>
<p>还要注意两件事。查询参数是外部输入，页码可能是负数或者根本不是数字，标签可能不存在，都要解析和校验。导航之后要更新 <code>document.title</code>、把焦点移到新内容、处理滚动位置，否则用屏幕阅读器的用户不知道页面已经变了。</p>
</blockquote>
<h2>history 模式的最小实现</h2>
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
<p>为什么 <code>navigate</code> 里改完地址还要自己调用 <code>render</code>？因为 <code>pushState</code> 不会触发 <code>popstate</code>，只有浏览器的前进后退才会触发它。不手动渲染，地址变了页面却不动。</p>
<p>点击拦截那段会放过按着修饰键的点击、非左键点击、<code>target</code> 不是当前窗口的链接和下载链接，这些都交给浏览器原本的行为。两种模式的细节和服务器回退配置，见<a href="/questions/state-hash-history/">《hash 路由和 history 路由的原理是什么？服务器要怎样配置回退？》</a>。</p>
<h2>查询参数为什么要校验</h2>
<p>URL 是用户可以随手改的，所以查询参数要当成外部输入看待。下面的函数把参数解析成安全的值：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseQuery</span>(<span class="hljs-params">search, knownTags</span>) {
  <span class="hljs-keyword">const</span> params = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>(search);
  <span class="hljs-keyword">const</span> page = <span class="hljs-title class_">Number</span>(params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;page&#x27;</span>));
  <span class="hljs-keyword">const</span> tag = params.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;tag&#x27;</span>);
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">page</span>: <span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(page) &amp;&amp; page &gt; <span class="hljs-number">0</span> ? page : <span class="hljs-number">1</span>,
    <span class="hljs-attr">tag</span>: knownTags.<span class="hljs-title function_">includes</span>(tag) ? tag : <span class="hljs-literal">null</span>,
  };
}

<span class="hljs-keyword">const</span> tags = [<span class="hljs-string">&#x27;react&#x27;</span>, <span class="hljs-string">&#x27;vue&#x27;</span>];
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseQuery</span>(<span class="hljs-string">&#x27;?page=2&amp;tag=react&#x27;</span>, tags)); <span class="hljs-comment">// { page: 2, tag: &#x27;react&#x27; }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseQuery</span>(<span class="hljs-string">&#x27;?page=-3&amp;tag=angular&#x27;</span>, tags)); <span class="hljs-comment">// { page: 1, tag: null }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">parseQuery</span>(<span class="hljs-string">&#x27;?page=abc&#x27;</span>, tags)); <span class="hljs-comment">// { page: 1, tag: null }</span>
</code></pre></div>
<p>页码是 <code>-3</code> 或 <code>abc</code> 时，<code>Number</code> 转出来要么是负数，要么是 <code>NaN</code>，都过不了检查，于是回到默认的第 1 页。标签不在已知列表里，就当作没选。</p>
<p>参数不合法时，除了用默认值，必要时还可以用 <code>history.replaceState</code> 把地址改成规范的形式。这样同一个内容不会有好几种 URL。</p>
<h2>导航时还要做哪些事</h2>
<p>数据加载：进入路由时开始请求，用户快速切换时取消旧请求，见<a href="/questions/state-route-concurrency/">《路由并发导航和权限变化应该怎样处理？》</a>。</p>
<p>错误与 404：参数指向的数据不存在时，显示 404 页面。如果是 SSR 或静态托管，还要返回真实的 404 状态码，见<a href="/questions/render-seo-deploy/">《前端渲染方式怎样影响 SEO 和部署？》</a>。</p>
<p>标题与焦点：更新 <code>document.title</code>，把焦点移到新页面的 <code>&lt;h1&gt;</code> 上，<code>&lt;h1&gt;</code> 要加 <code>tabindex=&quot;-1&quot;</code> 才能被脚本聚焦；也可以用 <code>aria-live</code> 区域播报。这是因为单页应用切换页面时浏览器不会重新加载，读屏软件不会自动告诉用户“到了新页面”。</p>
<p>滚动：进入新页面滚到顶部，后退时恢复原来的位置。Vue Router 用 <code>scrollBehavior</code> 配置，React Router 用 <code>&lt;ScrollRestoration&gt;</code> 组件。</p>
<h2>路由守卫能保护什么</h2>
<p>前端路由守卫，比如没登录就跳到登录页，只是改善体验。用户完全可以绕过页面直接调接口，所以权限必须由服务端在每个请求里校验。</p>
<h2>常见追问</h2>
<p><strong><code>pushState</code> 和 <code>replaceState</code> 有什么区别？</strong></p>
<blockquote>
<p><code>pushState</code> 新增一条历史记录，<code>replaceState</code> 替换当前这条。修正参数、筛选条件实时变化这类不希望堆出一串历史的场景，用 <code>replaceState</code>。</p>
</blockquote>
<p><strong>Navigation API 是什么？</strong></p>
<blockquote>
<p>它是浏览器提供的较新的路由 API，用一个 <code>navigate</code> 事件统一拦截链接点击、表单提交和前进后退。有了它，就不用再手动拦截点击、监听 <code>popstate</code> 了。</p>
</blockquote>`};export{e as default};