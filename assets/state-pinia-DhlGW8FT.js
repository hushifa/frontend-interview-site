var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>state</code>：需要保存和维护的原始数据，例如收藏的题目 ID 列表。</li>
<li><code>getters</code>：从 state 推导的值，例如收藏数量，结果会被缓存，不要再单独存一份。</li>
<li><code>actions</code>：封装修改 state 的业务操作，可以是 async 函数，组件只调用 action，不关心实现。</li>
<li>解构时：state 和 getter 用 <code>storeToRefs(store)</code>，否则得到的是普通值；action 可以直接从 store 解构。</li>
<li>组合式写法（setup store）没有内置 <code>$reset</code>，需要自己实现；SSR 中每个请求都要创建新的 <code>createPinia()</code> 实例。</li>
</ul>
<h2>组合式写法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// stores/bookmarks.js</span>
<span class="hljs-keyword">import</span> { defineStore } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;pinia&#x27;</span>;
<span class="hljs-keyword">import</span> { computed, ref } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">const</span> useBookmarksStore = <span class="hljs-title function_">defineStore</span>(<span class="hljs-string">&#x27;bookmarks&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> ids = <span class="hljs-title function_">ref</span>([]);
  <span class="hljs-keyword">const</span> count = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> ids.<span class="hljs-property">value</span>.<span class="hljs-property">length</span>);
  <span class="hljs-keyword">const</span> <span class="hljs-title function_">has</span> = (<span class="hljs-params">id</span>) =&gt; ids.<span class="hljs-property">value</span>.<span class="hljs-title function_">includes</span>(id);

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">toggle</span>(<span class="hljs-params">id</span>) {
    <span class="hljs-keyword">const</span> prev = ids.<span class="hljs-property">value</span>;
    ids.<span class="hljs-property">value</span> = <span class="hljs-title function_">has</span>(id) ? prev.<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">x</span>) =&gt;</span> x !== id) : [...prev, id];
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/bookmarks/<span class="hljs-subst">\${id}</span>\`</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;PUT&#x27;</span> });
      <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${res.status}</span>\`</span>);
    } <span class="hljs-keyword">catch</span> {
      ids.<span class="hljs-property">value</span> = prev; <span class="hljs-comment">// 失败时恢复</span>
    }
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">$reset</span>(<span class="hljs-params"></span>) {
    ids.<span class="hljs-property">value</span> = [];
  }

  <span class="hljs-keyword">return</span> { ids, count, has, toggle, $reset };
});
</code></pre></div>
<p><code>ref</code> 对应 state，<code>computed</code> 对应 getter，普通函数对应 action。要被 DevTools 和 SSR 识别为 state，所有 state 都必须从 setup 函数返回。</p>
<h2>在组件中使用</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;script setup&gt;
import { storeToRefs } from &#x27;pinia&#x27;;
import { useBookmarksStore } from &#x27;@/stores/bookmarks&#x27;;

const store = useBookmarksStore();
const { count } = storeToRefs(store); // 保持响应性
const { toggle } = store; // action 直接解构
&lt;/script&gt;

&lt;template&gt;
  &lt;span&gt;已收藏 {{ count }} 题&lt;/span&gt;
  &lt;button @click=&quot;toggle(42)&quot;&gt;收藏第 42 题&lt;/button&gt;
&lt;/template&gt;
</code></pre></div>
<p>直接写 <code>const { count } = store</code> 得到的是一个数字，之后不会更新。</p>
<h2>直接修改与 $patch</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">store.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">7</span>); <span class="hljs-comment">// 可以直接修改</span>
store.$patch(<span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> {
  state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">7</span>);
  state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">8</span>);
}); <span class="hljs-comment">// 多处修改合并为一次</span>
</code></pre></div>
<p>Pinia 允许组件直接改 state，但有业务规则（校验、请求、日志）的修改应放进 action，便于统一维护。</p>
<h2>SSR</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 每个请求</span>
<span class="hljs-keyword">const</span> pinia = <span class="hljs-title function_">createPinia</span>();
app.<span class="hljs-title function_">use</span>(pinia);
<span class="hljs-comment">// 渲染后把 pinia.state.value 序列化到页面，客户端用它初始化</span>
</code></pre></div>
<p>不要在模块顶层创建 Pinia 实例或在 store 外部定义共享的 <code>ref</code>，否则所有请求共享同一份数据，会把一个用户的数据显示给另一个用户。Nuxt 的 <code>@pinia/nuxt</code> 模块已经处理了这些。</p>
<h2>持久化</h2>
<p>需要把 state 保存到 localStorage 时，可以用 <code>pinia-plugin-persistedstate</code> 等插件，或者在 <code>store.$subscribe</code> 中写入。不要持久化令牌等敏感信息，也要处理旧版本数据结构的兼容。</p>
<h2>常见追问</h2>
<ul>
<li>和 Vuex 的区别？Pinia 没有 mutations，action 可以直接修改 state；每个 store 独立定义，天然支持代码分割；TypeScript 类型推导更好。Pinia 是 Vue 官方推荐的状态管理库。</li>
<li>store 之间能互相调用吗？可以在一个 store 的 action 或 getter 中调用另一个 store 的 <code>useXxxStore()</code>。</li>
</ul>`};export{e as default};