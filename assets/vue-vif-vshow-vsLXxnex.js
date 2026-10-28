var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>v-if</code> 是真正的条件渲染：条件为假时元素不存在，组件被卸载，内部状态和事件监听被清理。</li>
<li><code>v-show</code> 总是渲染元素，只通过 <code>display: none</code> 隐藏，组件实例和状态一直保留。</li>
<li><code>v-if</code> 初始条件为假时不渲染，初始成本低，切换成本高；<code>v-show</code> 正好相反。</li>
<li><code>v-show</code> 隐藏的组件仍在运行：计时器、请求、侦听器都不会停止。</li>
<li><code>v-if</code> 可以配合 <code>v-else</code>、<code>v-else-if</code>，也能用在 <code>&lt;template&gt;</code> 上；<code>v-show</code> 不支持 <code>&lt;template&gt;</code>，也不能配合 <code>v-else</code>。</li>
</ul>
<h2>对比状态是否保留</h2>
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
<p>在两个输入框都输入文字，再切换两次：</p>
<ul>
<li><code>v-if</code> 那份打印&quot;卸载&quot;&quot;挂载&quot;，文字被清空。</li>
<li><code>v-show</code> 那份没有打印，文字还在。</li>
</ul>
<p>需要用 <code>v-if</code> 又想保留状态时，把状态提升到父组件，或者用 <code>&lt;KeepAlive&gt;</code> 包裹动态组件。</p>
<h2>如何选择</h2>
<table><thead><tr><th>场景</th><th>选择</th></tr></thead><tbody><tr><td>标签页、折叠面板来回切换</td><td><code>v-show</code></td></tr><tr><td>权限控制、初始不需要的大块内容</td><td><code>v-if</code></td></tr><tr><td>隐藏时必须停止计时器或断开连接</td><td><code>v-if</code></td></tr><tr><td>隐藏时保留表单草稿</td><td><code>v-show</code> 或状态提升</td></tr></tbody></table>
<h2>v-if 与 v-for</h2>
<p>Vue 3 中同一元素上 <code>v-if</code> 优先级高于 <code>v-for</code>，所以 <code>v-if</code> 里读不到 <code>v-for</code> 的循环变量。过滤列表应先用 <code>computed</code> 筛选，再 <code>v-for</code>；按整体条件隐藏列表，把 <code>v-if</code> 放在外层 <code>&lt;template&gt;</code> 上。Vue 2 中优先级相反。</p>
<h2>无障碍</h2>
<p><code>display: none</code> 和 <code>v-if</code> 都会让内容从无障碍树中移除，屏幕阅读器读不到。只想视觉隐藏但保留给辅助技术，应使用视觉隐藏类而不是这两个指令。</p>
<h2>常见追问</h2>
<ul>
<li><code>v-if</code> 切换时 key 有什么作用？<code>v-if</code> / <code>v-else</code> 切换两个相同类型的元素时，Vue 会复用元素；加不同的 <code>key</code> 可以强制重建。列表 key 的原理和 React 相同，见<a href="/questions/react-key/">《列表中的 key 为什么不能随意使用数组下标？》</a>。</li>
<li>组件上用 <code>v-show</code> 会怎样？<code>display</code> 加在组件根元素上；多根组件会给出警告。</li>
</ul>`};export{e as default};