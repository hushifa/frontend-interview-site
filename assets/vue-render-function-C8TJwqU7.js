var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如要写一个标题组件，传 <code>level: 2</code> 就渲染 <code>&lt;h2&gt;</code>，传 3 就渲染 <code>&lt;h3&gt;</code>。用模板得写一串 <code>v-if</code>，用渲染函数一行 <code>h(&#x27;h&#x27; + props.level, slots.default())</code> 就行。</p>
<p><code>h()</code> 的作用是创建虚拟节点，参数是 <code>h(类型, props, 子节点)</code>。类型可以是标签名，也可以直接传导入的组件对象；props 里 <code>class</code>、<code>style</code> 和模板里一样写，事件写成 <code>onClick</code> 这种 <code>on</code> 加大写字母开头的形式；子节点可以是字符串或节点数组。除了类型，其他参数都能省。</p>
<p>模板指令在渲染函数里都要换成 JavaScript：<code>v-if</code> 用三元表达式，<code>v-for</code> 用 <code>map</code> 并传 <code>key</code>，<code>v-model</code> 拆成 <code>modelValue</code> 和 <code>onUpdate:modelValue</code>。给组件传插槽要传函数，具名插槽写成函数对象，前面的 props 位置没有值时要填 <code>null</code>。JSX 是同一件事的另一种写法，Vue 的 JSX 能直接写 <code>class</code> 和 <code>for</code>。</p>
<p>要注意，在 <code>setup</code> 里要返回一个函数，而不是直接返回 <code>h()</code> 的结果，因为 <code>setup</code> 只执行一次，返回的渲染函数才会在每次更新时重新执行。另外同一个虚拟节点不能在树里用两次，需要重复时用函数每次新建。</p>
</blockquote>
<h2>模板和渲染函数是什么关系</h2>
<p>模板会先被编译成渲染函数，运行时执行渲染函数，得到一棵虚拟节点树，再交给渲染器更新 DOM。编译的过程见<a href="/questions/vue-template-compile/">《Vue 模板编译的过程是怎样的？parse、transform、generate 各做什么？》</a>。</p>
<p>所以手写渲染函数就是跳过编译，自己写编译器原本会生成的那部分代码。大部分场景模板更好读，编译器还能做静态提升、补丁标记等优化，见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。渲染函数适合逻辑比结构复杂的场景，比如上面按 <code>level</code> 切换标签。</p>
<h2>h() 的几种写法</h2>
<p>官方文档列出的参数形式如下，除了第一个参数都可以省略：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { h } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>);
<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;foo&#x27;</span> });
<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, { <span class="hljs-attr">class</span>: <span class="hljs-string">&#x27;bar&#x27;</span>, <span class="hljs-attr">innerHTML</span>: <span class="hljs-string">&#x27;hello&#x27;</span> });
<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, { <span class="hljs-attr">onClick</span>: <span class="hljs-function">() =&gt;</span> {} });
<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, { <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;foo&#x27;</span> }, <span class="hljs-string">&#x27;hello&#x27;</span>);
<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, <span class="hljs-string">&#x27;hello&#x27;</span>);
<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, [<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;span&#x27;</span>, <span class="hljs-string">&#x27;hello&#x27;</span>)]);
</code></pre></div>
<p>第二个参数为什么能同时放 <code>class</code> 和 <code>innerHTML</code>？文档说明，HTML 属性和 DOM 属性都可以写在 props 里，Vue 会自动选择正确的设置方式。确实需要强制时，可以加 <code>.</code> 前缀表示 DOM 属性、<code>^</code> 前缀表示 HTML 属性。</p>
<p>第一个参数传组件时，直接传导入的组件对象，不需要注册：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> <span class="hljs-title class_">Foo</span> <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;./Foo.vue&#x27;</span>;

<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, [<span class="hljs-title function_">h</span>(<span class="hljs-title class_">Foo</span>, { <span class="hljs-attr">msg</span>: <span class="hljs-string">&#x27;hi&#x27;</span> })]);
</code></pre></div>
<h2>在 setup 里返回渲染函数</h2>
<p>组合式 API 里，<code>setup</code> 返回一个函数，这个函数就是渲染函数：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { ref, h } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">props</span>: { <span class="hljs-attr">msg</span>: <span class="hljs-title class_">String</span> },
  <span class="hljs-title function_">setup</span>(<span class="hljs-params">props</span>) {
    <span class="hljs-keyword">const</span> count = <span class="hljs-title function_">ref</span>(<span class="hljs-number">1</span>);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, { <span class="hljs-attr">onClick</span>: <span class="hljs-function">() =&gt;</span> count.<span class="hljs-property">value</span>++ }, props.<span class="hljs-property">msg</span> + count.<span class="hljs-property">value</span>);
  },
};
</code></pre></div>
<p>为什么不能直接 <code>return h(&#x27;div&#x27;, ...)</code>？因为 <code>setup</code> 每个组件实例只执行一次，直接返回节点就只渲染这一次的结果。返回函数以后，Vue 每次更新都调用它，函数里读到的 <code>count.value</code> 和 <code>props.msg</code> 是最新值，也会被收集成依赖。</p>
<h2>指令在渲染函数里怎么写</h2>
<p>模板指令都要换成普通 JavaScript。下面把 <code>v-if</code>、<code>v-for</code> 和 <code>v-model</code> 放在一起看：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, [
  ok.<span class="hljs-property">value</span> ? <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;p&#x27;</span>, <span class="hljs-string">&#x27;yes&#x27;</span>) : <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;p&#x27;</span>, <span class="hljs-string">&#x27;no&#x27;</span>),
  <span class="hljs-title function_">h</span>(
    <span class="hljs-string">&#x27;ul&#x27;</span>,
    items.<span class="hljs-property">value</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">{ id, text }</span>) =&gt;</span> <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;li&#x27;</span>, { <span class="hljs-attr">key</span>: id }, text)),
  ),
  <span class="hljs-title function_">h</span>(<span class="hljs-title class_">SomeInput</span>, {
    <span class="hljs-attr">modelValue</span>: text.<span class="hljs-property">value</span>,
    <span class="hljs-string">&#x27;onUpdate:modelValue&#x27;</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> (text.<span class="hljs-property">value</span> = value),
  }),
]);
</code></pre></div>
<p><code>v-for</code> 换成 <code>map</code> 以后，<code>key</code> 仍然要写，它放在 props 里。组件上的 <code>v-model</code> 本来就是 <code>modelValue</code> 加 <code>update:modelValue</code> 事件的简写，见<a href="/questions/vue-vmodel/">《组件 v-model 的本质是什么？》</a>，渲染函数里要自己把这两个都传上。</p>
<p>事件修饰符里，<code>.passive</code>、<code>.capture</code>、<code>.once</code> 可以直接拼进事件名，比如 <code>onClickCapture</code>、<code>onKeyupOnce</code>；<code>.self</code>、<code>.stop</code> 这类要用 <code>withModifiers(handler, [&#x27;self&#x27;])</code> 包一下。</p>
<p>同一个节点能不能复用？文档要求组件树里的虚拟节点必须唯一。想渲染 20 个相同的段落，不能把同一个 <code>h(&#x27;p&#x27;, &#x27;hi&#x27;)</code> 放进数组 20 次，要用 <code>Array.from({ length: 20 }).map(() =&gt; h(&#x27;p&#x27;, &#x27;hi&#x27;))</code> 每次新建。</p>
<h2>插槽为什么要传函数</h2>
<p>组件内部渲染插槽时，<code>slots</code> 上的每个插槽都是一个函数，调用后返回节点数组：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">setup</span>(<span class="hljs-params">props, { slots }</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> [
    <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, slots.<span class="hljs-title function_">default</span>()),
    <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>, slots.<span class="hljs-title function_">footer</span>({ <span class="hljs-attr">text</span>: props.<span class="hljs-property">message</span> })),
  ];
}
</code></pre></div>
<p>父组件给子组件传插槽，也要传函数而不是节点数组：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">h</span>(<span class="hljs-title class_">MyComponent</span>, <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;hello&#x27;</span>);

<span class="hljs-title function_">h</span>(<span class="hljs-title class_">MyComponent</span>, <span class="hljs-literal">null</span>, {
  <span class="hljs-attr">default</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;default slot&#x27;</span>,
  <span class="hljs-attr">footer</span>: <span class="hljs-function">(<span class="hljs-params">{ text }</span>) =&gt;</span> <span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;p&#x27;</span>, text),
});
</code></pre></div>
<p>第二种写法里的 <code>null</code> 不能省，否则插槽对象会被当成 props。为什么要传函数？文档说明，传函数让子组件调用它，插槽里用到的数据就被子组件追踪成依赖，更新更准确，也更高效。作用域插槽就是子组件调用时传了参数，比如上面的 <code>{ text }</code>。插槽本身的概念见<a href="/questions/vue-slots-provide/">《插槽、作用域插槽和 provide/inject 各解决什么问题？》</a>。</p>
<h2>Vue 的 JSX 和 React 有什么不同</h2>
<p>JSX 是写渲染函数的另一种语法，最后同样编译成创建虚拟节点的调用。项目里通过 <code>create-vue</code> 或 Vue CLI 开启，手动配置用 <code>@vue/babel-plugin-jsx</code>。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">const</span> vnode = (
  <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;card&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{handleClick}</span>&gt;</span>
    {ok.value ? <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>yes<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span> : <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>no<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>}
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>
);
</code></pre></div>
<p>文档强调 Vue 的 JSX 转换和 React 的不同。第一，可以直接写 <code>class</code> 和 <code>for</code>，不用写 <code>className</code>、<code>htmlFor</code>。第二，给组件传插槽时，子节点要写成函数对象：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx">&lt;<span class="hljs-title class_">MyComponent</span>&gt;
  {{
    <span class="hljs-attr">default</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;default slot&#x27;</span>,
    <span class="hljs-attr">foo</span>: <span class="hljs-function">() =&gt;</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">div</span>&gt;</span>foo<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span></span>,
  }}
&lt;/<span class="hljs-title class_">MyComponent</span>&gt;
</code></pre></div>
<p>用 TSX 时，<code>tsconfig.json</code> 要设置 <code>&quot;jsx&quot;: &quot;preserve&quot;</code>，让 TypeScript 保留 JSX 交给 Vue 的转换处理。Vue 3.4 起不再隐式注册全局 <code>JSX</code> 命名空间，要加 <code>&quot;jsxImportSource&quot;: &quot;vue&quot;</code>，或者在文件顶部写 <code>/* @jsxImportSource vue */</code>。</p>
<h2>常见追问</h2>
<p><strong>函数式组件是什么？</strong></p>
<blockquote>
<p>就是一个普通函数，接收 props 和上下文，返回虚拟节点，比如 <code>function MyComponent(props, { slots, emit, attrs }) {}</code>。它不创建组件实例，没有 <code>this</code>，也没有常规的生命周期钩子。声明 props 要写在函数上，比如 <code>MyComponent.props = [&#x27;value&#x27;]</code>。</p>
</blockquote>
<p><strong>选项式 API 里怎么写渲染函数？</strong></p>
<blockquote>
<p>写 <code>render()</code> 选项，在里面用 <code>this</code> 访问组件数据，比如 <code>render() { return h(&#x27;div&#x27;, this.message) }</code>，插槽通过 <code>this.$slots.default()</code> 渲染。</p>
</blockquote>`};export{e as default};