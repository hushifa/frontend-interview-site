var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Vue 的模板在构建时会先被编译成渲染函数。编译器能看懂模板，知道哪些节点永远不变、哪些节点的哪一部分会变，所以它会把这些信息直接写进编译结果里。</p>
<p>具体有三招。完全不变的节点只创建一次，之后直接复用。会变的节点打上标记，叫 patch flag，比如只标“文本和 class 会变”，更新时就只比这两样。每个区块再把里面所有会变的节点收集到一个扁平数组里，这个区块叫 block，更新时直接遍历这个数组，不用一层层往下找。</p>
<p>这样一来，更新的工作量只跟动态内容的多少有关，跟模板有多大关系不大。<code>v-if</code>、<code>v-for</code> 这种会改变结构的地方，会各自开一个新的 block，保证数组结构稳定。</p>
<p>要注意，手写渲染函数或 JSX 拿不到这些编译信息，只能走完整的 diff。而且编译优化省的是比较的开销，组件太多、节点太多的问题它解决不了。</p>
</blockquote>
<h2>编译器到底生成了什么</h2>
<p>先看一个简单模板，<code>h1</code> 是写死的，<code>p</code> 的 class 和文本会变：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;template&gt;
  &lt;div&gt;
    &lt;h1&gt;标题&lt;/h1&gt;
    &lt;p :class=&quot;cls&quot;&gt;{{ msg }}&lt;/p&gt;
  &lt;/div&gt;
&lt;/template&gt;
</code></pre></div>
<p>编译后大致是下面这样（Vue 3.4 及以前的静态提升写法，示意）：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> _hoisted_1 = <span class="hljs-title function_">createElementVNode</span>(<span class="hljs-string">&#x27;h1&#x27;</span>, <span class="hljs-literal">null</span>, <span class="hljs-string">&#x27;标题&#x27;</span>, -<span class="hljs-number">1</span> <span class="hljs-comment">/* HOISTED */</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">ctx</span>) {
  <span class="hljs-keyword">return</span> (<span class="hljs-title function_">openBlock</span>(), <span class="hljs-title function_">createElementBlock</span>(<span class="hljs-string">&#x27;div&#x27;</span>, <span class="hljs-literal">null</span>, [
    _hoisted_1,
    <span class="hljs-title function_">createElementVNode</span>(<span class="hljs-string">&#x27;p&#x27;</span>, { <span class="hljs-attr">class</span>: <span class="hljs-title function_">normalizeClass</span>(ctx.<span class="hljs-property">cls</span>) }, <span class="hljs-title function_">toDisplayString</span>(ctx.<span class="hljs-property">msg</span>),
      <span class="hljs-number">3</span> <span class="hljs-comment">/* TEXT, CLASS */</span>),
  ]));
}
</code></pre></div>
<p>你可能会问，<code>h1</code> 怎么跑到渲染函数外面去了？因为它永远不变，编译器就把它提出来只创建一次，每次渲染拿到的都是同一个对象。更新时 Vue 发现新旧是同一个对象，直接跳过。Vue 3.5 起写法换了，静态节点改放进 <code>_cache</code> 缓存，输出里标注为 <code>CACHED</code>，作用一样，静态部分只创建一次。</p>
<p><code>p</code> 后面那个 <code>3</code> 就是 patch flag，意思是“文本和 class 会变”。更新这个节点时，Vue 只比较文本和 class，别的属性看都不看。</p>
<p>想看任意模板的编译结果，可以打开 <a href="https://play.vuejs.org/">Vue SFC Playground</a> 的 JS 标签页。</p>
<h2>block 为什么能跳过整棵树</h2>
<p>假设一个页面头尾有很多静态内容，中间只有两处会变：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;div&gt;
  &lt;header&gt;…很多静态节点…&lt;/header&gt;
  &lt;span&gt;{{ a }}&lt;/span&gt;
  &lt;footer&gt;…&lt;em&gt;{{ b }}&lt;/em&gt;…&lt;/footer&gt;
&lt;/div&gt;
</code></pre></div>
<p>普通的虚拟 DOM 更新要把整棵树从上到下比一遍。可是 Vue 在编译时已经把会变的节点收集起来了，根 block 的 <code>dynamicChildren</code> 数组里只有 <code>span</code> 和 <code>em</code> 两项。所以更新时直接比这两项就行，<code>em</code> 嵌得再深也不用逐层进入。</p>
<p>那为什么 <code>v-if</code> 和 <code>v-for</code> 要单独开 block？因为扁平数组只有在结构不变时才靠得住。<code>v-if</code> 的不同分支结构不一样，所以每个分支是独立的 block；<code>v-for</code> 的列表长度会变，所以作为一个 fragment block 处理，里面按 key 比较。</p>
<h2>还有哪些编译期的小优化</h2>
<p>事件处理函数会被缓存。<code>@click=&quot;onClick&quot;</code> 每次渲染拿到的是同一个函数，所以子组件不会因为“收到一个新函数”而跟着更新。</p>
<p>另外有两个指令能手动帮编译器一把。<code>v-once</code> 让一块内容只渲染一次；<code>v-memo</code> 在你指定的依赖不变时跳过整个子树，适合大列表里的条目。</p>
<h2>编译优化管不到的地方</h2>
<p>编译优化减少的是比较的开销。如果一个页面组件数量过多、一次渲染上万个 DOM 节点，或者计算属性本身很重，它就帮不上忙了。这时还得靠虚拟列表、拆分组件、<code>shallowRef</code> 这些手段，见<a href="/questions/vue-performance/">《Vue 大型页面应从哪些方面优化更新开销？》</a>。</p>
<h2>常见追问</h2>
<p><strong>和 React 有什么差别？</strong></p>
<blockquote>
<p>React 的 JSX 就是普通 JavaScript，编译期很难确定哪些部分是静态的，所以默认每次比较整棵子树。React Compiler 通过自动记忆化达到类似的目的，但实现路径不一样。Vue 是靠模板的约束，在编译时就把动静分开了。</p>
</blockquote>
<p><strong>Vapor Mode 是什么？</strong></p>
<blockquote>
<p>这是 Vue 正在开发的一种编译模式，不使用虚拟 DOM，直接生成操作 DOM 的代码。它的正式状态以官方发布为准。</p>
</blockquote>`};export{e as default};