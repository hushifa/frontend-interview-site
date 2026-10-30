var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如一个后台页面，在顶部搜索框里打字，下面几百行的表格跟着卡。我会先用 React DevTools 的 Profiler 录一次，看是哪些组件在渲染、每次花多久，确认瓶颈再动手，而不是到处加 <code>memo</code>。</p>
<p>找到原因后按三类处理。第一类是减少渲染次数：把输入框这类频繁变化的状态放到用它的组件里，不往上提；包裹型组件用 <code>children</code> 接收 JSX；对确实慢的子组件用 <code>memo</code>，并配合 <code>useMemo</code>、<code>useCallback</code> 让 props 保持不变；列表用稳定的 <code>key</code>，避免整项重建。</p>
<p>第二类是减少每次渲染的成本：昂贵的计算用 <code>useMemo</code> 缓存；长列表用虚拟列表只渲染可见的几十行；不急的更新用 <code>useTransition</code> 或 <code>useDeferredValue</code> 降低优先级，让输入先响应。第三类是减少加载体积：用 <code>lazy</code> 加 <code>Suspense</code> 把不在首屏的页面和组件拆出去，按需加载。</p>
<p>要注意，<code>memo</code> 和 <code>useMemo</code> 都只是性能优化，不是保证，React 仍可能重新渲染。启用 React Compiler 后，它会在构建时自动做记忆化，新代码大多不用再手写这些。</p>
</blockquote>
<h2>先测量，再优化</h2>
<p>React 提供了 <code>&lt;Profiler&gt;</code> 组件，包住一棵子树后，每次子树里的组件更新，React 都会调用 <code>onRender</code> 回调，告诉你这次渲染花了多久。日常排查更常用的是 React DevTools 里的 Profiler 面板，文档说它以浏览器扩展的形式提供了类似的功能，可以交互式地查看。</p>
<p>为什么一定要先测？因为优化有成本。文档提到 <code>&lt;Profiler&gt;</code> 本身会增加 CPU 和内存开销，生产构建里默认是关闭的；<code>memo</code> 每次也要比较 props。没有测量就加，可能多做了工作，界面却没有变快。另外 React 文档提醒，做性能测量时要让 React 运行在生产模式，开发环境多了很多检查，测出来比实际慢。</p>
<h2>减少渲染次数</h2>
<p>React 的默认行为是父组件重新渲染时，子组件跟着一起渲染，原因见<a href="/questions/react-render-commit/">《React 的渲染阶段与提交阶段有什么区别？》</a>。所以最直接的优化是让状态变化影响的范围尽量小。React 文档在 <code>memo</code> 一页里先推荐的就是这几条，排在 <code>memo</code> 之前：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-comment">// 改前：输入框的状态放在页面顶层，打一个字整个页面都渲染</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [keyword, setKeyword] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{keyword}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setKeyword(e.target.value)} /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">BigTable</span> /&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}

<span class="hljs-comment">// 改后：状态下放到用它的组件里，BigTable 不再跟着渲染</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">SearchBox</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [keyword, setKeyword] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{keyword}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setKeyword(e.target.value)} /&gt;</span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Page</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">SearchBox</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">BigTable</span> /&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>改后为什么 <code>BigTable</code> 不渲染了？因为 <code>keyword</code> 变化只会让 <code>SearchBox</code> 重新执行，<code>Page</code> 自己没有状态变化，也就不会带着 <code>BigTable</code> 一起渲染。文档的原话是优先使用局部状态，不要把状态提升到超出需要的地方，像表单输入、是否悬停这种临时状态不要放在树顶或全局状态库里。</p>
<p>同样的思路还有一种写法：组件在视觉上包裹别的组件时，让它通过 <code>children</code> 接收 JSX。包裹组件更新自己的状态时，React 知道传进来的 <code>children</code> 不需要重新渲染。文档还指出，React 应用的很多性能问题来自 Effect 里更新状态引起的连锁渲染，能在渲染时直接算出来的值就不要用 Effect 同步到 state。</p>
<p>这些都做不到时，再用 <code>memo</code>。<code>memo</code> 包住的组件在 props 没变时会跳过渲染，props 默认用 <code>Object.is</code> 逐个比较，所以传给它的对象和函数要用 <code>useMemo</code>、<code>useCallback</code> 保持同一个引用，否则每次都是新的，<code>memo</code> 等于没加。三者怎么配合见<a href="/questions/react-memo/">《React.memo 怎样跳过组件渲染？什么情况下会失效？》</a>。</p>
<p>列表的 <code>key</code> 也影响渲染工作量。<code>key</code> 稳定时，React 能认出同一项，只更新变化的部分；用下标当 <code>key</code> 又发生插入或排序，React 会把状态和 DOM 对到错误的项上，详见<a href="/questions/react-key/">《列表中的 key 为什么不能随意使用数组下标？》</a>。反过来，同一位置换一个 <code>key</code> 会让 React 丢掉旧组件、重建新组件，这是重置状态的手段，不要在每次渲染时随机生成 <code>key</code>。</p>
<h2>减少每次渲染的成本</h2>
<p>渲染次数降不下来时，就让每次渲染少做点事。组件里有很贵的计算，比如对上万条数据过滤排序，用 <code>useMemo</code> 缓存结果，依赖没变就直接复用。</p>
<p>列表本身太长是另一种情况。一次渲染一万行，即使每行都很简单，创建和更新这么多 DOM 节点也会卡。虚拟列表只渲染可视区域内的几十行，滚动时替换内容，React 本身没有内置这个功能，通常借助第三方虚拟列表库实现，原理见<a href="/questions/perf-render-large-list/">《页面要渲染十万条数据，怎样不卡顿？》</a>。</p>
<p>还有一类卡顿不是总量大，而是一次更新阻塞了输入。比如每输入一个字都要重新渲染一个复杂图表，可以用 <code>useTransition</code> 或 <code>useDeferredValue</code> 把图表更新标记为不紧急，React 会先处理输入，详见<a href="/questions/react-transitions/">《useTransition 和 useDeferredValue 能优化哪些卡顿？》</a>。</p>
<h2>减少加载体积</h2>
<p>首屏慢往往不是渲染慢，而是要下载、解析的 JavaScript 太多。<code>lazy</code> 可以推迟加载组件的代码，直到它第一次被渲染：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { lazy, <span class="hljs-title class_">Suspense</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">Settings</span> = <span class="hljs-title function_">lazy</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./Settings.jsx&#x27;</span>));

<span class="hljs-keyword">function</span> <span class="hljs-title function_">App</span>(<span class="hljs-params">{ tab }</span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">Suspense</span> <span class="hljs-attr">fallback</span>=<span class="hljs-string">{</span>&lt;<span class="hljs-attr">p</span>&gt;</span>加载中…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}&gt;
      {tab === &#x27;settings&#x27; &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">Settings</span> /&gt;</span>}
    <span class="hljs-tag">&lt;/<span class="hljs-name">Suspense</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>用户没切到设置页时，<code>Settings</code> 的代码不会下载。切过去后，代码还在加载期间组件会挂起，外层 <code>Suspense</code> 显示 <code>fallback</code>。要注意 <code>lazy</code> 依赖动态 <code>import()</code>，需要打包工具或框架支持，被导入的组件要是默认导出；<code>lazy</code> 要写在模块顶层，写在组件里每次渲染都会得到新组件，状态会被重置。</p>
<h2>React Compiler 改变了什么</h2>
<p>上面 <code>memo</code>、<code>useMemo</code>、<code>useCallback</code> 都要手写，文档也承认手动记忆化繁琐、容易写错、还增加维护的代码。React Compiler 是一个构建时工具，它分析组件代码，自动加上合适的记忆化，让组件只在需要时重新渲染。</p>
<p>所以启用编译器的新项目，一般不再手写这些 API，把精力放在状态放在哪里、列表是否太长、包是否太大这些编译器管不到的事上。编译器的细节见<a href="/questions/react-compiler/">《React Compiler 解决了哪些优化问题？》</a>。</p>
<h2>常见追问</h2>
<p><strong>是不是给所有组件都加上 memo 就好了？</strong></p>
<blockquote>
<p>不是。<code>memo</code> 每次都要比较 props，props 每次都变的话，比较白做了。文档也说明它只是性能优化，不是保证，React 仍可能重新渲染。应该先用 Profiler 找到确实慢、又经常收到相同 props 的组件，再加。</p>
</blockquote>
<p><strong>Context 变化导致大量组件渲染怎么办？</strong></p>
<blockquote>
<p>用了某个 Context 的组件，在它的值变化时一定会重新渲染，<code>memo</code> 也挡不住。常见的做法是用 <code>useMemo</code>、<code>useCallback</code> 包住传给 Provider 的对象和函数，让 <code>value</code> 只在内容真变时才换成新对象，避免父组件每次渲染都通知所有使用者。</p>
</blockquote>
<p><strong>生产环境怎么用 Profiler？</strong></p>
<blockquote>
<p><code>&lt;Profiler&gt;</code> 在生产构建里默认关闭，React 提供了一个开启了分析功能的特殊生产构建，需要在构建配置里切换才能使用。</p>
</blockquote>`};export{e as default};