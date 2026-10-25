var e={answerHtml:`<p>defineModel 是 Vue 3.4 起提供的 script setup 编译宏。默认模型对应 modelValue 与 update:modelValue，提供字符串名称时则对应那个名称的 prop 与更新事件。</p>
<p>它返回的模型引用让子组件可以用类似 ref 的方式读取和写入，但背后仍然要与父级绑定协作。宏减少的是重复声明代码，不是取消数据所有权。</p>
<h3>多个命名模型可以各自建立契约</h3>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- ModelEditor.vue --&gt;
&lt;script setup&gt;
const [title, titleModifiers] = defineModel(&#x27;title&#x27;, {
  type: String,
  required: true,
  set(value) {
    return titleModifiers.uppercase ? value.toUpperCase() : value;
  },
});
const enabled = defineModel(&#x27;enabled&#x27;, { type: Boolean, required: true });
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;label&gt;标题&lt;input v-model=&quot;title&quot; /&gt;&lt;/label&gt;
    &lt;label&gt;&lt;input v-model=&quot;enabled&quot; type=&quot;checkbox&quot; /&gt;启用&lt;/label&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import ModelEditor from &#x27;./ModelEditor.vue&#x27;;
const title = ref(&#x27;Vue&#x27;);
const enabled = ref(true);
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;ModelEditor v-model:title.uppercase=&quot;title&quot; v-model:enabled=&quot;enabled&quot; /&gt;
    &lt;p&gt;父级标题：{{ title }}&lt;/p&gt;
    &lt;p&gt;父级启用：{{ enabled }}&lt;/p&gt;
    &lt;button type=&quot;button&quot; @click=&quot;title = &#x27;from parent&#x27;&quot;&gt;父级赋值&lt;/button&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>title 模型对应 title/update:title，enabled 模型对应 enabled/update:enabled。子组件用模板绑定模型引用，更新后通过生成的协议把值交给父级；父级自己赋值，也会沿 prop 路径反映到子组件。</p>
<p>在 JavaScript 中操作模型引用仍通常使用 .value，模板则遵循 ref 解包规则。defineModel 不是在普通 JavaScript 文件里随便调用的运行时函数，不需要像 ref 那样从 vue 导入，应由相应 SFC 编译器处理。</p>
<h3>修饰符只会执行你定义的含义</h3>
<p>uppercase 是本例自定义的修饰符，宏把修饰符信息交给组件，set 转换决定从子级发出的值怎样处理。用户输入 react，会把 REACT 交给父级。</p>
<p>但父级按钮直接写入 from parent，不会因为存在 set 转换就自动变成大写。set 处理的是相应写入路径，不是所有值进入系统时都强制执行的全局规则。若需要对读取展示也做变换，可以设计 get 转换，并明确显示值与实际模型值的区别。</p>
<p>大小写、去空白、数值化等转换也会影响光标和输入法体验。不能仅因为宏允许转换，就在每个中间输入状态都强制采用最终业务格式。</p>
<h3>子级默认值不会自动初始化父级</h3>
<p>下面展示一个应当理解并有意处理的边界：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- DefaultCounter.vue --&gt;
&lt;script setup&gt;
const model = defineModel({ type: Number, default: 1 });
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;output aria-label=&quot;子级模型&quot;&gt;{{ model }}&lt;/output&gt;
    &lt;button type=&quot;button&quot; @click=&quot;model++&quot;&gt;子级增加&lt;/button&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- DefaultParent.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import DefaultCounter from &#x27;./DefaultCounter.vue&#x27;;
const count = ref();
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;p&gt;父级模型：{{ count === undefined ? &#x27;undefined&#x27; : count }}&lt;/p&gt;
    &lt;DefaultCounter v-model=&quot;count&quot; /&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>初始时子级可以显示 1，而父级 count 仍是 undefined。子级默认值不等于已经向父级发出了一次初始化更新。之后操作模型，父级才可能通过更新事件接收到新的值。</p>
<p>更清楚的设计通常是在状态所有者处初始化，或明确要求父级提供值。required 可以表达契约和辅助开发检查，但也不是生成父级状态或阻止所有错误运行时输入的自动机制。</p>
<h3>对象模型的深层修改不一定经过模型 setter</h3>
<p>模型中存的是对象时，直接修改 model.value.name 可能只是修改共享对象的嵌套属性，并没有给 model.value 重新赋值。不能因此保证 update 事件、set 转换或你希望记录的提交动作都按预期发生。</p>
<p>如果接口约定通过模型更新提交新对象，可以复制修改路径后给模型赋值；如果是复杂表单草稿，也可以用显式保存事件，把局部编辑与正式父级状态分开。选择取决于双方约定，而不只是“写起来更像双向绑定”。</p>
<h3>多个模型不代表更新天然原子化</h3>
<p>把起止日期拆成两个命名模型，可以改善接口表达，但它们仍可能先后变化。如果两个字段必须始终满足共同条件，父级可能需要统一校验，或改为一个整体值、草稿提交流程。</p>
<p>校验错误、请求 pending、服务器确认结果也不是输入模型本身。把它们全部混成一个随时双向写入的大对象，往往会让状态来源更加混乱。</p>
<h3>它仍依赖完整的父子绑定与编译链</h3>
<p>没有正确的 prop/update 绑定关系时，子级的本地模型行为不能被理解成父级已经同步。命名不匹配、忘记监听或把只读来源当写入目标，都可能让两边出现不同结果。</p>
<p>相关类型参数、默认值、修饰符和转换选项也需要匹配编译器与 Vue 版本。旧运行环境或没有相应 SFC 编译支持的工具，不会仅因为函数名字叫 defineModel 就生成这些能力。</p>
<p>验证时应覆盖父级改值、子级输入、默认值未初始化、自定义修饰符、清空与组合输入，还要检查是否产生多余更新或隐藏的对象修改。只有这些边界明确，defineModel 才真正减少维护工作，而不是把通信规则藏得更深。</p>`};export{e as default};