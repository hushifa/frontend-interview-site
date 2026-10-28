var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Zustand：<code>create</code> 返回一个 hook，组件用选择器读取需要的字段，选择结果按 <code>Object.is</code> 比较决定是否重新渲染。不需要 Provider，store 上的 <code>getState</code>、<code>setState</code> 可以在 React 之外调用。</li>
<li>Jotai：<code>atom</code> 只是定义，值保存在 store 中。派生原子的读函数里 <code>get</code> 会追踪依赖，依赖变化时自动重新计算。不使用 Provider 时所有组件共用默认 store。</li>
<li>Redux Toolkit：状态只能通过 dispatch action 改变，reducer 是纯函数。<code>configureStore</code> 默认加入 thunk、连接 Redux DevTools，开发环境还会检查状态被直接修改和存入不可序列化的值。</li>
<li>选择看状态的形状和团队需要的约束：集中的业务状态、需要记录和回放操作时选 Redux Toolkit；状态零散、彼此有派生关系时 Jotai 更顺手；想要少量样板代码的集中 store 选 Zustand。</li>
<li>服务端数据由 TanStack Query 或 SWR 管理，参见<a href="/questions/state-server-cache/">《为什么要用 TanStack Query 或 SWR 管理服务端状态？》</a>。</li>
</ul>
<h2>Zustand</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { create } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;zustand&#x27;</span>;
<span class="hljs-keyword">import</span> { useShallow } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;zustand/react/shallow&#x27;</span>;

<span class="hljs-keyword">const</span> useCartStore = <span class="hljs-title function_">create</span>(<span class="hljs-function">(<span class="hljs-params">set</span>) =&gt;</span> ({
  <span class="hljs-attr">items</span>: [],
  <span class="hljs-attr">coupon</span>: <span class="hljs-literal">null</span>,
  <span class="hljs-attr">addItem</span>: <span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> <span class="hljs-title function_">set</span>(<span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> ({ <span class="hljs-attr">items</span>: [...state.<span class="hljs-property">items</span>, item] })),
  <span class="hljs-attr">setCoupon</span>: <span class="hljs-function">(<span class="hljs-params">coupon</span>) =&gt;</span> <span class="hljs-title function_">set</span>({ coupon }), <span class="hljs-comment">// 默认浅合并，其他字段保留</span>
}));

<span class="hljs-comment">// 只订阅 items 的长度，coupon 变化不会让它重新渲染</span>
<span class="hljs-keyword">const</span> count = <span class="hljs-title function_">useCartStore</span>(<span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> state.<span class="hljs-property">items</span>.<span class="hljs-property">length</span>);

<span class="hljs-comment">// 选择器每次返回新对象时，要用 useShallow 按字段比较</span>
<span class="hljs-keyword">const</span> { items, addItem } = <span class="hljs-title function_">useCartStore</span>(
  <span class="hljs-title function_">useShallow</span>(<span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> ({ <span class="hljs-attr">items</span>: state.<span class="hljs-property">items</span>, <span class="hljs-attr">addItem</span>: state.<span class="hljs-property">addItem</span> })),
);
</code></pre></div>
<p>Zustand v5 用 <code>Object.is</code> 比较选择结果。选择器每次返回新对象而不包 <code>useShallow</code>，可能导致 &quot;Maximum update depth exceeded&quot;。也可以每个字段单独调用一次选择器。</p>
<h2>Jotai</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { atom, useAtom, useAtomValue } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;jotai&#x27;</span>;

<span class="hljs-keyword">const</span> priceAtom = <span class="hljs-title function_">atom</span>(<span class="hljs-number">100</span>);
<span class="hljs-keyword">const</span> countAtom = <span class="hljs-title function_">atom</span>(<span class="hljs-number">2</span>);
<span class="hljs-comment">// 派生原子：priceAtom 或 countAtom 变化时自动重新计算</span>
<span class="hljs-keyword">const</span> totalAtom = <span class="hljs-title function_">atom</span>(<span class="hljs-function">(<span class="hljs-params">get</span>) =&gt;</span> <span class="hljs-title function_">get</span>(priceAtom) * <span class="hljs-title function_">get</span>(countAtom));

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Total</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">useAtomValue</span>(totalAtom);
}
</code></pre></div>
<p>原子要定义在模块顶层或用 <code>useMemo</code> 保持引用稳定，在渲染中直接创建会导致 <code>useAtom</code> 无限循环。需要让不同子树拥有各自的状态、注入初始值或通过重新挂载重置所有原子时，才需要 Provider。</p>
<h2>Redux Toolkit</h2>
<p>Redux Toolkit 的写法和 reducer 纯粹性见<a href="/questions/state-redux/">《Redux 的单向数据流为什么强调 reducer 的纯粹性？》</a>。它的样板代码比前两者多，换来的是统一的修改入口：每次变化都有一个 action，可以在 DevTools 中逐条查看和回放，中间件可以统一处理日志、埋点和异步流程。</p>
<h2>对比</h2>
<table><thead><tr><th></th><th>Zustand</th><th>Jotai</th><th>Redux Toolkit</th></tr></thead><tbody><tr><td>状态组织</td><td>一个或几个集中 store</td><td>分散的原子</td><td>一个全局 store，按 slice 划分</td></tr><tr><td>订阅粒度</td><td>选择器</td><td>原子</td><td>选择器（<code>useSelector</code>）</td></tr><tr><td>Provider</td><td>不需要</td><td>可选</td><td>需要 <code>&lt;Provider store&gt;</code></td></tr><tr><td>修改方式</td><td>调用 <code>set</code></td><td>写原子</td><td>dispatch action</td></tr><tr><td>调试</td><td>可接 DevTools 中间件</td><td>有独立的调试工具</td><td>默认接入 DevTools</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>SSR 时要注意什么？模块级的 Zustand store 和 Jotai 默认 store 会被同一个服务器进程里的所有请求共享，SSR 时要为每个请求创建独立的 store，或在 Jotai 中为每个请求使用独立的 Provider。</li>
<li>只用 React 自带的 <code>useState</code> 和 Context 行不行？状态少、更新不频繁时可以。Context 值变化时所有使用它的组件都会重新渲染，状态多且更新频繁时才需要这些库的细粒度订阅。</li>
<li>三者能混用吗？可以，但同一份数据只应该有一个来源，否则需要在多处同步。</li>
</ul>`};export{e as default};