var e={answerHtml:`<h2>简答</h2>
<ul>
<li>修改响应式状态后，JS 中读到的已经是新值；但组件的 DOM 更新被推迟到队列中，在同一轮的微任务中统一执行。</li>
<li>这样同一个事件里多次修改只渲染一次。</li>
<li><code>nextTick()</code> 返回一个 Promise，在当前这轮 DOM 更新完成后 resolve。</li>
<li>典型场景：渲染新元素后立刻聚焦、列表追加后滚动到底部、内容变化后测量高度。</li>
<li>它只等待 Vue 的 DOM 更新，不等待图片加载、动画结束或网络请求。</li>
</ul>
<h2>示例：追加消息后滚动到底部</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { nextTick, ref } from &#x27;vue&#x27;;

const messages = ref([]);
const listEl = ref(null);

async function add(text) {
  messages.value.push(text);
  console.log(listEl.value.children.length); // 还是旧数量
  await nextTick();
  console.log(listEl.value.children.length); // 新数量
  listEl.value.scrollTop = listEl.value.scrollHeight;
}
&lt;/script&gt;

&lt;template&gt;
  &lt;ul ref=&quot;listEl&quot; style=&quot;height: 200px; overflow: auto&quot;&gt;
    &lt;li v-for=&quot;(m, i) in messages&quot; :key=&quot;i&quot;&gt;{{ m }}&lt;/li&gt;
  &lt;/ul&gt;
&lt;/template&gt;
</code></pre></div>
<h2>示例：点击编辑后聚焦输入框</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { nextTick, ref } from &#x27;vue&#x27;;

const editing = ref(false);
const input = ref(null);

async function startEdit() {
  editing.value = true;
  await nextTick();
  input.value.focus(); // v-if 渲染出 input 之后才能聚焦
}
&lt;/script&gt;

&lt;template&gt;
  &lt;input v-if=&quot;editing&quot; ref=&quot;input&quot; /&gt;
  &lt;button v-else @click=&quot;startEdit&quot;&gt;编辑&lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<h2>替代方式</h2>
<ul>
<li>每次 DOM 更新后都要执行的逻辑，用 <code>onUpdated</code> 或 <code>watch(..., { flush: &#x27;post&#x27; })</code>。</li>
<li>只需要在挂载后访问 DOM，用 <code>onMounted</code>。</li>
</ul>
<h2>实现原理</h2>
<p>Vue 用 <code>Promise.resolve().then(flushJobs)</code> 安排队列刷新；<code>nextTick(fn)</code> 把回调排在这次刷新之后。由于基于微任务，它会在浏览器绘制之前执行，所以此时读取的布局信息已经更新，但用户还没看到画面。</p>
<h2>常见追问</h2>
<ul>
<li>在 <code>nextTick</code> 中能读到 CSS 过渡结束后的尺寸吗？不能，过渡要监听 <code>transitionend</code> 事件。</li>
<li>Vue 2 的 <code>this.$nextTick</code> 和 Vue 3 的区别？用法相同，Vue 3 改为从 <code>vue</code> 导入函数，并统一返回 Promise。</li>
</ul>`};export{e as default};