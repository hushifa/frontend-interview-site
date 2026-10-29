var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>先看要干什么。如果是根据已有数据算出一个新值，比如购物车总价，就用 <code>computed</code>。如果是数据变了以后去做一件事，比如发请求、改 <code>document.title</code>，就用 <code>watch</code> 或 <code>watchEffect</code>，这类“计算之外的动作”叫副作用。</p>
<p><code>computed</code> 返回一个只读 ref，依赖没变就直接返回缓存的结果，所以它的 getter 应该是纯计算，不发请求，也不改别的状态。</p>
<p><code>watch(source, callback)</code> 只盯你指定的来源，回调能拿到新值和旧值，默认第一次不执行，加 <code>immediate: true</code> 才会立刻跑一次。<code>watchEffect(fn)</code> 会立刻执行一次，执行时同步读到了哪些响应式数据，就自动追踪哪些；<code>await</code> 之后读的不算。</p>
<p>有两点要注意。能用 <code>computed</code> 表达的，就别用 <code>watch</code> 去同步另一份状态。侦听器里发请求时，要清理上一次的请求，Vue 3.5 起用 <code>onWatcherCleanup</code>，旧写法是回调的第三个参数 <code>onCleanup</code>。</p>
</blockquote>
<h2>派生数据为什么用 computed</h2>
<p>购物车的总价完全由商品列表决定，这种值叫派生数据：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> items = <span class="hljs-title function_">ref</span>([{ <span class="hljs-attr">price</span>: <span class="hljs-number">10</span>, <span class="hljs-attr">count</span>: <span class="hljs-number">2</span> }, { <span class="hljs-attr">price</span>: <span class="hljs-number">5</span>, <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> }]);
<span class="hljs-keyword">const</span> total = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> items.<span class="hljs-property">value</span>.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">s, i</span>) =&gt;</span> s + i.<span class="hljs-property">price</span> * i.<span class="hljs-property">count</span>, <span class="hljs-number">0</span>));
</code></pre></div>
<p>有人会写成 <code>watch(items, () =&gt; { total.value = ... }, { deep: true })</code>。结果是对的，可是多了一份 <code>total</code> 要你手动维护。哪天漏了一个更新路径，两边就对不上了。<code>computed</code> 直接声明“总价等于这个算式”，Vue 负责在依赖变化时重新算，没变时直接用缓存。</p>
<h2>用 watch 在数据变化时发请求</h2>
<p><code>userId</code> 变了就重新拉用户信息，这是典型的副作用：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { ref, watch, onWatcherCleanup } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> userId = <span class="hljs-title function_">ref</span>(<span class="hljs-number">1</span>);
<span class="hljs-keyword">const</span> user = <span class="hljs-title function_">ref</span>(<span class="hljs-literal">null</span>);

<span class="hljs-title function_">watch</span>(
  userId,
  <span class="hljs-title function_">async</span> (id) =&gt; {
    <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
    <span class="hljs-title function_">onWatcherCleanup</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>());
    <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/users/<span class="hljs-subst">\${id}</span>\`</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
    user.<span class="hljs-property">value</span> = <span class="hljs-keyword">await</span> res.<span class="hljs-title function_">json</span>();
  },
  { <span class="hljs-attr">immediate</span>: <span class="hljs-literal">true</span> },
);
</code></pre></div>
<p>如果 <code>userId</code> 从 1 快速变到 2，请求 1 可能比请求 2 晚回来，把正确结果盖掉。所以每次执行前，<code>onWatcherCleanup</code> 注册的函数会先把上一次的请求取消。注意它必须在第一个 <code>await</code> 之前调用，因为它要知道自己属于哪一次执行。</p>
<h2>watch 的来源该怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">keyword</span>: <span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-attr">page</span>: <span class="hljs-number">1</span> });

<span class="hljs-title function_">watch</span>(<span class="hljs-function">() =&gt;</span> state.<span class="hljs-property">keyword</span>, <span class="hljs-function">(<span class="hljs-params">kw</span>) =&gt;</span> { state.<span class="hljs-property">page</span> = <span class="hljs-number">1</span>; }); <span class="hljs-comment">// getter</span>
<span class="hljs-title function_">watch</span>([<span class="hljs-function">() =&gt;</span> state.<span class="hljs-property">keyword</span>, <span class="hljs-function">() =&gt;</span> state.<span class="hljs-property">page</span>], <span class="hljs-function">(<span class="hljs-params">[kw, page]</span>) =&gt;</span> <span class="hljs-title function_">search</span>(kw, page)); <span class="hljs-comment">// 多个来源</span>
<span class="hljs-title function_">watch</span>(state, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">save</span>(state)); <span class="hljs-comment">// reactive 对象，默认深层侦听</span>
</code></pre></div>
<p>最常见的错误是写成 <code>watch(state.keyword, ...)</code>。这样传进去的只是当时的一个字符串，Vue 没法知道它后来变没变。所以侦听 <code>reactive</code> 对象的某个属性，必须包成 getter 函数。</p>
<h2>watchEffect 适合什么情况</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = <span class="hljs-string">\`<span class="hljs-subst">\${unread.value}</span> 条未读 - <span class="hljs-subst">\${siteName.value}</span>\`</span>;
});
</code></pre></div>
<p>这里用到了两个数据，<code>watchEffect</code> 自动把它们都追踪上，写起来比 <code>watch([unread, siteName], ...)</code> 简洁。可是如果依赖藏得深、不好一眼看出来，或者你需要旧值，就用 <code>watch</code>，来源写得明明白白。</p>
<h2>回调在什么时候执行</h2>
<p>默认情况下，侦听器回调在父组件更新之后、本组件 DOM 更新之前执行。所以在回调里读本组件的 DOM，拿到的还是旧的。要读更新后的 DOM，设置 <code>flush: &#x27;post&#x27;</code>，或者直接用 <code>watchPostEffect</code>。也可以设 <code>flush: &#x27;sync&#x27;</code> 让它同步触发，但每次改数据都立刻执行，要谨慎使用。</p>
<h2>常见追问</h2>
<p><strong>怎么停止侦听？</strong></p>
<blockquote>
<p><code>watch</code> 和 <code>watchEffect</code> 都返回一个停止函数，调用它就行。在 <code>setup</code> 里同步创建的侦听器会在组件卸载时自动停止；在异步回调里创建的不会，要自己手动停。</p>
</blockquote>
<p><strong>computed 可以写入吗？</strong></p>
<blockquote>
<p>可以，传入 <code>{ get, set }</code> 就能创建可写的 computed，常用来包装 v-model，见<a href="/questions/vue-vmodel/">《组件 v-model 的本质是什么？》</a>。</p>
</blockquote>`};export{e as default};