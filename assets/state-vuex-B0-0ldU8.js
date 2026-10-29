var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>购物车数量要同时显示在顶栏、商品页和结算页，几个互不相干的组件都要读、都要改，靠 props 和事件一层层传很麻烦。Vuex 的做法是把这类共享状态集中放进一个 store，所有组件都从这里读，也都按同一套规则改。</p>
<p>store 有五个部分。<code>state</code> 存原始数据；<code>getter</code> 是从 state 算出来的派生数据，相当于 store 的 computed；<code>mutation</code> 是唯一能修改 state 的地方，组件用 <code>commit</code> 调用它；<code>action</code> 用来处理异步，比如先请求接口，拿到结果后再 <code>commit</code> 一个 mutation，组件用 <code>dispatch</code> 调用它；<code>module</code> 把一个大 store 按业务拆成多个小模块，开启 <code>namespaced</code> 后各自的名字互不冲突。</p>
<p>为什么要把改数据和异步分开？Vuex 文档要求 mutation 必须是同步函数。因为调试工具要在每次 mutation 前后记录状态快照，如果 mutation 里有异步回调，回调里改的数据就记录不到，状态变化没法追踪。所以异步都放在 action 里，action 本身不改 state，只在合适的时机提交 mutation。</p>
<p>要注意，Vue 官方的状态管理库已经换成了 Pinia。Vuex 3 和 4 仍然维护，但基本不会再加新功能，新项目推荐直接用 Pinia。</p>
</blockquote>
<h2>一个完整的 store</h2>
<p>下面用一个购物车模块把五个部分串起来：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cart = {
  <span class="hljs-attr">namespaced</span>: <span class="hljs-literal">true</span>,
  <span class="hljs-attr">state</span>: <span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">items</span>: [] }),
  <span class="hljs-attr">getters</span>: {
    <span class="hljs-attr">count</span>: <span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> state.<span class="hljs-property">items</span>.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, item</span>) =&gt;</span> sum + item.<span class="hljs-property">quantity</span>, <span class="hljs-number">0</span>),
  },
  <span class="hljs-attr">mutations</span>: {
    <span class="hljs-title function_">setItems</span>(<span class="hljs-params">state, items</span>) {
      state.<span class="hljs-property">items</span> = items;
    },
  },
  <span class="hljs-attr">actions</span>: {
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">loadCart</span>(<span class="hljs-params">{ commit }</span>) {
      <span class="hljs-keyword">const</span> items = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/cart&#x27;</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">res</span>) =&gt;</span> res.<span class="hljs-title function_">json</span>());
      <span class="hljs-title function_">commit</span>(<span class="hljs-string">&#x27;setItems&#x27;</span>, items);
    },
  },
};

<span class="hljs-keyword">const</span> store = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Vuex</span>.<span class="hljs-title class_">Store</span>({ <span class="hljs-attr">modules</span>: { cart } });
</code></pre></div>
<p>组件里读数量用 <code>store.getters[&#x27;cart/count&#x27;]</code>，加载购物车用 <code>store.dispatch(&#x27;cart/loadCart&#x27;)</code>。因为模块开了 <code>namespaced: true</code>，名字前面都要带上 <code>cart/</code>，别的模块也有 <code>loadCart</code> 也不会冲突。</p>
<p><code>loadCart</code> 为什么不直接写 <code>state.items = items</code>？action 拿到的是一个上下文对象，按规则只通过 <code>commit</code> 修改数据。这样每一次数据变化都对应一条 mutation 记录，在调试工具里能看到是哪个 mutation、带了什么参数、改之前和改之后的 state。</p>
<p>模块的 <code>state</code> 写成函数，是为了同一个模块被注册多次时，每次都拿到一份新对象，不会共用同一份数据，和组件的 <code>data</code> 必须是函数是同一个道理。</p>
<h2>刷新页面数据为什么没了</h2>
<p>Vuex 的数据存在内存里，刷新页面后 store 会重新创建，state 回到初始值。需要保留的数据，比如登录信息、购物车，要自己存到 <code>localStorage</code> 或交给服务端，页面加载时再读回来。常见做法是写一个 Vuex 插件，订阅 mutation，每次变化后把需要的部分写进存储。</p>
<h2>常见追问</h2>
<p><strong>Vuex 和 Pinia 有什么区别？</strong></p>
<blockquote>
<p>Pinia 去掉了 mutation，直接在 action 里改 state，同步异步都写在 action 里；没有嵌套模块，每个 store 是独立的，按需引入；对 TypeScript 的类型推导也更好。Vuex 的 README 里说可以把 Pinia 看作换了名字的 Vuex 5。Pinia 的用法见<a href="/questions/state-pinia/">《Pinia 中 state、getter 和 action 应如何分工？》</a>。</p>
</blockquote>
<p><strong>为什么不直接在组件里改 store.state？</strong></p>
<blockquote>
<p>能改，数据也会变，但绕过了 mutation，调试工具记录不到，出问题很难查是谁改的。开启 <code>strict: true</code> 后，在 mutation 之外修改 state 会抛错，开发环境可以用它检查，生产环境不要开，因为它要深度侦听整个状态树，开销很大。</p>
</blockquote>
<p><strong>mapState、mapGetters 这些辅助函数做了什么？</strong></p>
<blockquote>
<p>它们帮你生成组件的 computed 或 methods，比如 <code>...mapGetters(&#x27;cart&#x27;, [&#x27;count&#x27;])</code> 等于在组件里写了一个返回 <code>this.$store.getters[&#x27;cart/count&#x27;]</code> 的计算属性，省去重复代码。</p>
</blockquote>`};export{e as default};