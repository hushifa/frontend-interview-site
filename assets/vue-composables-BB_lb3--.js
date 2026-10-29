var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>组合式函数，英文叫 composable，就是一个以 <code>use</code> 开头、里面用了 Vue 响应式 API 的普通函数，在 <code>setup</code> 里调用。比如 <code>const { x, y } = useMouse()</code>，鼠标位置的逻辑全封装在里面。</p>
<p>它比 mixin 好维护，是因为来源清楚。用了 mixin 以后，组件里的 <code>this.user</code> 可能来自任何一个 mixin，多个 mixin 有同名属性还会互相覆盖，mixin 之间还可能偷偷通过 <code>this</code> 依赖对方。组合式函数的返回值是显式解构出来的，模板里每个变量都能找到出处，重名了也能直接改名。</p>
<p>一个函数需要另一个函数的结果时，就当参数传进去，比如 <code>usePermission(user)</code>，依赖关系写在代码里。</p>
<p>要注意两点。每次调用都会创建一份独立的状态，想在组件间共享，就把状态定义在函数外面，或者用 Pinia。另外，组合式函数里注册的生命周期钩子和侦听器属于调用它的那个组件，组件卸载时会自动清理，所以一般要在 <code>setup</code> 里同步调用。</p>
</blockquote>
<h2>先看一个组合式函数</h2>
<p>下面的 <code>useFetch</code> 负责请求数据，并把数据、错误、加载状态三个 ref 返回出去：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// useFetch.js</span>
<span class="hljs-keyword">import</span> { ref, toValue, watchEffect } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">useFetch</span>(<span class="hljs-params">url</span>) {
  <span class="hljs-keyword">const</span> data = <span class="hljs-title function_">ref</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> error = <span class="hljs-title function_">ref</span>(<span class="hljs-literal">null</span>);
  <span class="hljs-keyword">const</span> loading = <span class="hljs-title function_">ref</span>(<span class="hljs-literal">false</span>);

  <span class="hljs-title function_">watchEffect</span>(<span class="hljs-title function_">async</span> (onCleanup) =&gt; {
    <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
    <span class="hljs-title function_">onCleanup</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>());
    loading.<span class="hljs-property">value</span> = <span class="hljs-literal">true</span>;
    error.<span class="hljs-property">value</span> = <span class="hljs-literal">null</span>;
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-title function_">toValue</span>(url), { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
      <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${res.status}</span>\`</span>);
      data.<span class="hljs-property">value</span> = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>();
    } <span class="hljs-keyword">catch</span> (err) {
      <span class="hljs-keyword">if</span> (err.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) error.<span class="hljs-property">value</span> = err;
    } <span class="hljs-keyword">finally</span> {
      loading.<span class="hljs-property">value</span> = <span class="hljs-literal">false</span>;
    }
  });

  <span class="hljs-keyword">return</span> { data, error, loading };
}
</code></pre></div>
<p>组件里这样用：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { useFetch } from &#x27;./useFetch&#x27;;

const props = defineProps({ id: Number });
const { data: user, loading } = useFetch(() =&gt; \`/api/users/\${props.id}\`);
&lt;/script&gt;
</code></pre></div>
<p>这里传进去的是一个函数 <code>() =&gt; ...</code>，不是字符串。为什么？因为 <code>useFetch</code> 内部用 <code>toValue(url)</code> 读取地址，<code>toValue</code> 能接受普通值、ref 或者 getter 函数。传 getter 时，<code>watchEffect</code> 执行期间读到了 <code>props.id</code>，所以 <code>id</code> 一变就会重新请求。如果直接传字符串，就只是当时的一个值，之后不会再变。</p>
<p>返回的是由 ref 组成的普通对象，所以调用方解构以后仍然是响应式的，还能顺手改名，比如 <code>data: user</code>。</p>
<h2>mixin 的问题出在哪</h2>
<p>看一段 mixin 写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// mixin 写法</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">mixins</span>: [userMixin, permissionMixin],
  <span class="hljs-title function_">mounted</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">user</span>, <span class="hljs-variable language_">this</span>.<span class="hljs-property">can</span>); <span class="hljs-comment">// 来自哪个 mixin？会不会被覆盖？</span>
  },
};
</code></pre></div>
<p>读这段代码的人没法直接知道 <code>this.user</code> 是谁提供的，得一个个打开 mixin 去找。如果两个 mixin 都定义了 <code>user</code>，后面的会覆盖前面的。更麻烦的是，<code>permissionMixin</code> 里可能直接读 <code>this.user</code>，它依赖 <code>userMixin</code> 却没写在任何地方，删掉一个另一个就坏了。</p>
<p>换成组合式函数，这种依赖就得明着写：<code>const { user } = useUser(); const { can } = usePermission(user);</code>。</p>
<h2>写组合式函数要守哪些约定</h2>
<p>函数名以 <code>use</code> 开头。参数可能是 ref 或 getter 时，用 <code>toValue</code> 统一读取。</p>
<p>一般要在 <code>&lt;script setup&gt;</code> 或 <code>setup()</code> 里同步调用，不要放进异步回调里。<code>&lt;script setup&gt;</code> 是唯一的例外：编译器会在顶层 <code>await</code> 之后恢复当前组件，所以 <code>await</code> 后面也能调用。因为生命周期钩子要关联到“当前正在初始化的组件”，异步回调执行时这个组件已经不是当前组件了，钩子就挂不上去。</p>
<p>做服务端渲染时，不要在模块顶层创建共享状态。服务器上这个模块只加载一次，顶层变量会被所有请求共用，用户的数据就可能串到别人的页面上。</p>
<h2>常见追问</h2>
<p><strong>和 React 自定义 Hook 有什么区别？</strong></p>
<blockquote>
<p>Vue 的 <code>setup</code> 只执行一次，组合式函数也只调用一次，所以不受调用顺序的限制，也没有依赖数组和读到旧闭包值的问题。React 组件每次渲染都会重新执行 Hook。</p>
</blockquote>
<p><strong>VueUse 是什么？</strong></p>
<blockquote>
<p>一个常用组合式函数的集合，比如 <code>useStorage</code>、<code>useIntersectionObserver</code>。可以直接拿来用，也可以参考它的实现。</p>
</blockquote>`};export{e as default};