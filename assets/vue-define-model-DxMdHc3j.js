var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>const model = defineModel()</code> 等价于声明 <code>modelValue</code> prop 和 <code>update:modelValue</code> 事件；给 <code>model.value</code> 赋值就会 emit。</li>
<li><code>defineModel(&#x27;title&#x27;)</code> 声明命名模型，对应父组件的 <code>v-model:title</code>。</li>
<li>修饰符通过解构读取：<code>const [model, modifiers] = defineModel()</code>，再在 <code>set</code> 选项里根据 <code>modifiers</code> 转换写入的值。</li>
<li>父组件没有绑定值时，子组件用 <code>default</code> 显示，但这个默认值不会回传给父组件，两边可能不一致。</li>
<li>模型是对象时，<code>model.value.name = &#x27;x&#x27;</code> 直接修改了父组件的对象，不会 emit；需要通知父组件时整体赋新对象。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Rating.vue --&gt;
&lt;script setup&gt;
const score = defineModel({ type: Number, required: true });
&lt;/script&gt;

&lt;template&gt;
  &lt;button v-for=&quot;n in 5&quot; :key=&quot;n&quot; :aria-pressed=&quot;n &lt;= score&quot; @click=&quot;score = n&quot;&gt;★&lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<p>父组件写 <code>&lt;Rating v-model=&quot;rating&quot; /&gt;</code> 即可。<code>required: true</code> 让父组件必须提供值，避免出现子组件用默认值、父组件却是 <code>undefined</code> 的情况。</p>
<h2>自定义修饰符</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- TitleInput.vue --&gt;
&lt;script setup&gt;
const [title, modifiers] = defineModel(&#x27;title&#x27;, {
  set(value) {
    return modifiers.capitalize ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  },
});
&lt;/script&gt;

&lt;template&gt;
  &lt;input v-model=&quot;title&quot; /&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;TitleInput v-model:title.capitalize=&quot;pageTitle&quot; /&gt;
</code></pre></div>
<p><code>set</code> 只作用于子组件写入的值。父组件直接给 <code>pageTitle</code> 赋小写字符串，不会被转换。</p>
<h2>多个模型</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
const first = defineModel(&#x27;first&#x27;);
const last = defineModel(&#x27;last&#x27;);
&lt;/script&gt;
</code></pre></div>
<p>父组件写 <code>&lt;NameEditor v-model:first=&quot;f&quot; v-model:last=&quot;l&quot; /&gt;</code>。两个模型各自 emit，父组件分两次收到更新；需要两个字段必须同时生效时，改用单个对象模型并整体赋值。</p>
<h2>编译结果</h2>
<p><code>defineModel</code> 只能在 <code>&lt;script setup&gt;</code> 中使用，不需要导入，由编译器处理。它展开后就是 prop、emit 和一个本地 ref：父组件传入的值变化时同步到 ref，ref 被赋值时 emit。原理见<a href="/questions/vue-vmodel/">《组件 v-model 的本质是什么？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>父组件没有用 v-model 时，子组件赋值会怎样？本地 ref 会更新并显示新值，但父组件不知道，像一个非受控组件。</li>
<li>能在普通组合式函数里调用吗？不能，它是编译宏，只在 SFC 的 <code>&lt;script setup&gt;</code> 顶层有效。</li>
</ul>`};export{e as default};