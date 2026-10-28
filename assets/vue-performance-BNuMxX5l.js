var e={answerHtml:`<h2>简答</h2>
<ul>
<li>先测量：Vue DevTools 的性能时间线看哪些组件渲染多、耗时长，浏览器 Performance 面板看长任务、布局和绘制。</li>
<li>保持 props 稳定：传给每行的应是&quot;这一行是否选中&quot;，而不是整个 <code>activeId</code>，否则一处变化所有行都会更新。</li>
<li>大型只读数据（接口返回的大表格、第三方实例）用 <code>shallowRef</code> 或 <code>markRaw</code>，避免深层代理的开销。</li>
<li>长列表用虚拟滚动，只渲染可见的几十行。</li>
<li><code>v-once</code> 只渲染一次，<code>v-memo=&quot;[deps]&quot;</code> 在依赖不变时跳过子树；路由和大组件用 <code>defineAsyncComponent</code> 拆包。</li>
</ul>
<h2>稳定 props</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 不好：activeId 变化时所有行的 props 都变了 --&gt;
&lt;Row v-for=&quot;item in list&quot; :key=&quot;item.id&quot; :item=&quot;item&quot; :active-id=&quot;activeId&quot; /&gt;

&lt;!-- 好：只有选中状态变化的两行更新 --&gt;
&lt;Row v-for=&quot;item in list&quot; :key=&quot;item.id&quot; :item=&quot;item&quot; :active=&quot;item.id === activeId&quot; /&gt;
</code></pre></div>
<h2>大型数据不做深层响应式</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { shallowRef, triggerRef } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vue&#x27;</span>;

<span class="hljs-keyword">const</span> rows = <span class="hljs-title function_">shallowRef</span>([]);

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">load</span>(<span class="hljs-params"></span>) {
  rows.<span class="hljs-property">value</span> = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetchRows</span>(); <span class="hljs-comment">// 10 万行，只代理外层</span>
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">rename</span>(<span class="hljs-params">index, name</span>) {
  rows.<span class="hljs-property">value</span>[index].<span class="hljs-property">name</span> = name;
  <span class="hljs-title function_">triggerRef</span>(rows); <span class="hljs-comment">// 手动触发更新</span>
}
</code></pre></div>
<p>更推荐的做法是整体替换：<code>rows.value = rows.value.with(index, { ...rows.value[index], name })</code>。</p>
<h2>v-memo</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;div v-for=&quot;item in list&quot; :key=&quot;item.id&quot; v-memo=&quot;[item.id === selectedId]&quot;&gt;
  &lt;ExpensiveCard :item=&quot;item&quot; :selected=&quot;item.id === selectedId&quot; /&gt;
&lt;/div&gt;
</code></pre></div>
<p><code>selectedId</code> 变化时，只有选中状态改变的两项重新渲染。依赖数组必须包含影响渲染的所有值，漏写会导致界面不更新。</p>
<h2>计算放在 computed 里</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 不好：每次渲染都排序 --&gt;
&lt;li v-for=&quot;u in users.slice().sort(byName)&quot; :key=&quot;u.id&quot;&gt;{{ u.name }}&lt;/li&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> sortedUsers = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> users.<span class="hljs-property">value</span>.<span class="hljs-title function_">slice</span>().<span class="hljs-title function_">sort</span>(byName));
</code></pre></div>
<p><code>computed</code> 只在 <code>users</code> 变化时重新计算。</p>
<h2>加载性能</h2>
<ul>
<li>路由懒加载：<code>component: () =&gt; import(&#x27;./pages/Report.vue&#x27;)</code>。</li>
<li>很少显示的大组件：<code>defineAsyncComponent(() =&gt; import(&#x27;./Editor.vue&#x27;))</code>。</li>
<li>SSR 场景中，Vue 3.5 起可以给异步组件设置惰性 hydration，例如 <code>hydrateOnVisible()</code>，滚动到可见时再激活。</li>
</ul>
<p>加载优化减少的是首屏下载，输入卡顿要靠前面的更新优化来解决，两者分开评估。</p>
<h2>常见追问</h2>
<ul>
<li>组件太多会慢吗？每个组件实例都有创建和更新开销，纯展示的小片段不必都拆成组件。</li>
<li>编译器做了哪些优化？见《Vue 模板编译如何减少运行时更新工作？》。</li>
</ul>`};export{e as default};