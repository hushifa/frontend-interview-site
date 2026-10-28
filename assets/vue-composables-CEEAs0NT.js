var e={answerHtml:`<h2>简答</h2>
<ul>
<li>组合式函数（composable）是以 <code>use</code> 开头、内部使用 Vue 响应式 API 的函数，在 <code>setup</code> 中调用。</li>
<li>返回值显式解构：<code>const { x, y } = useMouse()</code>，模板里的每个变量都能找到来源。</li>
<li>mixin 的三个问题：属性来源不清楚、多个 mixin 之间同名属性互相覆盖、mixin 之间通过 <code>this</code> 产生隐式依赖。</li>
<li>每次调用组合式函数都会创建独立的状态；要在多个组件间共享，把状态定义在函数外部，或使用 Pinia。</li>
<li>在组合式函数内部注册的生命周期钩子和侦听器，属于调用它的那个组件，组件卸载时自动清理。</li>
</ul>
<h2>示例</h2>
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
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { useFetch } from &#x27;./useFetch&#x27;;

const props = defineProps({ id: Number });
const { data: user, loading } = useFetch(() =&gt; \`/api/users/\${props.id}\`);
&lt;/script&gt;
</code></pre></div>
<ul>
<li><code>toValue</code> 接受普通值、ref 或 getter，传 getter 时 <code>props.id</code> 变化会重新请求。</li>
<li>返回 ref 组成的普通对象，调用方解构后仍保持响应式，也可以重命名（<code>data: user</code>）。</li>
</ul>
<h2>和 mixin 对比</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// mixin 写法</span>
<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> {
  <span class="hljs-attr">mixins</span>: [userMixin, permissionMixin],
  <span class="hljs-title function_">mounted</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-variable language_">this</span>.<span class="hljs-property">user</span>, <span class="hljs-variable language_">this</span>.<span class="hljs-property">can</span>); <span class="hljs-comment">// 来自哪个 mixin？会不会被覆盖？</span>
  },
};
</code></pre></div>
<p>组合式函数中如果一个函数需要另一个的结果，通过参数传入：<code>usePermission(user)</code>，依赖关系写在代码里。</p>
<h2>编写约定</h2>
<ul>
<li>函数名以 <code>use</code> 开头。</li>
<li>输入参数接受 ref 或 getter 时用 <code>toValue</code> 统一读取。</li>
<li>只在 <code>&lt;script setup&gt;</code> 或 <code>setup()</code> 中同步调用，不要在异步回调里调用，否则生命周期钩子无法关联到组件。</li>
<li>SSR 中避免在模块顶层创建共享状态，否则会被多个请求共用，导致用户数据串到别人页面上。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和 React 自定义 Hook 的区别？Vue 的 <code>setup</code> 只执行一次，组合式函数也只调用一次，不受调用顺序限制，也没有依赖数组和过期闭包问题。</li>
<li>VueUse 是什么？一个常用组合式函数集合，例如 <code>useStorage</code>、<code>useIntersectionObserver</code>，可以直接使用或参考实现。</li>
</ul>`};export{e as default};