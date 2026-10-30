var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Service Worker 能拦截页面发出的请求，在 <code>fetch</code> 事件里自己决定：从 Cache Storage 拿，还是去网络拿，还是两个都用。MDN 的说法是，缓存策略要在离线可用、响应速度和内容新鲜之间取舍，一个应用通常对不同资源用不同策略。</p>
<p>常用的有这几种。预缓存是在 <code>install</code> 时把应用外壳存好，适合这个版本一定要用、又不会变的文件。缓存优先是先查缓存，没有再去网络并存一份，适合文件名带哈希的 JS、CSS。网络优先是先请求网络，失败了才用缓存，适合 HTML 入口和消息列表这种要尽量新、但旧的总比没有强的内容。</p>
<p>还有一种是先返回缓存、同时在后台请求网络更新缓存，叫 stale-while-revalidate，适合响应快更重要、内容稍旧也能接受的场景。至于 POST 请求，以及商品库存这种宁可失败也不能给旧数据的接口，只走网络。</p>
<p>写的时候要注意两点：<code>Response</code> 的内容只能读一次，存进缓存前要 <code>clone()</code>；只缓存成功的响应，不要把 404、500 也存进去。</p>
</blockquote>
<h2>先看一个按资源分流的 fetch</h2>
<p>下面的 <code>fetch</code> 处理器按请求类型选策略，只处理同源的 GET 请求：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// sw.js</span>
<span class="hljs-keyword">const</span> <span class="hljs-variable constant_">CACHE</span> = <span class="hljs-string">&#x27;static-v42&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">cacheFirst</span>(<span class="hljs-params">request</span>) {
  <span class="hljs-keyword">const</span> hit = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">match</span>(request);
  <span class="hljs-keyword">if</span> (hit) <span class="hljs-keyword">return</span> hit;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(request);
    <span class="hljs-keyword">if</span> (response.<span class="hljs-property">ok</span>) {
      <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE</span>);
      cache.<span class="hljs-title function_">put</span>(request, response.<span class="hljs-title function_">clone</span>());
    }
    <span class="hljs-keyword">return</span> response;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Response</span>.<span class="hljs-title function_">error</span>();
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">networkFirst</span>(<span class="hljs-params">request</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(request);
    <span class="hljs-keyword">if</span> (response.<span class="hljs-property">ok</span>) {
      <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE</span>);
      cache.<span class="hljs-title function_">put</span>(request, response.<span class="hljs-title function_">clone</span>());
    }
    <span class="hljs-keyword">return</span> response;
  } <span class="hljs-keyword">catch</span> {
    <span class="hljs-keyword">return</span> (<span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">match</span>(request)) ?? <span class="hljs-title class_">Response</span>.<span class="hljs-title function_">error</span>();
  }
}

<span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;fetch&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> { request } = event;
  <span class="hljs-keyword">const</span> url = <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(request.<span class="hljs-property">url</span>);
  <span class="hljs-keyword">if</span> (request.<span class="hljs-property">method</span> !== <span class="hljs-string">&#x27;GET&#x27;</span> || url.<span class="hljs-property">origin</span> !== <span class="hljs-variable language_">self</span>.<span class="hljs-property">location</span>.<span class="hljs-property">origin</span>) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">if</span> (request.<span class="hljs-property">mode</span> === <span class="hljs-string">&#x27;navigate&#x27;</span>) {
    event.<span class="hljs-title function_">respondWith</span>(<span class="hljs-title function_">networkFirst</span>(request));
  } <span class="hljs-keyword">else</span> <span class="hljs-keyword">if</span> (url.<span class="hljs-property">pathname</span>.<span class="hljs-title function_">startsWith</span>(<span class="hljs-string">&#x27;/assets/&#x27;</span>)) {
    event.<span class="hljs-title function_">respondWith</span>(<span class="hljs-title function_">cacheFirst</span>(request));
  }
});
</code></pre></div>
<p>没有调用 <code>respondWith()</code> 的请求，比如接口和跨域请求，会按正常方式走网络，Service Worker 不插手。</p>
<p>为什么要 <code>response.clone()</code>？MDN 解释，<code>Response</code> 是流，只能读一次。存进缓存要读一次，返回给页面又要读一次，所以存一份副本，把原件返回。为什么判断 <code>response.ok</code>？<code>fetch</code> 遇到 404、500 也会正常完成，不判断的话，一次服务端出错就会把错误页面缓存下来，之后一直返回它。</p>
<p>缓存优先为什么还要在没命中时去网络？因为缓存可能被浏览器或用户清掉，MDN 也提到了这一点，没有网络回退的话，清过缓存后资源就加载不出来了。</p>
<h2>不同资源为什么用不同策略</h2>
<p>HTML 入口用网络优先。入口页面里写着当前版本的 JS、CSS 文件名，如果它被缓存优先返回，用户就一直拿到旧页面，新版本的资源也永远不会被请求。断网时再回退到缓存，离线也能打开。</p>
<p>带哈希的静态资源用缓存优先。文件内容一变，构建工具生成的文件名就变，新文件名相当于一个新资源，所以缓存里的旧文件永远不会被当成新内容返回，命中缓存总是对的。</p>
<p>接口数据要看业务。MDN 举的例子是，消息应用的最近消息列表适合网络优先；商品列表过时了会让用户困扰，只走网络更合适；POST 这类请求永远不应该缓存。接口里如果有用户个人数据，还要考虑同一台设备上换账号登录的情况，退出登录时要清掉相关缓存。</p>
<h2>stale-while-revalidate 怎样写</h2>
<p>这种策略先用缓存快速响应，同时不管有没有命中都去请求网络，拿到新响应后更新缓存，下次访问就是新的了：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">staleWhileRevalidate</span>(<span class="hljs-params">request</span>) {
  <span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">await</span> caches.<span class="hljs-title function_">open</span>(<span class="hljs-variable constant_">CACHE</span>);
  <span class="hljs-keyword">const</span> networkPromise = <span class="hljs-title function_">fetch</span>(request).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">response</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (response.<span class="hljs-property">ok</span>) cache.<span class="hljs-title function_">put</span>(request, response.<span class="hljs-title function_">clone</span>());
    <span class="hljs-keyword">return</span> response;
  });
  <span class="hljs-keyword">return</span> (<span class="hljs-keyword">await</span> cache.<span class="hljs-title function_">match</span>(request)) ?? networkPromise;
}
</code></pre></div>
<p>缓存更新放在 <code>then</code> 里异步完成，页面不用等网络。代价是用户这一次看到的可能是上一次的内容，所以只适合头像、配置这类稍旧也没关系的资源。</p>
<h2>预缓存放什么</h2>
<p><code>install</code> 事件里用 <code>cache.addAll()</code> 预缓存的，应该是这个版本一定会用到、而且不会变的文件，比如应用外壳的 HTML、主 JS 和 CSS。MDN 说明，只要其中一个文件缓存失败，整个安装就失败；反过来，安装成功就说明这些文件都已经在缓存里了。</p>
<p>所以预缓存清单不要放可能 404 的文件，也不要放太多，否则安装慢、容易失败。缓存名带版本号、在 <code>activate</code> 里删掉旧缓存，以及新版本怎样接管页面，见<a href="/questions/mobile-serviceworker/">《Service Worker 的安装、激活与缓存更新有哪些坑？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Service Worker 里的 fetch 会经过 HTTP 缓存吗？</strong></p>
<blockquote>
<p>会。Service Worker 里调用 <code>fetch()</code> 也是一次普通请求，同样可能命中 HTTP 缓存。所以网络优先拿到的内容旧，不一定是 Cache Storage 的问题，也要看服务端的 <code>Cache-Control</code>，见<a href="/questions/browser-cache-location/">《浏览器缓存存放在哪里？请求按什么顺序查找缓存？》</a>。</p>
</blockquote>
<p><strong>Workbox 解决了什么？</strong></p>
<blockquote>
<p>它把预缓存清单、缓存策略和过期清理这些模板代码封装好了，策略的名字也和上面这些对应。原理一样，出问题时还是按上面的思路排查。</p>
</blockquote>`};export{e as default};