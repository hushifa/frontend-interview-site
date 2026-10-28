var e={answerHtml:`<p>一个组件库的表格从几百行增长到几万行后，用户发现输入筛选会卡顿。开发者给每个组件加 <code>v-memo</code>，结果某些单元格不再更新，键盘焦点和错误状态也变得难以追踪。性能优化必须先找出成本来自响应式计算、组件更新、DOM 数量还是布局绘制，再选择不会破坏公共行为的方案。</p>
<h2>先缩小响应式范围和更新输入</h2>
<p>父组件每次更新时，子组件是否需要重新计算，取决于传入 props 的身份和内容。把整个行对象、会不断新建的内联对象或每次都变化的回调传给大量子组件，会扩大更新范围。可以把单元格真正需要的字段作为稳定 props 传入，并把派生状态在合适的层级计算。</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { computed } from &#x27;vue&#x27;;

const props = defineProps({
  name: { type: String, required: true },
  enabled: Boolean,
  selected: Boolean,
});
const emit = defineEmits([&#x27;select&#x27;]);

const statusText = computed(() =&gt; {
  return props.enabled ? &#x27;已启用&#x27; : &#x27;已停用&#x27;;
});
&lt;/script&gt;

&lt;template&gt;
  &lt;div&gt;
    &lt;span&gt;{{ name }}&lt;/span&gt;
    &lt;span&gt;{{ statusText }}&lt;/span&gt;
    &lt;button type=&quot;button&quot; :aria-pressed=&quot;selected&quot; @click=&quot;emit(&#x27;select&#x27;)&quot;&gt;
      {{ selected ? &#x27;取消选择&#x27; : &#x27;选择&#x27; }} {{ name }}
    &lt;/button&gt;
  &lt;/div&gt;
&lt;/template&gt;
</code></pre></div>
<p>示例只是说明组件边界，不代表所有表格都应拆成最小组件。组件越细，实例和通信成本也可能增加；应通过 Vue DevTools、Performance 面板和真实数据测量。</p>
<p>这里传入 name、enabled、selected 三个实际需要的值，不再每次把新建的整行对象传给展示组件。选择使用原生切换按钮及 aria-pressed；普通 div 不能仅添加 aria-selected 就成为有效的选项控件。完整数据表应保留 table、行与单元格语义，不能把这个独立展示组件当作完整表格实现。</p>
<p>假设父组件持有 selectedId，给每行传 selectedId 会让所有行的这个 prop 同时变化；改传 <code>:selected=&quot;row.id === selectedId&quot;</code>，从 A 选到 B 时通常只有 A、B 两行的布尔值改变。列表扫描仍可能发生，只是减少了不必要的子组件更新，不能宣称整个操作变成 O(1)。</p>
<p>也不是传对象必然慢：稳定的响应式行对象可以通过属性读取追踪需要的字段。真正需要避免的是与当前渲染无关的值反复变化或频繁重建对象，应以生产录制为依据，而不是一律把所有 props 拆成基础类型。</p>
<h2>插槽是公共契约，也可能放大更新</h2>
<p>表格提供单元格插槽后，业务方可以渲染按钮、输入框和复杂图表。组件库不能假设插槽是廉价纯文本，也不能为了优化跳过插槽更新。应记录插槽渲染上下文、稳定 key、分页和虚拟化限制，并让消费者知道哪些单元格适合放重组件。</p>
<p>如果单元格内部有输入状态，虚拟列表卸载行时不能把草稿只存于行组件；应按稳定记录 ID 保存在表单状态或上层 store。重新进入可见区时恢复值、错误和焦点关系，避免用户滚动后丢失编辑内容。</p>
<h2>虚拟列表需要处理语义和键盘路径</h2>
<p>虚拟化只保留可见范围附近的 DOM，能减少布局和绘制，但会改变屏幕阅读器看到的节点数量和键盘移动方式。组件需要提供总行数、当前范围、行标题和可访问位置，并处理焦点离开被卸载行的情况。不能为了减少节点把不可见但正在编辑的内容直接销毁。</p>
<p>动态行高、粘性表头、列固定、展开行和滚动到错误位置都会增加测量成本。先确认业务真的需要同时渲染几万行；分页、服务端筛选和分组摘要通常更容易维护。虚拟列表适合大量重复行，不适合所有复杂布局。</p>
<h2>缓存和跳过更新要谨慎</h2>
<p><code>computed</code> 适合缓存纯派生结果，<code>v-memo</code>、<code>shallowRef</code> 或手动缓存可以减少特定更新，但会让数据依赖更隐式。跳过更新前要写清楚哪些值变化时必须重新渲染，并测试禁用、错误、选中、加载和权限状态。不能通过冻结对象或浅层响应式让组件“看起来更快”，却让嵌套字段变化不再触发界面。</p>
<p>组件库应避免把业务数据深度 <code>reactive</code> 化后再复制多份。大列表可以保留原始数据、使用稳定索引和按需派生；如果引入不可变更新或结构共享，要统一消费者契约，避免一部分组件修改对象、一部分组件假设只读。</p>
<h2>DOM 和布局仍是最终瓶颈</h2>
<p>即使 Vue 更新很快，浏览器仍需处理 DOM、样式、布局和绘制。表格中重复的阴影、复杂选择器、自动测量列宽和同步读取 <code>offsetHeight</code> 都可能造成长帧。把读写分批、减少过度装饰、限制同时可见节点，并用 Long Animation Frames 或 Performance 面板确认改善。</p>
<h2>组件库发布前的性能契约</h2>
<p>每个重型组件文档应说明推荐数据量、分页和虚拟化入口、默认渲染状态、插槽成本、键盘行为和销毁规则。性能回归测试要固定数据规模和设备条件，比较首次渲染、筛选、滚动、编辑和卸载后的内存；不能只比较一次快照或开发模式日志。</p>
<h2>常见误区</h2>
<ul>
<li>给所有组件加缓存：可能跳过必要状态和错误更新。</li>
<li>只减少 Vue 更新：浏览器布局和绘制仍可能成为瓶颈。</li>
<li>虚拟列表直接卸载表单行：会丢草稿、焦点和错误状态。</li>
<li>用数组下标作为 key：重排后会复用错误的内部状态。</li>
<li>只在高性能电脑测试：低端设备和长列表才会暴露真实问题。</li>
</ul>
<h2>参考资料</h2>
<ul>
<li><a href="https://vuejs.org/guide/best-practices/performance.html">Vue · Performance</a></li>
<li><a href="https://vuejs.org/guide/essentials/list.html">Vue · List Rendering</a></li>
<li><a href="https://vuejs.org/guide/essentials/reactivity-fundamentals.html">Vue · Reactivity Fundamentals</a></li>
<li><a href="https://www.w3.org/WAI/tutorials/tables/">WAI · Tables Tutorial</a></li>
</ul>`};export{e as default};