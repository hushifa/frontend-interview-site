var e={answerHtml:`<h2>简答</h2>
<p>在组件上，v-model 是 :modelValue 加 @update:modelValue 的语法糖；v-model:title 对应 title prop 和 update:title 事件。子组件接收值，并通过 emit 发出新值，状态仍然归父级所有。手写实现常用可写 computed 包装 prop 和 emit。Vue 3.4 起可以用 defineModel 宏简化这个写法。</p>
<p>父组件写一个 v-model，看起来像把自己的变量直接交给子组件任意修改。实际关系更明确：父级把当前值作为 prop 传下去，子级在希望更新时发出约定事件，父级的绑定处理再更新自己的状态。</p>
<p>默认模型使用 modelValue 与 update:modelValue。所谓双向绑定，是这两条路径被简写连接起来，不是让子组件获得修改父级任意变量的权限。</p>
<h2>用显式 prop、事件与可写 computed 实现</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- TextField.vue --&gt;
&lt;script setup&gt;
import { computed } from &#x27;vue&#x27;;

const props = defineProps({
  modelValue: { type: String, default: &#x27;&#x27; },
});
const emit = defineEmits([&#x27;update:modelValue&#x27;]);

const value = computed({
  get: () =&gt; props.modelValue,
  set: next =&gt; emit(&#x27;update:modelValue&#x27;, next),
});
&lt;/script&gt;

&lt;template&gt;
  &lt;label&gt;姓名&lt;input v-model=&quot;value&quot; /&gt;&lt;/label&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import TextField from &#x27;./TextField.vue&#x27;;

const name = ref(&#x27;Lin&#x27;);
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;TextField v-model=&quot;name&quot; /&gt;
    &lt;p&gt;父级姓名：{{ name }}&lt;/p&gt;
    &lt;button type=&quot;button&quot; @click=&quot;name = &#x27;Chen&#x27;&quot;&gt;父级改值&lt;/button&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>输入时，原生 input 的 v-model 写入可写 computed；computed 的 setter 不直接修改 prop，而是发出 update:modelValue；父级绑定处理更新 name，再把新值传回来。</p>
<p>点击父级按钮时，name 改变，子级 computed 的 getter 读取新的 prop，输入框也跟着更新。可写 computed 在这里是一个访问桥梁，不是另一份需要与父级反复同步的独立数据副本。</p>
<p>也可以手工写 value 绑定与输入事件，但需要正确处理输入法组合等细节。示例在内部继续使用原生 v-model，以复用它对输入事件的处理。</p>
<h2>编译后的约定并不神秘</h2>
<p>组件上的 v-model 大致展开为传入 modelValue，并注册 update:modelValue 处理函数，把事件载荷写回父级绑定表达式。父级需要的是可赋值的合适表达式，不能把任意只读计算结果都当成可以写回的目标。</p>
<p>如果父级需要校验、格式化或拒绝更新，可以显式管理这条事件路径。但拒绝后的界面反馈、输入框当前 DOM 值和草稿状态也要设计，不能只让监听器什么都不做，就假定所有控件都会自动呈现正确回退。</p>
<p>当交互是“编辑草稿，最后保存或取消”，它也未必适合每次输入都立即修改父级真实值。可以使用独立草稿与提交事件，明确区分编辑过程和正式确认。</p>
<h2>命名模型用于多组独立的值</h2>
<p>v-model:title 对应 title prop 与 update:title 事件，而不是继续使用默认 modelValue。一个组件可以定义多组命名模型，例如区间的 start、end。</p>
<p>Vue 3.4 起的 defineModel 编译宏会生成同样的 prop 与更新事件，宏的用法、修饰符，以及多模型非原子更新、对象模型深层修改等边界，见 defineModel 一题。</p>
<h2>默认值不会自动写回父级</h2>
<p>父级绑定值是 undefined、子组件用默认值显示 1 时，父级变量并没有变成 1。应在状态所有者处初始化，并约定 null、空字符串与“未提供”是否不同。</p>
<h2>原生控件与自定义组件的绑定规则不同</h2>
<p>原生文本输入通常通过 value 与 input 事件同步，复选框和单选框关注 checked，select 又有选择规则。Vue 的 v-model 指令会根据控件类型处理，不是简单给所有元素都绑定同一个事件名。</p>
<p>对于需要输入法的文字，原生 v-model 通常在组合输入阶段暂缓模型更新，结束后再同步。自行包装输入时如果忽略这一点，可能把尚未完成的拼音或组合字符当成最终值处理，破坏编辑体验。</p>
<p>.lazy、.trim、.number 等原生修饰符也有具体语义。.number 不保证每个状态都是 number，例如无法解析或清空时仍可能保留字符串。业务解析应与用户编辑中的临时值区分。</p>
<p>组件自己的修饰符需要按其 API 支持，尤其自定义的 capitalize 等行为，需要通过模型转换或实现明确处理。不能只在组件调用处写一个新后缀，就期待 Vue 自动知道业务转换规则。</p>
<h2>类型、事件声明与实际行为应一致</h2>
<p>defineProps、defineEmits 或 defineModel 可以帮助描述类型和开发期约定，但不会替代任意外部输入的业务验证，也不自动保存数据到服务器。</p>
<p>验证一个模型组件时，应同时从两个方向操作：用户输入是否正确更新父级，父级改值是否正确反映到子级；再检查清空、重置、默认值、输入法、禁用和记录切换。两条路径都明确，v-model 才是简洁的数据流接口，而不是隐藏状态覆盖的来源。</p>`};export{e as default};