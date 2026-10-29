var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>前端路由要做到的是：地址栏变了，页面内容跟着变，但浏览器不重新加载页面。实现方式有两种。</p>
<p>hash 路由的地址长这样：<code>/#/user/1</code>。<code>#</code> 后面那段叫片段，它不会随请求发给服务器，改 <code>location.hash</code> 也不会刷新页面，值一变就触发 <code>hashchange</code> 事件，路由监听它来切换页面。</p>
<p>history 路由用 <code>history.pushState(state, &#x27;&#x27;, url)</code> 修改地址栏，同时新增一条历史记录。浏览器不会去加载这个地址，也不会触发 <code>popstate</code>，所以路由库调用完要自己渲染新页面。<code>popstate</code> 只在用户前进、后退切换历史记录时触发。另外 <code>pushState</code> 的地址必须和当前页面同源。</p>
<p>要注意，history 模式下用户一刷新，或者直接打开 <code>/user/1</code>，浏览器就会真的去请求这个路径。静态服务器上没有这个文件，所以要配置成找不到时返回 <code>index.html</code>，交给前端路由处理。</p>
</blockquote>
<p>路由还要管理哪些数据、深链接和权限的边界，见<a href="/questions/state-router/">《前端路由除切换组件外还需要管理什么？》</a>。这道题只讲两种模式怎样手写，以及服务器怎样配置回退。</p>
<h2>hash 路由怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">renderByHash</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> path = location.<span class="hljs-property">hash</span>.<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>) || <span class="hljs-string">&#x27;/&#x27;</span>;
  <span class="hljs-title function_">render</span>(path);
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;hashchange&#x27;</span>, renderByHash);
<span class="hljs-title function_">renderByHash</span>();

<span class="hljs-comment">// 跳转</span>
location.<span class="hljs-property">hash</span> = <span class="hljs-string">&#x27;/user/1&#x27;</span>;
</code></pre></div>
<p><code>location.hash</code> 读出来是带 <code>#</code> 的，<code>slice(1)</code> 去掉它就是路径。页面第一次打开时 <code>hashchange</code> 不会触发，所以要手动调用一次 <code>renderByHash()</code>。</p>
<p>有个细节：给 <code>location.hash</code> 赋一个和当前相同的值，不会触发 <code>hashchange</code>。</p>
<p>hash 模式的好处是完全不需要服务器配置。代价是地址里带着 <code>#</code>，而且和页内锚点共用同一个片段，没法再用 <code>#section</code> 跳到页面某个位置。</p>
<h2>history 路由怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">navigate</span>(<span class="hljs-params">url</span>) {
  history.<span class="hljs-title function_">pushState</span>(<span class="hljs-literal">null</span>, <span class="hljs-string">&#x27;&#x27;</span>, url);
  <span class="hljs-title function_">render</span>(location.<span class="hljs-property">pathname</span>); <span class="hljs-comment">// pushState 不会触发 popstate，要手动渲染</span>
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;popstate&#x27;</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">render</span>(location.<span class="hljs-property">pathname</span>));

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> link = event.<span class="hljs-property">target</span>.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;a[href^=&quot;/&quot;]&#x27;</span>);
  <span class="hljs-comment">// 保留新标签页、下载和其他脚本已处理的点击</span>
  <span class="hljs-keyword">if</span> (
    !link ||
    event.<span class="hljs-property">defaultPrevented</span> ||
    event.<span class="hljs-property">button</span> !== <span class="hljs-number">0</span> ||
    event.<span class="hljs-property">metaKey</span> ||
    event.<span class="hljs-property">ctrlKey</span> ||
    event.<span class="hljs-property">shiftKey</span> ||
    event.<span class="hljs-property">altKey</span> ||
    link.<span class="hljs-property">target</span> ||
    link.<span class="hljs-title function_">hasAttribute</span>(<span class="hljs-string">&#x27;download&#x27;</span>)
  )
    <span class="hljs-keyword">return</span>;
  event.<span class="hljs-title function_">preventDefault</span>();
  <span class="hljs-title function_">navigate</span>(link.<span class="hljs-title function_">getAttribute</span>(<span class="hljs-string">&#x27;href&#x27;</span>));
});
</code></pre></div>
<p>代码分三块。<code>navigate</code> 改地址再渲染；<code>popstate</code> 监听前进后退；最后一块拦截站内链接的点击，阻止浏览器真的跳转，改成调用 <code>navigate</code>。</p>
<p>为什么拦截点击前要判断那么多条件？因为用户按着 Ctrl 或 Cmd 点链接，是想在新标签页打开；带 <code>target</code> 或 <code>download</code> 的链接也有自己的用途；<code>defaultPrevented</code> 说明别的脚本已经处理过了。这些情况都不该拦，交给浏览器原本的行为。</p>
<p><code>replaceState</code> 的参数和 <code>pushState</code> 一样，区别是它替换当前这条记录，不新增。适合规范化查询参数这类不该多出一条历史的场景。</p>
<h2>服务器为什么要配置回退</h2>
<p>调用 <code>pushState</code> 时浏览器不会请求新地址。可之后用户刷新页面、复制链接在新窗口打开、重启浏览器恢复标签页，浏览器都会真的去请求 <code>/user/1</code>。所以服务器必须能响应所有前端路由的路径。</p>
<p>Nginx 的常见写法是先找真实文件，找不到再返回入口页：</p>
<div class="not-prose code-block"><div class="code-language">nginx</div><pre><code class="hljs language-nginx">location / {
  try_files $uri $uri/ /index.html;
}
</code></pre></div>
<p>回退以后有个副作用：服务器对任何未知路径都返回 200 和入口页。真正不存在的页面，要由前端渲染出 404 界面。还有，静态资源路径写错时，你可能拿到的是一段 HTML 而不是脚本，排查时要留意响应类型。</p>
<p>如果应用部署在子路径下，比如 <code>/app/</code>，那路由库的 base、构建工具的资源前缀都要设成同一个子路径，回退目标也要是这个子路径下的 <code>index.html</code>。托管平台不支持回退配置的话，可以改用 hash 模式。</p>
<h2>常见追问</h2>
<p><strong>为什么说 history 模式对 SEO 更友好？</strong></p>
<blockquote>
<p>每个页面有独立的真实路径，服务端渲染或预渲染时可以按路径输出不同的内容。hash 片段不会发给服务器，服务器没法据此返回不同的页面。</p>
</blockquote>
<p><strong><code>pushState</code> 的第二个参数有用吗？</strong></p>
<blockquote>
<p>它是历史遗留的标题参数，浏览器基本都忽略它，通常传空字符串。</p>
</blockquote>`};export{e as default};