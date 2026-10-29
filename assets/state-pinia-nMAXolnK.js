var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Pinia 的 store 里有三样东西，各管一件事。<code>state</code> 是需要保存的原始数据，比如收藏的题目 ID 列表。<code>getters</code> 是从 state 推出来的值，比如收藏了几题，它的结果会被缓存，不要另存一份。<code>actions</code> 是修改 state 的业务操作，可以是 async 函数，组件只管调用 action，不用关心里面怎么实现。</p>
<p>从 store 里解构的时候要小心。state 和 getter 要用 <code>storeToRefs(store)</code> 解构，直接解构拿到的只是当时的普通值，之后不会更新。action 是普通函数，可以直接解构。</p>
<p>还有两点要注意。用组合式写法，也就是 setup store 时，没有内置的 <code>$reset</code>，要自己写。做 SSR 时，每个请求都要创建一个新的 <code>createPinia()</code> 实例，否则不同用户会共享同一份数据。</p>
</blockquote>
<h2>组合式写法怎么对应三者</h2>
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
<p>在 setup store 里，<code>ref</code> 就是 state，<code>computed</code> 就是 getter，普通函数就是 action。</p>
<p><code>toggle</code> 先改界面再发请求，失败了把 <code>ids</code> 恢复成之前的值，这叫乐观更新。注意它能恢复，是因为每次都生成新数组，<code>prev</code> 一直指向旧数组没被改过。</p>
<p>还有一条规则：要让 DevTools 和 SSR 把它们识别成 state，所有 state 都必须从 setup 函数里 return 出去。<code>$reset</code> 也是因为 setup store 没有内置，才在这里手写的。</p>
<h2>在组件里怎么解构</h2>
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
<p>如果直接写 <code>const { count } = store</code>，拿到的就是一个数字。之后收藏变了，这个数字也不会更新。<code>storeToRefs</code> 把 state 和 getter 包成 ref，解构出来还连着 store。</p>
<p>action 不需要这样处理，因为它只是函数，不存在“值过期”的问题。</p>
<h2>能直接改 state 吗</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">store.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">7</span>); <span class="hljs-comment">// 可以直接修改</span>
store.$patch(<span class="hljs-function">(<span class="hljs-params">state</span>) =&gt;</span> {
  state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">7</span>);
  state.<span class="hljs-property">ids</span>.<span class="hljs-title function_">push</span>(<span class="hljs-number">8</span>);
}); <span class="hljs-comment">// 多处修改合并为一次</span>
</code></pre></div>
<p>Pinia 允许组件直接改 state，<code>$patch</code> 则可以把多处修改合成一次。</p>
<p>能改不代表都该这么改。带业务规则的修改，比如要校验、要发请求、要记日志，应该放进 action 里，这样规则只写在一个地方，好维护。</p>
<h2>SSR 时要注意什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 每个请求</span>
<span class="hljs-keyword">const</span> pinia = <span class="hljs-title function_">createPinia</span>();
app.<span class="hljs-title function_">use</span>(pinia);
<span class="hljs-comment">// 渲染后把 pinia.state.value 序列化到页面，客户端用它初始化</span>
</code></pre></div>
<p>服务器上只有一个进程，要同时处理很多用户的请求。如果在模块顶层创建 Pinia 实例，或者在 store 外面定义一个共享的 <code>ref</code>，所有请求就会用同一份数据，一个用户的数据可能显示给另一个用户。所以每个请求都要新建实例。</p>
<p>用 Nuxt 的话，<code>@pinia/nuxt</code> 模块已经把这些处理好了。</p>
<h2>怎样持久化</h2>
<p>想把 state 存进 localStorage，可以用 <code>pinia-plugin-persistedstate</code> 这类插件，或者在 <code>store.$subscribe</code> 里自己写入。</p>
<p>不要持久化令牌这类敏感信息。另外以后数据结构改了，还要能兼容旧版本存下来的数据。</p>
<h2>常见追问</h2>
<p><strong>Pinia 和 Vuex 有什么区别？</strong></p>
<blockquote>
<p>Pinia 没有 mutations，action 可以直接改 state。每个 store 是单独定义的，天然支持代码分割。TypeScript 的类型推导也更好。现在 Pinia 是 Vue 官方推荐的状态管理库。</p>
</blockquote>
<p><strong>store 之间能互相调用吗？</strong></p>
<blockquote>
<p>可以。在一个 store 的 action 或 getter 里，调用另一个 store 的 <code>useXxxStore()</code> 就行。</p>
</blockquote>`};export{e as default};