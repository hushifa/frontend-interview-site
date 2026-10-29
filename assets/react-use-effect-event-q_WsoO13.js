var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写 Effect 时常碰到一种两难：某个值 Effect 里要用，写进依赖它一变 Effect 就重跑；不写进依赖，又读到旧值。<code>useEffectEvent</code> 就是为这种情况准备的，它在 React 19.2 中成为稳定 API。</p>
<p>它返回一个函数，这个函数每次被调用时，读到的都是最新一次渲染的 props 和 state，所以不会有过期闭包。而且它不能也不需要写进依赖数组，Effect 只依赖真正决定“要不要重新同步”的值。</p>
<p>典型例子是聊天室：房间变了要重连，主题变了只需要下次通知时用新颜色，不该断线重连。</p>
<p>要注意，它只能在同一个组件或 Hook 里、从 Effect 内部调用，不能传给子组件，不能在渲染时或事件处理器里调用。也别拿它藏真正的依赖，某个值变了外部连接必须重建，它就该留在依赖数组里。配套的 lint 规则需要升级到最新的 <code>eslint-plugin-react-hooks</code>。</p>
</blockquote>
<h2>先看聊天室的例子</h2>
<p>连接成功时要弹一个通知，通知的样式跟着主题走：</p>
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
<p>切换 <code>roomId</code> 时，依赖变了，Effect 重新执行，断开旧房间、连上新房间。切换 <code>theme</code> 时，Effect 不执行，连接不会断；等下次连接成功，<code>onConnected</code> 读到的是最新的 <code>theme</code>。</p>
<p>没有 <code>useEffectEvent</code> 之前只能二选一：要么把 <code>theme</code> 写进依赖，换个主题就断线重连；要么关掉 lint 规则不写，结果通知一直用旧主题。</p>
<h2>为什么它能读到最新值又不用当依赖</h2>
<p>依赖数组的意思是“这些值变了要重新同步”。<code>theme</code> 变了不需要重连，所以它本来就不该是这个 Effect 的依赖，只是 Effect 里恰好要读它。</p>
<p><code>useEffectEvent</code> 把“读 <code>theme</code>”这部分逻辑分离出去，变成一个事件。事件是被调用时才去读值的，所以总能拿到最新的。Effect 本身就只剩下跟 <code>roomId</code> 有关的同步逻辑。</p>
<h2>记录访问日志</h2>
<p>另一个常见场景是 URL 变了要记日志，日志里顺便带上购物车数量，但购物车数量变了不该再记一次：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params">{ url, cartCount }</span>) {
  <span class="hljs-keyword">const</span> onVisit = <span class="hljs-title function_">useEffectEvent</span>(<span class="hljs-function">(<span class="hljs-params">visitedUrl</span>) =&gt;</span> {
    <span class="hljs-title function_">logVisit</span>(visitedUrl, cartCount);
  });

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">onVisit</span>(url);
  }, [url]);
}
</code></pre></div>
<p>为什么把 <code>url</code> 当参数传进去，而不是在 <code>onVisit</code> 里直接读？因为这样读代码的人一眼就能看出：这个 Effect 是因为 <code>url</code> 变化才执行的，<code>url</code> 是触发原因，<code>cartCount</code> 只是顺带读一下。</p>
<h2>和 useCallback 有什么区别</h2>
<p>两者都返回函数，但用途不同。<code>useCallback</code> 返回的函数在依赖不变时引用稳定，读到的是创建时的依赖值，可以在任何地方调用、传给子组件。<code>useEffectEvent</code> 返回的函数不保证引用稳定，你也不该依赖它的引用；它读到的是调用时的最新值；只能在 Effect 内部调用。</p>
<h2>常见追问</h2>
<p><strong>能在 <code>setInterval</code> 回调里用吗？</strong></p>
<blockquote>
<p>可以，因为回调是在 Effect 里注册的，调用也发生在 Effect 建立的定时器里。例子见<a href="/questions/react-stale-closure/">《React 中的过期闭包为什么会读到旧状态？》</a>。</p>
</blockquote>
<p><strong>为什么不能传给子组件？</strong></p>
<blockquote>
<p>它的设计目的就是给 Effect 读最新值。如果当成普通回调到处传，lint 就没法判断依赖关系，规则也就失去了意义。</p>
</blockquote>`};export{e as default};