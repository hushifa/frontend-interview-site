var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Vue 2 已于 2023-12-31 停止维护，本题以 Vue 2.7 为准。</li>
<li>getter/setter 只在初始化时为已存在的属性定义，所以新增、删除对象属性都检测不到。</li>
<li>数组 <code>items[i] = v</code> 和 <code>items.length = n</code> 检测不到；用 <code>Vue.set</code>/<code>vm.$set</code>、<code>splice</code> 代替。</li>
<li><code>Vue.set</code> 对新属性调用 <code>defineReactive</code> 并通过 <code>__ob__.dep</code> 通知；<code>Vue.delete</code> 删除后同样通知。两者都不能用于 Vue 实例或根级 <code>$data</code>。</li>
<li><code>push</code>、<code>pop</code>、<code>shift</code>、<code>unshift</code>、<code>splice</code>、<code>sort</code>、<code>reverse</code> 被包装在响应式数组的原型上，执行原方法后通知更新，并对新插入的元素做 observe。</li>
</ul>
<h2>对象：新增与删除属性</h2>
<p>官方文档说明，Vue 在实例初始化时做 getter/setter 转换，属性必须一开始就在 data 中才是响应式的。Vue 也不允许在已创建的实例上动态添加根级响应式属性，需要时应在 data 中预先声明（可以设为空值）。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">set</span>(vm.<span class="hljs-property">user</span>, <span class="hljs-string">&#x27;age&#x27;</span>, <span class="hljs-number">18</span>); <span class="hljs-comment">// 或 this.$set(this.user, &#x27;age&#x27;, 18)</span>
<span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">delete</span>(vm.<span class="hljs-property">user</span>, <span class="hljs-string">&#x27;age&#x27;</span>); <span class="hljs-comment">// 或 this.$delete(...)</span>

<span class="hljs-comment">// 一次加多个属性：用新对象替换，而不是 Object.assign 到原对象</span>
<span class="hljs-variable language_">this</span>.<span class="hljs-property">user</span> = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>({}, <span class="hljs-variable language_">this</span>.<span class="hljs-property">user</span>, { <span class="hljs-attr">a</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">b</span>: <span class="hljs-number">2</span> });
</code></pre></div>
<p><code>set</code> 的源码行为：</p>
<ul>
<li>属性已存在于目标上：直接赋值后返回，由原有 setter 负责通知。</li>
<li>目标不是响应式对象（没有 <code>__ob__</code>）：只赋值，不通知。</li>
<li>目标是 Vue 实例或根 <code>$data</code>（<code>ob.vmCount &gt; 0</code>）：开发环境警告并返回。</li>
<li>否则 <code>defineReactive</code> 新属性，再 <code>ob.dep.notify()</code>。这个 dep 就是读取该对象时由 <code>childOb.dep.depend()</code> 收集的依赖。</li>
</ul>
<h2>数组：下标与 length</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">vm.<span class="hljs-property">items</span>[<span class="hljs-number">1</span>] = <span class="hljs-string">&#x27;x&#x27;</span>; <span class="hljs-comment">// 不是响应式</span>
vm.<span class="hljs-property">items</span>.<span class="hljs-property">length</span> = <span class="hljs-number">2</span>; <span class="hljs-comment">// 不是响应式</span>

<span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">set</span>(vm.<span class="hljs-property">items</span>, <span class="hljs-number">1</span>, <span class="hljs-string">&#x27;x&#x27;</span>); <span class="hljs-comment">// 或 vm.items.splice(1, 1, &#x27;x&#x27;)</span>
vm.<span class="hljs-property">items</span>.<span class="hljs-title function_">splice</span>(<span class="hljs-number">2</span>); <span class="hljs-comment">// 截断数组</span>
</code></pre></div>
<p>对数组下标，<code>Vue.set</code> 内部会先扩展 length，再调用 <code>target.splice(key, 1, val)</code>，依靠被拦截的 <code>splice</code> 触发更新。Vue 2 没有为数组下标逐个定义 getter/setter，<code>length</code> 本身也是不可配置属性，无法用 <code>defineProperty</code> 改成访问器。</p>
<h2>7 个变异方法的拦截</h2>
<p><code>array.ts</code> 以 <code>Array.prototype</code> 为原型创建 <code>arrayMethods</code>，在它上面为 7 个方法定义包装函数：</p>
<ol>
<li>调用原方法得到结果。</li>
<li><code>push</code>/<code>unshift</code> 的全部参数、<code>splice</code> 从第 3 个起的参数是新插入的元素，调用 <code>ob.observeArray(inserted)</code> 变成响应式。</li>
<li><code>ob.dep.notify()</code> 通知依赖这个数组的 Watcher。</li>
</ol>
<p><code>Observer</code> 处理数组时把它的原型替换为 <code>arrayMethods</code>（环境不支持 <code>__proto__</code> 时把方法逐个定义到数组上）。<code>filter</code>、<code>concat</code>、<code>slice</code> 等返回新数组的方法不会被拦截，用返回值替换原数组即可，官方文档说明 Vue 会尽量复用已有 DOM，替换不会导致整个列表重新渲染。</p>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 用 Node 运行，vue@2.7.16</span>
<span class="hljs-keyword">const</span> <span class="hljs-title class_">Vue</span> = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;vue&#x27;</span>);
<span class="hljs-keyword">const</span> vm = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Vue</span>({ <span class="hljs-attr">data</span>: { <span class="hljs-attr">user</span>: { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;a&#x27;</span> }, <span class="hljs-attr">items</span>: [<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-string">&#x27;b&#x27;</span>, <span class="hljs-string">&#x27;c&#x27;</span>] } });
<span class="hljs-keyword">const</span> log = [];
vm.$watch(<span class="hljs-function">() =&gt;</span> <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(vm.<span class="hljs-property">user</span>), <span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;user:&#x27;</span> + v));
vm.$watch(<span class="hljs-function">() =&gt;</span> vm.<span class="hljs-property">items</span>.<span class="hljs-title function_">join</span>(), <span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;items:&#x27;</span> + v));

vm.<span class="hljs-property">user</span>.<span class="hljs-property">age</span> = <span class="hljs-number">1</span>;
vm.<span class="hljs-property">items</span>[<span class="hljs-number">1</span>] = <span class="hljs-string">&#x27;x&#x27;</span>;
vm.<span class="hljs-property">items</span>.<span class="hljs-property">length</span> = <span class="hljs-number">2</span>;
<span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">nextTick</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log); <span class="hljs-comment">// []，三次修改都未被检测到</span>
  vm.$set(vm.<span class="hljs-property">user</span>, <span class="hljs-string">&#x27;city&#x27;</span>, <span class="hljs-string">&#x27;x&#x27;</span>);
  vm.<span class="hljs-property">items</span>.<span class="hljs-title function_">splice</span>(<span class="hljs-number">1</span>, <span class="hljs-number">1</span>, <span class="hljs-string">&#x27;y&#x27;</span>);
  <span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">nextTick</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log));
  <span class="hljs-comment">// [ &#x27;user:{&quot;name&quot;:&quot;a&quot;,&quot;age&quot;:1,&quot;city&quot;:&quot;x&quot;}&#x27;, &#x27;items:a,y&#x27; ]</span>
});
</code></pre></div>
<p>第二次输出里 <code>items</code> 是 <code>a,y</code>：<code>length = 2</code> 已经截断了数组，只是当时没有通知。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 <code>this.$set(this.user, &#x27;age&#x27;, 2)</code> 在 <code>age</code> 已被普通赋值添加后不更新？属性已存在时 <code>set</code> 只赋值，而这个属性没有 setter，不会通知。</li>
<li>Vue 3 还有这些限制吗？没有，见<a href="/questions/vue2-vs-vue3-reactivity/">《defineProperty 和 Proxy 实现的响应式有什么区别？》</a>。</li>
</ul>`};export{e as default};