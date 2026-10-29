var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>v-if</code> 是真正的条件渲染。条件为假时元素根本不存在，组件会被卸载，里面的状态和事件监听都被清掉。<code>v-show</code> 则总是渲染，只是用 <code>display: none</code> 把元素藏起来，组件实例和状态一直都在。</p>
<p>所以它们的成本正好相反。<code>v-if</code> 初始条件为假时什么都不渲染，开销小，但每次切换都要创建或销毁；<code>v-show</code> 一开始就要渲染，但切换只是改个样式。频繁切换的标签页、折叠面板用 <code>v-show</code>，权限控制、一开始不需要的大块内容用 <code>v-if</code>。</p>
<p>有一点容易忽略：<code>v-show</code> 藏起来的组件还在运行，计时器、请求、侦听器都不会停。隐藏时必须停掉这些东西，就用 <code>v-if</code>。</p>
<p>语法上，<code>v-if</code> 能配合 <code>v-else</code>、<code>v-else-if</code>，也能用在 <code>&lt;template&gt;</code> 上；<code>v-show</code> 两样都不行。</p>
</blockquote>
<h2>状态到底保不保留</h2>
<p>用一个带输入框的组件试一下。它在挂载和卸载时各打印一句：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Draft.vue --&gt;
&lt;script setup&gt;
import { onMounted, onUnmounted, ref } from &#x27;vue&#x27;;

const text = ref(&#x27;&#x27;);
onMounted(() =&gt; console.log(&#x27;挂载&#x27;));
onUnmounted(() =&gt; console.log(&#x27;卸载&#x27;));
&lt;/script&gt;

&lt;template&gt;
  &lt;textarea v-model=&quot;text&quot; /&gt;
&lt;/template&gt;
</code></pre></div>
<p>父组件里放两份，一份用 <code>v-if</code>，一份用 <code>v-show</code>：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
import Draft from &#x27;./Draft.vue&#x27;;

const visible = ref(true);
&lt;/script&gt;

&lt;template&gt;
  &lt;button @click=&quot;visible = !visible&quot;&gt;切换&lt;/button&gt;
  &lt;Draft v-if=&quot;visible&quot; /&gt;
  &lt;Draft v-show=&quot;visible&quot; /&gt;
&lt;/template&gt;
</code></pre></div>
<p>在两个输入框里都输入文字，再点两次切换。<code>v-if</code> 那份会打印“卸载”和“挂载”，文字被清空了；<code>v-show</code> 那份什么都没打印，文字还在。</p>
<p>原因是 <code>v-if</code> 隐藏时把组件整个销毁了，<code>text</code> 跟着没了，再显示时是一个全新的组件。<code>v-show</code> 只是改了根元素的 <code>display</code>，组件一直活着。</p>
<p>如果必须用 <code>v-if</code>，又想保留状态，可以把状态提升到父组件，或者用 <code>&lt;KeepAlive&gt;</code> 包住动态组件。</p>
<h2>怎么选</h2>
<table><thead><tr><th>场景</th><th>选择</th></tr></thead><tbody><tr><td>标签页、折叠面板来回切换</td><td><code>v-show</code></td></tr><tr><td>权限控制、初始不需要的大块内容</td><td><code>v-if</code></td></tr><tr><td>隐藏时必须停止计时器或断开连接</td><td><code>v-if</code></td></tr><tr><td>隐藏时保留表单草稿</td><td><code>v-show</code> 或状态提升</td></tr></tbody></table>
<h2>v-if 和 v-for 写在一起会怎样</h2>
<p>Vue 3 中，同一个元素上 <code>v-if</code> 的优先级比 <code>v-for</code> 高，所以 <code>v-if</code> 里读不到 <code>v-for</code> 的循环变量。想过滤列表，应该先用 <code>computed</code> 筛好再 <code>v-for</code>；想根据整体条件隐藏列表，就把 <code>v-if</code> 放到外层的 <code>&lt;template&gt;</code> 上。Vue 2 中两者优先级正好相反。</p>
<h2>对屏幕阅读器有什么影响</h2>
<p><code>display: none</code> 和 <code>v-if</code> 都会让内容从无障碍树中移除，屏幕阅读器读不到。如果只想视觉上隐藏、但还要让辅助技术读到，应该用视觉隐藏的 CSS 类，而不是这两个指令。</p>
<h2>常见追问</h2>
<p><strong>v-if 切换时 key 有什么用？</strong></p>
<blockquote>
<p>Vue 2 中，<code>v-if</code> 和 <code>v-else</code> 切换两个同类型元素时会复用同一个元素，比如两个输入框之间切换，输入的内容会留着，要加不同的 <code>key</code> 才能强制重建。Vue 3 的编译器会自动给各个分支生成不同的 key，所以不再需要手写。列表 key 的原理和 React 一样，见<a href="/questions/react-key/">《列表中的 key 为什么不能随意使用数组下标？》</a>。</p>
</blockquote>
<p><strong>在组件上用 v-show 会怎样？</strong></p>
<blockquote>
<p><code>display</code> 会加在组件的根元素上。如果组件有多个根元素，Vue 会给出警告。</p>
</blockquote>`};export{e as default};