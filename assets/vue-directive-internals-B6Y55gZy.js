var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如写了 <code>&lt;div v-pin:top.animate=&quot;200&quot;&gt;</code>。模板编译以后，这个 <code>div</code> 的 vnode 会被 <code>withDirectives</code> 包一层，参数是 <code>[[pin, 200, &#x27;top&#x27;, { animate: true }]]</code>，也就是指令对象、绑定值、参数、修饰符。<code>withDirectives</code> 把这些信息整理成 <code>binding</code> 对象，存进 vnode 的 <code>dirs</code> 数组。</p>
<p>之后渲染器处理这个元素时，会在固定的位置检查 <code>dirs</code>，调用对应的钩子：元素刚创建、属性还没设置时调 <code>created</code>；插入页面之前调 <code>beforeMount</code>；父组件和所有子组件都挂载完以后调 <code>mounted</code>。更新时先调 <code>beforeUpdate</code>，更新完调 <code>updated</code>；卸载前后分别调 <code>beforeUnmount</code> 和 <code>unmounted</code>。</p>
<p>每个钩子拿到 <code>el</code>、<code>binding</code>、<code>vnode</code>，更新的两个钩子还多一个 <code>prevVnode</code>。<code>binding</code> 里有 <code>value</code>、<code>oldValue</code>、<code>arg</code>、<code>modifiers</code>，还有所在组件实例 <code>instance</code> 和指令对象本身 <code>dir</code>。<code>oldValue</code> 只在 <code>beforeUpdate</code> 和 <code>updated</code> 里有意义。</p>
<p>要注意，指令写成一个函数时，Vue 会把它同时当作 <code>mounted</code> 和 <code>updated</code>，其他钩子都不会调用。除了 <code>el</code>，其他参数都应该当作只读；要在钩子之间共享数据，官方建议存在元素的 <code>dataset</code> 上。</p>
</blockquote>
<h2>模板里的指令被编译成了什么</h2>
<p>先看官方文档给的渲染函数写法，它和模板 <code>&lt;div v-pin:top.animate=&quot;200&quot;&gt;&lt;/div&gt;</code> 等价：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { h, withDirectives } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> pin = {
  <span class="hljs-title function_">mounted</span>(<span class="hljs-params"></span>) {},
  <span class="hljs-title function_">updated</span>(<span class="hljs-params"></span>) {},
};

<span class="hljs-keyword">const</span> vnode = <span class="hljs-title function_">withDirectives</span>(<span class="hljs-title function_">h</span>(<span class="hljs-string">&#x27;div&#x27;</span>), [[pin, <span class="hljs-number">200</span>, <span class="hljs-string">&#x27;top&#x27;</span>, { <span class="hljs-attr">animate</span>: <span class="hljs-literal">true</span> }]]);
</code></pre></div>
<p><code>withDirectives</code> 的第二个参数是一个数组，每个指令也是一个数组，格式是 <code>[指令, 值, 参数, 修饰符]</code>，后面不需要的项可以省略。模板编译器做的事情就是把 <code>v-pin:top.animate=&quot;200&quot;</code> 拆成这四项。指令如果是按名字全局注册的，渲染函数里拿不到对象，就用 <code>resolveDirective(&#x27;pin&#x27;)</code> 按名字查出来。</p>
<p>那 <code>withDirectives</code> 拿到这些以后做了什么？它并不调用任何钩子，只是往 vnode 上记一笔。下面用简化的代码模拟 vuejs/core 源码里的逻辑：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withDirectives</span>(<span class="hljs-params">vnode, directives</span>) {
  <span class="hljs-keyword">const</span> bindings = vnode.<span class="hljs-property">dirs</span> || (vnode.<span class="hljs-property">dirs</span> = []);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [raw, value, arg, modifiers = {}] <span class="hljs-keyword">of</span> directives) {
    <span class="hljs-comment">// 函数简写被展开成同时拥有 mounted 和 updated 的对象</span>
    <span class="hljs-keyword">const</span> dir = <span class="hljs-keyword">typeof</span> raw === <span class="hljs-string">&#x27;function&#x27;</span> ? { <span class="hljs-attr">mounted</span>: raw, <span class="hljs-attr">updated</span>: raw } : raw;
    bindings.<span class="hljs-title function_">push</span>({ dir, value, <span class="hljs-attr">oldValue</span>: <span class="hljs-literal">undefined</span>, arg, modifiers });
  }
  <span class="hljs-keyword">return</span> vnode;
}

<span class="hljs-keyword">const</span> <span class="hljs-title function_">color</span> = (<span class="hljs-params">el, binding</span>) =&gt; {
  el.<span class="hljs-property">style</span>.<span class="hljs-property">color</span> = binding.<span class="hljs-property">value</span>;
};
<span class="hljs-keyword">const</span> pin = { <span class="hljs-title function_">mounted</span>(<span class="hljs-params"></span>) {} };
<span class="hljs-keyword">const</span> vnode = <span class="hljs-title function_">withDirectives</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;div&#x27;</span> }, [
  [pin, <span class="hljs-number">200</span>, <span class="hljs-string">&#x27;top&#x27;</span>, { <span class="hljs-attr">animate</span>: <span class="hljs-literal">true</span> }],
  [color, <span class="hljs-string">&#x27;red&#x27;</span>],
]);

<span class="hljs-keyword">const</span> [first, second] = vnode.<span class="hljs-property">dirs</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(vnode.<span class="hljs-property">dirs</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 2</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">arg</span> + <span class="hljs-string">&#x27; &#x27;</span> + first.<span class="hljs-property">modifiers</span>.<span class="hljs-property">animate</span>); <span class="hljs-comment">// top true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(second.<span class="hljs-property">dir</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// mounted,updated</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(second.<span class="hljs-property">dir</span>.<span class="hljs-property">mounted</span> === second.<span class="hljs-property">dir</span>.<span class="hljs-property">updated</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>第三行说明了函数简写的真实含义：源码里遇到函数，就直接包成 <code>{ mounted: dir, updated: dir }</code>。所以函数简写的指令只会在挂载和更新时执行，<code>unmounted</code> 不会被调用，需要在卸载时清理的指令必须写成对象。</p>
<p>真实源码里还会记录 <code>instance</code>（当前组件的公开实例），并且在指令对象设置了 <code>deep: true</code> 时深度遍历绑定值，让对象内部的变化也能触发更新。另外，<code>withDirectives</code> 只能在渲染函数里调用，否则开发模式下会警告并原样返回 vnode。</p>
<h2>钩子分别在什么时候被调用</h2>
<p>记在 <code>dirs</code> 上的指令，由渲染器在处理元素的过程中调用。vuejs/core 的 <code>renderer.ts</code> 里，挂载一个元素的顺序是这样的：</p>
<ol>
<li>创建 DOM 元素，挂载子节点之后调用 <code>created</code>。这时元素的属性和事件监听还没设置，对应官方文档说的“在绑定元素的属性或事件监听器被应用之前调用”。</li>
<li>设置属性和事件监听，然后调用 <code>beforeMount</code>。</li>
<li>把元素插入容器。</li>
<li><code>mounted</code> 不是马上调用，而是放进渲染完成后的回调队列，等这一轮渲染结束才执行。所以官方文档说它在“绑定元素的父组件及它自己的所有子节点都挂载完成后调用”。</li>
</ol>
<p>更新时，<code>beforeUpdate</code> 在比对新旧 vnode 的属性和子节点之前调用，<code>updated</code> 同样放进渲染完成后的队列。卸载时，<code>beforeUnmount</code> 在移除元素之前调用，<code>unmounted</code> 放进渲染完成后的队列，在元素移除之后执行。</p>
<p>为什么 <code>mounted</code> 要延后？因为在它执行时，整棵子树都已经在页面上了，这时读取尺寸、调用 <code>focus()</code>、计算位置才可靠。<code>beforeMount</code> 时元素还没插入页面，这些操作拿不到正确结果。</p>
<h2>oldValue 是怎么来的</h2>
<p>每次更新，组件重新渲染得到新的 vnode，新 vnode 上的 <code>dirs</code> 也是 <code>withDirectives</code> 重新生成的，里面 <code>oldValue</code> 一开始都是 <code>undefined</code>。渲染器调用 <code>beforeUpdate</code>、<code>updated</code> 时，会按下标从旧 vnode 的 <code>dirs</code> 里取出上一次的 <code>value</code>，填进新 binding 的 <code>oldValue</code>。</p>
<p>这解释了官方文档里的两句话：<code>oldValue</code> 只在 <code>beforeUpdate</code> 和 <code>updated</code> 中可用，而且不论值有没有变都会有。挂载阶段没有旧 vnode，自然没有旧值。父组件每次重新渲染都会触发这两个钩子，所以钩子里最好先比较 <code>binding.value</code> 和 <code>binding.oldValue</code>，没变就直接返回，省掉不必要的 DOM 操作。</p>
<h2>为什么 binding 不能改</h2>
<p><code>binding</code> 和 vnode 在每次渲染时都会重新生成，在钩子里改它们，下次渲染就被覆盖了，而且 <code>binding</code> 还会被渲染器用来算下一次的 <code>oldValue</code>。所以官方要求除了 <code>el</code>，其他参数都当作只读。</p>
<p>需要在 <code>mounted</code> 和 <code>unmounted</code> 之间传东西时，比如事件处理函数，就把它挂在元素上。官方建议用 <code>dataset</code>。<code>dataset</code> 只能存字符串，函数引用存不进去，<a href="/questions/vue-custom-directives/">《Vue 自定义指令适合什么场景？》</a>里的点击外部关闭就把处理函数挂在 <code>el</code> 的一个自定义属性上，卸载时取出来移除。</p>
<h2>常见追问</h2>
<p><strong>指令用在组件上会怎样？</strong></p>
<blockquote>
<p>官方不推荐这么用。指令会作用在组件的根元素上；组件有多个根节点时，指令会被忽略并抛出警告。和普通属性不同，指令也不能通过 <code>v-bind=&quot;$attrs&quot;</code> 转交给组件内部的其他元素。</p>
</blockquote>
<p><strong>同一个元素上有多个指令，钩子按什么顺序调用？</strong></p>
<blockquote>
<p>按 <code>dirs</code> 数组的顺序，也就是 <code>withDirectives</code> 收到的指令顺序。渲染器调用某个钩子时，会遍历 <code>dirs</code>，对每个指令依次调用同名钩子。</p>
</blockquote>
<p><strong>指令里能用响应式数据吗？钩子会不会被意外追踪？</strong></p>
<blockquote>
<p>绑定值本身是在渲染函数里求值的，它变了会触发组件重新渲染，进而调用 <code>beforeUpdate</code> 和 <code>updated</code>。钩子执行时，vuejs/core 会暂停依赖追踪，所以在钩子里读取响应式数据不会把它收集成某个副作用的依赖。</p>
</blockquote>`};export{e as default};