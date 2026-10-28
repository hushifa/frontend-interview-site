var e={answerHtml:`<h2>简答</h2>
<ul>
<li>React 不知道每个 Hook 的&quot;名字&quot;，只按调用顺序把第 1 个、第 2 个 Hook 和内部保存的状态对应起来。</li>
<li>每次渲染的 Hook 调用顺序必须一致，所以不能在条件、循环、嵌套函数或提前 return 之后调用 Hook。</li>
<li>Hook 只能在函数组件或自定义 Hook（名称以 <code>use</code> 开头）中调用，不能在普通函数或类组件里调用。</li>
<li>自定义 Hook 复用的是逻辑，不是状态：两个组件调用同一个 Hook，各自有独立的 state。</li>
<li><code>use(promise)</code> 和 <code>use(Context)</code> 不是 Hook，可以写在条件和循环里，但仍然只能在组件或 Hook 中调用。</li>
</ul>
<h2>顺序错位会发生什么</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ user }</span>) {
  <span class="hljs-keyword">if</span> (!user) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>; <span class="hljs-comment">// 错误：提前 return 在 Hook 之前</span>
  <span class="hljs-keyword">const</span> [tab, setTab] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;posts&#x27;</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> { <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = user.<span class="hljs-property">name</span>; }, [user.<span class="hljs-property">name</span>]);
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<p><code>user</code> 从 <code>null</code> 变成对象时，这次渲染比上次多调用了两个 Hook，React 会报错 &quot;Rendered more hooks than during the previous render&quot;。正确写法是把所有 Hook 放在提前 return 之前：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">Profile</span>(<span class="hljs-params">{ user }</span>) {
  <span class="hljs-keyword">const</span> [tab, setTab] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;posts&#x27;</span>);
  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (user) <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = user.<span class="hljs-property">name</span>;
  }, [user]);
  <span class="hljs-keyword">if</span> (!user) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-comment">// ...</span>
}
</code></pre></div>
<h2>条件写在 Hook 内部或组件边界上</h2>
<ul>
<li>条件同步：把 <code>if</code> 写进 Effect 的函数体里。</li>
<li>条件使用整块逻辑：把逻辑拆成子组件，用条件渲染决定是否渲染这个子组件，子组件内部照常调用 Hook。</li>
</ul>
<h2>自定义 Hook</h2>
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
<p>需要多个组件共享同一份状态时，把状态提升到共同的父组件，或使用 Context 和外部 store。</p>
<h2>工具检查</h2>
<p><code>eslint-plugin-react-hooks</code> 的 <code>rules-of-hooks</code> 规则会检查调用位置，<code>exhaustive-deps</code> 检查依赖数组。新版的推荐预设还包含 React Compiler 相关规则，应在项目中默认开启。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 React 不按名字保存状态？按顺序存储让 Hook 不需要传入 key，也便于自定义 Hook 任意组合而不产生命名冲突。</li>
<li><code>use</code> 为什么可以条件调用？它读取的是传入的资源本身（Promise 或 Context），不依赖调用顺序来定位状态。</li>
</ul>`};export{e as default};