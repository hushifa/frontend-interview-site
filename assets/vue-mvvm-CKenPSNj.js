var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写过 jQuery 的人都知道，数据变了要自己找到 DOM 去改，用户输入了还要自己去读 DOM 再写回数据。MVVM 想解决的就是这件事：把界面分成三层，Model 是数据，View 是界面，中间加一层 ViewModel，负责把数据绑定到界面上，并把界面上的操作转成对数据的修改。开发者只管改数据，界面跟着变。</p>
<p>在 Vue 里大致可以这样对应：组件的 <code>data</code> 或 <code>ref</code>、<code>reactive</code> 状态是 Model，模板是 View，组件实例就是 ViewModel。模板里的 <code>{{ }}</code> 和 <code>v-bind</code> 把数据显示出来，<code>v-on</code> 把用户操作变成方法调用，<code>v-model</code> 两个方向都做。</p>
<p>不过要准确地说。Vue 2 官方文档的原话是：Vue 虽然没有完全遵循 MVVM 模式，但设计上部分受到了它的启发，所以习惯用变量名 <code>vm</code>（ViewModel 的缩写）表示 Vue 实例。Vue 3 的文档已经不用 MVVM 来介绍了，它把 Vue 的核心概括为两点：声明式渲染和响应式。</p>
<p>所以面试时可以先讲 MVVM 的三层和数据绑定，再说明 Vue 是“受 MVVM 启发”，背后靠的是响应式系统追踪依赖、自动更新 DOM，而不是说“Vue 就是 MVVM 框架”。</p>
</blockquote>
<h2>MVVM 的三层各管什么</h2>
<p>Model 是业务数据，比如购物车里的商品列表。它不知道界面长什么样。</p>
<p>View 是用户看到的界面，比如列表和按钮。它只描述“数据显示成什么样子”，不写“怎么去改 DOM”。</p>
<p>ViewModel 是两者之间的桥。它持有 View 需要的数据和方法，通过数据绑定把数据推给 View；View 上发生点击、输入时，调用 ViewModel 的方法去改数据。因为有这层绑定，View 和 Model 不用直接打交道。</p>
<h2>用 Vue 的代码对一下</h2>
<p>Vue 3 官方文档入门的第一个例子就能看出这三层：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createApp } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-title function_">createApp</span>({
  <span class="hljs-title function_">data</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> };
  },
}).<span class="hljs-title function_">mount</span>(<span class="hljs-string">&#x27;#app&#x27;</span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;app&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> @<span class="hljs-attr">click</span>=<span class="hljs-string">&quot;count++&quot;</span>&gt;</span>Count is: {{ count }}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p><code>count</code> 是数据，模板是界面，<code>createApp</code> 创建并挂载的组件实例把两者连起来。点按钮时，<code>@click</code> 改的是 <code>count</code>，没有任何代码去找按钮改文字，按钮上的数字却变了。</p>
<p>Vue 3 文档对此的说法是：声明式渲染，用基于 JavaScript 状态的模板语法描述 HTML 输出；响应式，自动追踪 JavaScript 状态的变化，在变化时高效地更新 DOM。这两点正是 MVVM 里“数据绑定”在 Vue 中的实现方式。</p>
<h2>数据变了界面为什么会自己变</h2>
<p>关键在 ViewModel 怎么知道“数据变了，哪块界面要更新”。下面用 <code>Proxy</code> 写一个极简版本：读数据时记下是谁在用，改数据时通知它们重新执行。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">reactive</span>(<span class="hljs-params">target</span>) {
  <span class="hljs-keyword">const</span> subscribers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
  <span class="hljs-keyword">const</span> proxy = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(target, {
    <span class="hljs-title function_">get</span>(<span class="hljs-params">obj, key</span>) {
      <span class="hljs-keyword">if</span> (activeEffect) subscribers.<span class="hljs-title function_">add</span>(activeEffect);
      <span class="hljs-keyword">return</span> obj[key];
    },
    <span class="hljs-title function_">set</span>(<span class="hljs-params">obj, key, value</span>) {
      obj[key] = value;
      subscribers.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">effect</span>) =&gt;</span> <span class="hljs-title function_">effect</span>());
      <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
    },
  });
  <span class="hljs-keyword">return</span> proxy;
}

<span class="hljs-keyword">let</span> activeEffect = <span class="hljs-literal">null</span>;
<span class="hljs-keyword">function</span> <span class="hljs-title function_">effect</span>(<span class="hljs-params">fn</span>) {
  activeEffect = fn;
  <span class="hljs-title function_">fn</span>();
  activeEffect = <span class="hljs-literal">null</span>;
}

<span class="hljs-comment">// Model</span>
<span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> });

<span class="hljs-comment">// View：用一个对象代替 DOM 节点</span>
<span class="hljs-keyword">const</span> view = { <span class="hljs-attr">text</span>: <span class="hljs-string">&#x27;&#x27;</span> };
<span class="hljs-title function_">effect</span>(<span class="hljs-function">() =&gt;</span> {
  view.<span class="hljs-property">text</span> = <span class="hljs-string">\`Count is: <span class="hljs-subst">\${state.count}</span>\`</span>;
});
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-property">text</span>); <span class="hljs-comment">// Count is: 0</span>

<span class="hljs-comment">// 用户点击按钮时，事件处理只改数据</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">onClick</span>(<span class="hljs-params"></span>) {
  state.<span class="hljs-property">count</span>++;
}
<span class="hljs-title function_">onClick</span>();
<span class="hljs-title function_">onClick</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(view.<span class="hljs-property">text</span>); <span class="hljs-comment">// Count is: 2</span>
</code></pre></div>
<p><code>effect</code> 第一次执行时读了 <code>state.count</code>，<code>get</code> 就把这个“渲染函数”记了下来。后来 <code>onClick</code> 改了 <code>count</code>，<code>set</code> 通知它重新执行，<code>view.text</code> 就更新了。<code>onClick</code> 本身完全没碰 <code>view</code>。</p>
<p>这个例子做了很多简化：真实的 Vue 按对象和属性分别记录依赖，组件更新会被缓冲后批量执行，渲染函数生成的是虚拟 DOM 再比较差异。完整过程见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>。</p>
<h2>为什么说 Vue 不是严格的 MVVM</h2>
<p>经典 MVVM 里，ViewModel 是一个单独的层，View 通过绑定只和它打交道。Vue 2 文档也只说“部分受到启发”，没有把自己归为 MVVM 框架。</p>
<p>实际写 Vue 时，边界没那么严格。组件实例同时承担了 ViewModel 和一部分 View 的职责，模板就写在组件里；组件也可以通过模板 ref 直接操作 DOM，这在纯粹的 MVVM 里是 View 和 ViewModel 的越界。Vue 3 的组合式 API 更是把状态、计算和副作用按功能组织，不再强调分层。</p>
<p>所以更贴切的说法是：Vue 借用了 MVVM 的数据绑定思想，核心实现是响应式系统加模板编译。</p>
<h2>常见追问</h2>
<p><strong>MVVM 和 MVC 有什么区别？</strong></p>
<blockquote>
<p>MVC 里 Controller 接收用户输入，去改 Model，再决定更新哪个 View，更新界面通常是手动的。MVVM 用数据绑定取代了这部分手动工作：ViewModel 的数据一变，View 自动更新，View 上的输入也能自动写回。</p>
</blockquote>
<p><strong><code>v-model</code> 是双向绑定，那 Vue 是双向数据流吗？</strong></p>
<blockquote>
<p>不是。<code>v-model</code> 只是语法糖，在原生输入框上相当于绑定 <code>value</code> 加监听 <code>input</code> 事件，数据仍然从父组件单向流向子组件，子组件通过事件通知父组件修改，见<a href="/questions/vue-vmodel/">《组件 v-model 的本质是什么？》</a>。</p>
</blockquote>`};export{e as default};