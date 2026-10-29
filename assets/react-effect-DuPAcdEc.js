var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件显示出来以后，有时要跟 React 之外的东西对接，比如连上聊天服务器、开一个定时器、订阅窗口事件。<code>useEffect</code> 就是用来做这种同步的。</p>
<p>依赖数组要写上 Effect 里读到的所有 props、state 和组件内定义的值。它的意思是“这些值变了，就要重新同步”，而不是“我想在什么时候执行”。值一变，React 先运行上一轮返回的清理函数，再用新值执行 Effect；组件卸载时也会运行清理。</p>
<p>这样写的好处是 Effect 永远跟最新的 props 对得上，比如切换房间就自动断开旧房间、连上新房间。<code>eslint-plugin-react-hooks</code> 会帮你检查依赖写没写全。</p>
<p>要注意两点。开发环境的严格模式会故意多跑一次“挂载 → 清理 → 挂载”，用来暴露没写清理的 Effect。另外，能在渲染时直接算出来的值，和用户点击触发的逻辑，都不需要 Effect。</p>
</blockquote>
<h2>先看一个聊天室</h2>
<p>下面的组件要连到某个房间。连接是 React 之外的东西，所以放在 Effect 里，并返回一个断开连接的清理函数。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">ChatRoom</span>(<span class="hljs-params">{ roomId, serverUrl }</span>) {
  <span class="hljs-keyword">const</span> [messages, setMessages] = <span class="hljs-title function_">useState</span>([]);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> connection = <span class="hljs-title function_">createConnection</span>(serverUrl, roomId);
    connection.<span class="hljs-title function_">on</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">msg</span>) =&gt;</span> <span class="hljs-title function_">setMessages</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> [...list, msg]));
    connection.<span class="hljs-title function_">connect</span>();
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> connection.<span class="hljs-title function_">disconnect</span>();
  }, [roomId, serverUrl]);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">MessageList</span> <span class="hljs-attr">items</span>=<span class="hljs-string">{messages}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>用户从房间 A 切到房间 B，<code>roomId</code> 变了。React 先调用上一轮的清理函数，断开 A；再用新的 <code>roomId</code> 执行 Effect，连上 B。整个过程你不用写“如果房间变了就先断开”，依赖数组和清理函数已经把这件事表达清楚了。</p>
<h2>依赖数组的三种写法</h2>
<p>不传数组，Effect 在每次提交后都执行。传 <code>[]</code>，只在挂载后执行一次，卸载时清理。传 <code>[a, b]</code>，挂载后执行，之后 <code>a</code> 或 <code>b</code> 变了才重新执行，比较用的是 <code>Object.is</code>。</p>
<p>很多人为了让 Effect “少执行几次”，把依赖删掉。可是 Effect 用到的值没写进数组，它就会一直读旧渲染里的那个值，这就是过期闭包，详见<a href="/questions/react-stale-closure/">《React 中的过期闭包为什么会读到旧状态？》</a>。</p>
<p>依赖太多时，应该改代码结构，而不是删依赖。只在 Effect 里用的对象或函数，挪到 Effect 内部去创建，它就不再是依赖。要根据旧值更新状态，用函数式更新 <code>setX(x =&gt; ...)</code>，就不用依赖 <code>x</code>。只想读最新值、不想因它重新连接的逻辑，提取成 <code>useEffectEvent</code>，它在 React 19.2 起成为稳定 API。</p>
<h2>请求数据时，旧请求可能覆盖新结果</h2>
<p>用户快速切换 <code>id</code>，先发的请求可能后回来，把新数据覆盖掉。这种情况叫竞态。用清理函数取消旧请求就能避免：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${id}</span>\`</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> })
    .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">res</span>) =&gt;</span> res.<span class="hljs-title function_">json</span>())
    .<span class="hljs-title function_">then</span>(setUser)
    .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">err</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (err.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-title function_">setError</span>(err);
    });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>();
}, [id]);
</code></pre></div>
<p><code>id</code> 变化时，上一轮的清理函数调用 <code>abort()</code>，旧请求被取消，自然就不会再 <code>setUser</code>。不过实际项目更推荐用框架自带的数据加载，或者 TanStack Query 这类库，它们还处理了缓存和去重。</p>
<h2>哪些事不该放进 Effect</h2>
<p>由 props 或 state 推导出来的值，直接在渲染里算就行。放进 Effect 再 <code>setState</code>，会多渲染一次，还容易不同步。计算开销大时用 <code>useMemo</code>。</p>
<p>提交表单、点击购买这类操作，写在事件处理器里。它们是用户某个具体动作触发的，不是“这个组件一显示就要做”的事。</p>
<p>props 变了想重置状态，给组件换一个 <code>key</code>，React 会重新创建它，不用在 Effect 里手动清空。</p>
<h2>Effect 什么时候执行</h2>
<p>Effect 在提交之后执行，也就是 React 已经把改动写进 DOM 以后。由点击这类离散事件触发的更新，React 可能在浏览器绘制前就同步执行 Effect；其他情况通常在绘制之后执行。</p>
<p>如果你需要在绘制前测量布局，避免画面闪一下，就改用 <code>useLayoutEffect</code>。</p>
<h2>常见追问</h2>
<p><strong>为什么开发环境 Effect 执行了两次？</strong></p>
<blockquote>
<p>这是严格模式故意的，它模拟一次卸载再挂载，看你的清理写没写对。清理写正确的话，用户看不出区别。生产环境不会这样。</p>
</blockquote>
<p><strong>可以直接把 async 函数传给 <code>useEffect</code> 吗？</strong></p>
<blockquote>
<p>不行。async 函数返回的是 Promise，而 <code>useEffect</code> 期望的返回值是清理函数。正确做法是在 Effect 里面定义一个 async 函数，然后立即调用它。</p>
</blockquote>`};export{e as default};