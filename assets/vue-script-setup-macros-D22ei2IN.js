var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写一个 <code>&lt;script setup&gt;</code> 的输入框组件，要声明它接收 <code>label</code>，在内容变化时通知父组件，还要让父组件能调用它的 <code>focus()</code>。这三件事分别交给 <code>defineProps</code>、<code>defineEmits</code> 和 <code>defineExpose</code>。</p>
<p>它们都是编译器宏，不是普通函数。所以不用从 <code>vue</code> 导入，只能写在 <code>&lt;script setup&gt;</code> 里，编译时会被处理掉。<code>defineProps</code> 接收的值和 <code>props</code> 选项一样，<code>defineEmits</code> 接收的值和 <code>emits</code> 选项一样，还能根据传入的声明推断类型。</p>
<p><code>defineExpose</code> 是因为 <code>&lt;script setup&gt;</code> 组件默认是“关闭”的：父组件通过模板 ref 拿到的实例上，看不到组件里声明的任何变量和函数。想让父组件调用 <code>focus</code>，就要用 <code>defineExpose({ focus })</code> 显式暴露出来。</p>
<p>要注意版本差别。Vue 3.5 起，从 <code>defineProps</code> 解构出来的变量是响应式的，还能直接用 JavaScript 默认值语法；3.4 及以前解构会丢失响应式，类型声明的默认值要用 <code>withDefaults</code>。另外传给这些宏的参数会被提升到模块作用域，不能引用 <code>setup</code> 里的局部变量。</p>
</blockquote>
<h2>先看一个完整的组件</h2>
<p>下面是一个输入框组件，三个宏各管一件事：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;

const props = defineProps({
  label: String,
  modelValue: String,
});

const emit = defineEmits([&#x27;update:modelValue&#x27;]);

const inputRef = ref(null);
function focus() {
  inputRef.value.focus();
}

defineExpose({ focus });
&lt;/script&gt;

&lt;template&gt;
  &lt;label&gt;
    {{ props.label }}
    &lt;input
      ref=&quot;inputRef&quot;
      :value=&quot;props.modelValue&quot;
      @input=&quot;emit(&#x27;update:modelValue&#x27;, $event.target.value)&quot;
    /&gt;
  &lt;/label&gt;
&lt;/template&gt;
</code></pre></div>
<p>为什么 <code>defineProps</code> 没有导入就能用？因为它不会在运行时被调用，编译器处理 <code>&lt;script setup&gt;</code> 时会把它换成组件的 <code>props</code> 选项，所以文档说它们“在编译时被处理掉”。<code>defineEmits</code> 返回一个 <code>emit</code> 函数，调用它就是触发事件。这种 <code>modelValue</code> 加 <code>update:modelValue</code> 的写法就是组件 <code>v-model</code> 的展开形式，Vue 3.4 起可以直接用 <code>defineModel</code> 代替，见<a href="/questions/vue-define-model/">《Vue 3 defineModel 的双向绑定边界是什么？》</a>。</p>
<h2>为什么参数里不能用局部变量</h2>
<p>传给 <code>defineProps</code> 和 <code>defineEmits</code> 的参数会被提升到 <code>setup</code> 外面的模块作用域。下面这种写法会编译报错：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
const defaultLabel = &#x27;用户名&#x27;;

defineProps({
  label: { type: String, default: defaultLabel },
});
&lt;/script&gt;
</code></pre></div>
<p><code>defaultLabel</code> 是 <code>setup</code> 里的局部变量，提升到模块作用域以后就找不到了。可是导入的变量没问题，因为导入本来就在模块作用域里。所以要复用常量，就把它放到另一个文件里导入进来。</p>
<h2>运行时声明和类型声明</h2>
<p>上面的写法叫运行时声明，传的是对象或数组。用 TypeScript 时还可以只传一个类型参数：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup lang=&quot;ts&quot;&gt;
const props = defineProps&lt;{
  label?: string
  modelValue: string
}&gt;();

const emit = defineEmits&lt;{
  &#x27;update:modelValue&#x27;: [value: string]
}&gt;();
&lt;/script&gt;
</code></pre></div>
<p>编译器会根据类型静态分析，自动生成等价的运行时声明，所以不用写两遍。可是两种写法不能同时用在同一个宏上，比如既传类型参数又传对象，会编译报错。<code>defineEmits</code> 这种“事件名对应参数元组”的简洁写法从 3.3 开始支持。</p>
<h2>解构 props 在 3.5 前后有什么不同</h2>
<p>很多人想直接把 props 解构出来用。下面这段在不同版本里表现不一样：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { watchEffect } from &#x27;vue&#x27;;

const { foo, msg = &#x27;hello&#x27; } = defineProps([&#x27;foo&#x27;, &#x27;msg&#x27;]);

watchEffect(() =&gt; {
  console.log(foo);
});
&lt;/script&gt;
</code></pre></div>
<p>Vue 3.5 起，同一个 <code>&lt;script setup&gt;</code> 里访问解构出来的 <code>foo</code>，编译器会自动改成 <code>props.foo</code>，所以 <code>foo</code> 变了 <code>watchEffect</code> 会重新执行，<code>msg = &#x27;hello&#x27;</code> 也成了默认值。在 3.4 及以前，这个特性默认没开，<code>foo</code> 只是解构那一刻的值，<code>watchEffect</code> 只跑一次。这时类型声明要设默认值，只能用 <code>withDefaults</code> 宏。</p>
<p>还有一点，3.5 里把解构出来的 <code>foo</code> 直接传给 <code>watch(foo, ...)</code> 不行，因为编译后传的是一个值。要写成 <code>watch(() =&gt; foo, ...)</code>。props 为什么不能在子组件里改，见<a href="/questions/vue-props/">《为什么 Vue 提倡 props 单向数据流？》</a>。</p>
<h2>defineExpose 决定父组件能拿到什么</h2>
<p>父组件这样拿子组件的实例：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref, onMounted } from &#x27;vue&#x27;;
import MyInput from &#x27;./MyInput.vue&#x27;;

const field = ref(null);
onMounted(() =&gt; {
  field.value.focus();
});
&lt;/script&gt;

&lt;template&gt;
  &lt;MyInput ref=&quot;field&quot; label=&quot;用户名&quot; /&gt;
&lt;/template&gt;
</code></pre></div>
<p>如果 <code>MyInput</code> 没有写 <code>defineExpose</code>，<code>field.value.focus</code> 就是 <code>undefined</code>。因为 <code>&lt;script setup&gt;</code> 组件默认是关闭的，通过模板 ref 或 <code>$parent</code> 拿到的公共实例不会暴露内部声明的任何绑定。写了 <code>defineExpose({ focus })</code> 以后，父组件拿到的对象就带上了 <code>focus</code>。暴露的如果是 ref，会像普通实例上那样自动解包。</p>
<p>这样做的好处是组件对外的接口是明确列出来的，内部变量改名或删掉，不会意外破坏父组件。</p>
<h2>常见追问</h2>
<p><strong>defineEmits 声明有什么用？不声明也能 emit 吗？</strong></p>
<blockquote>
<p>声明以后事件有了类型和校验，也说明了组件对外会发出哪些事件。更重要的是，没声明的事件监听器会被当成透传属性加到根元素上，可能出现原生事件和 <code>emit</code> 各触发一次的情况，详见<a href="/questions/vue-attrs-inherit/">《Vue 的 $attrs、inheritAttrs 和透传属性是怎样工作的？》</a>。</p>
</blockquote>
<p><strong>能在普通 <code>&lt;script&gt;</code> 或 setup() 函数里用 defineProps 吗？</strong></p>
<blockquote>
<p>不能，它们是只在 <code>&lt;script setup&gt;</code> 里生效的编译器宏。在 <code>setup()</code> 函数里，props 用 <code>props</code> 选项声明，作为 <code>setup</code> 的第一个参数传进来；事件用 <code>emits</code> 选项声明，<code>emit</code> 从第二个参数 <code>ctx</code> 里拿；要暴露方法则调用 <code>ctx.expose()</code>。</p>
</blockquote>
<p><strong>defineExpose 和 provide 有什么区别？</strong></p>
<blockquote>
<p><code>defineExpose</code> 是给直接拿到这个组件 ref 的父组件用的，通常是调用 <code>focus</code>、<code>reset</code> 这类方法。<code>provide</code> 是把数据交给任意深度的后代组件，方向相反，见<a href="/questions/vue-slots-provide/">《插槽、作用域插槽和 provide/inject 各解决什么问题？》</a>。</p>
</blockquote>`};export{e as default};