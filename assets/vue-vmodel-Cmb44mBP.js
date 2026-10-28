var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>&lt;Child v-model=&quot;name&quot; /&gt;</code> 展开为 <code>&lt;Child :modelValue=&quot;name&quot; @update:modelValue=&quot;v =&gt; name = v&quot; /&gt;</code>。</li>
<li><code>v-model:title=&quot;t&quot;</code> 使用 <code>title</code> prop 和 <code>update:title</code> 事件，一个组件可以有多个 v-model。</li>
<li>数据始终归父组件所有，子组件不能直接修改 prop，只能 emit 新值，由父组件决定是否更新。</li>
<li>子组件手写实现时，常用可写 <code>computed</code> 把 prop 读取和 emit 包装成一个可以绑定的值。</li>
<li>Vue 3.4 起用 <code>defineModel()</code> 宏自动完成上述声明，见《Vue 3 defineModel 的双向绑定边界是什么？》。</li>
</ul>
<h2>手写实现</h2>
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
<p>用户输入时：内部 <code>input</code> 写入 <code>value</code> → setter 发出 <code>update:modelValue</code> → 父组件更新 <code>name</code> → 新值作为 prop 传回子组件 → getter 返回新值。可写 <code>computed</code> 不保存数据，只是读写的转接。</p>
<h2>父组件可以拒绝或改写更新</h2>
<p>因为更新是一个事件，父组件可以不用 v-model 简写，自己处理：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;TextField :modelValue=&quot;name&quot; @update:modelValue=&quot;(v) =&gt; (name = v.slice(0, 20))&quot; /&gt;
</code></pre></div>
<p>这里父组件把名字截断为 20 个字符。子组件即使 emit 了更长的值，显示的也是父组件最终给出的 prop。</p>
<h2>原生元素上的 v-model</h2>
<p>在 <code>input</code>、<code>textarea</code>、<code>select</code> 上，v-model 由编译器按元素类型展开：文本框绑定 <code>value</code> 和 <code>input</code> 事件，复选框绑定 <code>checked</code> 和 <code>change</code> 事件。文本输入时还会处理输入法组合，拼音输入完成前不会更新。内置修饰符 <code>.lazy</code>（改用 change 事件）、<code>.number</code>、<code>.trim</code> 只对原生元素有效，组件需要自己实现修饰符。</p>
<h2>常见追问</h2>
<ul>
<li>Vue 2 有什么不同？Vue 2 默认使用 <code>value</code> prop 和 <code>input</code> 事件，用 <code>.sync</code> 实现其他属性的双向绑定；Vue 3 统一为 <code>v-model:xxx</code>，移除了 <code>.sync</code>。</li>
<li>绑定对象后在子组件里修改它的属性会怎样？会直接改到父组件的对象，但不经过 emit，数据流向不清晰，应 emit 一个新对象。</li>
</ul>`};export{e as default};