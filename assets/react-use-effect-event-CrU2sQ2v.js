var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>useEffectEvent</code> 在 React 19.2 中成为稳定 API，配套的 lint 规则需要升级到最新的 <code>eslint-plugin-react-hooks</code>。</li>
<li>返回的函数每次被调用时都读取最新渲染的 props 和 state，因此不会出现过期闭包。</li>
<li>它不能也不需要写进 Effect 的依赖数组；Effect 只依赖真正决定&quot;要不要重新同步&quot;的值。</li>
<li>只能在同一个组件或 Hook 中、从 Effect 内部调用；不能传给子组件，不能在渲染期间或事件处理器中调用。</li>
<li>不要用它隐藏真正的依赖：如果某个值变化后外部连接必须重建，它就该留在依赖数组里。</li>
</ul>
<h2>典型场景</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useEffectEvent } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">ChatRoom</span>(<span class="hljs-params">{ roomId, theme }</span>) {
  <span class="hljs-keyword">const</span> onConnected = <span class="hljs-title function_">useEffectEvent</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">showNotification</span>(<span class="hljs-string">&#x27;已连接&#x27;</span>, theme);
  });

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> connection = <span class="hljs-title function_">createConnection</span>(roomId);
    connection.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;connected&#x27;</span>, onConnected);
    connection.<span class="hljs-title function_">connect</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> connection.<span class="hljs-title function_">disconnect</span>();
  }, [roomId]);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>{roomId}<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span></span>;
}
</code></pre></div>
<ul>
<li>切换 <code>roomId</code>：Effect 重新执行，断开旧房间、连接新房间。</li>
<li>切换 <code>theme</code>：Effect 不执行，不会断线；下次连接成功时通知使用新主题。</li>
</ul>
<p>在没有 <code>useEffectEvent</code> 之前，要么把 <code>theme</code> 写进依赖导致无谓重连，要么关掉 lint 规则留下过期闭包。</p>
<h2>记录日志时读取最新值</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params">{ url, cartCount }</span>) {
  <span class="hljs-keyword">const</span> onVisit = <span class="hljs-title function_">useEffectEvent</span>(<span class="hljs-function">(<span class="hljs-params">visitedUrl</span>) =&gt;</span> {
    <span class="hljs-title function_">logVisit</span>(visitedUrl, cartCount);
  });

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">onVisit</span>(url);
  }, [url]);
}
</code></pre></div>
<p>把 <code>url</code> 作为参数传入，而不是在事件函数里读取，能清楚表达&quot;这个 Effect 因 url 变化而执行&quot;。</p>
<h2>和 useCallback 的区别</h2>
<table><thead><tr><th></th><th>useCallback</th><th>useEffectEvent</th></tr></thead><tbody><tr><td>返回的函数引用</td><td>依赖不变时稳定</td><td>不保证稳定，也不应依赖其引用</td></tr><tr><td>读到的值</td><td>创建时的依赖值</td><td>调用时的最新值</td></tr><tr><td>调用位置</td><td>任意，可传给子组件</td><td>只在 Effect 内部</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>能在 <code>setInterval</code> 回调里用吗？可以，回调是在 Effect 中注册的，见<a href="/questions/react-stale-closure/">《React 中的过期闭包为什么会读到旧状态？》</a>。</li>
<li>为什么不能传给子组件？它的设计目的是给 Effect 读取最新值，作为普通回调使用会让 lint 无法判断依赖关系。</li>
</ul>`};export{e as default};