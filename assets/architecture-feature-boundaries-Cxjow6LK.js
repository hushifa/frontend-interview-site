var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>划分功能边界，最实用的标准是“哪些代码会一起改”。按业务能力组织，比如订单、商品、账户各一个目录，比按 components、hooks、utils 这种技术类型组织，更容易做到一次需求只改一个目录。</p>
<p>每个功能模块只留一个公开入口，比如 <code>index.ts</code>，别的模块只能从这里导入，不能深入到它内部的文件。依赖方向也是单向的：页面依赖功能模块，功能模块依赖共享层，共享层不依赖任何业务模块。</p>
<p>状态也要有归属。每份状态只归一个模块所有，其他模块想读或想改，都走它的公开接口。</p>
<p>这些约定光靠自觉守不住，要用 ESLint 规则或依赖检查工具强制。迁移也要按需求一点点做，不要一次性大重构。</p>
</blockquote>
<h2>按技术类型组织有什么问题</h2>
<p>很多项目一开始是这样分目录的：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>src/
  components/OrderList.tsx
  hooks/useOrders.ts
  api/orders.ts
  store/orderSlice.ts
</code></pre></div>
<p>看着整齐，可改一个订单需求，要在四个目录之间来回跳。哪天要删掉订单功能，也很难确认哪些文件能一起删。因为同一个功能的代码被拆散了。</p>
<h2>按功能组织是什么样</h2>
<p>换成按功能分：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>src/
  app/            路由、全局布局、组装各功能
  features/
    orders/
      index.ts    公开入口
      api.ts
      OrderList.tsx
      useOrders.ts
    cart/
  shared/         与业务无关的 UI 组件、工具函数、请求封装
</code></pre></div>
<p>订单相关的东西都在 <code>features/orders/</code> 里。它对外只通过 <code>index.ts</code> 暴露：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// features/orders/index.ts</span>
<span class="hljs-keyword">export</span> { <span class="hljs-title class_">OrderList</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./OrderList&#x27;</span>;
<span class="hljs-keyword">export</span> { useOrderSummary } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./useOrders&#x27;</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">OrderSummary</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./types&#x27;</span>;
</code></pre></div>
<p>别的模块只能写 <code>import { OrderList } from &#x27;@/features/orders&#x27;</code>。这样 <code>api.ts</code> 和内部组件怎么改都行，只要入口导出的东西不变，外面就不受影响。</p>
<h2>依赖方向为什么要单向</h2>
<p>依赖只能这样走：</p>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>app → features → shared
</code></pre></div>
<p><code>shared</code> 不能导入任何 <code>features</code>，否则共享层就带上了业务，谁都离不开它。</p>
<p>功能之间尽量不直接依赖。确实需要的时候，比如购物车要显示商品信息，也只依赖对方的公开入口，并且避免循环依赖。</p>
<p>需要把几个功能组合起来时，放到 <code>app</code> 层或页面里做。页面同时引入订单和购物车的组件，在两者之间传数据，这样订单和购物车彼此都不用认识对方。</p>
<h2>状态归谁管</h2>
<p>订单列表的数据，只由 <code>orders</code> 模块负责获取和缓存。</p>
<p>购物车下单以后，订单列表需要刷新。这时购物车不应该直接去改订单的 store，而是调用 <code>orders</code> 暴露的刷新方法，或者让对应的查询缓存失效。这样以后订单数据出了问题，只用看一个模块。</p>
<h2>怎样强制执行这些约定</h2>
<p>ESLint 的 <code>no-restricted-imports</code> 规则可以禁止导入 <code>features/*/</code> 下面的内部路径。dependency-cruiser 这类工具可以检查依赖方向和循环依赖，放进 CI 里，违规的代码合不进去。如果是 monorepo，还可以把功能拆成独立的包，用 <code>package.json</code> 的 <code>exports</code> 字段在包这一级限制入口。</p>
<h2>旧项目怎样逐步迁移</h2>
<ol>
<li>新功能按新结构写。</li>
<li>修改旧功能时，顺手把它迁到 <code>features/</code> 下面。</li>
<li>先建立公开入口，再逐步收紧导入规则。</li>
</ol>
<p>为什么不一次性搬完？因为大规模搬迁会和别人的代码产生大量冲突，评审也几乎没法做。</p>
<h2>常见追问</h2>
<p><strong>共享组件该放哪里？</strong></p>
<blockquote>
<p>跟业务无关的按钮、表格放 <code>shared</code>。只在两个功能之间共享、而且带业务含义的组件，优先放在其中一方，通过它的公开入口导出。</p>
</blockquote>
<p><strong>这和微前端有什么关系？</strong></p>
<blockquote>
<p>功能边界是代码组织层面的事。微前端还涉及独立部署和运行时集成，见<a href="/questions/architecture-microfrontend/">《微前端适合解决什么组织和部署问题？》</a>。</p>
</blockquote>`};export{e as default};