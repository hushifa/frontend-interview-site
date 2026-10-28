var e={answerHtml:`<h2>简答</h2>
<ul>
<li>按业务能力（订单、商品、账户）组织代码，比按技术类型（components、hooks、utils）更容易让一次需求只改一个目录。</li>
<li>每个功能模块只通过一个公开入口（如 <code>index.ts</code>）对外暴露，其他模块不能深层导入它的内部文件。</li>
<li>依赖方向单向：页面依赖功能模块，功能模块依赖共享层，共享层不依赖任何业务模块。</li>
<li>每份状态只归一个模块所有，其他模块通过它的公开接口读取或触发变更。</li>
<li>用 ESLint 规则或依赖检查工具强制这些约束，并按需求逐步迁移，而不是一次性重构。</li>
</ul>
<h2>按技术类型组织的问题</h2>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>src/
  components/OrderList.tsx
  hooks/useOrders.ts
  api/orders.ts
  store/orderSlice.ts
</code></pre></div>
<p>改一个订单需求要在四个目录间跳转，删除订单功能时也很难确认哪些文件可以一起删。</p>
<h2>按功能组织</h2>
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
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-comment">// features/orders/index.ts</span>
<span class="hljs-keyword">export</span> { <span class="hljs-title class_">OrderList</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./OrderList&#x27;</span>;
<span class="hljs-keyword">export</span> { useOrderSummary } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./useOrders&#x27;</span>;
<span class="hljs-keyword">export</span> <span class="hljs-keyword">type</span> { <span class="hljs-title class_">OrderSummary</span> } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./types&#x27;</span>;
</code></pre></div>
<p>其他模块只能 <code>import { OrderList } from &#x27;@/features/orders&#x27;</code>，<code>api.ts</code> 和内部组件可以自由修改而不影响外部。</p>
<h2>依赖方向</h2>
<div class="not-prose code-block"><div class="code-language">代码</div><pre><code>app → features → shared
</code></pre></div>
<ul>
<li><code>shared</code> 不导入任何 <code>features</code>。</li>
<li>功能之间尽量不直接依赖。确实需要时（例如购物车需要显示商品信息），只依赖对方的公开入口，并避免循环依赖。</li>
<li>跨功能的组合放到 <code>app</code> 层或页面中完成：页面同时引入订单和购物车组件，并在两者之间传递数据。</li>
</ul>
<h2>状态归属</h2>
<p>订单列表的数据只由 <code>orders</code> 模块获取和缓存。购物车下单后需要刷新订单列表时，调用 <code>orders</code> 暴露的刷新方法或触发查询失效，而不是直接修改订单的 store。这样排查订单数据问题时只需要看一个模块。</p>
<h2>强制约束</h2>
<ul>
<li>ESLint 的 <code>no-restricted-imports</code> 禁止导入 <code>features/*/</code> 下的内部路径。</li>
<li>dependency-cruiser 等工具检查依赖方向和循环依赖，放进 CI。</li>
<li>monorepo 中可以把功能拆成独立包，用 <code>exports</code> 字段在包级别限制入口。</li>
</ul>
<h2>逐步迁移</h2>
<ol>
<li>新功能按新结构编写。</li>
<li>修改旧功能时顺手把它迁移到 <code>features/</code> 下。</li>
<li>先建立公开入口，再逐步收紧导入规则。</li>
</ol>
<p>一次性大规模搬迁会产生大量冲突，也很难评审。</p>
<h2>常见追问</h2>
<ul>
<li>共享组件放哪里？与业务无关的按钮、表格放 <code>shared</code>；只在两个功能间共享且带业务含义的组件，优先考虑放在其中一方并通过公开入口导出。</li>
<li>这和微前端有什么关系？功能边界是代码组织层面；微前端还涉及独立部署和运行时集成，见《微前端适合解决什么组织和部署问题？》。</li>
</ul>`};export{e as default};