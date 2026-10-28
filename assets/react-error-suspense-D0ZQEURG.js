var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Error Boundary 捕获后代组件在渲染、生命周期方法和构造函数中抛出的错误，显示备用 UI，避免整棵树卸载。</li>
<li>Error Boundary 不捕获事件处理器、<code>setTimeout</code> 等异步回调里的错误，也不捕获服务端渲染的错误和它自身的错误。</li>
<li>目前只能用类组件实现（<code>getDerivedStateFromError</code> + <code>componentDidCatch</code>），实践中常用 <code>react-error-boundary</code> 库。</li>
<li>Suspense 在子树&quot;挂起&quot;时显示 <code>fallback</code>。能触发挂起的是 <code>lazy</code> 组件、<code>use(promise)</code> 和支持 Suspense 的框架数据加载，普通 Effect 里的 fetch 不会。</li>
<li>已经显示过内容的 Suspense 边界，如果更新包在 Transition 里，React 会保留旧内容而不是切回 fallback。</li>
</ul>
<h2>组合使用</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { <span class="hljs-title class_">Suspense</span>, lazy } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { <span class="hljs-title class_">ErrorBoundary</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-error-boundary&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">Chart</span> = <span class="hljs-title function_">lazy</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./Chart.jsx&#x27;</span>));

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Dashboard</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ErrorBoundary</span>
      <span class="hljs-attr">fallbackRender</span>=<span class="hljs-string">{({</span> <span class="hljs-attr">error</span>, <span class="hljs-attr">resetErrorBoundary</span> }) =&gt;</span> (
        <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>图表加载失败：{error.message}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{resetErrorBoundary}</span>&gt;</span>重试<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
      )}
    &gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>图表加载中…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
        <span class="hljs-tag">&lt;<span class="hljs-name">Chart</span> /&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">ErrorBoundary</span>&gt;</span></span>
  );
}
</code></pre></div>
<ul>
<li>加载 <code>Chart</code> 的代码块时显示&quot;加载中&quot;；加载失败（如网络断开）时 Promise reject，错误交给 ErrorBoundary。</li>
<li>ErrorBoundary 放在 Suspense 外面，等待和失败都只影响这一块区域。</li>
</ul>
<h2>手写 Error Boundary</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">class</span> <span class="hljs-title class_">ErrorBoundary</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">React.Component</span> {
  state = { <span class="hljs-attr">error</span>: <span class="hljs-literal">null</span> };

  <span class="hljs-keyword">static</span> <span class="hljs-title function_">getDerivedStateFromError</span>(<span class="hljs-params">error</span>) {
    <span class="hljs-keyword">return</span> { error };
  }

  <span class="hljs-title function_">componentDidCatch</span>(<span class="hljs-params">error, info</span>) {
    <span class="hljs-title function_">reportError</span>(error, info.<span class="hljs-property">componentStack</span>);
  }

  <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-property">state</span>.<span class="hljs-property">error</span>) <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span>.<span class="hljs-property">fallback</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">props</span>.<span class="hljs-property">children</span>;
  }
}
</code></pre></div>
<p><code>getDerivedStateFromError</code> 在渲染阶段决定显示备用 UI，<code>componentDidCatch</code> 在提交阶段做上报。</p>
<h2>边界放在哪里</h2>
<ul>
<li>按用户可以独立理解的区域划分：一个卡片、一个面板、一个路由页面。整个应用只有一个顶层边界的话，任何小错误都会让全屏变成错误页。</li>
<li>多个并排的 Suspense 会各自显示 fallback；希望它们一起出现，就包在同一个 Suspense 里。</li>
<li>嵌套 Suspense 可以逐级显示：外层先出页面骨架，内层再出详细数据。</li>
</ul>
<h2>事件处理器里的错误</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleSave</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">save</span>(form);
  } <span class="hljs-keyword">catch</span> (err) {
    <span class="hljs-title function_">setError</span>(err.<span class="hljs-property">message</span>);
  }
}
</code></pre></div>
<p>事件和异步回调的错误不会进入 Error Boundary，要自己 <code>try/catch</code> 并更新状态显示。</p>
<h2>常见追问</h2>
<ul>
<li>错误恢复后怎么重新渲染？<code>react-error-boundary</code> 的 <code>resetErrorBoundary</code> 或 <code>resetKeys</code> 会清空错误状态，重新渲染子树。</li>
<li>React 19 在错误处理上有什么变化？<code>createRoot</code> 新增 <code>onCaughtError</code>、<code>onUncaughtError</code> 选项，用于统一上报。</li>
</ul>`};export{e as default};