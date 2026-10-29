var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这两个内置组件解决的是不同问题。<code>&lt;KeepAlive&gt;</code> 包住动态组件或路由视图后，被切走的组件不会卸载，而是放进缓存，切回来时输入的内容、滚动位置都还在。<code>&lt;Teleport to=&quot;body&quot;&gt;</code> 则是把一段内容渲染到指定的 DOM 节点下，常用于弹窗，避免被父元素的 <code>overflow: hidden</code> 或层叠上下文挡住。</p>
<p>KeepAlive 切走时触发 <code>onDeactivated</code>，切回时触发 <code>onActivated</code>。用 <code>include</code>、<code>exclude</code> 按组件 name 决定缓存谁，用 <code>max</code> 限制数量，超了就淘汰最久没访问的那个。</p>
<p>它的边界在于，被缓存的组件还活着。定时器、轮询、WebSocket 不会自己停，要在 <code>onDeactivated</code> 里暂停、<code>onActivated</code> 里恢复。</p>
<p>Teleport 只搬 DOM，props、事件、provide/inject 仍然按原来的组件树传。目标节点必须在挂载时已经存在，Vue 3.5 起可以加 <code>defer</code>，等同一轮渲染里的目标出来再挂。</p>
</blockquote>
<h2>KeepAlive 怎么用</h2>
<p>下面用按钮在列表页和详情页之间切换，外面包一层 KeepAlive，最多缓存 5 个：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { shallowRef } from &#x27;vue&#x27;;
import ListPage from &#x27;./ListPage.vue&#x27;;
import DetailPage from &#x27;./DetailPage.vue&#x27;;

const current = shallowRef(ListPage);
&lt;/script&gt;

&lt;template&gt;
  &lt;button @click=&quot;current = ListPage&quot;&gt;列表&lt;/button&gt;
  &lt;button @click=&quot;current = DetailPage&quot;&gt;详情&lt;/button&gt;
  &lt;KeepAlive :max=&quot;5&quot;&gt;
    &lt;component :is=&quot;current&quot; /&gt;
  &lt;/KeepAlive&gt;
&lt;/template&gt;
</code></pre></div>
<p>从列表切到详情再切回来，列表页不会重新创建，状态都在。可是列表页如果开着一个每 10 秒刷新的轮询，切走以后它还会继续跑，白白发请求。所以要用那一对钩子控制它：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- ListPage.vue --&gt;
&lt;script setup&gt;
import { onActivated, onDeactivated } from &#x27;vue&#x27;;

let timer;
function startPolling() {
  timer = setInterval(refresh, 10_000);
}

onActivated(startPolling); // 首次挂载时也会调用
onDeactivated(() =&gt; clearInterval(timer));
&lt;/script&gt;
</code></pre></div>
<p>为什么轮询只写在这对钩子里就够了，不用再写 <code>onMounted</code>？因为 <code>onActivated</code> 在首次挂载和每次从缓存恢复时都会调用，<code>onDeactivated</code> 在进入缓存和最终卸载时都会调用，开和关正好一一对应。</p>
<p>在 Vue Router 里的写法是这样：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;RouterView v-slot=&quot;{ Component }&quot;&gt;
  &lt;KeepAlive include=&quot;ListPage&quot;&gt;
    &lt;component :is=&quot;Component&quot; /&gt;
  &lt;/KeepAlive&gt;
&lt;/RouterView&gt;
</code></pre></div>
<p><code>include</code> 匹配的是组件的 <code>name</code>。用 <code>&lt;script setup&gt;</code> 写的组件，会根据文件名自动推断 name，所以 <code>ListPage.vue</code> 就能被 <code>include=&quot;ListPage&quot;</code> 匹配到。</p>
<h2>Teleport 怎么用</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { ref } from &#x27;vue&#x27;;
const open = ref(false);
&lt;/script&gt;

&lt;template&gt;
  &lt;button @click=&quot;open = true&quot;&gt;打开&lt;/button&gt;
  &lt;Teleport to=&quot;body&quot;&gt;
    &lt;dialog v-if=&quot;open&quot; open aria-labelledby=&quot;dlg-title&quot; @close=&quot;open = false&quot;&gt;
      &lt;h2 id=&quot;dlg-title&quot;&gt;确认删除？&lt;/h2&gt;
      &lt;button @click=&quot;open = false&quot;&gt;取消&lt;/button&gt;
    &lt;/dialog&gt;
  &lt;/Teleport&gt;
&lt;/template&gt;
</code></pre></div>
<p>对话框的 DOM 出现在 <code>body</code> 下面，可是 <code>open</code> 仍然由这个组件控制，点“取消”照样能改它。这就是“只搬 DOM，不改组件关系”。</p>
<p>不过 Teleport 只解决位置问题。一个真正的模态对话框，还需要打开时把焦点移进去、按 Esc 关闭、关闭后焦点回到触发按钮。用原生 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code> 能直接获得这些行为，Teleport 本身不提供。</p>
<p>还有两个细节。<code>:disabled=&quot;true&quot;</code> 能让内容留在原位不搬走，比如移动端想内联显示时。服务端渲染时，Teleport 的内容会单独输出，所以目标容器要在服务端模板里就存在。</p>
<h2>常见追问</h2>
<p><strong>KeepAlive 怎么手动清掉某个组件的缓存？</strong></p>
<blockquote>
<p>动态修改 <code>include</code> 列表，把这个组件的 name 移出去，它的缓存就会被清掉。</p>
</blockquote>
<p><strong>两个 Teleport 指向同一个目标会怎样？</strong></p>
<blockquote>
<p>按挂载顺序依次追加到目标节点里，后挂载的排在后面。</p>
</blockquote>`};export{e as default};