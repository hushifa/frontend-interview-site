var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一块界面在加载时可能遇到两种情况：还没加载完，或者加载失败了。Suspense 处理前一种，子树在等代码或数据时，先显示它的 <code>fallback</code>。Error Boundary 处理后一种，子组件在渲染、生命周期方法或构造函数里抛了错，它显示备用界面，不让整个应用白屏。</p>
<p>能让 Suspense 进入等待的，是 <code>lazy</code> 组件、<code>use(promise)</code> 和支持 Suspense 的框架数据加载。在普通 Effect 里 fetch 是不会触发的。</p>
<p>它们的用处是把“等待”和“失败”限制在一小块区域里，其他部分照常显示。Error Boundary 目前只能用类组件写，实际项目常用 <code>react-error-boundary</code> 库。</p>
<p>要注意，Error Boundary 抓不到事件处理器、<code>setTimeout</code> 这类异步回调里的错误，也抓不到服务端渲染的错误和它自己抛的错误。另外，已经显示过内容的 Suspense，如果更新包在 Transition 里，React 会保留旧内容，不会退回 fallback。</p>
</blockquote>
<h2>先看两个一起用</h2>
<p>下面的仪表盘按需加载一个图表组件。Suspense 负责加载中，ErrorBoundary 负责加载失败。</p>
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
<p><code>Chart</code> 的代码还在下载时，<code>lazy</code> 让组件进入等待，Suspense 显示“图表加载中”。如果网络断了，<code>import()</code> 返回的 Promise 失败，错误就交给外面的 ErrorBoundary，显示失败提示和重试按钮。</p>
<p>ErrorBoundary 放在 Suspense 外面，所以等待和失败都只影响这一块。页面其他地方不受影响。</p>
<h2>Error Boundary 自己怎么写</h2>
<p>目前只有类组件能当 Error Boundary，因为要用到两个类组件专有的方法：</p>
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
<p><code>getDerivedStateFromError</code> 在渲染阶段运行，它把错误存进 state，决定接下来显示备用界面。<code>componentDidCatch</code> 在提交阶段运行，适合做错误上报。一个管“显示什么”，一个管“上报”。</p>
<h2>为什么事件里的错误抓不到</h2>
<p>Error Boundary 只能抓到 React 渲染组件过程中抛出的错误。点击事件、<code>setTimeout</code> 回调、<code>await</code> 之后的代码，执行时 React 早就渲染完了，错误不经过渲染流程，边界自然拦不住。</p>
<p>这类错误要自己 <code>try/catch</code>，再用 state 显示：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleSave</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">save</span>(form);
  } <span class="hljs-keyword">catch</span> (err) {
    <span class="hljs-title function_">setError</span>(err.<span class="hljs-property">message</span>);
  }
}
</code></pre></div>
<h2>边界应该放在哪里</h2>
<p>按用户能独立理解的区域来划：一张卡片、一个面板、一个路由页面。如果整个应用只有一个顶层边界，任何一个小组件出错，全屏都会变成错误页。</p>
<p>Suspense 也是同样的思路。几个并排的 Suspense 会各自显示自己的 fallback，想让它们一起出现，就包进同一个 Suspense。嵌套的 Suspense 可以逐级显示，外层先出页面骨架，内层再出详细数据。</p>
<h2>常见追问</h2>
<p><strong>出错以后怎么让它重新渲染？</strong></p>
<blockquote>
<p><code>react-error-boundary</code> 提供了 <code>resetErrorBoundary</code> 函数和 <code>resetKeys</code> 属性，调用或者 key 变化时会清掉错误状态，重新渲染子树。</p>
</blockquote>
<p><strong>React 19 在错误处理上有什么变化？</strong></p>
<blockquote>
<p><code>createRoot</code> 新增了 <code>onCaughtError</code> 和 <code>onUncaughtError</code> 两个选项，分别处理被边界捕获的错误和没被捕获的错误，方便统一上报。</p>
</blockquote>`};export{e as default};