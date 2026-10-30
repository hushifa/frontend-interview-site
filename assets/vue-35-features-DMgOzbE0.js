var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Vue 3.5 是 2024 年 9 月发布的小版本，没有破坏性变更。和日常写代码关系最大的两处，一个是 props 解构，一个是模板引用。</p>
<p>以前 <code>const { count } = defineProps(...)</code> 解构出来的 <code>count</code> 是个常量，父组件改了它也不变。3.5 起这个特性稳定并默认开启，编译器会把同一个 <code>&lt;script setup&gt;</code> 里用到的 <code>count</code> 改写成 <code>props.count</code>，所以它是响应式的；默认值也能直接写成 <code>{ count = 0 }</code>，不再需要 <code>withDefaults</code>。</p>
<p>模板引用以前要声明一个和 <code>ref=&quot;input&quot;</code> 同名的 <code>const input = ref(null)</code>，靠变量名对上。3.5 新增 <code>useTemplateRef(&#x27;input&#x27;)</code>，按运行时的字符串 ID 匹配，变量名随便起，ref 名是动态的也能用，配合工具还能推断类型。</p>
<p>要注意，解构出的 prop 直接传给 <code>watch(count)</code> 编译时会报错，要写成 <code>watch(() =&gt; count)</code>；传给组合式函数也要包成 getter。模板引用要等组件挂载后才有值，挂载前是 <code>null</code>。</p>
</blockquote>
<h2>props 解构到底发生了什么</h2>
<p>先看编译前后的对比。下面这段 <code>&lt;script setup&gt;</code>：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { watch } from &#x27;vue&#x27;;

const { count = 0 } = defineProps([&#x27;count&#x27;]);

watch(() =&gt; count, () =&gt; {});
console.log(count);
&lt;/script&gt;
</code></pre></div>
<p>用 <code>@vue/compiler-sfc</code> 3.5 编译后，<code>setup</code> 里的关键部分变成了这样：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">watch</span>(<span class="hljs-function">() =&gt;</span> __props.<span class="hljs-property">count</span>, <span class="hljs-function">() =&gt;</span> {});
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(__props.<span class="hljs-property">count</span>);
</code></pre></div>
<p>所以 <code>count</code> 并不是真的被解构成了一个普通变量。每次访问都被换成了对 props 对象的属性读取，Vue 的响应式靠属性访问收集依赖，这样就能追踪到。默认值 <code>count = 0</code> 则被编译成了组件的 props 默认值声明。</p>
<p>那为什么 <code>watch(count, ...)</code> 不行？按改写规则，它会变成 <code>watch(__props.count, ...)</code>，传进去的是一个值，不是响应式数据源。Vue 编译器会直接报错，提示改成 <code>() =&gt; count</code>。同样，把解构的 prop 传给组合式函数时要写 <code>useComposable(() =&gt; count)</code>，函数内部用 <code>toValue()</code> 读取。这个规则和版本差别在<a href="/questions/vue-script-setup-macros/">《defineProps、defineEmits 和 defineExpose 有什么作用？》</a><a href="/questions/vue-props/">《为什么 Vue 提倡 props 单向数据流？》</a>里也有完整例子。</p>
<h2>useTemplateRef 解决了什么麻烦</h2>
<p>3.5 以前，<code>&lt;script setup&gt;</code> 里拿 DOM 元素要这样写：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref, onMounted } from &#x27;vue&#x27;;

const input = ref(null);

onMounted(() =&gt; {
  input.value.focus();
});
&lt;/script&gt;

&lt;template&gt;
  &lt;input ref=&quot;input&quot; /&gt;
&lt;/template&gt;
</code></pre></div>
<p>这里的约定是变量名必须和 <code>ref</code> 属性的值完全一样。读代码时看不出 <code>input</code> 是个模板引用，改名时两边也得一起改。</p>
<p>3.5 以后写成：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { useTemplateRef, onMounted } from &#x27;vue&#x27;;

const input = useTemplateRef(&#x27;my-input&#x27;);

onMounted(() =&gt; {
  input.value.focus();
});
&lt;/script&gt;

&lt;template&gt;
  &lt;input ref=&quot;my-input&quot; /&gt;
&lt;/template&gt;
</code></pre></div>
<p>区别在于匹配方式。以前是编译器分析静态的变量名，现在是运行时按字符串 ID 匹配，所以 ref 名可以带连字符，也可以是动态绑定、会变化的 ID。用 TypeScript 时，IDE 和 <code>vue-tsc</code> 会根据 ref 用在哪个元素或组件上自动推断 <code>input.value</code> 的类型。</p>
<p><code>v-for</code> 里用 <code>ref=&quot;items&quot;</code> 时，<code>useTemplateRef(&#x27;items&#x27;)</code> 拿到的是一个数组，挂载后填入元素。官方文档提醒，这个数组的顺序不保证和源数组一致。ref 加在组件上拿到的是组件实例，<code>&lt;script setup&gt;</code> 组件默认什么都不暴露，要用 <code>defineExpose</code>。</p>
<h2>3.5 还带来了哪些变化</h2>
<p>官方发布文章还列了这些：响应式系统重构，内存占用减少 56%，某些情况下大型深层响应式数组的追踪快了最多 10 倍；<code>onWatcherCleanup()</code> 用于在侦听器里注册清理，见<a href="/questions/vue-computed-watch/">《computed、watch 和 watchEffect 应该如何选择？》</a>；<code>&lt;Teleport defer&gt;</code> 让目标元素可以晚于 Teleport 渲染，见<a href="/questions/vue-keepalive-teleport/">《KeepAlive 与 Teleport 有哪些使用边界？》</a>。</p>
<p>服务端渲染方面有三项：<code>defineAsyncComponent()</code> 支持 <code>hydrate</code> 选项做懒水合，比如 <code>hydrateOnVisible()</code>；<code>useId()</code> 生成在服务端和客户端保持一致的 ID；<code>data-allow-mismatch</code> 用来消除服务端和客户端值必然不同时的水合警告，比如日期。</p>
<h2>常见追问</h2>
<p><strong>升级到 3.5 后，原来用 withDefaults 的代码要改吗？</strong></p>
<blockquote>
<p>不用。3.5 没有破坏性变更，<code>withDefaults</code> 照样能用。只是新代码可以直接写解构默认值，更简洁。</p>
</blockquote>
<p><strong>解构的 prop 和普通变量在编辑器里怎么区分？</strong></p>
<blockquote>
<p>官方提到 Vue 的 VS Code 扩展有一个设置，可以给解构出来的 props 显示内联提示，开启后就能一眼看出来。</p>
</blockquote>
<p><strong>useTemplateRef 在 setup 里立刻读，为什么是 null？</strong></p>
<blockquote>
<p>因为元素要第一次渲染后才存在。官方建议在 <code>onMounted</code> 里访问；用 <code>watchEffect</code> 时要判断 <code>input.value</code> 是否存在，元素被 <code>v-if</code> 移除后它也会变回 <code>null</code>。</p>
</blockquote>`};export{e as default};