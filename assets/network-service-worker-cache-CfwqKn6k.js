var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Service Worker 是浏览器在页面背后跑的一个脚本，能拦截页面的请求，自己决定从缓存还是网络返回。它的生命周期是 <code>install</code> → <code>waiting</code> → <code>activate</code>。发了新版本，新 Worker 装好后会停在 waiting，只要还有页面被旧 Worker 控制，它就一直等。这期间用户看到的还是旧版本。</p>
<p>更新检测本身也有坑。浏览器会逐字节比对 <code>sw.js</code>。<code>updateViaCache</code> 默认是 <code>imports</code>，意思是 <code>sw.js</code> 本身不走 HTTP 缓存，但 <code>importScripts()</code> 引入的脚本会走。被引入的文件不带版本号，更新就可能不生效。</p>
<p>另外，Cache Storage 和 HTTP 缓存是两套东西，清浏览器缓存清不掉 Cache Storage，必须在代码里删。常规做法是缓存名带版本号，在 <code>activate</code> 时删掉其他版本；HTML 走网络优先，带哈希的静态资源走缓存优先。</p>
<p><code>skipWaiting()</code> 能让新 Worker 立刻生效，但已经打开的旧页面可能会用新 Worker 去请求已经被删掉的旧资源。所以更稳妥的是提示用户刷新。</p>
</blockquote>
<h2>一个不容易卡在旧版本的 sw.js</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sw.js</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">VERSION</span> = <span class="hljs-string">&#x27;v42&#x27;</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">STATIC_CACHE</span> = <span class="hljs-string">\`static-<span class="hljs-subst">\${VERSION}</span>\`</span>;
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">PRECACHE</span> = [<span class="hljs-string">&#x27;/&#x27;</span>, <span class="hljs-string">&#x27;/assets/app.3f9a1c.js&#x27;</span>, <span class="hljs-string">&#x27;/assets/app.8b2e.css&#x27;</span>];

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;install&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">waitUntil</span>(caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">STATIC_CACHE</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">cache</span>) =&gt;</span> cache.<span class="hljs-title function_">addAll</span>(<span class="hljs-variable constant_">PRECACHE</span>)));
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;activate&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">waitUntil</span>(
    caches.<span class="hljs-title function_">keys</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">keys</span>) =&gt;</span>
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(keys.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> key !== <span class="hljs-variable constant_">STATIC_CACHE</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">key</span>) =&gt;</span> caches.<span class="hljs-title function_">delete</span>(key))),
    ),
  );
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { request } = event;
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(request.<span class="hljs-property">url</span>);
  <span class="hljs-keyword">if</span> (request.<span class="hljs-property">method</span> !== <span class="hljs-string">&#x27;GET&#x27;</span> || url.<span class="hljs-property">origin</span> !== <span class="hljs-variable language_">self</span>.<span class="hljs-property">location</span>.<span class="hljs-property">origin</span>) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">if</span> (request.<span class="hljs-property">mode</span> === <span class="hljs-string">&#x27;navigate&#x27;</span>) {
    <span class="hljs-comment">// HTML：网络优先，离线时回退缓存</span>
    event.<span class="hljs-title function_">respondWith</span>(<span class="hljs-title function_">fetch</span>(request).<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> caches.<span class="hljs-title function_">match</span>(<span class="hljs-string">&#x27;/&#x27;</span>)));
    <span class="hljs-keyword">return</span>;
  }

  <span class="hljs-keyword">if</span> (url.<span class="hljs-property">pathname</span>.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;/assets/&#x27;</span>)) {
    event.<span class="hljs-title function_">respondWith</span>(caches.<span class="hljs-title function_">match</span>(request).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">hit</span>) =&gt;</span> hit ?? <span class="hljs-title function_">fetch</span>(request)));
  }
});

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span> === <span class="hljs-string">&#x27;SKIP_WAITING&#x27;</span>) <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">skipWaiting</span>();
});
</code></pre></div>
<p>每次发版改 <code>VERSION</code>，缓存名就变了。<code>install</code> 时把新资源存进新缓存，<code>activate</code> 时把名字不是当前版本的缓存全删掉。如果缓存名一直不变，旧文件就会永远留在里面。</p>
<p><code>fetch</code> 里分了两种策略。页面导航是网络优先，有网就拿最新的 HTML，断网才用缓存。<code>/assets/</code> 下的文件名带哈希，内容不会变，所以缓存优先。</p>
<p>还要注意，它只拦截同源的 GET 请求和明确的静态目录，接口请求一律交给网络，免得把个人数据存进 Cache Storage。</p>
<h2>怎么提示用户更新</h2>
<p>页面这边监听新 Worker 的状态，装好了就弹个提示：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> registration = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-title function_">register</span>(<span class="hljs-string">&#x27;/sw.js&#x27;</span>);

registration.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;updatefound&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> worker = registration.<span class="hljs-property">installing</span>;
  worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;statechange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (worker.<span class="hljs-property">state</span> === <span class="hljs-string">&#x27;installed&#x27;</span> &amp;&amp; navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-property">controller</span>) {
      <span class="hljs-title function_">showUpdateBanner</span>(<span class="hljs-function">() =&gt;</span> worker.<span class="hljs-title function_">postMessage</span>(<span class="hljs-string">&#x27;SKIP_WAITING&#x27;</span>));
    }
  });
});

<span class="hljs-keyword">let</span> refreshing = <span class="hljs-literal">false</span>;
navigator.<span class="hljs-property">serviceWorker</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;controllerchange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (refreshing) <span class="hljs-keyword">return</span>;
  refreshing = <span class="hljs-literal">true</span>;
  location.<span class="hljs-title function_">reload</span>();
});
</code></pre></div>
<p>为什么要判断 <code>navigator.serviceWorker.controller</code>？因为它存在，说明当前页面已经被一个旧 Worker 控制，这次是更新；不存在就是第一次安装，没必要提示。</p>
<p>用户点了更新，页面给新 Worker 发 <code>SKIP_WAITING</code>，新 Worker 调 <code>skipWaiting()</code> 立刻接管。接管时触发 <code>controllerchange</code>，页面就刷新一次。<code>refreshing</code> 这个标记是防止重复刷新。</p>
<h2>出了问题怎么排查</h2>
<p>在 DevTools 的 Application → Service Workers 里，可以看到新 Worker 是不是停在 waiting。调试时可以勾选 Update on reload。</p>
<p>在 Application → Cache Storage 里，确认旧版本的缓存有没有被删掉。</p>
<p>线上出了大问题需要紧急下线时，可以部署一个只做清理和 <code>registration.unregister()</code> 的 <code>sw.js</code>，或者返回 <code>Clear-Site-Data: &quot;storage&quot;</code> 响应头。</p>
<h2>常见追问</h2>
<p><strong>Workbox 解决了什么？</strong></p>
<blockquote>
<p>它把预缓存清单、版本化和缓存策略这些模板代码封装好了，原理和上面一样。</p>
</blockquote>
<p><strong>PWA 还有哪些能力？</strong></p>
<blockquote>
<p>见<a href="/questions/mobile-pwa/">《PWA 由哪些能力组成，是否所有浏览器体验都一致？》</a>。</p>
</blockquote>`};export{e as default};