var e={answerHtml:`<h2>简答</h2>
<ul>
<li>hash 路由：地址形如 <code>/#/user/1</code>。<code>#</code> 后面的片段不会随请求发给服务器，修改 <code>location.hash</code> 不会刷新页面，值变化时触发 <code>hashchange</code> 事件。</li>
<li>history 路由：<code>history.pushState(state, &#x27;&#x27;, url)</code> 修改地址栏并新增历史记录，浏览器不会加载该地址，也不会触发 <code>popstate</code>，路由库要在调用后自己渲染新页面。</li>
<li><code>popstate</code> 在用户前进、后退等切换历史记录时触发，路由库监听它来同步界面。<code>pushState</code> 的地址必须与当前页面同源。</li>
<li>history 模式下刷新或直接打开 <code>/user/1</code> 时，浏览器会真正请求这个路径。静态服务器上没有对应文件，需要配置为返回 <code>index.html</code>，由前端路由处理。</li>
</ul>
<p>路由要管理的数据、深链接和权限边界见<a href="/questions/state-router/">《前端路由除切换组件外还需要管理什么？》</a>，本题只讲两种模式怎样手写，以及服务器怎样配置回退。</p>
<h2>hash 路由</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">renderByHash</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> path = location.<span class="hljs-property">hash</span>.<span class="hljs-title function_">slice</span>(<span class="hljs-number">1</span>) || <span class="hljs-string">&#x27;/&#x27;</span>;
  <span class="hljs-title function_">render</span>(path);
}

<span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;hashchange&#x27;</span>, renderByHash);
<span class="hljs-title function_">renderByHash</span>();

<span class="hljs-comment">// 跳转</span>
location.<span class="hljs-property">hash</span> = <span class="hljs-string">&#x27;/user/1&#x27;</span>;
</code></pre></div>
<p>给 <code>location.hash</code> 赋与当前相同的值不会触发 <code>hashchange</code>。hash 模式不依赖服务器配置，代价是地址带 <code>#</code>，并且与页内锚点共用片段。</p>
<h2>history 路由</h2>
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
<p><code>replaceState</code> 参数相同，只是替换当前记录，适合规范化查询参数这类不应产生新历史的场景。</p>
<h2>服务器回退</h2>
<p>浏览器调用 <code>pushState</code> 时不请求新地址，但之后刷新、复制链接打开或重启浏览器恢复标签页时都会请求它。服务器必须能响应所有前端路由路径。</p>
<p>Nginx 的常见写法是先找真实文件，找不到再返回入口页：</p>
<div class="not-prose code-block"><div class="code-language">nginx</div><pre><code class="hljs language-nginx">location / {
  try_files $uri $uri/ /index.html;
}
</code></pre></div>
<p>回退之后服务器对任何未知路径都返回 200 和入口页，真正不存在的页面要由前端渲染 404 界面。静态资源路径写错时也可能拿到 HTML 而不是脚本，排查时注意响应类型。</p>
<p>部署在子路径（例如 <code>/app/</code>）时，路由库的 base 和构建工具的资源前缀都要设成同一个子路径，回退目标也要是该子路径下的 <code>index.html</code>。不支持回退配置的托管平台上，可以改用 hash 模式。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 history 模式对 SEO 更友好？每个页面有独立的真实路径，服务端渲染或预渲染时可以按路径输出不同内容；hash 片段不发给服务器，无法据此返回不同页面。</li>
<li><code>pushState</code> 的第二个参数有用吗？它是历史遗留的标题参数，浏览器基本忽略，通常传空字符串。</li>
</ul>`};export{e as default};