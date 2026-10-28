var e={answerHtml:`<h2>简答</h2>
<ul>
<li>生命周期是 <code>install</code> → <code>waiting</code> → <code>activate</code>。只要还有页面被旧 Worker 控制，新 Worker 就停在 waiting。</li>
<li>浏览器检查更新时会逐字节比对 <code>sw.js</code>。<code>updateViaCache</code> 默认是 <code>imports</code>：<code>sw.js</code> 本身不走 HTTP 缓存，但 <code>importScripts()</code> 引入的脚本会走，被引入的文件不带版本号时更新可能不生效。</li>
<li>Cache Storage 与 HTTP 缓存相互独立，清浏览器 HTTP 缓存不会清 Cache Storage，必须在代码里删除旧缓存。</li>
<li>缓存名带上版本号，在 <code>activate</code> 时删除其他版本；HTML 用网络优先，带哈希的静态资源用缓存优先。</li>
<li><code>skipWaiting()</code> 能立即激活，但已打开的旧页面可能用新 Worker 请求已被删除的旧资源，最好提示用户刷新。</li>
</ul>
<h2>示例</h2>
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
<p>只拦截同源的 GET 请求和明确的静态目录，接口请求交给网络，避免把个人数据存进 Cache Storage。</p>
<h2>提示用户更新</h2>
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
<p><code>navigator.serviceWorker.controller</code> 存在说明这是更新，不是首次安装。</p>
<h2>排查</h2>
<ul>
<li>DevTools Application → Service Workers：查看 waiting 状态，可勾选 Update on reload 调试。</li>
<li>Application → Cache Storage：确认旧版本缓存是否被删除。</li>
<li>紧急下线：部署一个只做清理和 <code>registration.unregister()</code> 的 <code>sw.js</code>，或返回 <code>Clear-Site-Data: &quot;storage&quot;</code>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>Workbox 解决了什么？预缓存清单、版本化和缓存策略的模板代码，原理与上面相同。</li>
<li>PWA 的安装和整体能力见《PWA 由哪些能力组成，是否所有浏览器体验都一致？》。</li>
</ul>`};export{e as default};