var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>&lt;Suspense&gt;</code> 用来统一处理加载状态。它有两个插槽，<code>#default</code> 放真正的内容，<code>#fallback</code> 放加载中的占位。默认内容里的异步依赖还没全部完成时，就显示 fallback。</p>
<p>它能等的异步依赖只有两种：<code>&lt;script setup&gt;</code> 里有顶层 <code>await</code> 的组件，以及用 <code>defineAsyncComponent</code> 创建的异步组件。在 <code>onMounted</code> 或者普通函数里发的请求，它是不知道的。</p>
<p>好处是一个页面有好几个异步子组件时，它们共用一个 fallback，全部好了再一起显示，不会东一块西一块地跳出来。</p>
<p>要注意三点。Suspense 自己不捕获错误，要用父组件的 <code>onErrorCaptured</code> 处理。首次加载完以后，只有 <code>#default</code> 的根节点被换掉时才会重新进入等待。另外它在 Vue 文档里仍标为实验性功能。</p>
</blockquote>
<h2>先看一个例子</h2>
<p><code>UserProfile</code> 在 setup 顶层直接 await 请求，<code>Page</code> 用 Suspense 包住它，同时用 <code>onErrorCaptured</code> 接住错误：</p>
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
<p><code>UserProfile</code> 的 setup 里有 <code>await</code>，它要等请求回来才能渲染。在这期间 Suspense 显示“加载中…”。请求失败时 setup 抛出错误，Suspense 不会处理，错误往上传到 <code>Page</code> 的 <code>onErrorCaptured</code>，由它显示错误信息。</p>
<h2>切换内容时怎样避免闪一下 loading</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;Suspense timeout=&quot;200&quot;&gt;
  &lt;component :is=&quot;currentTab&quot; /&gt;
  &lt;template #fallback&gt;&lt;Spinner /&gt;&lt;/template&gt;
&lt;/Suspense&gt;
</code></pre></div>
<p>切换 <code>currentTab</code> 时，根节点被换掉了，Suspense 会重新进入等待。这时旧内容继续显示，新内容在 <code>timeout</code> 设定的 200 毫秒内准备好，就直接换上去；超过 200 毫秒才切到 fallback。这样加载很快时，用户不会看到 loading 一闪而过。</p>
<h2>和路由、KeepAlive 一起用</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;RouterView v-slot=&quot;{ Component }&quot;&gt;
  &lt;KeepAlive&gt;
    &lt;Suspense&gt;
      &lt;component :is=&quot;Component&quot; /&gt;
      &lt;template #fallback&gt;加载中…&lt;/template&gt;
    &lt;/Suspense&gt;
  &lt;/KeepAlive&gt;
&lt;/RouterView&gt;
</code></pre></div>
<p>几个内置组件嵌套时有固定顺序，官方推荐的是 <code>RouterView</code> → <code>Transition</code> → <code>KeepAlive</code> → <code>Suspense</code>，上面省略了 <code>Transition</code>。</p>
<h2>不用 Suspense 怎么做</h2>
<p>很多项目在组件内部用状态管理 loading 和 error，或者用 Nuxt 的 <code>useAsyncData</code>、TanStack Query 这类工具。这样不依赖实验性 API，代价是每个组件都要自己显示加载状态。</p>
<h2>常见追问</h2>
<p><strong>顶层 await 之后还能注册生命周期钩子吗？</strong></p>
<blockquote>
<p>在 <code>&lt;script setup&gt;</code> 里可以，编译器会在 <code>await</code> 前后保存并恢复当前组件实例。在普通的 <code>async setup()</code> 函数里就不行。</p>
</blockquote>
<p><strong>和 React Suspense 有什么区别？</strong></p>
<blockquote>
<p>React 是组件“抛出 Promise”来触发挂起，比如 <code>use</code> 和 <code>lazy</code>。Vue 是靠异步 setup 和异步组件触发。两者都不追踪普通的 fetch 调用。</p>
</blockquote>`};export{e as default};