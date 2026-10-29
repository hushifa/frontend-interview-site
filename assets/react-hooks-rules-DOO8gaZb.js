var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个组件里写了好几个 <code>useState</code>、<code>useEffect</code>，React 并不知道哪个是哪个，它只记“第 1 个 Hook、第 2 个 Hook……”，按调用顺序把每个 Hook 和内部保存的状态对上。</p>
<p>所以每次渲染，Hook 的调用顺序必须完全一样。如果把 Hook 放进 <code>if</code>、循环、嵌套函数，或者写在提前 <code>return</code> 的后面，某次渲染少调或多调一个，后面的状态就全对错了位置。</p>
<p>这条规则让 Hook 不需要传 key，自定义 Hook 也能随便组合。另外 Hook 只能在函数组件或以 <code>use</code> 开头的自定义 Hook 里调用。自定义 Hook 复用的是逻辑，两个组件用同一个 Hook，各自有独立的状态。</p>
<p>有一个例外：<code>use(promise)</code> 和 <code>use(Context)</code> 不是 Hook，可以写在条件和循环里，但也只能在组件或 Hook 中调用。</p>
</blockquote>
<h2>顺序乱了会发生什么</h2>
<p>下面的组件在没有用户时先 <code>return</code>，Hook 写在后面：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ user }</span>) {
  <span class="hljs-keyword">if</span> (!user) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>; <span class="hljs-comment">// 错误：提前 return 在 Hook 之前</span>
  <span class="hljs-keyword">const</span> [tab, setTab] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;posts&#x27;</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> { <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = user.<span class="hljs-property">name</span>; }, [user.<span class="hljs-property">name</span>]);
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<p>第一次渲染 <code>user</code> 是 <code>null</code>，组件直接返回，一个 Hook 都没调。等 <code>user</code> 变成对象，这次渲染调了两个 Hook，比上次多了。React 发现对不上，会报错 “Rendered more hooks than during the previous render”。</p>
<p>改法是把所有 Hook 挪到提前 <code>return</code> 前面，条件写进 Hook 里面：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ user }</span>) {
  <span class="hljs-keyword">const</span> [tab, setTab] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;posts&#x27;</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (user) <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = user.<span class="hljs-property">name</span>;
  }, [user]);
  <span class="hljs-keyword">if</span> (!user) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<p>现在不管 <code>user</code> 是不是空，每次渲染都调同样两个 Hook，顺序永远一致。</p>
<h2>真的需要“有条件地用 Hook”怎么办</h2>
<p>有两种思路。条件只影响要不要做某件事，就把 <code>if</code> 写进 Effect 的函数体里，像上面那样。</p>
<p>如果是一整块逻辑要不要启用，就把它拆成子组件，用条件渲染决定渲不渲染这个子组件。子组件内部照常在顶层调 Hook，它要么整个存在，要么整个不存在，顺序不会乱。</p>
<h2>自定义 Hook 复用的是逻辑，不是状态</h2>
<p>下面写一个开关 Hook，同一个组件里调用两次：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">useToggle</span>(<span class="hljs-params">initial = <span class="hljs-literal">false</span></span>) {
  <span class="hljs-keyword">const</span> [on, setOn] = <span class="hljs-title function_">useState</span>(initial);
  <span class="hljs-keyword">const</span> toggle = <span class="hljs-title function_">useCallback</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setOn</span>(<span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> !v), []);
  <span class="hljs-keyword">return</span> [on, toggle];
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Panel</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [open, toggleOpen] = <span class="hljs-title function_">useToggle</span>();
  <span class="hljs-keyword">const</span> [pinned, togglePinned] = <span class="hljs-title function_">useToggle</span>(<span class="hljs-literal">true</span>);
  <span class="hljs-comment">// open 和 pinned 互不影响</span>
}
</code></pre></div>
<p><code>useToggle</code> 本质上就是把 <code>useState</code> 和 <code>useCallback</code> 打了个包。调用两次，就等于在 <code>Panel</code> 里按顺序调了两组 Hook，各有各的状态。所以切换 <code>open</code> 不会影响 <code>pinned</code>。</p>
<p>如果想让多个组件共享同一份状态，自定义 Hook 做不到，要把状态提升到共同的父组件，或者用 Context、外部 store。</p>
<h2>让工具帮你检查</h2>
<p><code>eslint-plugin-react-hooks</code> 的 <code>rules-of-hooks</code> 规则会检查 Hook 的调用位置，<code>exhaustive-deps</code> 检查依赖数组。新版的推荐预设还带上了 React Compiler 相关的规则，项目里应该默认开着。</p>
<h2>常见追问</h2>
<p><strong>React 为什么不按名字保存状态？</strong></p>
<blockquote>
<p>按顺序存储，Hook 就不用传一个 key 进去。自定义 Hook 也能任意组合，不用担心两个 Hook 内部用了同一个名字而冲突。</p>
</blockquote>
<p><strong><code>use</code> 为什么可以条件调用？</strong></p>
<blockquote>
<p>因为它读的是你传进去的东西本身，也就是那个 Promise 或 Context，不需要靠调用顺序去找自己的状态。</p>
</blockquote>`};export{e as default};