var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做标签页时，用户在“联系”页的输入框里打了一半字，切到“首页”再切回来，内容没了，因为条件渲染把组件卸载了。<code>&lt;Activity&gt;</code> 解决的就是这个问题：<code>&lt;Activity mode=&quot;hidden&quot;&gt;</code> 把子树藏起来，但状态和 DOM 都保留，切回 <code>visible</code> 时原样出现。</p>
<p>它隐藏时做三件事：用 CSS <code>display: none</code> 藏起子元素；销毁里面的 Effect，订阅之类会被清理；保留 React 状态和 DOM，包括 <code>&lt;textarea&gt;</code> 里输入的文字这类非受控状态。隐藏的子组件收到新 props 仍会重新渲染，只是优先级比可见内容低。</p>
<p>除了保留状态，它还能预渲染。一开始就是 <code>hidden</code> 的边界，React 会低优先级地先把子组件渲染出来，用 <code>use</code> 读取的数据也会提前请求，用户点开时出现得更快。</p>
<p>要注意，隐藏的 DOM 还在页面上，所以 <code>&lt;video&gt;</code>、<code>&lt;audio&gt;</code>、<code>&lt;iframe&gt;</code> 这类会继续播放或运行，要在 <code>useLayoutEffect</code> 的清理函数里暂停。另外它是 React 19.2 正式加入的，之前只在实验版里有。</p>
</blockquote>
<h2>和条件渲染比，差别在哪</h2>
<p>React 的官方文档拿侧边栏举例，两种写法只差一行：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 条件渲染：隐藏时卸载，状态和 DOM 都被销毁</span>
{isShowingSidebar &amp;&amp; <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Sidebar</span> /&gt;</span></span>}

<span class="hljs-comment">// Activity：隐藏时保留状态和 DOM</span>
&lt;<span class="hljs-title class_">Activity</span> mode={isShowingSidebar ? <span class="hljs-string">&#x27;visible&#x27;</span> : <span class="hljs-string">&#x27;hidden&#x27;</span>}&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Sidebar</span> /&gt;</span></span>
&lt;/<span class="hljs-title class_">Activity</span>&gt;
</code></pre></div>
<p>用条件渲染时，<code>isShowingSidebar</code> 变成 <code>false</code>，<code>&lt;Sidebar /&gt;</code> 从树里消失，React 会丢掉它的全部状态。为什么会丢？因为 React 的状态挂在组件在树中的位置上，位置上的组件没了，状态也就没了，见<a href="/questions/react-hooks-internals/">《Hooks 在 React 内部是怎样保存状态的？为什么靠调用顺序区分？》</a>。所以侧边栏里展开的分组，再显示时又收起来了。</p>
<p>换成 <code>&lt;Activity&gt;</code>，组件一直在树里，只是被标记为隐藏，状态就保住了。<code>Sidebar</code> 本身一行都不用改。</p>
<p>标签页是最典型的场景，每个标签各包一层：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">Activity</span> mode={activeTab === <span class="hljs-string">&#x27;home&#x27;</span> ? <span class="hljs-string">&#x27;visible&#x27;</span> : <span class="hljs-string">&#x27;hidden&#x27;</span>}&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Home</span> /&gt;</span></span>
&lt;/<span class="hljs-title class_">Activity</span>&gt;
<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Activity</span> <span class="hljs-attr">mode</span>=<span class="hljs-string">{activeTab</span> === <span class="hljs-string">&#x27;contact&#x27;</span> ? &#x27;<span class="hljs-attr">visible</span>&#x27; <span class="hljs-attr">:</span> &#x27;<span class="hljs-attr">hidden</span>&#x27;}&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">Contact</span> /&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">Activity</span>&gt;</span></span>
</code></pre></div>
<h2>隐藏的时候，Effect 怎么处理</h2>
<p>文档建议把隐藏的 Activity 理解成“被卸载了，只是 React 替你存着状态”。所以进入 <code>hidden</code> 时，里面的 Effect 会执行清理函数；回到 <code>visible</code> 时，Effect 重新执行。这样隐藏的标签页不会还在后台连着 WebSocket、监听窗口事件。</p>
<p>这就要求 Effect 的清理函数写完整。如果某个副作用只在 Effect 挂载时做，没有对应的清理，隐藏后它就会留在那里。开发环境的 <code>&lt;StrictMode&gt;</code> 会额外多做几次 Activity 的卸载和挂载，帮你暴露这类漏写的清理，见<a href="/questions/react-strict-mode/">《React 严格模式为什么会让组件渲染两次、Effect 执行两次？》</a>。</p>
<h2>隐藏的视频为什么还在播放</h2>
<p><code>display: none</code> 只是不显示，<code>&lt;video&gt;</code> 元素还在 DOM 里，所以声音照样在放。文档给的改法是在清理函数里暂停：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useRef, useLayoutEffect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Video</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> ref = <span class="hljs-title function_">useRef</span>();

  <span class="hljs-title function_">useLayoutEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> videoRef = ref.<span class="hljs-property">current</span>;
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
      videoRef.<span class="hljs-title function_">pause</span>();
    };
  }, []);

  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">video</span> <span class="hljs-attr">ref</span>=<span class="hljs-string">{ref}</span> <span class="hljs-attr">controls</span> <span class="hljs-attr">playsInline</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;...&quot;</span> /&gt;</span></span>;
}
</code></pre></div>
<p>为什么用 <code>useLayoutEffect</code> 而不是 <code>useEffect</code>？因为暂停这件事要和“界面被藏起来”同时发生。文档说明，普通 <code>useEffect</code> 的清理可能被重新挂起的 Suspense 边界或 View Transition 推迟。两种 Effect 的时机区别见<a href="/questions/react-ref-layout-effect/">《useEffect 和 useLayoutEffect 在什么时候执行？测量 DOM 为什么要用 useLayoutEffect？》</a>。顺带的好处是，切回来时视频从原来的进度继续，也不用重新下载。</p>
<p>另一个小坑：如果子组件只返回一段文本，没有任何元素，隐藏时什么都不会输出，因为没有元素可以加 <code>display: none</code>。</p>
<h2>怎样用它提前加载下一页</h2>
<p>一开始就是 <code>hidden</code> 的 Activity，React 会在低优先级下先渲染里面的组件，但不挂载 Effect。配合 Suspense，就能在用户点开之前把代码和数据准备好：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">Suspense</span> fallback={<span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>Loading...<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span></span>}&gt;
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Activity</span> <span class="hljs-attr">mode</span>=<span class="hljs-string">{activeTab</span> === <span class="hljs-string">&#x27;posts&#x27;</span> ? &#x27;<span class="hljs-attr">visible</span>&#x27; <span class="hljs-attr">:</span> &#x27;<span class="hljs-attr">hidden</span>&#x27;}&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">Posts</span> /&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">Activity</span>&gt;</span></span>
&lt;/<span class="hljs-title class_">Suspense</span>&gt;
</code></pre></div>
<p>这里有个限制。只有通过会触发 Suspense 的方式读取的数据才会提前请求，比如用 <code>use</code> 读取 Promise。在 Effect 里 <code>fetch</code> 的数据不会，因为隐藏时 Effect 根本不执行。<code>use</code> 的用法见<a href="/questions/react-use-hook/">《React use API 可以读取哪些值？》</a>。</p>
<h2>常见追问</h2>
<p><strong>Activity 和 Vue 的 KeepAlive 一样吗？</strong></p>
<blockquote>
<p>目的相近，都是切走时保留组件状态。但机制不同：Activity 在隐藏时会销毁 Effect、回来再重建，DOM 只是被 <code>display: none</code> 藏起来；KeepAlive 缓存组件实例，组件里的定时器不会自己停，要靠 <code>onActivated</code>、<code>onDeactivated</code> 钩子暂停和恢复，见<a href="/questions/vue-keepalive-teleport/">《KeepAlive 与 Teleport 有哪些使用边界？》</a>。</p>
</blockquote>
<p><strong>所有标签页都包 Activity，会不会很耗内存？</strong></p>
<blockquote>
<p>会占用更多内存，因为隐藏的组件状态和 DOM 都留着，而且收到新 props 时还会低优先级重新渲染。只给用户会频繁来回切换、丢状态体验差的部分用，不常访问的页面还是条件渲染更省。</p>
</blockquote>
<p><strong>服务端渲染时有什么用？</strong></p>
<blockquote>
<p>文档提到，Activity 和 Suspense 一样会把树分成可以独立水合的单元，React 可以先水合标签按钮这类部分。区别是 Activity 不显示 fallback，服务端输出的 HTML 不变。</p>
</blockquote>`};export{e as default};