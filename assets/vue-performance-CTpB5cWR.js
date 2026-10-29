var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>第一步是测量，不是猜。用 Vue DevTools 的性能时间线看哪些组件渲染得多、耗时长，用浏览器 Performance 面板看长任务、布局和绘制。</p>
<p>最常见的问题是 props 不稳定。比如把整个 <code>activeId</code> 传给每一行，选中项一变，所有行的 props 都变了，所有行都要更新。改成只传“这一行是否选中”，就只有两行更新。</p>
<p>数据层面，大块只读数据，比如接口返回的十万行表格、第三方库的实例，用 <code>shallowRef</code> 或 <code>markRaw</code>，省掉深层代理的开销。长列表用虚拟滚动，只渲染看得见的几十行。模板里的计算放进 <code>computed</code>，<code>v-once</code> 让内容只渲染一次，<code>v-memo</code> 在依赖不变时跳过子树。</p>
<p>要分清两类问题。路由懒加载、<code>defineAsyncComponent</code> 拆包解决的是首屏下载慢；输入卡顿要靠上面的更新优化，两者分开评估。</p>
</blockquote>
<h2>为什么 props 要稳定</h2>
<p>看两种传 props 的写法：</p>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 不好：activeId 变化时所有行的 props 都变了 --&gt;
&lt;Row v-for=&quot;item in list&quot; :key=&quot;item.id&quot; :item=&quot;item&quot; :active-id=&quot;activeId&quot; /&gt;

&lt;!-- 好：只有选中状态变化的两行更新 --&gt;
&lt;Row v-for=&quot;item in list&quot; :key=&quot;item.id&quot; :item=&quot;item&quot; :active=&quot;item.id === activeId&quot; /&gt;
</code></pre></div>
<p>子组件要不要重新渲染，取决于它收到的 props 有没有变。第一种写法里，每一行都收到 <code>activeId</code>，它一变，一千行就全部更新。第二种写法里，每行收到的是一个布尔值，选中项从 A 换到 B 时，只有 A 从 <code>true</code> 变 <code>false</code>、B 从 <code>false</code> 变 <code>true</code>，其他行的值没变，就不用更新。</p>
<h2>大块数据为什么不要深层响应式</h2>
<p><code>ref</code> 默认会把里面的对象深层转成响应式，十万行数据的每个属性都要包一层代理。如果这些数据只是拿来展示，很少逐个修改，这份开销就是白花的：</p>
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
<p><code>shallowRef</code> 只关心 <code>.value</code> 本身有没有被换掉。所以改了某一行的 <code>name</code>，Vue 不知道，得调用 <code>triggerRef</code> 手动通知。更推荐的做法是整体替换：<code>rows.value = rows.value.with(index, { ...rows.value[index], name })</code>，换了一个新数组，Vue 自然就知道了。</p>
<h2>v-memo 怎么跳过子树</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;div v-for=&quot;item in list&quot; :key=&quot;item.id&quot; v-memo=&quot;[item.id === selectedId]&quot;&gt;
  &lt;ExpensiveCard :item=&quot;item&quot; :selected=&quot;item.id === selectedId&quot; /&gt;
&lt;/div&gt;
</code></pre></div>
<p><code>v-memo</code> 后面的数组是依赖。重新渲染时，如果某一项的依赖值和上次一样，Vue 直接跳过这一项的整个子树。所以 <code>selectedId</code> 变化时，只有选中状态改变的两项重新渲染。</p>
<p>它的风险在于依赖必须写全。影响渲染的值漏写了一个，那个值变了界面也不会更新。</p>
<h2>模板里的计算为什么要放进 computed</h2>
<div class="not-prose code-block"><div class="code-language">vue</div><pre><code class="hljs language-vue">&lt;!-- 不好：每次渲染都排序 --&gt;
&lt;li v-for=&quot;u in users.slice().sort(byName)&quot; :key=&quot;u.id&quot;&gt;{{ u.name }}&lt;/li&gt;
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> sortedUsers = <span class="hljs-title function_">computed</span>(<span class="hljs-function">() =&gt;</span> users.<span class="hljs-property">value</span>.<span class="hljs-title function_">slice</span>().<span class="hljs-title function_">sort</span>(byName));
</code></pre></div>
<p>写在模板里，组件因为任何原因重新渲染，都要重新排一次序。放进 <code>computed</code> 以后，只有 <code>users</code> 变了才重新计算，其他时候直接用缓存。</p>
<h2>加载速度怎么优化</h2>
<p>路由用懒加载，比如 <code>component: () =&gt; import(&#x27;./pages/Report.vue&#x27;)</code>；很少显示的大组件用 <code>defineAsyncComponent(() =&gt; import(&#x27;./Editor.vue&#x27;))</code>，用到时才下载。服务端渲染的场景里，Vue 3.5 起可以给异步组件设置惰性 hydration，比如 <code>hydrateOnVisible()</code>，滚动到可见时再激活。</p>
<p>这些减少的是首屏下载量，对输入卡顿没有帮助。</p>
<h2>常见追问</h2>
<p><strong>组件拆得太多会变慢吗？</strong></p>
<blockquote>
<p>会有开销。每个组件实例都有创建和更新的成本，纯展示的小片段不必都拆成组件。</p>
</blockquote>
<p><strong>Vue 编译器自己做了哪些优化？</strong></p>
<blockquote>
<p>见<a href="/questions/vue-compiler-optimizations/">《Vue 模板编译如何减少运行时更新工作？》</a>。</p>
</blockquote>`};export{e as default};