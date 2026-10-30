var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写过 jQuery 的人都知道，数据变了要自己找到 DOM 去改，用户输入了还要自己去读 DOM 再写回数据。MVVM 用 ViewModel 和数据绑定替掉这部分手工活，三层怎样分工、和 MVC、MVP 有什么区别，见<a href="/questions/pattern-mvc-mvp-mvvm/">《MVC、MVP、MVVM 有什么区别？前端框架分别更接近哪种？》</a>。这道题只讲 Vue 是怎样把“数据绑定”做出来的。</p>
<p>第一样是响应式系统。读取响应式数据时，Vue 记下当前是谁在用；修改时，通知这些使用者重新执行。开发者只管改数据，不碰 DOM。</p>
<p>第二样是模板编译。Vue 3 文档说，模板会被编译成渲染函数，渲染函数返回虚拟 DOM 树；编译可以在构建时提前完成，也可以用运行时编译器即时完成。渲染函数作为响应式副作用执行，它用到的数据一变，就重新生成虚拟 DOM，和旧树比较后只更新变化的部分。第三样是 <code>v-model</code>，它按元素类型展开成“属性加事件”，把用户输入写回数据，形成表单上的双向绑定。</p>
<p>不过要准确地说。Vue 2 官方文档的原话是：Vue 虽然没有完全遵循 MVVM 模式，但设计上部分受到了它的启发，所以习惯用变量名 <code>vm</code>（ViewModel 的缩写）表示 Vue 实例。Vue 3 的文档已经不用 MVVM 来介绍了，它把 Vue 的核心概括为声明式渲染和响应式。</p>
</blockquote>
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
<p><code>count</code> 是数据，模板是界面，<code>createApp</code> 创建并挂载的组件实例把两者连起来，大致扮演 ViewModel 的角色。点按钮时，<code>@click</code> 改的是 <code>count</code>，没有任何代码去找按钮改文字，按钮上的数字却变了。</p>
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
<p>这个例子做了很多简化：真实的 Vue 按对象和属性分别记录依赖，组件更新会被缓冲后批量执行。完整过程见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>。</p>
<h2>模板怎样变成会自动更新的界面</h2>
<p>上面的 <code>effect</code> 里，“渲染函数”是手写的。真实的 Vue 里，这个函数由模板编译而来。Vue 文档描述了三步：编译，把模板编译成渲染函数，可以在构建时完成，也可以用运行时编译器在浏览器里完成；挂载，运行时渲染器调用渲染函数，遍历返回的虚拟 DOM 树，创建真实 DOM 节点；更新，挂载这一步本身作为响应式副作用执行，会追踪用到的所有响应式依赖，依赖变化时副作用重新执行，生成新的虚拟 DOM 树，和旧树比较后把必要的改动应用到真实 DOM 上。</p>
<p>所以前面例子里的 <code>view.text = ...</code> 对应的就是“渲染函数加挂载、更新”这一段，只是 Vue 比较的是两棵虚拟 DOM 树，而不是整段重写。编译器还会在渲染函数里标出哪些部分是动态的，更新时只比较这些部分。</p>
<h2>v-model 怎样把输入写回数据</h2>
<p>数据到界面这个方向靠的是上面的渲染副作用。界面到数据这个方向，Vue 用 <code>v-model</code> 简化。文档给出的等价写法是：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">:value</span>=<span class="hljs-string">&quot;text&quot;</span> @<span class="hljs-attr">input</span>=<span class="hljs-string">&quot;event =&gt; text = event.target.value&quot;</span> /&gt;</span>
<span class="hljs-comment">&lt;!-- 等价于 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">v-model</span>=<span class="hljs-string">&quot;text&quot;</span> /&gt;</span>
</code></pre></div>
<p><code>v-model</code> 会按元素选择不同的属性和事件：文本类 <code>&lt;input&gt;</code> 和 <code>&lt;textarea&gt;</code> 用 <code>value</code> 属性和 <code>input</code> 事件；复选框和单选框用 <code>checked</code> 属性和 <code>change</code> 事件；<code>&lt;select&gt;</code> 用 <code>value</code> 和 <code>change</code> 事件。文档还提醒，<code>v-model</code> 会忽略表单元素上初始的 <code>value</code>、<code>checked</code>、<code>selected</code> 属性，始终以绑定的 JavaScript 状态为准。</p>
<p>所以双向绑定在 Vue 里是“单向渲染加事件回写”的组合：输入事件改数据，数据变化再触发渲染副作用更新界面。</p>
<h2>为什么说 Vue 不是严格的 MVVM</h2>
<p>经典 MVVM 里，ViewModel 是一个单独的层，View 通过绑定只和它打交道。Vue 2 文档也只说“部分受到启发”，没有把自己归为 MVVM 框架。</p>
<p>实际写 Vue 时，边界没那么严格。组件实例同时承担了 ViewModel 和一部分 View 的职责，模板就写在组件里；组件也可以通过模板 ref 直接操作 DOM，这在纯粹的 MVVM 里是 View 和 ViewModel 的越界。Vue 3 的组合式 API 更是把状态、计算和副作用按功能组织，不再强调分层。</p>
<p>所以更贴切的说法是：Vue 借用了 MVVM 的数据绑定思想，核心实现是响应式系统加模板编译。</p>
<h2>常见追问</h2>
<p><strong><code>v-model</code> 是双向绑定，那 Vue 是双向数据流吗？</strong></p>
<blockquote>
<p>不是。<code>v-model</code> 只是语法糖，在原生输入框上相当于绑定 <code>value</code> 加监听 <code>input</code> 事件，数据仍然从父组件单向流向子组件，子组件通过事件通知父组件修改，见<a href="/questions/vue-vmodel/">《组件 v-model 的本质是什么？》</a>。</p>
</blockquote>
<p><strong>模板一定要在构建时编译吗？</strong></p>
<blockquote>
<p>不一定。Vue 文档说编译可以通过构建步骤提前完成，也可以用运行时编译器即时完成。用单文件组件加构建工具时一般是提前编译；直接在 HTML 里写模板、不经过构建时，要用带编译器的 Vue 版本。也可以跳过模板，直接手写渲染函数。</p>
</blockquote>`};export{e as default};