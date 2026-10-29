var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，本题以 Vue 2.7 源码为准。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>Vue 2 在初始化组件时，会遍历 <code>data</code> 里的所有属性，用 <code>Object.defineProperty</code> 把每个属性改成 getter 和 setter，嵌套的对象也递归处理。这样读属性、改属性都会经过 Vue 自己的函数。</p>
<p>每个属性都配了一个依赖收集器 <code>Dep</code>。读属性时，getter 看看“现在是谁在求值”，这个求值者叫 Watcher，就把它记到 Dep 里。改属性时，setter 发现新值和旧值不同，就调用 <code>dep.notify()</code> 通知所有记下来的 Watcher。</p>
<p>每个组件都有一个渲染 watcher，它的求值过程就是渲染组件。渲染时读到了哪些属性，就成了哪些属性的订阅者，所以这些属性一变，组件就会重新渲染。</p>
<p>要注意，Watcher 被通知后不会马上执行，而是进入异步队列，同一轮里改多少次都只执行一次。</p>
</blockquote>
<h2>三个角色各管什么</h2>
<p><code>Observer</code> 挂在对象的 <code>__ob__</code> 属性上，负责把对象的属性转换成响应式；遇到数组就替换原型，并对每一项做 observe。它自己也带一个 <code>dep</code>，给 <code>Vue.set</code> 和数组方法通知更新时用。</p>
<p><code>Dep</code> 是装依赖的容器，<code>subs</code> 里保存订阅它的 Watcher。<code>Dep.target</code> 是全局唯一的“当前正在求值的 Watcher”，用 <code>pushTarget</code> 和 <code>popTarget</code> 维护成一个栈。</p>
<p><code>Watcher</code> 是一段需要追踪依赖的求值逻辑。渲染 watcher、<code>computed</code>（叫 <code>lazy</code> watcher）、<code>watch</code> 和 <code>$watch</code>（叫 user watcher）都是它的实例。</p>
<p>官方文档是这样描述的：Vue 遍历 data 的所有属性，用 <code>Object.defineProperty</code> 转为 getter/setter；每个组件实例都有对应的 watcher，在渲染时把“接触过”的属性记录为依赖；之后依赖的 setter 触发时，通知 watcher 重新渲染。</p>
<h2>依赖是怎么收集的</h2>
<p>Vue 怎么知道组件渲染时读了哪些属性？靠的是 <code>Watcher.get()</code> 这个流程：</p>
<ol>
<li><code>pushTarget(this)</code>，把自己设为 <code>Dep.target</code>。</li>
<li>执行 getter。渲染 watcher 的 getter 就是 <code>vm._update(vm._render())</code>，途中每读到一个响应式属性，那个属性的 getter 就会调用 <code>dep.depend()</code>。</li>
<li><code>dep.depend()</code> 调用 <code>Dep.target.addDep(dep)</code>，Watcher 用 <code>newDepIds</code> 去重后，把自己加进 <code>dep.subs</code>。</li>
<li>求值结束后 <code>popTarget()</code>，再调用 <code>cleanupDeps()</code>。这一轮没再用到的旧 dep 会把这个 Watcher 移除，所以 <code>v-if</code> 切走的分支，以后改了也不会再触发更新。</li>
</ol>
<p>还有一个细节。属性值是对象或数组时，getter 还会调用 <code>childOb.dep.depend()</code>，数组再递归 <code>dependArray</code>。为什么要多这一步？因为 <code>Vue.set</code> 新增属性、调用数组变异方法时，没有经过任何已有属性的 setter，只能通过对象自己的 <code>__ob__.dep</code> 通知。提前在这里收集好，才能通知到读过这个对象的 Watcher。</p>
<h2>更新是怎么派发的</h2>
<p>setter 里，如果新值和旧值相同（包括都是 NaN 的情况），直接返回。否则写入新值，对新值重新 <code>observe</code>，然后调用 <code>dep.notify()</code>。<code>notify</code> 会遍历 <code>subs</code>，调用每个 Watcher 的 <code>update()</code>，不同的 Watcher 处理方式不同：</p>
<ul>
<li><code>lazy</code> watcher（computed）只把 <code>dirty</code> 设为 true，等下次被读取时再重新计算。</li>
<li><code>sync</code> watcher 立即执行。</li>
<li>其他 Watcher 交给 <code>queueWatcher</code> 去重入队，在 <code>nextTick</code> 中按 id 排序后批量执行。</li>
</ul>
<h2>实际跑一下</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 用 Node 运行，vue@2.7.16</span>
<span class="hljs-keyword">const</span> <span class="hljs-title class_">Vue</span> = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;vue&#x27;</span>);
<span class="hljs-keyword">const</span> vm = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Vue</span>({ <span class="hljs-attr">data</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> } });
vm.$watch(<span class="hljs-string">&#x27;count&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">v, old</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(old, <span class="hljs-string">&#x27;-&gt;&#x27;</span>, v));

vm.<span class="hljs-property">count</span> = <span class="hljs-number">1</span>;
vm.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-comment">// 输出：0 -&gt; 2（同一轮多次修改合并为一次回调）</span>
</code></pre></div>
<p>改了两次，回调只执行了一次，而且直接从 0 跳到了 2。这是因为 user watcher 被通知后进了队列，第二次修改时它已经在队列里，被去重了。等 <code>nextTick</code> 时它才执行，这时读到的已经是最终值 2。</p>
<h2>常见追问</h2>
<p><strong>为什么组件的 data 要写成函数？</strong></p>
<blockquote>
<p>每个组件实例需要一份独立的数据对象。如果 data 是一个对象，多个实例就会共用同一份被 observe 的对象，一个改了其他的也跟着变。</p>
</blockquote>
<p><strong>和 Vue 3 的实现有什么不同？</strong></p>
<blockquote>
<p>见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>。</p>
</blockquote>
<p><strong>新增属性为什么不触发更新？</strong></p>
<blockquote>
<p>见<a href="/questions/vue2-reactivity-caveats/">《Vue 2 响应式有哪些限制？如何绕过？》</a>。</p>
</blockquote>`};export{e as default};