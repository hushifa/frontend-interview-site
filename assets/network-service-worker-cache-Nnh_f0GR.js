var e={answerHtml:`<p>“服务器文件已经更新，用户怎么还看到旧页面？”使用 Service Worker 后，这个问题往往不只有一个缓存原因。服务器可能已发布 v2，但浏览器还在运行控制旧页面的 v1 Worker，v1 又从自己管理的 Cache Storage 里返回旧文件。</p>
<p>理解更新过程，要同时看三样东西：当前文档已经加载了哪个版本、谁是这个文档的 controller，以及这个 Worker 从哪个缓存取数据。下载了新 Worker，并不意味着这三项同时切换。</p>
<h2>新 Worker 安装成功，为什么还在 waiting</h2>
<p>一个常见的更新过程是：</p>
<ol>
<li>用户页面由 v1 Worker 控制，页面中的 JavaScript 也是 v1。</li>
<li>浏览器检查更新，发现 Worker 脚本有新内容，开始安装 v2。</li>
<li>v2 的 <code>install</code> 完成，例如已准备好自己的静态资源缓存。</li>
<li>只要旧 Worker 仍控制着相应客户端，新 Worker 通常会等待，状态为 waiting。</li>
<li>等旧版本不再需要控制这些客户端，v2 才能激活，并在相应生命周期条件下接管后续请求。</li>
</ol>
<p>默认等待机制有意义：它尽量避免已运行的旧页面突然遇到不兼容的新资源处理逻辑。普通刷新时，旧文档和新文档的生命周期可能有衔接，所以不能承诺刷新一次就一定让 waiting Worker 激活；其他标签页仍开着也会影响更新。</p>
<p>首次注册时没有旧 Worker，安装后的 Worker 可以直接进入激活流程，但触发注册的已有页面默认也不一定立即受它控制，通常要后续导航。<code>navigator.serviceWorker.ready</code> 表示存在激活的注册，不等于当前页面的 <code>controller</code> 必然已切换。</p>
<h2>HTTP 缓存和 Cache Storage 不是同一个缓存</h2>
<p>浏览器 HTTP 缓存由请求与响应的缓存语义驱动；Cache Storage 则由应用通过 <code>caches.open()</code>、<code>cache.put()</code>、<code>cache.match()</code> 等接口管理。</p>
<p>Cache Storage 不会因为响应写了 <code>max-age=60</code> 就自动在六十秒后删除，也不会替你的代码实现“过期后请求网络”。应用显式存储和读取响应时，要自己确定哪些内容允许缓存、怎样失效、何时清理。平台存储配额和回收机制又可能让它提前消失，因此也不能保证缓存永久存在。</p>
<p>常见问题是 Worker 永远使用 <code>cache-first</code> 读取 <code>/index.html</code>：每次都命中同一份 HTML，根本没有机会得到新的资源地址。另一个问题是版本名一直不变，新旧 Worker 都写 <code>static-cache</code>，容易互相覆盖内容。</p>
<p>带内容哈希的 JS/CSS 更适合长期按版本缓存；入口 HTML 通常需要单独的更新策略。API 响应还涉及登录态、权限与数据时效，不能把所有 GET 都自动放入长期公共缓存。</p>
<h2>一个范围明确的静态资源缓存示例</h2>
<p>下面是独立 <code>/sw.js</code> 的示例，假定两份资源已随本次构建发布。它只缓存列出的静态文件，沿用默认更新等待机制，不主动抢占当前页面。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CACHE_PREFIX</span> = <span class="hljs-string">&#x27;interview-static-&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CACHE_NAME</span> = <span class="hljs-string">\`<span class="hljs-subst">\${CACHE_PREFIX}</span>v2\`</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">ASSET_URLS</span> = [
  <span class="hljs-string">&#x27;/assets/app.a1b2.js&#x27;</span>,
  <span class="hljs-string">&#x27;/assets/app.c3d4.css&#x27;</span>,
].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">path</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(path, <span class="hljs-variable language_">self</span>.<span class="hljs-property">location</span>.<span class="hljs-property">origin</span>).<span class="hljs-property">href</span>);

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;install&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">waitUntil</span>((<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE_NAME</span>);
    <span class="hljs-comment">// 安装时重新取回构建资源，避免从旧 HTTP 缓存准备本次版本。</span>
    <span class="hljs-keyword">const</span> requests = <span class="hljs-variable constant_">ASSET_URLS</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">url</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Request</span>(url, { <span class="hljs-attr">cache</span>: <span class="hljs-string">&#x27;reload&#x27;</span> }));
    <span class="hljs-keyword">await</span> cache.<span class="hljs-title function_">addAll</span>(requests);
  })());
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;activate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">waitUntil</span>((<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">const</span> names = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">keys</span>();
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(
      names
        .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">name</span>) =&gt;</span> name.<span class="hljs-title function_">startsWith</span>(<span class="hljs-variable constant_">CACHE_PREFIX</span>) &amp;&amp; name !== <span class="hljs-variable constant_">CACHE_NAME</span>)
        .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">name</span>) =&gt;</span> caches.<span class="hljs-title function_">delete</span>(name)),
    );
  })());
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> request = event.<span class="hljs-property">request</span>;
  <span class="hljs-keyword">if</span> (request.<span class="hljs-property">method</span> !== <span class="hljs-string">&#x27;GET&#x27;</span> || !<span class="hljs-variable constant_">ASSET_URLS</span>.<span class="hljs-title function_">includes</span>(request.<span class="hljs-property">url</span>)) <span class="hljs-keyword">return</span>;

  event.<span class="hljs-title function_">respondWith</span>((<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE_NAME</span>);
    <span class="hljs-keyword">const</span> cached = <span class="hljs-keyword">await</span> cache.<span class="hljs-title function_">match</span>(request);
    <span class="hljs-keyword">return</span> cached ?? <span class="hljs-title function_">fetch</span>(request);
  })());
});
</code></pre></div>
<p><code>event.waitUntil()</code> 让安装和激活等待相应 Promise。预缓存失败会使这次安装失败，避免把“关键文件尚未准备好”的 Worker 当成已安装版本，但不代表失败过程创建的所有存储都自动回滚。</p>
<p><code>respondWith()</code> 在事件处理过程中及时调用，把选出的响应交给浏览器。只有完整匹配清单的 GET 才被这里接管；HTML、接口和其他查询参数的资源走默认网络流程。缓存被清理时，它会尝试网络，离线且缓存也不存在时仍会失败，不应声称这个示例已经提供完整离线能力。</p>
<p>清理只删除本应用约定前缀的旧缓存，不删除同源其他应用的缓存。版本名和资源清单应随发布一起更新，真实项目通常由构建工具生成；一份缓存必须对应明确版本，不能用同一个名字不断写入不兼容内容。</p>
<h2>skipWaiting 和 clients.claim 并不是“自动安全更新”</h2>
<p><code>self.skipWaiting()</code> 请求新 Worker 不再等待旧客户端退出，尽快进入激活；<code>self.clients.claim()</code> 则让已激活 Worker 接管作用域内符合条件的现有客户端。原生 API 是 <code>clients.claim()</code>，部分工具库提供的 <code>clientsClaim()</code> 是封装函数，不能当作原生全局接口直接使用。</p>
<p>它们影响控制关系，不会重启页面中已经执行的 JavaScript。旧页面还在运行 v1 逻辑时，接下来的请求可能已交给 v2 Worker；如果 v2 激活后还立即删除 v1 缓存，旧页面的动态 import 就可能找不到对应资源。</p>
<p>实际可以在发现 waiting Worker 后提示“新版本已准备好”，让用户保存输入、确认刷新，再协调激活与重新加载。多标签页还需要兼顾其他页面，不能认为当前页面点了更新，就证明所有旧客户端已经安全退出。</p>
<p>如果业务必须无提示更新，就需要新旧协议兼容、明确资源可用窗口和版本策略。不能只调用两个 API 就宣称完成无感更新。</p>
<h2>删除旧发布文件也会影响已打开的页面</h2>
<p>服务器只保留最新构建文件时，已打开的旧页面可能仍引用旧哈希资源。它们如果尚未下载，之后的懒加载会得到 404；这是部署与页面生命周期的问题，即使不用 Service Worker 也会发生。</p>
<p>项目可以选择直接同步最新产物，再提供新版本提示和资源加载失败后的刷新恢复；也可以在有明确需求时采用版本窗口。选择哪种策略应结合项目要求，不能让缓存代码自行假设历史资源永远存在。</p>
<p>回滚也同样需要一份可用且配套的 Worker、资源清单和文件，而不是只把页面标题改回旧版本。</p>
<h2>排查时先找到真正返回旧内容的那一层</h2>
<p>开发者工具中可以依次检查当前页面的 controller、注册的 installing/waiting/active 状态，以及 Cache Storage 中有哪些版本。Network 若显示 <code>from ServiceWorker</code>，还要继续看 Worker 内部到底读了缓存还是请求网络，不能据此断定所有正文都来自离线缓存。</p>
<p>再检查 Worker 脚本是否真的变化、其更新请求与导入脚本是否受缓存策略影响、CDN 是否返回了旧文件，以及资源清单与当前发布是否对应。</p>
<p>“Disable cache”通常针对 HTTP 缓存，不能等同于删除 Cache Storage 或卸载 Worker。开发环境手动 unregister、清空存储可以帮助定位，但不应当成要求所有真实用户执行的更新方案。</p>`};export{e as default};