var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>列表里只想显示已完成的待办，很多人会写 <code>&lt;li v-for=&quot;todo in todos&quot; v-if=&quot;todo.done&quot;&gt;</code>。这种写法在 Vue 2 和 Vue 3 里表现不一样，官方都建议不要这么写。</p>
<p>区别在优先级。Vue 2 里同一个元素上 <code>v-for</code> 先执行，相当于先循环，再对每一项判断 <code>v-if</code>，能跑起来，但每次渲染都要遍历整个列表。Vue 3 改成了 <code>v-if</code> 先执行，这时循环还没开始，<code>todo</code> 还不存在，访问 <code>todo.done</code> 就会报错。</p>
<p>正确写法分两种情况。要过滤列表，就用 <code>computed</code> 先算出过滤后的数组，再 <code>v-for</code> 这个数组，结果有缓存，列表不变时不会重复过滤。要根据条件决定整个列表显不显示，就把 <code>v-if</code> 放到外层元素上，或者用 <code>&lt;template v-for&gt;</code> 包一层，把 <code>v-if</code> 写在里面的元素上。</p>
<p>要注意，Vue 2 升级到 Vue 3 时，这种写法不一定会在编译期暴露，常常是页面运行时报 <code>todo</code> 未定义，迁移时要专门搜一遍。</p>
</blockquote>
<h2>为什么 Vue 3 会报错</h2>
<p>下面这段模板在 Vue 2 里能正常过滤，在 Vue 3 里会出错：</p>
<div class="not-prose code-block"><div class="code-language">vue-html</div><pre><code class="hljs language-vue-html">&lt;li v-for=&quot;todo in todos&quot; v-if=&quot;!todo.done&quot;&gt;
  {{ todo.name }}
&lt;/li&gt;
</code></pre></div>
<p>Vue 3 文档的说法是：两个指令在同一个节点上时，<code>v-if</code> 的优先级更高，所以 <code>v-if</code> 的条件访问不到 <code>v-for</code> 作用域里的变量。可以理解成 Vue 3 把它编译成了“先判断条件，条件成立再循环”。判断条件时 <code>todo</code> 还没定义，表达式就出错了。</p>
<p>Vue 2 正好反过来，<code>v-for</code> 优先。它相当于“循环每一项，每一项再判断”，所以能拿到 <code>todo</code>。可是哪怕最后只显示一两项，每次重新渲染时整个列表都要遍历一遍。</p>
<h2>过滤列表用 computed</h2>
<p>把过滤逻辑挪到 <code>computed</code> 里：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { computed, ref } from &#x27;vue&#x27;;

const todos = ref([
  { id: 1, name: &#x27;写周报&#x27;, done: false },
  { id: 2, name: &#x27;交房租&#x27;, done: true },
]);
const activeTodos = computed(() =&gt; todos.value.filter((todo) =&gt; !todo.done));
&lt;/script&gt;

&lt;template&gt;
  &lt;ul&gt;
    &lt;li v-for=&quot;todo in activeTodos&quot; :key=&quot;todo.id&quot;&gt;{{ todo.name }}&lt;/li&gt;
  &lt;/ul&gt;
&lt;/template&gt;
</code></pre></div>
<p>这样模板里只剩一个 <code>v-for</code>，没有优先级问题。<code>computed</code> 会缓存结果，只有 <code>todos</code> 变了才重新过滤；页面上其他数据变化引起重新渲染时，直接用上次的结果。</p>
<h2>只想整体显示或隐藏时怎么写</h2>
<p>如果条件跟每一项无关，比如“列表为空时不显示”，就把 <code>v-if</code> 放到外层：</p>
<div class="not-prose code-block"><div class="code-language">vue-html</div><pre><code class="hljs language-vue-html">&lt;ul v-if=&quot;todos.length &gt; 0&quot;&gt;
  &lt;li v-for=&quot;todo in todos&quot; :key=&quot;todo.id&quot;&gt;{{ todo.name }}&lt;/li&gt;
&lt;/ul&gt;
</code></pre></div>
<p>如果确实要在循环里逐项判断，又不想多一层 DOM，可以用 <code>&lt;template&gt;</code> 承载 <code>v-for</code>：</p>
<div class="not-prose code-block"><div class="code-language">vue-html</div><pre><code class="hljs language-vue-html">&lt;template v-for=&quot;todo in todos&quot; :key=&quot;todo.id&quot;&gt;
  &lt;li v-if=&quot;!todo.done&quot;&gt;{{ todo.name }}&lt;/li&gt;
&lt;/template&gt;
</code></pre></div>
<p><code>&lt;template&gt;</code> 不会渲染成真实元素，<code>v-for</code> 在外面、<code>v-if</code> 在里面，先后关系一目了然，两个版本行为一致。</p>
<h2>常见追问</h2>
<p><strong>v-for 为什么要写 key？</strong></p>
<blockquote>
<p>key 让 Vue 在列表更新时认出哪一项是哪一项，从而复用对应的 DOM 和组件状态。不写或用下标时，插入、删除、排序会让状态错位，原理见<a href="/questions/vue2-diff/">《Vue 2 的 diff 算法是怎样比较子节点的？》</a>。</p>
</blockquote>
<p><strong>v-if 和 v-show 怎么选？</strong></p>
<blockquote>
<p><code>v-if</code> 条件为假时元素不渲染，切换时会创建和销毁；<code>v-show</code> 始终渲染，只切换 <code>display</code>。频繁切换用 <code>v-show</code>，很少改变的条件用 <code>v-if</code>。详见<a href="/questions/vue-vif-vshow/">《v-if 和 v-show 应该怎样选择？》</a>。</p>
</blockquote>`};export{e as default};