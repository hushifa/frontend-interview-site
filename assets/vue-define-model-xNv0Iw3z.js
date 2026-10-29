var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>defineModel</code> 是 Vue 3.4 起稳定的 <code>&lt;script setup&gt;</code> 宏。写一句 <code>const model = defineModel()</code>，就等于声明了 <code>modelValue</code> 这个 prop 和 <code>update:modelValue</code> 这个事件，返回一个 ref。读它就是读 prop，给 <code>model.value</code> 赋值就会自动 emit。</p>
<p>它省掉了手写 prop、emit 和可写 computed 的样板代码。要多个模型就传名字，<code>defineModel(&#x27;title&#x27;)</code> 对应父组件的 <code>v-model:title</code>；要支持自定义修饰符，就解构出 <code>[model, modifiers]</code>，在 <code>set</code> 选项里转换写入的值。</p>
<p>它有两个边界要清楚。第一，父组件没绑值时子组件会用 <code>default</code> 显示，但这个默认值不会传回父组件，两边可能不一致。第二，模型是对象时，<code>model.value.name = &#x27;x&#x27;</code> 是直接改了父组件的对象，不会 emit；要通知父组件，就整体赋一个新对象。</p>
</blockquote>
<h2>基本用法</h2>
<p>下面是一个评分组件，点第几颗星就把分数设成几：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Rating.vue --&gt;
&lt;script setup&gt;
const score = defineModel({ type: Number, required: true });
&lt;/script&gt;

&lt;template&gt;
  &lt;button v-for=&quot;n in 5&quot; :key=&quot;n&quot; :aria-pressed=&quot;n &lt;= score&quot; @click=&quot;score = n&quot;&gt;★&lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<p>父组件写 <code>&lt;Rating v-model=&quot;rating&quot; /&gt;</code> 就行。子组件里 <code>score = n</code> 看起来像在改本地变量，实际上会 emit 事件，由父组件更新 <code>rating</code>。</p>
<p>这里为什么加 <code>required: true</code>？因为如果父组件忘了传值，子组件会用默认值显示，父组件的变量却还是 <code>undefined</code>，两边对不上。设成必填，父组件漏传时开发环境就会警告。</p>
<h2>自定义修饰符</h2>
<p>下面的输入框支持 <code>.capitalize</code> 修饰符，把首字母转成大写：</p>
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
<p>要注意，<code>set</code> 只处理子组件写入的值。父组件自己给 <code>pageTitle</code> 赋一个小写字符串，不会经过这里，也就不会被转换。</p>
<h2>多个模型分开更新</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
const first = defineModel(&#x27;first&#x27;);
const last = defineModel(&#x27;last&#x27;);
&lt;/script&gt;
</code></pre></div>
<p>父组件写 <code>&lt;NameEditor v-model:first=&quot;f&quot; v-model:last=&quot;l&quot; /&gt;</code>。两个模型各自 emit，父组件是分两次收到更新的。如果业务上要求两个字段必须同时生效，就改成一个对象模型，整体赋值。</p>
<h2>它背后做了什么</h2>
<p><code>defineModel</code> 只能在 <code>&lt;script setup&gt;</code> 里用，不需要导入，由编译器处理。展开后就是一个 prop、一个 emit 和一个本地 ref：父组件传入的值变了，同步到 ref；ref 被赋值了，就 emit。原理见<a href="/questions/vue-vmodel/">《组件 v-model 的本质是什么？》</a>。</p>
<h2>常见追问</h2>
<p><strong>父组件没用 v-model，子组件给模型赋值会怎样？</strong></p>
<blockquote>
<p>本地的 ref 会更新，界面也会显示新值，但父组件不知道。这时它就像一个非受控组件，自己管自己的值。</p>
</blockquote>
<p><strong>能在普通的组合式函数里调用 defineModel 吗？</strong></p>
<blockquote>
<p>不能。它是编译宏，只在单文件组件的 <code>&lt;script setup&gt;</code> 顶层有效。</p>
</blockquote>`};export{e as default};