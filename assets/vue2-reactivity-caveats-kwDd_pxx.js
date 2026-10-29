var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题以 Vue 2.7 为准。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>Vue 2 的响应式靠 <code>Object.defineProperty</code>，在初始化时给每个已经存在的属性装上 getter 和 setter。所以初始化之后新加的属性、被删掉的属性，它都检测不到。</p>
<p>数组也有两个盲区：<code>items[i] = v</code> 用下标赋值，和 <code>items.length = n</code> 改长度，都不会触发更新。</p>
<p>绕过的办法是用 Vue 提供的 API。新增属性用 <code>Vue.set</code> 或 <code>vm.$set</code>，删除用 <code>Vue.delete</code>，它们会把新属性变成响应式并通知更新，但都不能用在 Vue 实例或根级 <code>$data</code> 上。数组改下标或截断用 <code>splice</code>。</p>
<p>那为什么 <code>push</code> 能触发更新？因为 Vue 2 替换了响应式数组的原型，<code>push</code>、<code>pop</code>、<code>shift</code>、<code>unshift</code>、<code>splice</code>、<code>sort</code>、<code>reverse</code> 这 7 个方法被包了一层，执行完原方法后会通知更新，还会把新插入的元素也变成响应式。</p>
</blockquote>
<h2>对象的新增和删除属性</h2>
<p>官方文档说明，Vue 在实例初始化时做 getter/setter 转换，属性必须一开始就在 data 里才是响应式的。Vue 也不允许在已创建的实例上动态添加根级响应式属性，需要的话应该在 data 里预先声明，可以先设成空值。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">set</span>(vm.<span class="hljs-property">user</span>, <span class="hljs-string">&#x27;age&#x27;</span>, <span class="hljs-number">18</span>); <span class="hljs-comment">// 或 this.$set(this.user, &#x27;age&#x27;, 18)</span>
<span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">delete</span>(vm.<span class="hljs-property">user</span>, <span class="hljs-string">&#x27;age&#x27;</span>); <span class="hljs-comment">// 或 this.$delete(...)</span>

<span class="hljs-comment">// 一次加多个属性：用新对象替换，而不是 Object.assign 到原对象</span>
<span class="hljs-variable language_">this</span>.<span class="hljs-property">user</span> = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>({}, <span class="hljs-variable language_">this</span>.<span class="hljs-property">user</span>, { <span class="hljs-attr">a</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">b</span>: <span class="hljs-number">2</span> });
</code></pre></div>
<p>为什么一次加多个属性要换成新对象？因为 <code>Object.assign(this.user, {...})</code> 是在原对象上直接加属性，跟 <code>this.user.a = 1</code> 一样检测不到。而 <code>this.user = 新对象</code> 是给 <code>user</code> 这个已有属性赋值，会经过它的 setter，新对象也会被转成响应式。</p>
<p><code>set</code> 在源码里分几种情况处理：</p>
<ul>
<li>属性已经存在：直接赋值后返回，由原有的 setter 负责通知。</li>
<li>目标不是响应式对象（没有 <code>__ob__</code>）：只赋值，不通知。</li>
<li>目标是 Vue 实例或根 <code>$data</code>（<code>ob.vmCount &gt; 0</code>）：开发环境警告并返回。</li>
<li>其他情况：用 <code>defineReactive</code> 定义新属性，再调用 <code>ob.dep.notify()</code>。这个 dep 就是读取这个对象时，由 <code>childOb.dep.depend()</code> 收集的依赖。</li>
</ul>
<h2>数组的下标和 length</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">vm.<span class="hljs-property">items</span>[<span class="hljs-number">1</span>] = <span class="hljs-string">&#x27;x&#x27;</span>; <span class="hljs-comment">// 不是响应式</span>
vm.<span class="hljs-property">items</span>.<span class="hljs-property">length</span> = <span class="hljs-number">2</span>; <span class="hljs-comment">// 不是响应式</span>

<span class="hljs-title class_">Vue</span>.<span class="hljs-title function_">set</span>(vm.<span class="hljs-property">items</span>, <span class="hljs-number">1</span>, <span class="hljs-string">&#x27;x&#x27;</span>); <span class="hljs-comment">// 或 vm.items.splice(1, 1, &#x27;x&#x27;)</span>
vm.<span class="hljs-property">items</span>.<span class="hljs-title function_">splice</span>(<span class="hljs-number">2</span>); <span class="hljs-comment">// 截断数组</span>
</code></pre></div>
<p>为什么数组下标检测不到？因为 Vue 2 没有给数组的每个下标定义 getter/setter。<code>length</code> 更特殊，它本身是不可配置的属性，没法用 <code>defineProperty</code> 改成访问器。所以对数组下标，<code>Vue.set</code> 内部是先扩展 length，再调用 <code>target.splice(key, 1, val)</code>，靠被拦截的 <code>splice</code> 来触发更新。</p>
<h2>7 个方法是怎么被拦截的</h2>
<p><code>array.ts</code> 以 <code>Array.prototype</code> 为原型创建了一个 <code>arrayMethods</code> 对象，在上面为 7 个方法定义包装函数。每个包装函数做三件事：</p>
<ol>
<li>调用原来的方法，拿到结果。</li>
<li>找出新插入的元素：<code>push</code>、<code>unshift</code> 的全部参数，<code>splice</code> 从第 3 个起的参数。调用 <code>ob.observeArray(inserted)</code> 把它们变成响应式。</li>
<li>调用 <code>ob.dep.notify()</code>，通知依赖这个数组的 Watcher。</li>
</ol>
<p><code>Observer</code> 处理数组时，把数组的原型换成 <code>arrayMethods</code>；环境不支持 <code>__proto__</code> 时，就把这些方法逐个定义到数组上。</p>
<p><code>filter</code>、<code>concat</code>、<code>slice</code> 这类返回新数组的方法不会被拦截，用返回值替换原数组就行。官方文档说明 Vue 会尽量复用已有的 DOM，所以替换数组并不会导致整个列表重新渲染。</p>
<h2>实际跑一下</h2>
<p>下面先用三种检测不到的方式修改，再用 <code>$set</code> 和 <code>splice</code> 修改，看 watcher 的回调有没有被触发：</p>
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
<p>第一次打印是空数组，三次修改都没被发现。第二次打印出了两条记录，而且 <code>user</code> 里也有 <code>age: 1</code>。这说明之前的修改其实已经写进对象了，只是 Vue 不知道；<code>$set</code> 触发重新计算时，才一起读到。</p>
<p><code>items</code> 是 <code>a,y</code> 也是同样的道理：<code>length = 2</code> 当时已经把数组截断成了 <code>[&#x27;a&#x27;, &#x27;x&#x27;]</code>，只是没有通知，<code>splice</code> 再把第二项换成 <code>y</code>。</p>
<h2>常见追问</h2>
<p><strong><code>age</code> 已经用普通赋值加上了，再用 <code>this.$set(this.user, &#x27;age&#x27;, 2)</code> 为什么还是不更新？</strong></p>
<blockquote>
<p>因为属性已经存在时，<code>set</code> 只做普通赋值。而这个 <code>age</code> 是普通赋值加上的，没有 setter，赋值了也不会通知。</p>
</blockquote>
<p><strong>Vue 3 还有这些限制吗？</strong></p>
<blockquote>
<p>没有了，见<a href="/questions/vue2-vs-vue3-reactivity/">《defineProperty 和 Proxy 实现的响应式有什么区别？》</a>。</p>
</blockquote>`};export{e as default};