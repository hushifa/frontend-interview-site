var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>单向数据流的意思是，数据从父组件通过 props 传给子组件，子组件只读不改。子组件想改，就 emit 一个事件，由拥有这份数据的父组件决定改不改。</p>
<p>这样做是为了让每份数据只有一个主人。如果任何子组件都能直接改，数据出错时就很难查是谁改的。而且直接给 prop 赋值，Vue 会在开发环境警告，下次父组件更新时这个值还会被覆盖回去。</p>
<p>实际开发中有两种合理的“修改”。只把 prop 当初始值、之后自己编辑，就复制到本地 <code>ref</code>；要根据 prop 换个格式显示，就用 <code>computed</code>。</p>
<p>有一个坑要注意。prop 是对象或数组时，子组件改它的内部属性不会触发警告，但其实是直接改了父组件的数据，这种写法应该避免。</p>
</blockquote>
<h2>子组件需要“改” prop 时怎么办</h2>
<p>第一种情况，prop 只是初始值，之后子组件自己编辑：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 作为初始值，之后独立编辑 --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
const props = defineProps({ initialTitle: String });
const title = ref(props.initialTitle);
&lt;/script&gt;
</code></pre></div>
<p>这样复制以后，父组件再改 <code>initialTitle</code>，本地的 <code>title</code> 不会跟着变。这正是想要的效果，所以命名时加个 <code>initial</code> 前缀，把这个意图说清楚。</p>
<p>第二种情况，基于 prop 派生出一个展示用的值：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 基于 prop 派生 --&gt;
&lt;script setup&gt;
import { computed } from &#x27;vue&#x27;;
const props = defineProps({ price: Number });
const display = computed(() =&gt; \`¥\${props.price.toFixed(2)}\`);
&lt;/script&gt;
</code></pre></div>
<p><code>display</code> 跟着 <code>price</code> 自动更新，子组件没有改动任何 prop。</p>
<h2>通过事件让父组件修改</h2>
<p>如果子组件确实需要改父组件的数据，就发事件：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Counter.vue --&gt;
&lt;script setup&gt;
defineProps({ count: { type: Number, required: true } });
const emit = defineEmits([&#x27;update:count&#x27;]);
&lt;/script&gt;

&lt;template&gt;
  &lt;button @click=&quot;emit(&#x27;update:count&#x27;, count + 1)&quot;&gt;{{ count }}&lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<p>父组件写 <code>&lt;Counter v-model:count=&quot;n&quot; /&gt;</code>，或者显式监听 <code>@update:count</code>。子组件只是说“我想把它改成这个值”，真正改 <code>n</code> 的是父组件。v-model 就是这个约定的简写，见<a href="/questions/vue-vmodel/">《组件 v-model 的本质是什么？》</a>。</p>
<h2>Vue 3.5 起解构 props 还是响应式的</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { watch } from &#x27;vue&#x27;;

const { size = &#x27;medium&#x27;, count } = defineProps([&#x27;size&#x27;, &#x27;count&#x27;]);

watch(() =&gt; count, (n) =&gt; console.log(n)); // 侦听解构的 prop 要用 getter
&lt;/script&gt;
</code></pre></div>
<p>按普通 JavaScript 的理解，解构出来的 <code>count</code> 是一个普通变量，应该不会再变。可是 Vue 3.5 起，编译器会把模板和代码里用到的 <code>count</code> 自动改写成 <code>props.count</code>，所以它仍然是响应式的，还能直接用 JS 的默认值语法。</p>
<p>不过这个改写有边界。把 <code>count</code> 直接传给 <code>watch(count)</code> 或者普通函数时，传进去的只是当时的值，所以要像上面那样用 getter 包一层。</p>
<h2>prop 校验</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">defineProps</span>({
  <span class="hljs-attr">status</span>: {
    <span class="hljs-attr">type</span>: <span class="hljs-title class_">String</span>,
    <span class="hljs-attr">required</span>: <span class="hljs-literal">true</span>,
    <span class="hljs-attr">validator</span>: <span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> [<span class="hljs-string">&#x27;draft&#x27;</span>, <span class="hljs-string">&#x27;published&#x27;</span>].<span class="hljs-title function_">includes</span>(v),
  },
});
</code></pre></div>
<p>校验失败只会在开发环境给出警告，不会阻止渲染。用 TypeScript 时可以直接写 <code>defineProps&lt;{ status: &#x27;draft&#x27; | &#x27;published&#x27; }&gt;()</code>。</p>
<h2>常见追问</h2>
<p><strong>布尔类型的 prop 有什么特殊规则？</strong></p>
<blockquote>
<p>声明为 <code>Boolean</code> 的 prop，写 <code>&lt;Comp disabled /&gt;</code> 就等于传了 <code>true</code>，完全不写等于 <code>false</code>。</p>
</blockquote>
<p><strong>传了但没声明成 prop 的属性去哪了？</strong></p>
<blockquote>
<p>它们叫透传属性（fallthrough attributes），会自动加到组件的根元素上。可以用 <code>inheritAttrs: false</code> 关掉，再通过 <code>$attrs</code> 手动绑定到想要的元素上。</p>
</blockquote>`};export{e as default};