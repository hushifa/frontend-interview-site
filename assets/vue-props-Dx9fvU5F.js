var e={answerHtml:`<h2>简答</h2>
<ul>
<li>父组件更新时，子组件的 props 会被刷新为最新值；子组件直接给 prop 赋值，Vue 会在开发环境警告，而且下次父组件更新就会被覆盖。</li>
<li>子组件想修改数据，就 emit 一个事件，由拥有数据的父组件决定是否修改。</li>
<li>只需要 prop 作为初始值、之后在子组件内独立编辑：复制到本地 <code>ref</code>。</li>
<li>需要基于 prop 转换展示：用 <code>computed</code>。</li>
<li>prop 是对象或数组时，子组件修改其内部属性不会报警告，但会直接改到父组件的数据，应避免。</li>
</ul>
<h2>两种合理的&quot;修改&quot;</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 作为初始值，之后独立编辑 --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
const props = defineProps({ initialTitle: String });
const title = ref(props.initialTitle);
&lt;/script&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 基于 prop 派生 --&gt;
&lt;script setup&gt;
import { computed } from &#x27;vue&#x27;;
const props = defineProps({ price: Number });
const display = computed(() =&gt; \`¥\${props.price.toFixed(2)}\`);
&lt;/script&gt;
</code></pre></div>
<p>第一种写法中，父组件之后修改 <code>initialTitle</code> 不会影响本地 <code>title</code>。命名带上 <code>initial</code> 前缀能表达这个意图。</p>
<h2>通过事件修改</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Counter.vue --&gt;
&lt;script setup&gt;
defineProps({ count: { type: Number, required: true } });
const emit = defineEmits([&#x27;update:count&#x27;]);
&lt;/script&gt;

&lt;template&gt;
  &lt;button @click=&quot;emit(&#x27;update:count&#x27;, count + 1)&quot;&gt;{{ count }}&lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<p>父组件写 <code>&lt;Counter v-model:count=&quot;n&quot; /&gt;</code>，或者显式监听 <code>@update:count</code>。v-model 就是这个约定的简写，见《组件 v-model 的本质是什么？》。</p>
<h2>Vue 3.5 的响应式 props 解构</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { watch } from &#x27;vue&#x27;;

const { size = &#x27;medium&#x27;, count } = defineProps([&#x27;size&#x27;, &#x27;count&#x27;]);

watch(() =&gt; count, (n) =&gt; console.log(n)); // 侦听解构的 prop 要用 getter
&lt;/script&gt;
</code></pre></div>
<p>Vue 3.5 起，编译器把解构出的变量自动改写为 <code>props.xxx</code>，因此保持响应式，还可以直接用 JS 默认值语法。不过把 <code>count</code> 直接传给 <code>watch(count)</code> 或普通函数时，传入的只是当前值；要用 getter 包一层。</p>
<h2>prop 校验</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">defineProps</span>({
  <span class="hljs-attr">status</span>: {
    <span class="hljs-attr">type</span>: <span class="hljs-title class_">String</span>,
    <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">validator</span>: <span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> [<span class="hljs-string">&#x27;draft&#x27;</span>, <span class="hljs-string">&#x27;published&#x27;</span>].<span class="hljs-title function_">includes</span>(v),
  },
});
</code></pre></div>
<p>校验只在开发环境给出警告，不阻止渲染。使用 TypeScript 时可以写 <code>defineProps&lt;{ status: &#x27;draft&#x27; | &#x27;published&#x27; }&gt;()</code>。</p>
<h2>常见追问</h2>
<ul>
<li>布尔 prop 有什么特殊规则？声明为 <code>Boolean</code> 的 prop，写 <code>&lt;Comp disabled /&gt;</code> 等于 <code>true</code>，不传等于 <code>false</code>。</li>
<li>没声明的属性去哪了？会作为 fallthrough attributes 加到组件根元素上，可用 <code>inheritAttrs: false</code> 关闭并通过 <code>$attrs</code> 手动绑定。</li>
</ul>`};export{e as default};