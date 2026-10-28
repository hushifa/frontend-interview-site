var e={answerHtml:`<h2>简答</h2>
<ul>
<li>生命周期是 注册 → 安装（install）→ 等待（waiting）→ 激活（activate）→ 控制页面；首次注册的页面默认不受控，刷新后才被控制。</li>
<li>新版本安装完成后会等待，直到所有使用旧版本的页面关闭才激活；这是保护机制，避免同一页面中途换了缓存逻辑。</li>
<li><code>skipWaiting()</code> 让新版本立即激活，<code>clients.claim()</code> 让它立即控制已打开的页面，但可能导致旧页面加载到新版本的资源。</li>
<li>在 activate 阶段删除旧版本的缓存，缓存名带版本号便于区分。</li>
<li><code>updateViaCache</code> 默认是 <code>&#x27;imports&#x27;</code>：检查更新时主脚本绕过 HTTP 缓存，<code>importScripts()</code> 引入的脚本仍走缓存，所以被导入的脚本要带版本号。</li>
</ul>
<h2>生命周期示例</h2>
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
<ul>
<li><code>install</code> 中预缓存失败（任何一个文件 404），整个安装失败，旧版本继续工作。</li>
<li><code>activate</code> 时删除其他版本的缓存。</li>
<li>非 GET 请求直接交给网络，不缓存。</li>
</ul>
<h2>更新流程</h2>
<p>浏览器在作用域内的页面导航时检查 Service Worker 脚本是否有变化（逐字节比较）；距上次检查超过 24 小时后，<code>push</code>、<code>sync</code> 等功能性事件也会触发检查；页面还可以调用 <code>registration.update()</code> 主动检查。有变化就安装新版本。新版本进入 waiting 状态，旧页面继续由旧版本控制。</p>
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
<ul>
<li><code>navigator.serviceWorker.controller</code> 存在说明这是更新而不是首次安装。</li>
<li>用户点击&quot;刷新&quot;后新版本才激活，激活后页面重新加载，避免新旧资源混用。</li>
<li><code>reloaded</code> 标记防止重复刷新。</li>
</ul>
<h2>常见坑</h2>
<table><thead><tr><th>问题</th><th>原因</th><th>处理</th></tr></thead><tbody><tr><td>改了代码用户一直看到旧版</td><td>新版本在等待，或 <code>index.html</code> 被缓存优先策略返回</td><td>提示刷新；HTML 用网络优先</td></tr><tr><td>直接 <code>skipWaiting</code> 后页面报错</td><td>旧页面请求的旧 chunk 已被删除缓存</td><td>激活后刷新页面，或保留旧资源</td></tr><tr><td>Service Worker 不更新</td><td>改的是 <code>importScripts()</code> 引入的脚本，URL 没变；或注册时设了 <code>updateViaCache: &#x27;all&#x27;</code></td><td>被导入的脚本带版本号，主脚本保持固定 URL</td></tr><tr><td>开发时缓存干扰调试</td><td>旧 Service Worker 仍在控制</td><td>DevTools 中勾选 Update on reload 或注销</td></tr><tr><td>作用范围不对</td><td>默认作用域是脚本所在目录</td><td>把 <code>sw.js</code> 放在根目录或设置 <code>scope</code></td></tr></tbody></table>
<h2>缓存策略选择</h2>
<ul>
<li>HTML 入口：网络优先，离线时回退缓存。</li>
<li>带哈希的静态资源：缓存优先，文件名变化即视为新资源。</li>
<li>API 数据：网络优先或&quot;先返回缓存再后台更新&quot;，并按用户或租户区分。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>怎样彻底移除 Service Worker？部署一个新版本，在 activate 中删除所有缓存并调用 <code>self.registration.unregister()</code>。</li>
<li>要不要用 Workbox？它封装了预缓存清单、缓存策略和过期清理，能减少手写错误，原理仍是上面的生命周期。</li>
</ul>`};export{e as default};