var e={answerHtml:`<h2>简答</h2>
<p>v-if 真正创建和销毁条件子树，条件为假时组件被卸载、状态丢失，初次渲染成本低；v-show 始终渲染，只切换 display，组件状态保留，切换成本低。频繁切换用 v-show，很少改变或初始不需要渲染用 v-if。v-show 隐藏的组件里，计时器和请求仍在运行。v-if 不能和 v-show 一起用在 template 上。</p>
<p>两个区域都能在条件为 false 时看不见，但“看不见”不代表它们经历了相同的事情。v-if 通常让对应条件子树不再存在，v-show 则让已经存在的内容通过 display 隐藏。</p>
<p>组件本地状态、DOM 身份、监听器与初次加载工作都会受到这个区别影响，所以不能只用一句“频繁切换选 v-show”结束判断。</p>
<h2>用两个有草稿的计数面板观察区别</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- StatefulPanel.vue --&gt;
&lt;script setup&gt;
import { onMounted, onUnmounted, ref } from &#x27;vue&#x27;;

const props = defineProps({ label: String });
const count = ref(0);
const draft = ref(&#x27;&#x27;);
onMounted(() =&gt; console.log(\`挂载 \${props.label}\`));
onUnmounted(() =&gt; console.log(\`卸载 \${props.label}\`));
&lt;/script&gt;

&lt;template&gt;
  &lt;section :data-mode=&quot;props.label&quot;&gt;
    &lt;h3&gt;{{ props.label }}&lt;/h3&gt;
    &lt;output&gt;{{ count }}&lt;/output&gt;
    &lt;button type=&quot;button&quot; @click=&quot;count++&quot;&gt;增加&lt;/button&gt;
    &lt;label&gt;草稿&lt;input v-model=&quot;draft&quot; /&gt;&lt;/label&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import StatefulPanel from &#x27;./StatefulPanel.vue&#x27;;
const visible = ref(false);
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;button type=&quot;button&quot; @click=&quot;visible = !visible&quot;&gt;{{ visible ? &#x27;隐藏&#x27; : &#x27;显示&#x27; }}&lt;/button&gt;
    &lt;StatefulPanel v-if=&quot;visible&quot; label=&quot;v-if&quot; /&gt;
    &lt;StatefulPanel v-show=&quot;visible&quot; label=&quot;v-show&quot; /&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<p>初始为 false 时，v-if 面板没有被创建，v-show 面板则已经挂载，只是显示被关闭。首次显示后，分别增加计数、填写草稿，再隐藏并显示：v-if 的普通子组件重新挂载，本地计数与草稿重新初始化；v-show 那份实例仍保留原来的值。</p>
<p>这里强调的是子组件内部状态。如果草稿保存在父级，子组件重新挂载时又从父级取得它，数据也可以保留。因此是否丢失草稿，不只由指令决定，还取决于状态所有权。</p>
<h2>初始成本与切换成本不同</h2>
<p>v-if 是惰性的，初始条件不成立时可以省掉该分支的创建工作。以后每次进入或退出，可能需要创建、卸载组件和 DOM，并处理生命周期。</p>
<p>v-show 一开始就需要承担渲染与组件建立成本，后续主要调整显示。大型内容即使初始隐藏，也可能已经建立侦听、计时器或其他工作，不能把它当成没有资源开销的占位。</p>
<p>因此罕见打开的复杂面板常适合 v-if，频繁切换且需要保留实例的区域可以考虑 v-show。最终还要测量真实内容，不是每个场景都有一条永远正确的速度排名。</p>
<h2>隐藏不会自动暂停组件内部的工作</h2>
<p>v-show 不触发普通卸载，也不会自动停止请求、轮询、订阅或动画脚本。若这些工作只应在可见时运行，应让它们依据可见状态主动暂停或清理。</p>
<p>display:none 的内容不参与正常布局，相关尺寸读取可能变为 0。隐藏期间初始化需要真实尺寸的图表或编辑器，可能得到错误布局；应在合适的显示阶段测量或通知外部实例调整。</p>
<p>v-if 触发卸载也不意味着任意外部资源都由 Vue 自动认识并释放，组件仍需实现清理。KeepAlive 还会改变某些组件的停用与保留规则，应按真实树结构判断，不能把所有条件退出都视为普通销毁。</p>
<h2>template、else 与列表条件有不同语法规则</h2>
<p>v-if 可以用于 template，把多个元素作为一个条件块；v-else、v-else-if 需要相邻分支关系。v-show 需要实际元素的显示样式，不支持用 template 当作同样的隐藏容器，也不能与 v-else 组成相同的分支链。</p>
<p>Vue 3 中，同一元素同时写 v-if 与 v-for 时，v-if 的优先级更高，这时不能按直觉认为循环变量已经可供条件使用。应先用 computed 过滤出要显示的列表，或用外层结构表达条件与循环，而不是依赖容易误读的同元素组合。</p>
<p>如果条件决定整张列表是否存在，可以把条件放在外层；如果决定每条记录是否出现，派生出列表通常更清楚。</p>
<h2>列表中的 key</h2>
<p>用条件渲染增删列表项时，组件是否复用取决于 key。key 的选择原则见 React 的 key 题，Vue 同样适用：用稳定、同级唯一的业务 ID，不要用数组下标或渲染时生成的随机值。</p>
<h2>保留状态与保持可用性需要一起设计</h2>
<p>隐藏当前焦点所在区域时，应把焦点移动到合理的仍可操作位置，而不是让键盘用户突然失去上下文。弹层、折叠区与复杂表单还需要状态提示和无障碍关系。</p>
<p>想跨卸载保留业务草稿，可以提升状态或持久化；想保留组件实例，可以按需求评估 KeepAlive。不要为了保留一点数据，就无界地把所有大型区域永久 v-show 隐藏。</p>
<p>验证时除了看内容是否出现，还应观察首次挂载、再次显示、草稿、焦点、定时任务与列表重排。视觉相同的两种写法，生命周期成本可能完全不同。</p>`};export{e as default};