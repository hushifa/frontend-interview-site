var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>单页应用发版以后，用户一直开着的那个标签页还在跑旧代码。比如后台管理系统，用户早上打开，下午才刷新，中间修的 bug 他都看不到。所以要让页面自己发现“服务器上已经是新版本了”，然后提示用户刷新。</p>
<p>常见做法是构建时生成一个 <code>version.json</code>，里面写版本号或构建时间。页面每隔几分钟请求一次，再在用户切回这个标签页时（<code>visibilitychange</code>）检查一次，版本号和自己启动时的不一样，就弹出“有新版本，点击刷新”。请求时用 <code>cache: &#x27;no-cache&#x27;</code>，让浏览器每次都向服务器确认，服务器配好 <code>ETag</code> 时没变化只回 304。</p>
<p>用了 Service Worker 的站点，可以不另做轮询。浏览器发现新的 <code>sw.js</code> 会安装它，新版本装好后停在 waiting 状态，页面监听到这一点就提示刷新，用户点了再让它激活。</p>
<p>还要准备兜底。用户没刷新就点开一个懒加载页面，请求的是旧的 chunk，如果部署时已经删掉了，就会加载失败。Vite 这时会派发 <code>vite:preloadError</code> 事件，可以在里面刷新页面。另外 HTML 要设 <code>Cache-Control: no-cache</code>，否则刷新后拿到的还是引用旧资源的页面。</p>
</blockquote>
<h2>为什么用户会一直停在旧版本</h2>
<p>构建工具会给 JS 和 CSS 文件名加上内容哈希，每次构建都会换名字，HTML 里引用的是新名字。可是单页应用只在第一次打开时加载 HTML，之后切换页面都不重新请求它，所以已经打开的标签页手里一直是旧的 HTML 和旧的 JS。</p>
<p>这会带来两类问题。一类是用户看不到修复，接口改了字段，旧代码还按老格式解析。另一类是懒加载失败：旧代码要加载的 chunk 文件名是旧的，部署时如果删了旧文件，就会 404，静态资源要保留多久见<a href="/questions/git-static-deploy/">《静态托管发布时为什么要检查资源路径和缓存？》</a>。</p>
<h2>怎样轮询 version.json</h2>
<p>构建时往产物里写一个文件，内容只要能区分版本就行，比如提交哈希或构建时间：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{ &quot;version&quot;: &quot;2026.10.30-1a2b3c&quot; }
</code></pre></div>
<p>页面启动时先记下当前版本，之后定时请求，再在标签页回到前台时补一次检查：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CHECK_INTERVAL</span> = <span class="hljs-number">5</span> * <span class="hljs-number">60</span> * <span class="hljs-number">1000</span>;
<span class="hljs-keyword">let</span> currentVersion = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">let</span> notified = <span class="hljs-literal">false</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fetchVersion</span>(<span class="hljs-params"></span>) {
  <span class="hljs-comment">// no-cache 会带上条件请求头去服务器确认，内容没变时服务器可回 304。</span>
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/version.json&#x27;</span>, { <span class="hljs-attr">cache</span>: <span class="hljs-string">&#x27;no-cache&#x27;</span> });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  <span class="hljs-keyword">return</span> data.<span class="hljs-property">version</span>;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">checkForUpdate</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (notified) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> latest = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchVersion</span>().<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-literal">null</span>);
  <span class="hljs-keyword">if</span> (!latest) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (currentVersion === <span class="hljs-literal">null</span>) {
    currentVersion = latest;
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (latest !== currentVersion) {
    notified = <span class="hljs-literal">true</span>;
    <span class="hljs-title function_">showUpdateBanner</span>(); <span class="hljs-comment">// 提示“有新版本”，用户点击后 location.reload()</span>
  }
}

<span class="hljs-title function_">checkForUpdate</span>();
<span class="hljs-built_in">setInterval</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;visible&#x27;</span>) <span class="hljs-title function_">checkForUpdate</span>();
}, <span class="hljs-variable constant_">CHECK_INTERVAL</span>);
<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;visible&#x27;</span>) <span class="hljs-title function_">checkForUpdate</span>();
});
</code></pre></div>
<p>为什么用 <code>cache: &#x27;no-cache&#x27;</code>？按 MDN 的说明，这个模式下浏览器即使缓存里有这个文件，也会先向服务器发条件请求确认；服务器说没变就用缓存，变了就下载新的。所以既不会读到过期的版本号，没变化时也只有一个很小的 304 响应。也可以在服务器上给 <code>version.json</code> 设 <code>Cache-Control: no-cache</code>，效果一样。</p>
<p>为什么定时器里还要判断 <code>visibilityState</code>？后台标签页没人在看，检查了也没用。用户切回来时会触发 <code>visibilitychange</code>，这时检查一次正好赶上用户回来的时机，所以后台期间可以跳过。</p>
<p>为什么是提示而不是直接刷新？用户可能正在填表单，直接刷新会把输入丢掉。所以先提示，让用户在合适的时候自己点；只有在确定没有未保存内容的时候，比如路由切换的瞬间，才适合自动刷新。</p>
<p>如果不想单独生成文件，也可以直接对 <code>index.html</code> 发请求，比较响应头里的 <code>ETag</code> 或 <code>Last-Modified</code>。前提是托管服务确实会在内容变化时换掉这些值，不同服务的行为不一样，部署后要实际看一下响应头。</p>
<h2>用了 Service Worker 时怎么做</h2>
<p>有 Service Worker 的站点，更新检测由浏览器负责：导航到作用域内的页面、或者调用 <code>registration.update()</code> 时，浏览器会重新获取 <code>sw.js</code>，内容和当前版本逐字节不同就安装新版本。新版本装好后进入 waiting 状态，页面这时提示用户刷新，用户点击后再让它 <code>skipWaiting()</code> 并重新加载。</p>
<p>所以这种站点不用另做 <code>version.json</code>，把上面定时器里的 <code>checkForUpdate()</code> 换成 <code>registration.update()</code> 就行。完整的提示流程和新旧资源混用的问题见<a href="/questions/mobile-serviceworker/">《Service Worker 的安装、激活与缓存更新有哪些坑？》</a>。</p>
<h2>旧 chunk 加载失败时怎样兜底</h2>
<p>不管检测做得多及时，总有用户在提示出现之前点开了懒加载页面。Vite 在动态导入加载失败时会在 <code>window</code> 上派发 <code>vite:preloadError</code> 事件，官方文档的示例是在里面刷新页面：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;vite:preloadError&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-comment">// 调用 preventDefault 后，原始的加载错误就不会再抛出。</span>
  event.<span class="hljs-title function_">preventDefault</span>();
  <span class="hljs-keyword">const</span> key = <span class="hljs-string">&#x27;reloaded-for-chunk-error&#x27;</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">sessionStorage</span>.<span class="hljs-title function_">getItem</span>(key)) <span class="hljs-keyword">return</span>;
  <span class="hljs-variable language_">sessionStorage</span>.<span class="hljs-title function_">setItem</span>(key, <span class="hljs-string">&#x27;1&#x27;</span>);
  <span class="hljs-variable language_">window</span>.<span class="hljs-property">location</span>.<span class="hljs-title function_">reload</span>();
});
</code></pre></div>
<p>为什么要用 <code>sessionStorage</code> 记一下？如果刷新后 chunk 还是加载失败，比如是网络问题而不是版本问题，不加限制会一直刷新。记一个标记，同一个会话里只自动刷新一次，再失败就交给页面的错误提示。</p>
<p>刷新能解决问题有一个前提：HTML 不能被缓存住。Vite 文档特别提到，HTML 要设 <code>Cache-Control: no-cache</code>，否则刷新以后拿到的还是引用旧资源的 HTML。动态导入本身的写法见<a href="/questions/engineering-lazy/">《代码分割与懒加载适合哪些场景？》</a>。</p>
<h2>常见追问</h2>
<p><strong><code>cache: &#x27;no-cache&#x27;</code> 和 <code>cache: &#x27;no-store&#x27;</code> 选哪个？</strong></p>
<blockquote>
<p>都能拿到最新版本号。<code>no-cache</code> 会先查缓存，再向服务器发条件请求确认，没变化时服务器回 304，用缓存里的内容；<code>no-store</code> 完全不看缓存，每次都完整下载，也不写回缓存。<code>version.json</code> 很小，两者差别不大，<code>no-cache</code> 在服务器支持 <code>ETag</code> 时更省流量。</p>
</blockquote>
<p><strong>为什么不用 WebSocket 推送新版本？</strong></p>
<blockquote>
<p>可以，发版系统在部署完成后推一条消息，页面实时收到。可是这要额外维护一个长连接服务，对纯静态托管的站点不划算。版本检测不需要秒级实时，轮询一个小文件已经够用。</p>
</blockquote>
<p><strong>检测到新版本后能不能静默刷新？</strong></p>
<blockquote>
<p>可以在不打扰用户的时机做，比如下一次路由切换时用 <code>location.href</code> 整页跳转代替前端路由跳转，这样用户感觉只是正常换了页。不要在用户填写表单、播放视频的时候直接刷新。</p>
</blockquote>`};export{e as default};