var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在单文件组件里写 <code>&lt;style scoped&gt;</code>，<code>.title { color: red }</code> 编译后会变成 <code>.title[data-v-7ba5bd90]</code>，而这个组件渲染出来的元素都会带上 <code>data-v-7ba5bd90</code> 这个属性。哈希每个组件不同，所以这条样式只能命中本组件的元素。</p>
<p>这样做是因为浏览器的 CSS 默认是全局的，两个组件都写 <code>.title</code> 就会互相影响。Vue 不依赖 Shadow DOM，只靠编译期改写选择器和给元素加属性，就做到了组件级隔离，不需要任何 polyfill。</p>
<p>要穿透隔离时有几个伪类：<code>:deep(.b)</code> 把属性挪到前面的父级，用来改子组件内部的样式；<code>:slotted()</code> 专门选插槽内容；<code>:global()</code> 让某一条规则不加属性。CSS 里还能写 <code>v-bind(color)</code>，编译成一个哈希过的 CSS 自定义属性，运行时写到组件根元素的行内样式上，数据变了样式跟着变。</p>
<p>要注意两点。子组件的根元素会同时带上父组件和子组件的属性，所以父组件的 scoped 样式能命中子组件根元素，这是官方有意的设计，方便父组件做布局。另外 <code>v-html</code> 插入的内容没有属性，scoped 样式管不到，得用 <code>:deep()</code>。</p>
</blockquote>
<h2>编译器把样式改成了什么</h2>
<p>下面这段 scoped 样式用 <code>@vue/compiler-sfc</code> 3.5.44 的 <code>compileStyle</code> 编译，<code>id</code> 传 <code>data-v-7ba5bd90</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.title</span> { <span class="hljs-attribute">color</span>: red; }
<span class="hljs-selector-class">.a</span> :<span class="hljs-built_in">deep</span>(.b) { <span class="hljs-attribute">color</span>: blue; }
<span class="hljs-selector-pseudo">:slotted</span>(<span class="hljs-selector-tag">div</span>) { <span class="hljs-attribute">color</span>: green; }
:<span class="hljs-built_in">global</span>(.dark) { <span class="hljs-attribute">color</span>: white; }
<span class="hljs-selector-class">.box</span> { <span class="hljs-attribute">color</span>: <span class="hljs-built_in">v-bind</span>(color); <span class="hljs-attribute">width</span>: <span class="hljs-built_in">v-bind</span>(<span class="hljs-string">&#x27;size.w&#x27;</span>); }
</code></pre></div>
<p>实际输出是：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.title</span><span class="hljs-selector-attr">[data-v-7ba5bd90]</span> { <span class="hljs-attribute">color</span>: red; }
<span class="hljs-selector-class">.a</span><span class="hljs-selector-attr">[data-v-7ba5bd90]</span> <span class="hljs-selector-class">.b</span> { <span class="hljs-attribute">color</span>: blue; }
<span class="hljs-selector-tag">div</span><span class="hljs-selector-attr">[data-v-7ba5bd90-s]</span> { <span class="hljs-attribute">color</span>: green; }
<span class="hljs-selector-class">.dark</span> { <span class="hljs-attribute">color</span>: white; }
<span class="hljs-selector-class">.box</span><span class="hljs-selector-attr">[data-v-7ba5bd90]</span> { <span class="hljs-attribute">color</span>: <span class="hljs-built_in">var</span>(--<span class="hljs-number">7</span>ba5bd90-color); <span class="hljs-attribute">width</span>: <span class="hljs-built_in">var</span>(--<span class="hljs-number">7</span>ba5bd90-size\\.w); }
</code></pre></div>
<p>普通选择器的属性加在最右边那一段上，也就是真正被选中的元素。所以 <code>.title</code> 必须同时满足“有这个类”和“是本组件渲染的”才会生效。</p>
<p><code>:deep(.b)</code> 为什么能改到子组件里面？因为属性被挪到了 <code>.a</code> 上，<code>.b</code> 本身不再要求带本组件的属性。只要 <code>.a</code> 是本组件的元素，它后代里任何 <code>.b</code> 都能命中，包括子组件内部的元素。</p>
<p><code>:slotted(div)</code> 用的是 <code>-s</code> 后缀的属性。官方文档说，插槽内容默认被看作父组件的东西，子组件的 scoped 样式管不到它；Vue 运行时在渲染插槽内容时，会给它们加上 <code>data-v-哈希-s</code>，<code>:slotted()</code> 就是专门匹配这个属性的。<code>:global(.dark)</code> 则直接去掉属性，相当于写在一个不带 scoped 的 <code>&lt;style&gt;</code> 里。</p>
<h2>元素上的属性从哪里来</h2>
<p>模板编译时传入 <code>scopeId</code>，运行时给组件渲染的每个元素都加上这个属性。下面是用 Vue 3.5.44 的 <code>renderToString</code> 实际渲染的结果，父组件的 scopeId 是 <code>data-v-parent</code>，子组件是 <code>data-v-child</code>：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">data-v-parent</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">data-v-parent</span>&gt;</span>text<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;child&quot;</span> <span class="hljs-attr">data-v-child</span> <span class="hljs-attr">data-v-parent</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">data-v-child</span>&gt;</span>inner<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">data-v-parent</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">b</span>&gt;</span>html<span class="hljs-tag">&lt;/<span class="hljs-name">b</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<p>子组件的根元素 <code>div.child</code> 同时带着两个属性，它里面的 <code>span</code> 只有 <code>data-v-child</code>。这就是官方文档说的：父组件的样式不会漏进子组件内部，但子组件的根元素同时受父子两边的 scoped 样式影响。</p>
<p>最后一个 <code>div</code> 用 <code>innerHTML</code> 插入了 <code>&lt;b&gt;</code>，<code>&lt;b&gt;</code> 上没有属性。<code>v-html</code> 也是这样，所以官方提示 <code>v-html</code> 的内容不受 scoped 样式影响，要用 <code>:deep()</code> 去选。</p>
<h2>CSS 里的 v-bind() 怎样变成响应式</h2>
<p><code>v-bind(color)</code> 编译成 <code>var(--7ba5bd90-color)</code> 后，CSS 文件本身还是静态的。值从哪来？同一个组件的 <code>&lt;script setup&gt;</code> 编译结果里会多出一段：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">_useCssVars</span>(<span class="hljs-function"><span class="hljs-params">_ctx</span> =&gt;</span> ({
  <span class="hljs-string">&quot;7ba5bd90-color&quot;</span>: (color.<span class="hljs-property">value</span>)
}))
</code></pre></div>
<p><code>useCssVars</code> 在运行时把 <code>--7ba5bd90-color: red</code> 写到组件根元素的行内样式上，<code>color</code> 变了就重新写一次。自定义属性会继承，所以组件内部的元素都能读到。官方文档的说法是：值被编译成哈希过的 CSS 自定义属性，通过行内样式应用到组件根元素，源数据变化时响应式更新。写 JavaScript 表达式时要加引号，比如 <code>v-bind(&#x27;theme.color&#x27;)</code>。</p>
<h2>使用时要注意什么</h2>
<p>官方给了两条建议。第一，scoped 不能代替类名，<code>p { color: red }</code> 加了 scoped 以后变成元素选择器加属性选择器，官方说这样会慢很多，换成类名或 id 基本就没有这个损耗。第二，递归组件里小心后代选择器，<code>.a .b</code> 中 <code>.a</code> 所在的元素如果包含递归的子组件，子组件里所有 <code>.b</code> 都会被命中，因为它们带着同样的属性。</p>
<p>如果想要不依赖属性、而是改写类名的隔离方式，可以用 <code>&lt;style module&gt;</code>，见<a href="/questions/css-modern-architecture/">《CSS Modules、层叠层和自定义属性怎样帮助维护样式？》</a>。浏览器原生的作用域方案见<a href="/questions/css-scope/">《CSS @scope 能解决哪些样式隔离问题？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么父组件的 scoped 样式能改到子组件的根元素？</strong></p>
<blockquote>
<p>因为子组件根元素同时带着父组件和子组件的 <code>data-v</code> 属性。Vue 官方说这是有意设计的，让父组件能给子组件的根元素设置布局相关的样式，比如外边距、宽度。子组件内部的其他元素只有子组件自己的属性，父组件的样式就碰不到。</p>
</blockquote>
<p><strong>同一个组件能同时写 scoped 和非 scoped 的样式吗？</strong></p>
<blockquote>
<p>可以，写两个 <code>&lt;style&gt;</code> 块，一个带 <code>scoped</code>、一个不带，不带的就是全局样式。如果只有一两条规则需要全局，也可以在 scoped 块里用 <code>:global()</code> 包起来。</p>
</blockquote>`};export{e as default};