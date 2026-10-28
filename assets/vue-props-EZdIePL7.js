var e={answerHtml:`<h2>简答</h2>
<p>props 是单向数据流：父级更新会流向子组件，子组件不能直接修改 prop，否则会收到警告，要通过 emit 通知父级修改。需要本地编辑时，用 prop 初始化本地 ref 作为草稿，或用 computed 派生。对象类型的 prop 可以修改内部属性，但这会悄悄改动父级状态，应当避免。Vue 3.5 起可以直接解构 defineProps 并保持响应性，传给函数时要用 getter 包装。</p>
<p>单向数据流的重点是明确谁拥有状态。父组件负责提供当前值，也可以负责校验、限制、保存和重置；子组件展示数据，并通过事件表达用户希望发生的操作。</p>
<p>这样发生变化时，可以找到一个明确的决策位置，而不是多个组件都直接修改同一个对象，最后很难判断谁覆盖了谁。</p>
<h2>子组件提出请求，父组件决定是否接受</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- CounterButton.vue --&gt;
&lt;script setup&gt;
const props = defineProps({
  count: { type: Number, required: true },
  step: { type: Number, default: 1 },
});
const emit = defineEmits([&#x27;increment&#x27;]);

function requestIncrement() {
  emit(&#x27;increment&#x27;, props.step);
}
&lt;/script&gt;

&lt;template&gt;
  &lt;button type=&quot;button&quot; @click=&quot;requestIncrement&quot;&gt;
    当前 {{ props.count }}，申请增加 {{ props.step }}
  &lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import CounterButton from &#x27;./CounterButton.vue&#x27;;

const count = ref(0);
const message = ref(&#x27;&#x27;);

function increment(amount) {
  if (!Number.isFinite(amount) || count.value + amount &gt; 2) {
    message.value = &#x27;本例最多允许增加到 2。&#x27;;
    return;
  }
  count.value += amount;
  message.value = &#x27;&#x27;;
}

function reset() {
  count.value = 0;
  message.value = &#x27;&#x27;;
}
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;CounterButton :count=&quot;count&quot; :step=&quot;1&quot; @increment=&quot;increment&quot; /&gt;
    &lt;button type=&quot;button&quot; @click=&quot;reset&quot;&gt;重置&lt;/button&gt;
    &lt;p role=&quot;status&quot;&gt;{{ message }}&lt;/p&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>子组件没有修改 count，而是发出 increment。父组件可以接受，也可以拒绝超过上限的操作。即使按钮一直被点击，实际值仍由父级决定，再通过 prop 传回展示。</p>
<p>这里的限制只是演示父级决策，不是服务端安全校验。事件校验和 props 类型声明同样不能替代跨网络的业务验证。</p>
<h2>只读 prop 不等于整个对象图都被深冻结</h2>
<p>子组件不应重新给 props.count 赋值。父级刷新时会继续提供自己的值，直接改 prop 既违反所有权，也容易被后续更新覆盖。</p>
<p>但对象、数组作为 prop 传入时，子组件可能持有同一个嵌套对象的引用。修改 props.user.name 在技术上可能影响父级对象，并不因为没有给 props.user 重新赋值就变成清楚的数据流。</p>
<p>除非父子组件明确约定紧密共享可变结构，否则通常应发出具体更新事件，或由父级提供明确的操作函数。是否能够修改，与是否应该把修改权暴露出去，是两件不同的事。</p>
<h2>本地编辑草稿需要单独的同步策略</h2>
<p>有些组件需要先编辑、再保存或取消，此时可以从 prop 初始化一份本地草稿。草稿与已保存值是不同状态，不应在用户每次输入时都无条件写回父级。</p>
<p>但 <code>ref(props.initialValue)</code> 通常只采用初始化时的值，父级以后更新不会自动重置这份 ref。若需要跟随记录切换或外部刷新，应明确什么时候覆盖草稿，是否先提示未保存修改，以及保存成功后怎样收敛。</p>
<p>反过来，一个无条件 watch 每次父值变化都覆盖草稿，也可能抹掉用户正在编辑的内容。简单显示转换通常用 computed 更合适，不需要复制出一份独立状态。</p>
<h2>props 解构有 Vue 3.5 的编译期例外</h2>
<p>下面的 script setup 示例面向 Vue 3.5 及以上：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- DestructuredCount.vue --&gt;
&lt;script setup&gt;
import { watchEffect } from &#x27;vue&#x27;;
const { count } = defineProps({ count: Number });

watchEffect(() =&gt; {
  console.log(&#x27;收到计数：&#x27;, count);
});
&lt;/script&gt;

&lt;template&gt;
  &lt;p&gt;{{ count }}&lt;/p&gt;
&lt;/template&gt;
</code></pre></div>
<p>在这一特定语法中，编译器会把同一 script setup 作用域内对解构变量的访问转换为 props 属性读取。因此父级 count 变化时，watchEffect 可以重新执行。</p>
<p>Vue 3.4 及更早版本对这个写法并没有同样行为；而普通 JavaScript 从 reactive 对象中解构原始值，也不会因为升级到 3.5 就自动变成响应式。</p>
<p>把解构值交给其他函数时，还要保留访问方式。watch(count, ...) 仍然可能只是传一个当前数字，应该使用 getter，例如 watch(() =&gt; count, ...)。需要给组合函数持续读取的来源，也应按它支持的 getter/ref 接口传递，而不是只给一个值快照。</p>
<h2>默认值与校验不负责创造额外业务保证</h2>
<p>props 的 required、type、validator 等声明有助于文档化和开发期发现误用，但警告不等于把错误数据自动转换成安全值。对象或数组默认值也要按对应声明方式避免无意共享可变实例。</p>
<p>父级没有提供某个值时，子级默认值可以影响本地展示，但不自动意味着父级状态也被写入同一个值。特别是模型绑定与异步初始化场景，双方需要对空值和默认值有一致约定。</p>
<h2>事件、v-model 与共享状态各有适用范围</h2>
<p>组件事件通常表达直接父子之间的沟通，不会像原生 DOM 事件一样自动沿组件祖先无限冒泡。多个层级共享状态时，可以考虑提供/注入或状态库，但仍要有明确的修改入口。</p>
<p>组件 v-model 把 prop 与更新事件的约定写得更简洁，不是取消单向数据流。复杂操作也不一定都适合一个 update 事件，保存、取消、提交草稿等意图可以有更具体的接口。</p>
<p>好的 props 设计应让调用方知道：传入的是当前状态还是初始值，子组件是否持有草稿，哪些动作会请求更新，以及父级什么时候有权拒绝或重置。把这些关系说明白，组件复用才不会依赖隐蔽的共享修改。</p>`};export{e as default};