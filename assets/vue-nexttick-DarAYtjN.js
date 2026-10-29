var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在 Vue 里给响应式数据赋值，JavaScript 里马上就能读到新值。可是页面上的 DOM 不会立刻变，Vue 会把更新放进一个队列，等当前代码执行完，在同一轮的微任务里统一更新。</p>
<p>这样做是为了合并。一个点击事件里改了十次数据，页面只需要重新渲染一次。</p>
<p>代价是改完数据立刻去读 DOM，读到的还是旧的。<code>nextTick()</code> 返回一个 Promise，在这一轮 DOM 更新完成后 resolve，所以 <code>await nextTick()</code> 以后再读就是新的了。典型场景有三个：新渲染出来的输入框要聚焦、列表追加后滚到底部、内容变化后测量高度。</p>
<p>要注意，它只等 Vue 的 DOM 更新，不等图片加载、动画结束或者网络请求。</p>
</blockquote>
<h2>现象：改完数据，DOM 还是旧的</h2>
<p>下面是一个聊天列表，追加一条消息后要滚到底部：</p>
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
<p><code>push</code> 之后 <code>messages</code> 已经多了一项，可是第一行打印出来的 <code>li</code> 数量还是旧的。原因就是 DOM 更新还在队列里排着。如果这时直接设 <code>scrollTop</code>，滚到的是旧内容的底部，新消息露不出来。等 <code>nextTick()</code> 之后，新的 <code>li</code> 已经渲染出来，<code>scrollHeight</code> 才包括它。</p>
<h2>另一个常见场景：点编辑后聚焦</h2>
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
<p><code>editing</code> 设成 <code>true</code> 的那一刻，<code>input</code> 还没被 <code>v-if</code> 渲染出来，<code>input.value</code> 是 <code>null</code>，调用 <code>focus()</code> 会报错。所以要等一下再聚焦。</p>
<h2>有没有别的写法</h2>
<p>如果是每次 DOM 更新后都要执行的逻辑，用 <code>onUpdated</code>，或者 <code>watch(..., { flush: &#x27;post&#x27; })</code>，就不用在每个改数据的地方都写一遍 <code>nextTick</code>。如果只是挂载后访问一次 DOM，用 <code>onMounted</code> 就够了。</p>
<h2>它是怎么实现的</h2>
<p>Vue 用 <code>Promise.resolve().then(flushJobs)</code> 安排队列刷新，<code>nextTick(fn)</code> 则把回调排在这次刷新之后。因为用的是微任务，它会在浏览器绘制之前执行。所以在 <code>nextTick</code> 里读到的布局信息已经是更新后的，但用户这时还没看到新画面。</p>
<h2>常见追问</h2>
<p><strong>在 nextTick 里能读到 CSS 过渡结束后的尺寸吗？</strong></p>
<blockquote>
<p>不能。<code>nextTick</code> 只等 DOM 更新，过渡动画还没开始播。要拿过渡结束后的尺寸，得监听 <code>transitionend</code> 事件。</p>
</blockquote>
<p><strong>Vue 2 的 <code>this.$nextTick</code> 和 Vue 3 有什么区别？</strong></p>
<blockquote>
<p>用法相同。Vue 3 改成从 <code>vue</code> 里导入 <code>nextTick</code> 函数，并且统一返回 Promise。</p>
</blockquote>`};export{e as default};