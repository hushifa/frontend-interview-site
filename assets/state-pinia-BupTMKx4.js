var e={answerHtml:`<h2>简答</h2>
<p>Pinia 的 state 存放真实状态，getters 是带缓存的派生值，actions 封装业务操作（可以是异步的）。从 store 解构 state 和 getters 要用 storeToRefs 才能保持响应性，actions 可以直接解构。组合式写法的 store 没有自带 $reset，需要自己实现。SSR 中每个请求要创建独立的 Pinia 实例，避免跨用户共享状态。</p>
<p>多个组件要显示同一份收藏题目时，可以由一个 store 保存收藏 ID。收藏数量不必再保存一份，而是从 ID 列表计算；点击收藏则通过一个操作决定新增还是移除。</p>
<p>这对应 Pinia 的三种职责：state 保存需要维护的数据，getter 计算依赖状态的派生值，action 表达修改或协调业务的操作。不是每个字段都应该有三份对应代码，更不是把所有组件状态搬进 store 就算完成状态管理。</p>
<h2>用收藏列表看三者怎样配合</h2>
<p>下面的 bookmarks-store.js 使用 Option Store。应用需要安装并注册 Pinia，再在对应应用上下文中取得这个 store：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { defineStore } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;pinia&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> useBookmarksStore = <span class="hljs-title function_">defineStore</span>(<span class="hljs-string">&#x27;bookmarks&#x27;</span>, {
  <span class="hljs-attr">state</span>: <span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">ids</span>: [] }),
  <span class="hljs-attr">getters</span>: {
    <span class="hljs-attr">count</span>: <span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> state.<span class="hljs-property">ids</span>.<span class="hljs-property">length</span>,
  },
  <span class="hljs-attr">actions</span>: {
    <span class="hljs-title function_">toggle</span>(<span class="hljs-params">id</span>) {
      <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> id !== <span class="hljs-string">&#x27;string&#x27;</span> || id.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) {
        <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;题目 ID 不能为空&#x27;</span>);
      }
      <span class="hljs-keyword">const</span> index = <span class="hljs-variable language_">this</span>.<span class="hljs-property">ids</span>.<span class="hljs-title function_">indexOf</span>(id);
      <span class="hljs-keyword">if</span> (index === -<span class="hljs-number">1</span>) <span class="hljs-variable language_">this</span>.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(id);
      <span class="hljs-keyword">else</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">ids</span>.<span class="hljs-title function_">splice</span>(index, <span class="hljs-number">1</span>);
    },
    <span class="hljs-title function_">clear</span>(<span class="hljs-params"></span>) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">ids</span> = [];
    },
  },
});
</code></pre></div>
<p>ids 是真正存储的状态，count 随它变化，toggle 集中表达“已收藏则移除，否则加入”。清空或移除时不需要再手工维护数量，因此不会出现列表已经为空、数量仍是 3 的不一致。</p>
<p>state 用函数返回初始状态，store ID 应在 Pinia 实例内唯一。多个组件取得同一实例中的同一个 store，会共享它的状态；不是每调用一次 useBookmarksStore 都产生一份独立收藏。</p>
<h2>Getter 应表达计算，而不是偷偷发请求</h2>
<p>getter 类似计算属性，适合数量、过滤后的视图和根据当前状态得出的判断。它不应为了读取一个值就发请求、改 state 或产生其他不可预期的副作用。</p>
<p>如果某个派生结果计算昂贵，可以进一步优化依赖和数据结构，但不要为了省一次计算随手复制成第二份可变状态；需要复制时也应明确同步策略。</p>
<p>只在一个组件里临时使用的派生展示，也可以留在组件 computed，不一定全部加入公共 store API。</p>
<h2>Action 可以异步，但不会自动解决竞态</h2>
<p>Option Store 的 action 可以通过 this 访问 store，所以需要 this 的方法不应写成捕获外部 this 的箭头函数。action 可以返回普通值或 Promise，也可以调用其他 action。</p>
<p>异步加载时仍要决定错误如何传给调用者、取消如何处理、旧结果是否允许覆盖当前状态。Pinia 不会因为函数放进 actions，就自动取消上一次请求或为你建立请求缓存。</p>
<p>例如搜索条件改变后，较早的 action 请求可能更晚完成。可以使用请求身份、取消信号或成熟的数据查询层处理；loading 和 error 的收尾也要属于请求，不能在任意 finally 中无条件清掉新请求状态。</p>
<h2>为什么解构时常用 storeToRefs</h2>
<p>组件内可以这样取得响应式引用与操作：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { storeToRefs } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;pinia&#x27;</span>;
<span class="hljs-keyword">import</span> { useBookmarksStore } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./bookmarks-store.js&#x27;</span>;

<span class="hljs-keyword">const</span> store = <span class="hljs-title function_">useBookmarksStore</span>();
<span class="hljs-keyword">const</span> { ids, count } = <span class="hljs-title function_">storeToRefs</span>(store);
<span class="hljs-keyword">const</span> { toggle } = store;
</code></pre></div>
<p>在脚本中通过 ids.value、count.value 读取引用；Vue 模板通常会按规则自动解包。action 可以直接解构，因为 Pinia 会把它绑定到对应 store。</p>
<p>普通的 <code>const { count } = store</code> 得到的是当时的数字，不会自动跟着后续状态更新。对象或数组解构更容易误判：取得的响应式对象可能仍能反映内部修改，但 store 把该属性替换成新对象后，旧引用就脱离了新的属性值。storeToRefs 用来保留与 store 属性的关联。</p>
<p>它也不是把所有东西都包装一遍，会跳过 action 和非响应式属性；不需要解构时，直接读取 store.count 同样清楚。</p>
<h2>Pinia 并不强制只能通过 action 修改</h2>
<p>Pinia 允许直接修改 state，也提供 $patch 等方式。把重要业务修改集中到 action，是为了明确职责、验证和复用，不是因为所有直接赋值都会被框架禁止。</p>
<p>$patch 可以组织一组修改和追踪，但不是具有回滚保证的数据库事务。业务执行到一半失败，仍要自己决定如何恢复。</p>
<p>Option Store 通常有基于初始 state 的 $reset；Setup Store 则需要按自身结构实现重置逻辑，不能假设两种写法在这方面完全相同。</p>
<p>Setup Store 中 ref、computed 与函数分别可承担 state、getter 与 action。需要让 Pinia 管理、序列化和调试的状态应按要求返回，不能把它藏在闭包里后还期待 SSR 和插件自动处理。</p>
<h2>共享范围和持久化要另外设计</h2>
<p>输入框当前是否聚焦、某个菜单是否展开，通常可以留在组件；可分享的筛选更适合与 URL 关联；服务端缓存还涉及失效、重试和去重。它们不应因为 store 方便就全部混成长期全局对象。</p>
<p>刷新页面后，普通内存 store 会重新建立。持久化需要明确保存哪些字段、如何迁移、何时清理和怎样处理损坏，插件不会替应用判断哪些数据值得保存。</p>
<p>SSR 则应为不同请求建立正确隔离的 Pinia 实例，组件外调用 store 时传入对应实例，避免复用全局用户状态。需要发送到客户端的状态还要正确序列化与转义，防止数据泄漏或 HTML 注入；服务端秘密不应因为存在 store 中就被整体输出。</p>`};export{e as default};