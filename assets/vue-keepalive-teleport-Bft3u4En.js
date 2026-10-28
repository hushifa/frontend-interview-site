var e={answerHtml:`<h2>简答</h2>
<p>KeepAlive 缓存被切走的组件实例，切回时状态保留，并触发 activated 和 deactivated 钩子；用 include、exclude、max 控制缓存范围，计时器等资源要在 deactivated 中暂停。Teleport 把一段模板渲染到另一个 DOM 位置（如 body），逻辑上的父子关系、props 和事件都保持不变，常用于弹窗。目标容器必须在挂载时已经存在，焦点管理和 ARIA 仍要自己实现。</p>
<p>切换页面后希望保留草稿，与把说明层放到页面外层，是两种不同需求。KeepAlive 主要保留组件实例及其局部状态；Teleport 主要调整某段内容在真实 DOM 中的位置。</p>
<p>它们可以一起使用，但不应该把“缓存了组件”理解成“所有资源自动暂停”，也不应该把“移到 body 外层”理解成“对话框交互已经实现”。</p>
<h2>缓存组件有激活与停用阶段</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- CachedCounter.vue --&gt;
&lt;script setup&gt;
import { onActivated, onDeactivated, onUnmounted, ref } from &#x27;vue&#x27;;

const ticks = ref(0);
const draft = ref(&#x27;&#x27;);
let timer;

function start() {
  if (timer !== undefined) return;
  timer = setInterval(() =&gt; { ticks.value += 1; }, 1000);
}

function stop() {
  clearInterval(timer);
  timer = undefined;
}

onActivated(start);
onDeactivated(stop);
onUnmounted(stop);
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;p&gt;计时次数：{{ ticks }}&lt;/p&gt;
    &lt;label&gt;草稿&lt;input v-model=&quot;draft&quot; /&gt;&lt;/label&gt;
  &lt;/section&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- OtherView.vue --&gt;
&lt;template&gt;
  &lt;p&gt;另一个页面&lt;/p&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Parent.vue --&gt;
&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import CachedCounter from &#x27;./CachedCounter.vue&#x27;;
import OtherView from &#x27;./OtherView.vue&#x27;;

const active = ref(&#x27;counter&#x27;);
const noticeOpen = ref(false);
&lt;/script&gt;

&lt;template&gt;
  &lt;section&gt;
    &lt;button type=&quot;button&quot; @click=&quot;active = &#x27;counter&#x27;&quot;&gt;计时页面&lt;/button&gt;
    &lt;button type=&quot;button&quot; @click=&quot;active = &#x27;other&#x27;&quot;&gt;其他页面&lt;/button&gt;
    &lt;KeepAlive :max=&quot;2&quot;&gt;
      &lt;component :is=&quot;active === &#x27;counter&#x27; ? CachedCounter : OtherView&quot; /&gt;
    &lt;/KeepAlive&gt;
    &lt;button type=&quot;button&quot; @click=&quot;noticeOpen = !noticeOpen&quot;&gt;切换说明层&lt;/button&gt;
    &lt;Teleport to=&quot;#overlay-root&quot;&gt;
      &lt;div v-if=&quot;noticeOpen&quot; class=&quot;notice&quot;&gt;
        &lt;p&gt;这段说明仍由原组件控制。&lt;/p&gt;
        &lt;button type=&quot;button&quot; @click=&quot;noticeOpen = false&quot;&gt;关闭说明&lt;/button&gt;
      &lt;/div&gt;
    &lt;/Teleport&gt;
  &lt;/section&gt;
&lt;/template&gt;

&lt;style scoped&gt;
.notice {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  padding: 1rem;
  border: 1px solid #94a3b8;
  background: white;
}
&lt;/style&gt;
</code></pre></div>
<p>Teleport 的目标容器应由宿主页面预先提供，例如与应用容器并列：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;app&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;overlay-root&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>max 为 2 时，在两个页面间切换可以保留计时器组件的 ticks 与草稿。离开计时页面会 deactivated，stop 暂停计时；回来会 activated，继续从原值运行，而不是重复建立多个计时器。</p>
<h2>activated 不只是“第二次回来”才调用</h2>
<p>缓存组件初次挂载时也会激活，所以例子直接在 onActivated 中启动工作，不需要再在 mounted 中无条件启动一份。deactivated 在进入缓存时调用，也可能参与最终卸载过程，因此清理保持可重复执行很重要。</p>
<p>KeepAlive 不会自动清除任意监听、关闭连接或停止轮询。组件实例仍然存在，响应式关系与外部任务也可能继续工作。哪些任务只在活动时运行，应由组件按业务控制。</p>
<h2>缓存范围和容量需要明确</h2>
<p>include、exclude 根据组件名称筛选范围，不是自动按 URL 或 DOM id 匹配。script setup 在支持的版本中可以根据文件名推断组件名，但应确认实际命名与规则。</p>
<p>max 限制缓存实例数量，采用最近使用策略。示例若改成 max=1，切到另一组件可能淘汰计时组件，回来就需要重新创建，本地草稿与计数不再保证保留。</p>
<p>数量上限不是内存字节上限。一个保留巨大图表、编辑器或数据列表的实例，也可能占用很多内存。改变 key 还可能让同一组件类型形成不同缓存身份，不能无限制造 key 再期待缓存自动廉价。</p>
<p>缓存也不是持久化。刷新页面、销毁 KeepAlive 容器、淘汰实例等都会影响局部状态；重要草稿需要更明确的数据保存策略。</p>
<h2>Teleport 只改变物理位置，逻辑关系仍在</h2>
<p>示例说明层的 DOM 位于 #overlay-root 内，但其状态、事件处理和组件逻辑仍归 Parent。正常的 props、组件事件和 provide/inject 关系不因为 DOM 被搬走就自动改成目标容器那一侧的组件关系。</p>
<p>这有助于让浮层避开原先祖先的部分定位、裁剪或层叠限制。但 CSS 继承与依赖真实祖先的选择器仍受物理 DOM 位置影响，滚动和事件的原生传播路径也应按真实节点关系分析。</p>
<p>scoped 样式可以通过编译后的作用域标记作用于内容，但不能据此认为所有父级布局约束和继承值都会原样保留。</p>
<h2>目标必须在正确时机存在</h2>
<p>目标不应依赖一个尚未出现的异步页面。Vue 3.5 的 defer 可以把目标解析推迟到同一挂载或更新周期中较晚出现的容器，但不是等任意未来请求完成的通用等待器。</p>
<p>多个 Teleport 共享目标时，还需要理解内容排列、层级与关闭顺序。SSR 也要由服务端渲染与宿主整合处理传送内容，不能只看客户端一次插入成功就认为 hydration 已经正确。</p>
<h2>浮层交互仍需要单独完成</h2>
<p>示例是一段可关闭的非模态说明。真正的模态对话框还需要明确名称、初始焦点、退出方式、背景交互与滚动管理，可以按需求使用原生 dialog 或成熟组件方案。</p>
<p>Teleport 不会自动提供焦点约束、Escape 关闭或所有无障碍语义，也不使任意 z-index 冲突都消失。选择它是为了清楚表达挂载位置，而不是省略交互设计。</p>
<p>验证时应分别观察实例状态是否保留、停用时任务是否停止、淘汰是否释放资源，以及传送目标、样式和事件是否符合预期。缓存与挂载位置各自正确，组合后才有可靠的组件行为。</p>
<p>补充参考：<a href="https://vuejs.org/guide/built-ins/teleport.html">Vue · Teleport</a>。</p>`};export{e as default};