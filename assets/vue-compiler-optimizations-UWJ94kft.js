var e={answerHtml:`<h2>简答</h2>
<ul>
<li>静态节点缓存：完全不变的节点只创建一次，后续渲染直接复用同一个 vnode。</li>
<li>Patch flags：编译器为动态节点标记哪些部分是动态的（文本、class、style、props 等），更新时只比较这些部分。</li>
<li>Block tree：每个 block 把内部所有动态节点收集到一个扁平数组 <code>dynamicChildren</code>，更新时直接遍历这个数组，不必递归整棵树。</li>
<li>结构会变化的指令（<code>v-if</code>、<code>v-for</code>）各自开启新的 block，以保证扁平数组的结构稳定。</li>
<li>手写渲染函数或 JSX 拿不到这些编译信息，只能走完整的 diff。</li>
</ul>
<h2>编译结果示意</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;template&gt;
  &lt;div&gt;
    &lt;h1&gt;标题&lt;/h1&gt;
    &lt;p :class=&quot;cls&quot;&gt;{{ msg }}&lt;/p&gt;
  &lt;/div&gt;
&lt;/template&gt;
</code></pre></div>
<p>编译后大致是（示意，具体输出随版本变化）：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> _hoisted_1 = <span class="hljs-title function_">createElementVNode</span>(<span class="hljs-string">&#x27;h1&#x27;</span>, <span class="hljs-literal">null</span>, <span class="hljs-string">&#x27;标题&#x27;</span>, -<span class="hljs-number">1</span> <span class="hljs-comment">/* HOISTED */</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params">ctx</span>) {
  <span class="hljs-keyword">return</span> (<span class="hljs-title function_">openBlock</span>(), <span class="hljs-title function_">createElementBlock</span>(<span class="hljs-string">&#x27;div&#x27;</span>, <span class="hljs-literal">null</span>, [
    _hoisted_1,
    <span class="hljs-title function_">createElementVNode</span>(<span class="hljs-string">&#x27;p&#x27;</span>, { <span class="hljs-attr">class</span>: <span class="hljs-title function_">normalizeClass</span>(ctx.<span class="hljs-property">cls</span>) }, <span class="hljs-title function_">toDisplayString</span>(ctx.<span class="hljs-property">msg</span>),
      <span class="hljs-number">3</span> <span class="hljs-comment">/* TEXT, CLASS */</span>),
  ]));
}
</code></pre></div>
<p>更新时：<code>h1</code> 是同一个对象，直接跳过；<code>p</code> 的 flag 是 <code>TEXT | CLASS</code>，只比较文本和 class，不检查其他属性。</p>
<p>可以在 <a href="https://play.vuejs.org/">Vue SFC Playground</a> 的 JS 标签页查看任意模板的编译结果。</p>
<h2>Block 为什么能跳过遍历</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;div&gt;
  &lt;header&gt;…很多静态节点…&lt;/header&gt;
  &lt;span&gt;{{ a }}&lt;/span&gt;
  &lt;footer&gt;…&lt;em&gt;{{ b }}&lt;/em&gt;…&lt;/footer&gt;
&lt;/div&gt;
</code></pre></div>
<p>根 block 的 <code>dynamicChildren</code> 只有 <code>span</code> 和 <code>em</code> 两项。更新时运行时直接比较这两项，嵌套多深都不需要逐层进入。</p>
<p><code>v-if</code> 的不同分支结构不同，所以每个分支是一个独立 block；<code>v-for</code> 的列表长度会变，也作为一个 fragment block 处理，内部按 key 比较。</p>
<h2>其他优化</h2>
<ul>
<li>事件处理函数缓存：<code>@click=&quot;onClick&quot;</code> 会被缓存，子组件不会因为每次收到新函数而更新。</li>
<li><code>v-once</code> 只渲染一次，<code>v-memo</code> 在指定依赖不变时跳过整个子树，适合大列表中的条目。</li>
</ul>
<h2>编译优化不能解决的问题</h2>
<p>编译优化减少的是比较开销。组件数量过多、一次渲染上万个 DOM 节点、计算属性很重，仍需要虚拟列表、拆分组件、<code>shallowRef</code> 等手段，见《Vue 大型页面应从哪些方面优化更新开销？》。</p>
<h2>常见追问</h2>
<ul>
<li>和 React 的差别？React 的 JSX 是普通 JS，编译期难以确定哪些是静态的，默认每次比较整棵子树；React Compiler 通过记忆化达到类似目的，但实现路径不同。</li>
<li>Vapor Mode 是什么？Vue 正在开发的一种不使用虚拟 DOM、直接生成 DOM 操作代码的编译模式，正式状态以官方发布为准。</li>
</ul>`};export{e as default};