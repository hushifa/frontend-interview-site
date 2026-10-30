var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如页面上放了三个计数按钮，都是同一个 <code>ButtonCounter</code> 组件。点第一个，只应该第一个加 1，另外两个不动。</p>
<p>组件定义只有一份，实例却可以有很多个。如果 <code>data</code> 写成一个对象，所有实例拿到的都是这同一个对象，一个实例改了 <code>count</code>，其他实例读到的也变了。写成函数后，Vue 每创建一个实例就调用一次这个函数，每次都返回一个新对象，实例之间就互不影响。Vue 2 文档的原话是：组件的 <code>data</code> 必须是函数，这样每个实例才能维护一份独立的数据副本。</p>
<p>只创建一次的根实例没有共享问题，所以 Vue 2 里 <code>new Vue({ data: { ... } })</code> 写对象也行。Vue 3 统一了写法，<code>data</code> 不再接受普通对象，只接受返回对象的函数。</p>
<p>要注意，如果函数返回的是外面定义好的同一个对象，比如 <code>data() { return shared }</code>，实例之间照样共享。函数的作用在于每次新建对象，不在于写成函数这个形式。</p>
</blockquote>
<h2>先看共享对象会出什么问题</h2>
<p>下面不用 Vue，只用普通 JavaScript 模拟“一个组件定义创建多个实例”。<code>createInstance</code> 每次创建实例时，按 <code>data</code> 的写法取出数据。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createInstance</span>(<span class="hljs-params">options</span>) {
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">typeof</span> options.<span class="hljs-property">data</span> === <span class="hljs-string">&#x27;function&#x27;</span> ? options.<span class="hljs-title function_">data</span>() : options.<span class="hljs-property">data</span>;
  <span class="hljs-keyword">return</span> { data };
}

<span class="hljs-keyword">const</span> objectOptions = { <span class="hljs-attr">data</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> } };
<span class="hljs-keyword">const</span> a = <span class="hljs-title function_">createInstance</span>(objectOptions);
<span class="hljs-keyword">const</span> b = <span class="hljs-title function_">createInstance</span>(objectOptions);
a.<span class="hljs-property">data</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(b.<span class="hljs-property">data</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 1</span>

<span class="hljs-keyword">const</span> functionOptions = {
  <span class="hljs-title function_">data</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> };
  },
};
<span class="hljs-keyword">const</span> c = <span class="hljs-title function_">createInstance</span>(functionOptions);
<span class="hljs-keyword">const</span> d = <span class="hljs-title function_">createInstance</span>(functionOptions);
c.<span class="hljs-property">data</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(d.<span class="hljs-property">data</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p><code>a</code> 和 <code>b</code> 是两个实例，可只改了 <code>a</code>，<code>b</code> 也变成了 1。因为组件选项只定义了一次，<code>objectOptions.data</code> 就是一个对象，两个实例拿到的都是它的引用。</p>
<p>换成函数以后，每个实例创建时都调用一次 <code>data()</code>，函数体里的对象字面量每次都会生成新对象，所以 <code>c</code> 改了，<code>d</code> 还是 0。</p>
<h2>为什么根实例可以写对象</h2>
<p>问题的根源是“一份定义，多个实例”。Vue 2 的根实例用 <code>new Vue({ el: &#x27;#app&#x27;, data: { ... } })</code> 创建，这个选项对象只用一次，没有别的实例跟它抢数据，所以 Vue 2 文档里的根实例例子都直接写对象。</p>
<p>组件不一样。组件定义注册一次以后，模板里写几次就创建几个实例，所以 Vue 2 规定组件的 <code>data</code> 必须是函数。</p>
<h2>Vue 3 有什么变化</h2>
<p>Vue 3 的迁移指南写明，<code>data</code> 选项不再接受普通对象，只接受函数声明，根实例也一样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">createApp</span>({
  <span class="hljs-title function_">data</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> };
  },
}).<span class="hljs-title function_">mount</span>(<span class="hljs-string">&#x27;#app&#x27;</span>);
</code></pre></div>
<p>迁移指南还提到另一个变化：组件的 <code>data</code> 和 mixin、<code>extends</code> 里的 <code>data</code> 合并时，Vue 3 只合并第一层属性。比如 mixin 返回 <code>user: { name, id }</code>，组件返回 <code>user: { id: 2 }</code>，Vue 2 会把 <code>user</code> 里的字段深度合并，保留 <code>name</code>；Vue 3 直接用组件的 <code>user</code> 整个替换，结果只剩 <code>{ id: 2 }</code>。</p>
<p>组合式 API 里不写 <code>data</code>，状态在 <code>setup</code> 里用 <code>ref</code>、<code>reactive</code> 创建。<code>setup</code> 本身每个实例执行一次，所以天然是每个实例一份，见<a href="/questions/vue-ref-reactive/">《Vue 3 中 ref 和 reactive 有什么区别？》</a>。</p>
<h2>常见追问</h2>
<p><strong>data 能写成箭头函数吗？</strong></p>
<blockquote>
<p>能，但箭头函数里的 <code>this</code> 不是组件实例。Vue 文档给的办法是用第一个参数拿实例，比如 <code>data: (vm) =&gt; ({ a: vm.myProp })</code>。</p>
</blockquote>
<p><strong>data 里以 _ 或 $ 开头的属性为什么用 this 读不到？</strong></p>
<blockquote>
<p>Vue 文档说明，以 <code>_</code> 或 <code>$</code> 开头的属性不会代理到组件实例上，因为可能和 Vue 内部属性、API 方法冲突，要用 <code>this.$data._property</code> 读取。</p>
</blockquote>`};export{e as default};