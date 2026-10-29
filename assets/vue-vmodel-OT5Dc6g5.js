var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组件上的 v-model 是一个语法糖。<code>&lt;Child v-model=&quot;name&quot; /&gt;</code> 会被展开成 <code>&lt;Child :modelValue=&quot;name&quot; @update:modelValue=&quot;v =&gt; name = v&quot; /&gt;</code>，也就是传一个 prop，再监听一个更新事件。</p>
<p>所以它看起来是双向绑定，其实还是单向数据流。数据始终属于父组件，子组件不能直接改 prop，只能 emit 新值，由父组件决定要不要更新。</p>
<p>一个组件可以有多个 v-model，<code>v-model:title=&quot;t&quot;</code> 用的就是 <code>title</code> prop 和 <code>update:title</code> 事件。子组件手写实现时，常用一个可写的 <code>computed</code> 把“读 prop”和“emit 事件”包成一个能直接绑定的值。</p>
<p>Vue 3.4 起有了 <code>defineModel()</code> 宏，能自动完成这些声明，见<a href="/questions/vue-define-model/">《Vue 3 defineModel 的双向绑定边界是什么？》</a>。</p>
</blockquote>
<h2>手写一个支持 v-model 的输入框</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- TextField.vue --&gt;
&lt;script setup&gt;
import { computed } from &#x27;vue&#x27;;

const props = defineProps({ modelValue: { type: String, default: &#x27;&#x27; } });
const emit = defineEmits([&#x27;update:modelValue&#x27;]);

const value = computed({
  get: () =&gt; props.modelValue,
  set: (next) =&gt; emit(&#x27;update:modelValue&#x27;, next),
});
&lt;/script&gt;

&lt;template&gt;
  &lt;label&gt;姓名 &lt;input v-model=&quot;value&quot; /&gt;&lt;/label&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import TextField from &#x27;./TextField.vue&#x27;;

const name = ref(&#x27;Lin&#x27;);
&lt;/script&gt;

&lt;template&gt;
  &lt;TextField v-model=&quot;name&quot; /&gt;
  &lt;p&gt;{{ name }}&lt;/p&gt;
&lt;/template&gt;
</code></pre></div>
<p>子组件里的 <code>input</code> 用 <code>v-model=&quot;value&quot;</code> 绑定，为什么不会直接改到 prop？因为 <code>value</code> 是一个可写的 <code>computed</code>，它自己不存数据。用户输入时，过程是这样的：<code>input</code> 写入 <code>value</code>，setter 发出 <code>update:modelValue</code>，父组件收到后更新 <code>name</code>，新值作为 prop 传回子组件，getter 再返回这个新值。整个过程中，真正改数据的只有父组件。</p>
<h2>父组件可以拒绝或者改写更新</h2>
<p>既然更新只是一个事件，父组件就可以不用 v-model 的简写，自己处理：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;TextField :modelValue=&quot;name&quot; @update:modelValue=&quot;(v) =&gt; (name = v.slice(0, 20))&quot; /&gt;
</code></pre></div>
<p>这里父组件把名字截到 20 个字符。子组件就算 emit 了更长的值，最终显示的也是父组件给回去的 prop。这正好说明了数据的主人是父组件。</p>
<h2>原生元素上的 v-model 有什么不同</h2>
<p>在 <code>input</code>、<code>textarea</code>、<code>select</code> 上，v-model 由编译器按元素类型展开。文本框绑定 <code>value</code> 和 <code>input</code> 事件，复选框绑定 <code>checked</code> 和 <code>change</code> 事件。文本输入时它还会处理输入法组合，用拼音打字时，选定汉字之前不会更新。</p>
<p>内置修饰符 <code>.lazy</code>（改用 change 事件）、<code>.number</code>、<code>.trim</code> 只对原生元素有效，组件要支持修饰符得自己实现。</p>
<h2>常见追问</h2>
<p><strong>Vue 2 的 v-model 有什么不同？</strong></p>
<blockquote>
<p>Vue 2 默认用的是 <code>value</code> prop 和 <code>input</code> 事件，其他属性的双向绑定靠 <code>.sync</code>。Vue 3 统一成了 <code>v-model:xxx</code>，并移除了 <code>.sync</code>。</p>
</blockquote>
<p><strong>v-model 绑定一个对象，子组件直接改它的属性会怎样？</strong></p>
<blockquote>
<p>会直接改到父组件的对象，但不经过 emit，数据是谁改的就不清楚了。应该 emit 一个新对象，让父组件去替换。</p>
</blockquote>`};export{e as default};