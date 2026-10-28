var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Vue 2 已于 2023-12-31 停止维护，本题以 Vue 2.7 源码为准。</li>
<li>初始化时 <code>Observer</code> 遍历 data，用 <code>defineReactive</code> 通过 <code>Object.defineProperty</code> 把每个属性改成 getter/setter，嵌套对象递归处理。</li>
<li>每个属性闭包里有一个 <code>Dep</code>；getter 执行时，若存在 <code>Dep.target</code>（正在求值的 Watcher），就互相登记依赖。</li>
<li>setter 发现新值与旧值不同时调用 <code>dep.notify()</code>，通知所有订阅的 Watcher 更新。</li>
<li>每个组件有一个渲染 watcher，求值函数就是渲染并 patch，它被通知后进入异步队列，统一重新渲染。</li>
</ul>
<h2>三个角色</h2>
<ul>
<li><code>Observer</code>：挂在对象的 <code>__ob__</code> 上，负责把对象的属性转换为响应式；数组则替换原型并逐项 observe。它自身也带一个 <code>dep</code>，供 <code>Vue.set</code> 和数组方法通知使用。</li>
<li><code>Dep</code>：依赖的容器，<code>subs</code> 保存订阅它的 Watcher。<code>Dep.target</code> 是全局唯一的&quot;当前正在求值的 Watcher&quot;，用 <code>pushTarget</code>/<code>popTarget</code> 维护成栈。</li>
<li><code>Watcher</code>：一段需要追踪依赖的求值逻辑。渲染 watcher、<code>computed</code>（<code>lazy</code> watcher）、<code>watch</code>/<code>$watch</code>（user watcher）都是它的实例。</li>
</ul>
<p>官方文档的描述：Vue 遍历 data 的所有属性并用 <code>Object.defineProperty</code> 转为 getter/setter，每个组件实例有一个对应的 watcher，在渲染时把&quot;接触过&quot;的属性记录为依赖，依赖的 setter 触发后通知 watcher 重新渲染。</p>
<h2>依赖收集</h2>
<p><code>Watcher.get()</code> 的流程：</p>
<ol>
<li><code>pushTarget(this)</code>，把自己设为 <code>Dep.target</code>。</li>
<li>执行 getter（渲染 watcher 就是 <code>vm._update(vm._render())</code>），途中读到的每个响应式属性都会调用 <code>dep.depend()</code>。</li>
<li><code>dep.depend()</code> 调用 <code>Dep.target.addDep(dep)</code>，Watcher 用 <code>newDepIds</code> 去重后把自己加入 <code>dep.subs</code>。</li>
<li>求值结束 <code>popTarget()</code>，再 <code>cleanupDeps()</code>：本轮没再用到的旧 dep 会把这个 Watcher 移除，所以 <code>v-if</code> 切走的分支不会再触发更新。</li>
</ol>
<p>属性值是对象或数组时，getter 还会让 <code>childOb.dep.depend()</code>，数组再递归 <code>dependArray</code>。这样 <code>Vue.set</code> 新增属性或调用数组变异方法时，通过 <code>__ob__.dep</code> 也能通知到读过这个对象的 Watcher。</p>
<h2>派发更新</h2>
<p>setter 中，新值与旧值相同（含 NaN 的情况）直接返回；否则写入新值，对新值重新 <code>observe</code>，然后 <code>dep.notify()</code>。<code>notify</code> 遍历 <code>subs</code> 调用每个 Watcher 的 <code>update()</code>：</p>
<ul>
<li><code>lazy</code> watcher（computed）只把 <code>dirty</code> 设为 true，下次读取时再求值。</li>
<li><code>sync</code> watcher 立即执行。</li>
<li>其他 Watcher 交给 <code>queueWatcher</code> 去重入队，在 <code>nextTick</code> 中按 id 排序后批量执行，所以同一轮里改多次只渲染一次。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 用 Node 运行，vue@2.7.16</span>
<span class="hljs-keyword">const</span> <span class="hljs-title class_">Vue</span> = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;vue&#x27;</span>);
<span class="hljs-keyword">const</span> vm = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Vue</span>({ <span class="hljs-attr">data</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> } });
vm.$watch(<span class="hljs-string">&#x27;count&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">v, old</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(old, <span class="hljs-string">&#x27;-&gt;&#x27;</span>, v));

vm.<span class="hljs-property">count</span> = <span class="hljs-number">1</span>;
vm.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-comment">// 输出：0 -&gt; 2（同一轮多次修改合并为一次回调）</span>
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>为什么组件的 <code>data</code> 要写成函数？每个实例需要独立的数据对象，否则多个实例共享同一份被 observe 的对象。</li>
<li>与 Vue 3 的实现有何不同？见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>。</li>
<li>新增属性为什么不触发更新？见<a href="/questions/vue2-reactivity-caveats/">《Vue 2 响应式有哪些限制？如何绕过？》</a>。</li>
</ul>`};export{e as default};