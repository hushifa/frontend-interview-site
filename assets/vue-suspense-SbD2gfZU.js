var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>&lt;Suspense&gt;</code> 有 <code>#default</code> 和 <code>#fallback</code> 两个插槽，默认内容中的异步依赖都解析完之前显示 fallback。</li>
<li>能被等待的异步依赖有两种：<code>&lt;script setup&gt;</code> 中有顶层 <code>await</code> 的组件，以及 <code>defineAsyncComponent</code> 创建的异步组件。</li>
<li>在 <code>onMounted</code> 或普通函数中发起的请求不会被 Suspense 追踪。</li>
<li>Suspense 不捕获错误，用父组件的 <code>onErrorCaptured</code> 或错误边界组件处理异步 setup 的失败。</li>
<li>首次解析之后，只有 <code>#default</code> 的根节点被替换时才会重新进入等待；<code>timeout</code> 属性控制等待多久后才切换到 fallback。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- UserProfile.vue --&gt;
&lt;script setup&gt;
const props = defineProps({ id: Number });
const res = await fetch(\`/api/users/\${props.id}\`);
if (!res.ok) throw new Error(&#x27;用户加载失败&#x27;);
const user = await res.json();
&lt;/script&gt;

&lt;template&gt;
  &lt;h2&gt;{{ user.name }}&lt;/h2&gt;
&lt;/template&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- Page.vue --&gt;
&lt;script setup&gt;
import { onErrorCaptured, ref } from &#x27;vue&#x27;;
import UserProfile from &#x27;./UserProfile.vue&#x27;;

const error = ref(null);
onErrorCaptured((err) =&gt; {
  error.value = err;
  return false; // 不再向上传播
});
&lt;/script&gt;

&lt;template&gt;
  &lt;p v-if=&quot;error&quot; role=&quot;alert&quot;&gt;{{ error.message }}&lt;/p&gt;
  &lt;Suspense v-else&gt;
    &lt;UserProfile :id=&quot;1&quot; /&gt;
    &lt;template #fallback&gt;
      &lt;p&gt;加载中…&lt;/p&gt;
    &lt;/template&gt;
  &lt;/Suspense&gt;
&lt;/template&gt;
</code></pre></div>
<p>页面中有多个异步子组件时，它们共用一个 fallback，全部完成后一起显示。</p>
<h2>再次进入等待</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;Suspense timeout=&quot;200&quot;&gt;
  &lt;component :is=&quot;currentTab&quot; /&gt;
  &lt;template #fallback&gt;&lt;Spinner /&gt;&lt;/template&gt;
&lt;/Suspense&gt;
</code></pre></div>
<p>切换 <code>currentTab</code> 时根节点被替换，Suspense 重新等待。在 <code>timeout</code> 时间内完成就直接显示新内容，超过才显示 fallback，避免快速加载时闪一下 loading。等待期间旧内容继续显示。</p>
<h2>和路由、KeepAlive 嵌套</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;RouterView v-slot=&quot;{ Component }&quot;&gt;
  &lt;KeepAlive&gt;
    &lt;Suspense&gt;
      &lt;component :is=&quot;Component&quot; /&gt;
      &lt;template #fallback&gt;加载中…&lt;/template&gt;
    &lt;/Suspense&gt;
  &lt;/KeepAlive&gt;
&lt;/RouterView&gt;
</code></pre></div>
<p>官方推荐的嵌套顺序是 <code>RouterView</code> → <code>Transition</code> → <code>KeepAlive</code> → <code>Suspense</code>。</p>
<h2>不用 Suspense 的做法</h2>
<p>很多项目在组件内部用状态管理 loading 和 error，或用 Nuxt 的 <code>useAsyncData</code>、TanStack Query 这类工具。这样不依赖实验性 API，但每个组件要自己显示加载状态。</p>
<h2>常见追问</h2>
<ul>
<li>顶层 <code>await</code> 之后还能注册生命周期钩子吗？可以，<code>&lt;script setup&gt;</code> 编译时会保存并恢复当前组件实例。在普通 <code>async setup()</code> 中则不行。</li>
<li>和 React Suspense 的区别？React 由组件&quot;抛出 Promise&quot;（<code>use</code>、<code>lazy</code>）触发挂起；Vue 由异步 setup 和异步组件触发，两者都不追踪普通的 fetch。</li>
</ul>`};export{e as default};