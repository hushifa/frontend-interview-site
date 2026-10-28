var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>&lt;KeepAlive&gt;</code> 包裹动态组件或路由视图，被切走的组件不会卸载，而是进入缓存；切回时触发 <code>onActivated</code>，切走时触发 <code>onDeactivated</code>。</li>
<li>用 <code>include</code>、<code>exclude</code>（按组件 name 匹配）控制缓存哪些组件，用 <code>max</code> 限制数量，超出时淘汰最久未访问的实例。</li>
<li>被缓存的组件仍在内存中，计时器、轮询、WebSocket 不会自动停止，要在 <code>onDeactivated</code> 中暂停、在 <code>onActivated</code> 中恢复。</li>
<li><code>&lt;Teleport to=&quot;body&quot;&gt;</code> 把内容渲染到指定 DOM 节点下，常用于弹窗、提示，避免被父元素的 <code>overflow: hidden</code> 或层叠上下文影响。</li>
<li>Teleport 只移动 DOM，props、事件、provide/inject 仍按组件树传递；目标节点必须在挂载时已存在，Vue 3.5 起可以用 <code>defer</code> 等待同一轮渲染中的目标。</li>
</ul>
<h2>KeepAlive</h2>
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
<p><code>onActivated</code> 在首次挂载和每次从缓存恢复时都会调用，<code>onDeactivated</code> 在进入缓存和最终卸载时都会调用，所以轮询只需写在这一对钩子里。</p>
<p>在 Vue Router 中，写法是：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;RouterView v-slot=&quot;{ Component }&quot;&gt;
  &lt;KeepAlive include=&quot;ListPage&quot;&gt;
    &lt;component :is=&quot;Component&quot; /&gt;
  &lt;/KeepAlive&gt;
&lt;/RouterView&gt;
</code></pre></div>
<p><code>include</code> 匹配的是组件的 <code>name</code>；<code>&lt;script setup&gt;</code> 组件会根据文件名自动推断 name。</p>
<h2>Teleport</h2>
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
<p>内容渲染在 <code>body</code> 下，但 <code>open</code> 仍由这个组件控制。真正的模态对话框还需要焦点移入、Esc 关闭、关闭后焦点返回触发按钮，使用原生 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code> 能直接获得这些行为。</p>
<ul>
<li><code>:disabled=&quot;true&quot;</code> 可以让内容留在原位，例如在移动端内联显示。</li>
<li>SSR 时 Teleport 的内容会单独输出，目标容器要在服务端模板中存在。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>KeepAlive 如何手动清除某个缓存？动态修改 <code>include</code> 列表，移除该组件的 name。</li>
<li>两个 Teleport 指向同一个目标会怎样？按挂载顺序依次追加到目标节点中。</li>
</ul>`};export{e as default};