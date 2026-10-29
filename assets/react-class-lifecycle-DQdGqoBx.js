var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>类组件从出现到消失分三个阶段。挂载阶段，React 先调用 <code>constructor</code> 初始化 state，再调用静态方法 <code>getDerivedStateFromProps</code>，然后 <code>render</code> 算出界面，DOM 插入页面后调用 <code>componentDidMount</code>，这里适合发请求、订阅事件、操作 DOM。</p>
<p>更新阶段，props 或 state 变化时，先调用 <code>getDerivedStateFromProps</code>，再问 <code>shouldComponentUpdate</code> 要不要重新渲染，返回 <code>false</code> 就跳过。需要渲染就调用 <code>render</code>，在 DOM 真正更新之前调用 <code>getSnapshotBeforeUpdate</code>，可以读取更新前的 DOM 信息，比如滚动位置，它的返回值会传给接下来的 <code>componentDidUpdate</code>。卸载阶段只有 <code>componentWillUnmount</code>，在这里取消订阅、清除定时器。</p>
<p>函数组件没有这些方法。React 文档的说法是，多数情况下 <code>componentDidMount</code>、<code>componentDidUpdate</code>、<code>componentWillUnmount</code> 三者组合起来，等价于在函数组件里调用 <code>useEffect</code>，需要在浏览器绘制前执行时用 <code>useLayoutEffect</code>。<code>shouldComponentUpdate</code> 的作用对应 <code>memo</code>。</p>
<p>要注意两点。<code>componentWillMount</code>、<code>componentWillReceiveProps</code>、<code>componentWillUpdate</code> 已被改名为带 <code>UNSAFE_</code> 前缀的版本，旧名字已废弃，新代码不要用。另外，捕获子组件渲染错误的 <code>getDerivedStateFromError</code> 和 <code>componentDidCatch</code> 在函数组件里还没有对应的写法，错误边界目前仍然要写成类组件。</p>
</blockquote>
<h2>一个完整的类组件</h2>
<p>下面的聊天室组件展示挂载、更新、卸载三个阶段该做的事：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">class</span> <span class="hljs-title class_">ChatRoom</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">Component</span> {
  state = { <span class="hljs-attr">messages</span>: [] };

  <span class="hljs-title function_">componentDidMount</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">connection</span> = <span class="hljs-title function_">connect</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span>.<span class="hljs-property">roomId</span>);
  }

  <span class="hljs-title function_">componentDidUpdate</span>(<span class="hljs-params">prevProps</span>) {
    <span class="hljs-keyword">if</span> (prevProps.<span class="hljs-property">roomId</span> !== <span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span>.<span class="hljs-property">roomId</span>) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">connection</span>.<span class="hljs-title function_">disconnect</span>();
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">connection</span> = <span class="hljs-title function_">connect</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span>.<span class="hljs-property">roomId</span>);
    }
  }

  <span class="hljs-title function_">componentWillUnmount</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">connection</span>.<span class="hljs-title function_">disconnect</span>();
  }

  <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">MessageList</span> <span class="hljs-attr">messages</span>=<span class="hljs-string">{this.state.messages}</span> /&gt;</span></span>;
  }
}
</code></pre></div>
<p>为什么三个方法都要写？<code>componentDidMount</code> 建立了连接，如果 <code>roomId</code> 后来变了，不在 <code>componentDidUpdate</code> 里重新连接，组件就一直连着旧房间；组件卸载时不在 <code>componentWillUnmount</code> 里断开，连接就会泄漏。React 文档特别提醒，实现了 <code>componentDidMount</code>，通常也要实现另外两个。</p>
<p>开发环境的严格模式下，React 会先调用 <code>componentDidMount</code>，立刻调用 <code>componentWillUnmount</code>，再调用一次 <code>componentDidMount</code>，专门检查清理逻辑有没有写全。</p>
<h2>换成函数组件</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">ChatRoom</span>(<span class="hljs-params">{ roomId }</span>) {
  <span class="hljs-keyword">const</span> [messages, setMessages] = <span class="hljs-title function_">useState</span>([]);

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> connection = <span class="hljs-title function_">connect</span>(roomId);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> connection.<span class="hljs-title function_">disconnect</span>();
  }, [roomId]);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">MessageList</span> <span class="hljs-attr">messages</span>=<span class="hljs-string">{messages}</span> /&gt;</span></span>;
}
</code></pre></div>
<p>三个生命周期方法被一个 <code>useEffect</code> 代替了。Effect 第一次执行相当于 <code>componentDidMount</code>；<code>roomId</code> 变化时，React 先执行上一次返回的清理函数，再用新的 <code>roomId</code> 执行一次，相当于 <code>componentDidUpdate</code> 里先断开再重连；组件卸载时执行清理函数，相当于 <code>componentWillUnmount</code>。</p>
<p>两种写法的思路不同。类组件按“什么时候”组织代码，函数组件按“要同步什么”组织代码，连接房间的逻辑都放在一个 Effect 里，不容易漏掉某个阶段。依赖数组怎样写，见<a href="/questions/react-effect/">《useEffect 的依赖数组和清理函数应该怎么写？》</a>。</p>
<h2>常见追问</h2>
<p><strong>在 componentDidMount 里调用 setState 会怎样？</strong></p>
<blockquote>
<p>会多触发一次渲染，但这次渲染发生在浏览器更新屏幕之前，用户看不到中间状态。React 文档建议尽量避免，初始 state 应该在 <code>constructor</code> 里设置；只有像弹窗、提示框这种要先测量 DOM 尺寸再决定位置的情况才需要这样做。</p>
</blockquote>
<p><strong>getDerivedStateFromProps 适合什么时候用？</strong></p>
<blockquote>
<p>很少需要。它在每次渲染前都会调用，用来在 props 变化时更新 state，比如 <code>userID</code> 变了就重置表单。多数场景有更简单的做法，比如给组件换一个 <code>key</code> 让它整体重置。</p>
</blockquote>
<p><strong>错误边界为什么只能用类组件写？</strong></p>
<blockquote>
<p>因为 <code>getDerivedStateFromError</code> 和 <code>componentDidCatch</code> 还没有对应的 Hook。不想写类组件时，可以写一个通用的 <code>ErrorBoundary</code> 类组件全局复用，或者用 react-error-boundary 这个库，见<a href="/questions/react-error-suspense/">《Error Boundary 和 Suspense 分别处理什么？》</a>。</p>
</blockquote>`};export{e as default};