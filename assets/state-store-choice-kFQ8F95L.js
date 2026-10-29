var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Zustand 是一个集中的 store。<code>create</code> 返回一个 hook，组件用选择器读出自己要的字段，选择结果用 <code>Object.is</code> 比较，变了才重新渲染。它不需要 Provider，store 上的 <code>getState</code>、<code>setState</code> 在 React 外面也能调用。</p>
<p>Jotai 是把状态拆成一个个小原子。<code>atom</code> 只是一个定义，值实际保存在 store 里。派生原子的读函数里用 <code>get</code> 读别的原子，Jotai 会记下依赖，依赖变了自动重新计算。不用 Provider 时，所有组件共用一个默认 store。</p>
<p>Redux Toolkit 约束最多：状态只能通过 dispatch action 改变，reducer 是纯函数。<code>configureStore</code> 默认加上 thunk、连接 Redux DevTools，开发环境下还会检查有没有直接修改状态、有没有存进不可序列化的值。</p>
<p>怎么选，看状态的形状和团队要多少约束。业务状态集中、需要记录和回放每次操作，选 Redux Toolkit；状态零散、彼此之间有派生关系，Jotai 更顺手；想要一个样板代码少的集中 store，选 Zustand。要注意，服务端数据交给 TanStack Query 或 SWR，参见<a href="/questions/state-server-cache/">《为什么要用 TanStack Query 或 SWR 管理服务端状态？》</a>。</p>
</blockquote>
<h2>Zustand 怎么用</h2>
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
<p><code>set({ coupon })</code> 只传了一个字段，<code>items</code> 却不会丢，因为 <code>set</code> 默认把传入的对象浅合并进现有状态。</p>
<p>选择器决定了组件订阅什么。<code>state.items.length</code> 只在长度变化时才变，所以改 <code>coupon</code> 不会让这个组件重新渲染。</p>
<p>那为什么第二段要包一层 <code>useShallow</code>？因为选择器每次都返回一个新对象 <code>{ items, addItem }</code>，按 <code>Object.is</code> 比较永远不相等。Zustand v5 用 <code>Object.is</code> 比较选择结果，这样写而不包 <code>useShallow</code>，可能导致 “Maximum update depth exceeded” 报错。<code>useShallow</code> 改成逐个字段比较，字段都没变就算没变。另一种办法是每个字段单独调用一次选择器。</p>
<h2>Jotai 怎么用</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { atom, useAtom, useAtomValue } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;jotai&#x27;</span>;

<span class="hljs-keyword">const</span> priceAtom = <span class="hljs-title function_">atom</span>(<span class="hljs-number">100</span>);
<span class="hljs-keyword">const</span> countAtom = <span class="hljs-title function_">atom</span>(<span class="hljs-number">2</span>);
<span class="hljs-comment">// 派生原子：priceAtom 或 countAtom 变化时自动重新计算</span>
<span class="hljs-keyword">const</span> totalAtom = <span class="hljs-title function_">atom</span>(<span class="hljs-function">(<span class="hljs-params">get</span>) =&gt;</span> <span class="hljs-title function_">get</span>(priceAtom) * <span class="hljs-title function_">get</span>(countAtom));

<span class="hljs-keyword">function</span> <span class="hljs-title function_">Total</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">useAtomValue</span>(totalAtom);
}
</code></pre></div>
<p><code>totalAtom</code> 的读函数里 <code>get</code> 了两个原子，Jotai 就记住它依赖这两个。任何一个变了，<code>totalAtom</code> 重新计算，用到它的 <code>Total</code> 组件也跟着更新。</p>
<p>原子要定义在模块顶层，或者用 <code>useMemo</code> 保持引用稳定。如果在渲染过程中直接创建原子，每次渲染都是一个新原子，<code>useAtom</code> 会陷入无限循环。</p>
<p>什么时候需要 Provider？想让不同的子树各有一份状态、需要注入初始值、或者想通过重新挂载把所有原子重置，这几种情况才需要。</p>
<h2>Redux Toolkit 有什么不同</h2>
<p>Redux Toolkit 的写法和 reducer 为什么要纯，见<a href="/questions/state-redux/">《Redux 的单向数据流为什么强调 reducer 的纯粹性？》</a>。</p>
<p>它的样板代码比前两个多，换来的是统一的修改入口。每次变化都对应一个 action，可以在 DevTools 里一条条查看、回放，中间件也能统一处理日志、埋点和异步流程。</p>
<h2>三者放在一起比</h2>
<table><thead><tr><th></th><th>Zustand</th><th>Jotai</th><th>Redux Toolkit</th></tr></thead><tbody><tr><td>状态组织</td><td>一个或几个集中 store</td><td>分散的原子</td><td>一个全局 store，按 slice 划分</td></tr><tr><td>订阅粒度</td><td>选择器</td><td>原子</td><td>选择器（<code>useSelector</code>）</td></tr><tr><td>Provider</td><td>不需要</td><td>可选</td><td>需要 <code>&lt;Provider store&gt;</code></td></tr><tr><td>修改方式</td><td>调用 <code>set</code></td><td>写原子</td><td>dispatch action</td></tr><tr><td>调试</td><td>可接 DevTools 中间件</td><td>有独立的调试工具</td><td>默认接入 DevTools</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>SSR 时要注意什么？</strong></p>
<blockquote>
<p>模块级的 Zustand store 和 Jotai 的默认 store，会被同一个服务器进程里的所有请求共享。所以 SSR 时要为每个请求创建独立的 store，Jotai 可以给每个请求用一个独立的 Provider。</p>
</blockquote>
<p><strong>只用 React 自带的 <code>useState</code> 和 Context 行不行？</strong></p>
<blockquote>
<p>状态少、更新不频繁时可以。Context 的值一变，所有用到它的组件都会重新渲染，所以状态多、更新又频繁时，才需要这些库的细粒度订阅。</p>
</blockquote>
<p><strong>三者能混用吗？</strong></p>
<blockquote>
<p>可以。但同一份数据只应该有一个来源，否则就得在好几处之间同步。</p>
</blockquote>`};export{e as default};