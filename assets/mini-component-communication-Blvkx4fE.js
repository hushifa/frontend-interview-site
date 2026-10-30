var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如页面里放一个商品卡片组件。页面要告诉卡片显示哪个商品，卡片被点了“加入购物车”要告诉页面。前者用 <code>properties</code>：子组件声明属性，父组件在 WXML 里传值。后者用 <code>triggerEvent</code>：子组件触发一个自定义事件并带上 <code>detail</code>，父组件用 <code>bind:事件名</code> 监听。</p>
<p>官方文档把这两种列为父子通信的最佳方式，因为数据流向清楚：数据往下走属性，通知往上走事件，子组件不需要知道父组件是谁。</p>
<p>另外两个工具解决的是别的问题。<code>behaviors</code> 是组件间共享代码的方式，类似 mixins，引用以后属性、数据、方法、生命周期都合并进组件。<code>selectComponent</code> 让父组件直接拿到子组件实例 <code>this</code>，可以调用它的方法，适合属性和事件都不够灵活的场景。</p>
<p>要注意，<code>triggerEvent</code> 默认不冒泡、不穿越组件边界，需要的话要设 <code>bubbles</code> 和 <code>composed</code>。<code>selectComponent</code> 官方不优先推荐，容易让组件互相依赖；可以引入内置 behavior <code>wx://component-export</code>，用 <code>export</code> 定义段只暴露需要的内容。</p>
</blockquote>
<h2>父传子用 properties</h2>
<p>子组件先在 <code>properties</code> 里声明属性，<code>type</code> 是类型，<code>value</code> 是初始值。父组件在 WXML 里给这个属性赋值，驼峰名可以写成连字符形式。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 子组件 goods-card.js</span>
<span class="hljs-title class_">Component</span>({
  <span class="hljs-attr">properties</span>: {
    <span class="hljs-attr">goodsId</span>: { <span class="hljs-attr">type</span>: <span class="hljs-title class_">String</span>, <span class="hljs-attr">value</span>: <span class="hljs-string">&#x27;&#x27;</span> },
    <span class="hljs-attr">price</span>: <span class="hljs-title class_">Number</span>,
  },
})
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 页面 WXML --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">goods-card</span> <span class="hljs-attr">goods-id</span>=<span class="hljs-string">&quot;{{currentId}}&quot;</span> <span class="hljs-attr">price</span>=<span class="hljs-string">&quot;{{currentPrice}}&quot;</span> /&gt;</span>
</code></pre></div>
<p><code>price: Number</code> 是简写，初始值和类型默认值相同时可以只写类型，<code>Number</code> 的默认值是 0。命名时有几个限制：属性名不能和 <code>data</code> 里的字段重名；<code>id</code>、<code>class</code>、<code>style</code>、<code>slot</code> 是 WXML 保留属性，写成组件属性也没法在 WXML 里赋值；<code>dataXxx</code> 这样的名字也赋不了值，因为 <code>data-xxx</code> 会被当成 dataset。</p>
<p>父组件更新传入的值时，同样要经过 <code>setData</code>，数据量大了一样会慢，优化方式见<a href="/questions/mini-setdata/">《setData 为什么会慢？如何优化小程序的数据更新？》</a>。</p>
<h2>子传父用 triggerEvent</h2>
<p>子组件调用 <code>this.triggerEvent(事件名, detail, 选项)</code>，父组件监听的写法和监听基础组件事件一样。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 子组件 goods-card.js</span>
<span class="hljs-title class_">Component</span>({
  <span class="hljs-attr">methods</span>: {
    <span class="hljs-title function_">onAddTap</span>(<span class="hljs-params"></span>) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">triggerEvent</span>(<span class="hljs-string">&#x27;add&#x27;</span>, { <span class="hljs-attr">goodsId</span>: <span class="hljs-variable language_">this</span>.<span class="hljs-property">data</span>.<span class="hljs-property">goodsId</span> })
    },
  },
})
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 页面 WXML --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">goods-card</span> <span class="hljs-attr">goods-id</span>=<span class="hljs-string">&quot;{{currentId}}&quot;</span> <span class="hljs-attr">bind:add</span>=<span class="hljs-string">&quot;onAdd&quot;</span> /&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 页面 JS</span>
<span class="hljs-title class_">Page</span>({
  <span class="hljs-title function_">onAdd</span>(<span class="hljs-params">e</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e.<span class="hljs-property">detail</span>.<span class="hljs-property">goodsId</span>)
  },
})
</code></pre></div>
<p>第三个参数是事件选项，三个选项默认都是 <code>false</code>：<code>bubbles</code> 表示是否冒泡；<code>composed</code> 表示能否穿越组件边界，为 <code>false</code> 时事件只在引用组件的那棵 Shadow 树上触发，不进入其他组件内部；<code>capturePhase</code> 表示是否有捕获阶段。所以默认情况下，事件只会被直接使用这个组件的地方监听到。</p>
<p>还要知道，<code>triggerEvent</code> 是同步触发的。文档提醒，在属性 <code>observer</code> 或数据监听器里直接调用可能导致递归更新，这时可以用 <code>wx.nextTick</code> 把触发放到独立任务里。</p>
<h2>behaviors 共享代码</h2>
<p>多个组件都需要同样的数据字段和方法时，用 <code>Behavior</code> 构造器定义一份，再在组件的 <code>behaviors</code> 里引用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> loadingBehavior = <span class="hljs-title class_">Behavior</span>({
  <span class="hljs-attr">data</span>: { <span class="hljs-attr">loading</span>: <span class="hljs-literal">false</span> },
  <span class="hljs-attr">methods</span>: {
    <span class="hljs-title function_">setLoading</span>(<span class="hljs-params">loading</span>) {
      <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">setData</span>({ loading })
    },
  },
})

<span class="hljs-title class_">Component</span>({
  <span class="hljs-attr">behaviors</span>: [loadingBehavior],
})
</code></pre></div>
<p>引用后，组件就有了 <code>loading</code> 字段和 <code>setLoading</code> 方法。同名时的规则要记住：属性和方法是覆盖式的，组件自己的覆盖 behavior 的，多个 behavior 之间靠后的覆盖靠前的；同名数据字段如果都是对象会合并，否则也是覆盖；生命周期函数、数据监听器这些是组合式的，都会执行，先按 behaviors 列表顺序执行，最后执行组件自己的。从基础库 2.9.2 起，<code>Page</code> 构造器也能用 <code>behaviors</code>。</p>
<p>所以 behaviors 解决的是“代码复用”，组件之间并不会因此共享同一份数据，每个组件实例的 <code>loading</code> 各是各的。</p>
<h2>selectComponent 直接拿实例</h2>
<p>父组件可以用 <code>this.selectComponent(选择器)</code> 拿到子组件实例 <code>this</code>，<code>selectAllComponents</code> 返回所有匹配的实例数组。子组件也可以用 <code>selectOwnerComponent</code> 拿到父组件实例。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 父组件</span>
<span class="hljs-keyword">const</span> form = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">selectComponent</span>(<span class="hljs-string">&#x27;#order-form&#x27;</span>)
form.<span class="hljs-title function_">validate</span>()
</code></pre></div>
<p>这样很方便，但父组件直接依赖子组件内部的方法和数据，子组件一改，父组件就跟着坏，官方文档说这种方式容易导致组件间过度耦合，不优先推荐。默认情况下，小程序与插件之间、不同插件之间的组件，用这些接口拿到的是 <code>null</code>。</p>
<p>要控制暴露的内容，可以在子组件里引入 <code>wx://component-export</code>，并写一个 <code>export</code> 定义段，这个功能从基础库 2.2.3 开始支持。对 exparser 组件框架，必须引入这个内置 behavior 才会生效。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 子组件 order-form.js</span>
<span class="hljs-title class_">Component</span>({
  <span class="hljs-attr">behaviors</span>: [<span class="hljs-string">&#x27;wx://component-export&#x27;</span>],
  <span class="hljs-title function_">export</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">validate</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">checkAll</span>() }
  },
  <span class="hljs-attr">methods</span>: {
    <span class="hljs-title function_">checkAll</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>
    },
  },
})
</code></pre></div>
<p>此后父组件 <code>selectComponent(&#x27;#order-form&#x27;)</code> 拿到的不再是完整实例，而是 <code>export</code> 返回的对象，只能调用 <code>validate</code>。</p>
<h2>常见追问</h2>
<p><strong>父子组件想双向同步一个值怎么办？</strong></p>
<blockquote>
<p>官方文档的父子通信里列了第三种方式：双向绑定。不想用双向绑定时，就按单向数据流写，父组件传属性，子组件改值时触发事件，父组件在事件里 <code>setData</code> 更新。</p>
</blockquote>
<p><strong>兄弟组件或跨层级组件怎么通信？</strong></p>
<blockquote>
<p>兄弟组件可以通过共同的父组件中转：一个触发事件给父组件，父组件再通过属性传给另一个。同一棵 Shadow 树里需要配合的组件，比如自己实现的表单和按钮，文档推荐用组件间关系 <code>relations</code>。</p>
</blockquote>
<p><strong>事件需要在页面上被祖先节点监听到，要怎么设？</strong></p>
<blockquote>
<p>只设 <code>bubbles: true</code>，事件会在使用这个组件的那棵 Shadow 树上冒泡。还要穿过外层组件的边界，就再设 <code>composed: true</code>。文档的例子里，组件嵌在另一个组件的 slot 中，只开 <code>bubbles</code> 时事件跳过外层组件内部的监听器，两个都开才会依次经过外层组件内部。</p>
</blockquote>`};export{e as default};