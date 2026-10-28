var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>computed</code>：返回一个只读 ref，依赖不变时直接返回缓存结果；getter 应是纯计算，不发请求、不修改其他状态。</li>
<li><code>watch(source, callback)</code>：只在指定来源变化时执行回调，回调参数是新值和旧值；默认懒执行，加 <code>immediate: true</code> 可以立即执行一次。</li>
<li><code>watchEffect(fn)</code>：立即执行，自动追踪执行期间同步读取的响应式数据；<code>await</code> 之后读取的数据不会被追踪。</li>
<li>侦听器里清理上一次的副作用（取消请求）：Vue 3.5 起用 <code>onWatcherCleanup</code>，旧写法是回调的第三个参数 <code>onCleanup</code>。</li>
<li>能用 <code>computed</code> 表达的就不要用 <code>watch</code> 去同步另一份状态。</li>
</ul>
<h2>computed：派生数据</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> items = <span class="hljs-title function_">ref</span>([{ <span class="hljs-attr">price</span>: <span class="hljs-number">10</span>, <span class="hljs-attr">count</span>: <span class="hljs-number">2</span> }, { <span class="hljs-attr">price</span>: <span class="hljs-number">5</span>, <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> }]);
<span class="hljs-keyword">const</span> total = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> items.<span class="hljs-property">value</span>.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">s, i</span>) =&gt;</span> s + i.<span class="hljs-property">price</span> * i.<span class="hljs-property">count</span>, <span class="hljs-number">0</span>));
</code></pre></div>
<p>不要写成 <code>watch(items, () =&gt; { total.value = ... }, { deep: true })</code>，那样多了一份需要同步的状态。</p>
<h2>watch：对指定变化做副作用</h2>
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
<p><code>userId</code> 快速变化时，上一次请求被取消，旧结果不会覆盖新结果。注意 <code>onWatcherCleanup</code> 必须在第一个 <code>await</code> 之前调用。</p>
<h2>侦听来源的写法</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> state = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">keyword</span>: <span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-attr">page</span>: <span class="hljs-number">1</span> });

<span class="hljs-title function_">watch</span>(<span class="hljs-function">() =&gt;</span> state.<span class="hljs-property">keyword</span>, <span class="hljs-function">(<span class="hljs-params">kw</span>) =&gt;</span> { state.<span class="hljs-property">page</span> = <span class="hljs-number">1</span>; }); <span class="hljs-comment">// getter</span>
<span class="hljs-title function_">watch</span>([<span class="hljs-function">() =&gt;</span> state.<span class="hljs-property">keyword</span>, <span class="hljs-function">() =&gt;</span> state.<span class="hljs-property">page</span>], <span class="hljs-function">(<span class="hljs-params">[kw, page]</span>) =&gt;</span> <span class="hljs-title function_">search</span>(kw, page)); <span class="hljs-comment">// 多个来源</span>
<span class="hljs-title function_">watch</span>(state, <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">save</span>(state)); <span class="hljs-comment">// reactive 对象，默认深层侦听</span>
</code></pre></div>
<p>侦听 <code>reactive</code> 对象的某个属性必须写成 getter，<code>watch(state.keyword, ...)</code> 传入的只是一个字符串。</p>
<h2>watchEffect：自动追踪</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title function_">watchEffect</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = <span class="hljs-string">\`<span class="hljs-subst">\${unread.value}</span> 条未读 - <span class="hljs-subst">\${siteName.value}</span>\`</span>;
});
</code></pre></div>
<p>依赖多、且都在同步代码中读取时，<code>watchEffect</code> 更简洁。依赖不明显或需要旧值时，用 <code>watch</code> 更清楚。</p>
<h2>回调执行时机</h2>
<p>默认情况下，侦听器回调在父组件更新之后、本组件 DOM 更新之前执行。需要在回调中读取更新后的 DOM，设置 <code>flush: &#x27;post&#x27;</code>（或用 <code>watchPostEffect</code>）；需要同步触发，设置 <code>flush: &#x27;sync&#x27;</code>，但要谨慎使用。</p>
<h2>常见追问</h2>
<ul>
<li>怎么停止侦听？<code>watch</code> 和 <code>watchEffect</code> 返回停止函数；在 <code>setup</code> 中同步创建的侦听器会在组件卸载时自动停止，异步创建的要手动停止。</li>
<li><code>computed</code> 可以写吗？可以传入 <code>{ get, set }</code> 创建可写 computed，常用于包装 v-model，见《组件 v-model 的本质是什么？》。</li>
</ul>`};export{e as default};