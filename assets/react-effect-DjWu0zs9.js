var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Effect 用于和外部系统同步，例如订阅、计时器、网络连接、非 React 组件。</li>
<li>依赖数组必须包含 Effect 内读取的所有 props、state 和组件内定义的值，由 <code>eslint-plugin-react-hooks</code> 检查。</li>
<li>依赖变化时，React 先运行上一轮的清理函数，再用新值运行 Effect；卸载时也会运行清理。</li>
<li>开发环境的严格模式会额外执行一次&quot;挂载 → 清理 → 挂载&quot;，用来暴露没写清理的 Effect。</li>
<li>能在渲染时算出的值直接计算，用户点击触发的逻辑写在事件处理器里，都不需要 Effect。</li>
</ul>
<h2>一个完整的同步</h2>
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
<p>切换 <code>roomId</code> 时，React 先断开旧房间，再连接新房间。依赖数组描述的是&quot;哪些值变了需要重新同步&quot;，不是&quot;想在什么时候执行&quot;。</p>
<h2>三种依赖写法</h2>
<table><thead><tr><th>写法</th><th>执行时机</th></tr></thead><tbody><tr><td>不传数组</td><td>每次提交后都执行</td></tr><tr><td><code>[]</code></td><td>只在挂载后执行，卸载时清理</td></tr><tr><td><code>[a, b]</code></td><td>挂载后执行，之后 <code>a</code> 或 <code>b</code> 变化（<code>Object.is</code> 比较）时重新执行</td></tr></tbody></table>
<p>不要为了&quot;少执行&quot;删掉依赖。Effect 用到的值没写进数组，它就会读到旧渲染里的值。依赖太多时，应改代码结构：</p>
<ul>
<li>只在 Effect 里用的对象或函数，挪到 Effect 内部创建。</li>
<li>基于前值更新状态，用函数式更新 <code>setX(x =&gt; ...)</code>，就不必依赖 <code>x</code>。</li>
<li>只想读最新值、不想因它重连的逻辑，提取成 <code>useEffectEvent</code>（React 19.2 起稳定）。</li>
</ul>
<h2>请求数据时处理竞态</h2>
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
<p>快速切换 <code>id</code> 时，旧请求在清理中被取消，不会覆盖新结果。实际项目更推荐用框架的数据加载或 TanStack Query 这类库，它们处理了缓存和去重。</p>
<h2>不需要 Effect 的情况</h2>
<ul>
<li>由 props 或 state 推导的值：在渲染中直接计算，开销大时用 <code>useMemo</code>。</li>
<li>提交表单、点击购买：写在事件处理器里，因为它们由具体操作触发，不是&quot;显示这个组件就要做&quot;。</li>
<li>props 变化时重置状态：给组件换 <code>key</code>，而不是在 Effect 里 <code>setState</code>。</li>
</ul>
<h2>执行时机</h2>
<p>Effect 在提交之后执行。由用户点击等离散事件触发的更新，React 可能在浏览器绘制前就同步执行 Effect；其他情况通常在绘制后执行。需要在绘制前测量布局、避免闪烁时，用 <code>useLayoutEffect</code>。</p>
<h2>常见追问</h2>
<ul>
<li>为什么开发环境 Effect 执行两次？严格模式故意模拟一次卸载再挂载，正确写了清理的 Effect 用户看不出区别。</li>
<li>Effect 里能直接写 async 函数吗？不能把 async 函数传给 <code>useEffect</code>，因为它返回 Promise 而不是清理函数；在内部定义 async 函数再调用。</li>
</ul>`};export{e as default};