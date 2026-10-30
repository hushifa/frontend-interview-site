var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Service Worker 是一段在页面背后运行的脚本，能拦截页面发出的请求，决定从缓存还是从网络拿资源，离线访问就靠它。</p>
<p>它有自己的生命周期：注册、安装（install）、等待（waiting）、激活（activate），然后才控制页面。第一次注册的那个页面默认不受它控制，刷新以后才会。</p>
<p>新版本装好以后不会马上生效，要等所有用旧版本的页面都关掉才激活，这是为了避免一个页面用到一半换了缓存逻辑。想马上生效可以用 <code>skipWaiting()</code> 和 <code>clients.claim()</code>，但旧页面可能因此加载到新版本的资源，出现新旧混用。</p>
<p>还有两点要注意：在 activate 阶段删掉旧版本的缓存，缓存名带上版本号；<code>importScripts()</code> 引入的脚本默认还走 HTTP 缓存，所以它们的地址也要带版本号。</p>
</blockquote>
<h2>先看一个完整的 sw.js</h2>
<p>下面这个 Service Worker 做了三件事：安装时预缓存文件，激活时清理旧缓存，请求时先查缓存。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sw.js</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CACHE</span> = <span class="hljs-string">&#x27;app-v3&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">PRECACHE</span> = [<span class="hljs-string">&#x27;/&#x27;</span>, <span class="hljs-string">&#x27;/index.html&#x27;</span>, <span class="hljs-string">&#x27;/assets/app.3f9a.js&#x27;</span>, <span class="hljs-string">&#x27;/assets/app.8c21.css&#x27;</span>];

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;install&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">waitUntil</span>(caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">cache</span>) =&gt;</span> cache.<span class="hljs-title function_">addAll</span>(<span class="hljs-variable constant_">PRECACHE</span>)));
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;activate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">waitUntil</span>(
    caches.<span class="hljs-title function_">keys</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">keys</span>) =&gt;</span>
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(keys.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> key !== <span class="hljs-variable constant_">CACHE</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> caches.<span class="hljs-title function_">delete</span>(key))),
    ),
  );
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">request</span>.<span class="hljs-property">method</span> !== <span class="hljs-string">&#x27;GET&#x27;</span>) <span class="hljs-keyword">return</span>;
  event.<span class="hljs-title function_">respondWith</span>(caches.<span class="hljs-title function_">match</span>(event.<span class="hljs-property">request</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">hit</span>) =&gt;</span> hit ?? <span class="hljs-title function_">fetch</span>(event.<span class="hljs-property">request</span>)));
});
</code></pre></div>
<p><code>install</code> 里预缓存时，只要有一个文件失败，比如 404，整个安装就失败，旧版本继续工作。这是好事，不会装上一个残缺的版本。</p>
<p><code>activate</code> 时把名字不是 <code>app-v3</code> 的缓存都删掉，所以缓存名要带版本号，否则分不清哪个是旧的。非 GET 请求直接 <code>return</code>，交给网络，不缓存。</p>
<h2>浏览器什么时候检查更新</h2>
<p>浏览器会逐字节比较 Service Worker 脚本有没有变化。检查的时机有三种：用户在作用域内的页面导航时；距上次检查超过 24 小时后，<code>push</code>、<code>sync</code> 这类功能性事件触发时；页面主动调用 <code>registration.update()</code> 时。</p>
<p>有变化就安装新版本。可是装好的新版本会进入 waiting 状态，已经打开的页面还由旧版本控制。所以“改了代码用户还看到旧版”，多半就是新版本在等。</p>
<h2>怎样提示用户刷新</h2>
<p>常见做法是发现新版本时弹一个提示，用户点“刷新”才让新版本激活，然后重新加载页面。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面中：发现新版本时提示用户刷新</span>
<span class="hljs-keyword">const</span> reg = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-title function_">register</span>(<span class="hljs-string">&#x27;/sw.js&#x27;</span>);

reg.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;updatefound&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> worker = reg.<span class="hljs-property">installing</span>;
  worker?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;statechange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (worker.<span class="hljs-property">state</span> === <span class="hljs-string">&#x27;installed&#x27;</span> &amp;&amp; navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-property">controller</span>) {
      <span class="hljs-title function_">showUpdateBanner</span>(<span class="hljs-function">() =&gt;</span> worker.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;SKIP_WAITING&#x27;</span> }));
    }
  });
});

<span class="hljs-keyword">let</span> reloaded = <span class="hljs-literal">false</span>;
navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;controllerchange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (reloaded) <span class="hljs-keyword">return</span>;
  reloaded = <span class="hljs-literal">true</span>;
  location.<span class="hljs-title function_">reload</span>();
});
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sw.js</span>
<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span>?.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;SKIP_WAITING&#x27;</span>) <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">skipWaiting</span>();
});
</code></pre></div>
<p>为什么要判断 <code>navigator.serviceWorker.controller</code>？因为它有值，说明页面已经被旧版本控制着，这次是更新；没有值就是首次安装，不用提示。</p>
<p>用户点了刷新，页面才发消息让新版本 <code>skipWaiting()</code>。新版本接管后触发 <code>controllerchange</code>，页面重新加载，这样整个页面都换成新资源，不会新旧混用。<code>reloaded</code> 标记是防止重复刷新。</p>
<h2>常见的坑</h2>
<table><thead><tr><th>问题</th><th>原因</th><th>处理</th></tr></thead><tbody><tr><td>改了代码用户一直看到旧版</td><td>新版本在等待，或 <code>index.html</code> 被缓存优先策略返回</td><td>提示刷新；HTML 用网络优先</td></tr><tr><td>直接 <code>skipWaiting</code> 后页面报错</td><td>旧页面请求的旧 chunk 已被删除缓存</td><td>激活后刷新页面，或保留旧资源</td></tr><tr><td>Service Worker 不更新</td><td>改的是 <code>importScripts()</code> 引入的脚本，URL 没变；或注册时设了 <code>updateViaCache: &#x27;all&#x27;</code></td><td>被导入的脚本带版本号，主脚本保持固定 URL</td></tr><tr><td>开发时缓存干扰调试</td><td>旧 Service Worker 仍在控制</td><td>DevTools 中勾选 Update on reload 或注销</td></tr><tr><td>作用范围不对</td><td>默认作用域是脚本所在目录</td><td>把 <code>sw.js</code> 放在根目录或设置 <code>scope</code></td></tr></tbody></table>
<p>第三行要多说一句。注册时有个 <code>updateViaCache</code> 选项，默认值是 <code>&#x27;imports&#x27;</code>，意思是检查更新时主脚本绕过 HTTP 缓存，但 <code>importScripts()</code> 引入的脚本还走缓存。所以只改了被导入的脚本、地址又没变，浏览器可能发现不了更新。</p>
<h2>出了问题怎么排查</h2>
<p>在 DevTools 的 Application → Service Workers 里，可以看到新版本是不是停在 waiting；Application → Cache Storage 里，可以确认旧版本的缓存有没有被删掉。</p>
<p>上面的 <code>fetch</code> 处理器为了突出生命周期，对所有 GET 请求都用了缓存优先。真实项目里 HTML 入口要用网络优先，否则入口被缓存住，新版本永远加载不到。各类资源分别用什么策略，见<a href="/questions/network-service-worker-cache/">《Service Worker 有哪些缓存策略？HTML、静态资源和接口分别怎么缓存？》</a>。</p>
<h2>常见追问</h2>
<p><strong>怎样彻底移除 Service Worker？</strong></p>
<blockquote>
<p>部署一个新版本，在 activate 里删掉所有缓存，并调用 <code>self.registration.unregister()</code>。也可以让服务端返回 <code>Clear-Site-Data: &quot;storage&quot;</code> 响应头，MDN 列出它会注销这个源的 Service Worker 注册，但没有明确列出 Cache Storage，所以清缓存仍建议在代码里用 <code>caches.delete()</code> 做，并在目标浏览器里确认。</p>
</blockquote>
<p><strong>要不要用 Workbox？</strong></p>
<blockquote>
<p>可以。它封装了预缓存清单、缓存策略和过期清理，能少写错。但原理还是上面这套生命周期，出问题时还得按生命周期去排查。</p>
</blockquote>`};export{e as default};