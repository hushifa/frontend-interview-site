var e={answerHtml:`<p>父组件写一个 v-model，看起来像把自己的变量直接交给子组件任意修改。实际关系更明确：父级把当前值作为 prop 传下去，子级在希望更新时发出约定事件，父级的绑定处理再更新自己的状态。</p>
<p>默认模型使用 modelValue 与 update:modelValue。所谓双向绑定，是这两条路径被简写连接起来，不是让子组件获得修改父级任意变量的权限。</p>
<h3>用显式 prop、事件与可写 computed 实现</h3>
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
<p>也可以手工写 value 绑定与输入事件，但需要正确处理输入法组合等细节。示例在内部继续使用原生 v-model，以复用它对输入事件的相应处理。</p>
<h3>编译后的约定并不神秘</h3>
<p>组件上的 v-model 大致展开为传入 modelValue，并注册 update:modelValue 处理函数，把事件载荷写回父级绑定表达式。父级需要的是可赋值的合适表达式，不能把任意只读计算结果都当成可以写回的目标。</p>
<p>如果父级需要校验、格式化或拒绝更新，可以显式管理这条事件路径。但拒绝后的界面反馈、输入框当前 DOM 值和草稿状态也要设计，不能只让监听器什么都不做，就假定所有控件都会自动呈现正确回退。</p>
<p>当交互是“编辑草稿，最后保存或取消”，它也未必适合每次输入都立即修改父级真实值。可以使用独立草稿与提交事件，明确区分编辑过程和正式确认。</p>
<h3>命名模型用于多组独立的值</h3>
<p>v-model:title 对应 title prop 与 update:title 事件，而不是继续使用默认 modelValue。一个组件可以定义多组命名模型，例如区间的 start、end，或姓名的 firstName、lastName。</p>
<p>每组模型仍需要明确允许的值、更新时机与组合约束。若 start 与 end 必须一起满足范围规则，拆成两个更新事件可能出现中间状态，应考虑原子更新对象或更合适的提交接口，而不是仅为语法方便拆分。</p>
<p>Vue 3.4 起的 defineModel 编译宏可以简化模型声明，生成相应 prop 与更新事件关系。它不是运行时魔法，也不改变父级是值来源、子级发出更新意图这一原则。</p>
<h3>默认值不会自动写回父级</h3>
<p>如果父级绑定值是 undefined，子组件却通过模型默认值显示 1，两边初始理解可能不同：子级看见默认值，不代表父级变量已经被改成 1。</p>
<p>应在合适的所有者处初始化，或明确一个双方都理解的空值约定。组件 API 还要说明 null、空字符串、空数组与“未提供”是否不同，不能全靠默认值把差异掩盖掉。</p>
<p>直接修改对象模型的嵌套属性，也不一定经过希望观察的更新事件。对象引用可能被共享，因此复杂模型应明确是否采用不可变更新、草稿提交或受控的深层操作。</p>
<h3>原生控件与自定义组件的绑定规则不同</h3>
<p>原生文本输入通常通过 value 与 input 事件同步，复选框和单选框关注 checked，select 又有相应选择规则。Vue 的 v-model 指令会根据控件类型处理，不是简单给所有元素都绑定同一个事件名。</p>
<p>对于需要输入法的文字，原生 v-model 通常在组合输入阶段暂缓模型更新，结束后再同步。自行包装输入时如果忽略这一点，可能把尚未完成的拼音或组合字符当成最终值处理，破坏编辑体验。</p>
<p>.lazy、.trim、.number 等原生修饰符也有具体语义。.number 不保证每个状态都是 number，例如无法解析或清空时仍可能保留相应字符串。业务解析应与用户编辑中的临时值区分。</p>
<p>组件自己的修饰符需要按其 API 支持，尤其自定义的 capitalize 等行为，需要通过模型转换或相应实现明确处理。不能只在组件调用处写一个新后缀，就期待 Vue 自动知道业务转换规则。</p>
<h3>类型、事件声明与实际行为应一致</h3>
<p>defineProps、defineEmits 或 defineModel 可以帮助描述类型和开发期约定，但不会替代任意外部输入的业务验证，也不自动保存数据到服务器。</p>
<p>验证一个模型组件时，应同时从两个方向操作：用户输入是否正确更新父级，父级改值是否正确反映到子级；再检查清空、重置、默认值、输入法、禁用和记录切换。两条路径都明确，v-model 才是简洁的数据流接口，而不是隐藏状态覆盖的来源。</p>`};export{e as default};