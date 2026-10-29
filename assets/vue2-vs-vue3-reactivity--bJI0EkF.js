var e={answerHtml:`<blockquote>
<p>Vue 2 已于 2023-12-31 停止维护，Vue 2 部分以 2.7 为准，Vue 3 部分以 3.5 为准。</p>
</blockquote>
<h2>简答</h2>
<blockquote>
<p>两者最根本的差别在于监听的单位。<code>defineProperty</code> 是给对象上某一个已经存在的属性装 getter 和 setter，所以 Vue 2 初始化时要把整个 data 递归遍历一遍。<code>Proxy</code> 是给整个对象套一层代理，任何属性的读写都会经过它，Vue 3 只在读到嵌套对象时才为它创建代理。</p>
<p>因为监听的是整个对象，Proxy 还能拦截更多操作：<code>deleteProperty</code> 拦删除，<code>has</code> 拦 <code>in</code>，<code>ownKeys</code> 拦遍历。所以 Vue 3 能检测属性的增删、<code>in</code> 判断、遍历，以及数组下标和 <code>length</code> 的修改，<code>Vue.set</code> 和 <code>Vue.delete</code> 也就被移除了。</p>
<p>Map、Set、WeakMap、WeakSet 在 Vue 3 里由专门的集合处理器拦截 <code>get</code>、<code>set</code>、<code>add</code> 等方法；Vue 2 不支持它们的响应式。</p>
<p>依赖管理上，Vue 3 由 effect 执行时读属性调用 <code>track</code> 登记依赖，写属性时调用 <code>trigger</code> 找到依赖它的 effect 去重新执行或调度。代价是 Proxy 没法 polyfill，所以 Vue 3 不支持 IE11。</p>
</blockquote>
<h2>能力边界对比</h2>
<table><thead><tr><th></th><th>Vue 2（defineProperty）</th><th>Vue 3（Proxy）</th></tr></thead><tbody><tr><td>新增/删除属性</td><td>检测不到，需 <code>Vue.set</code>/<code>Vue.delete</code></td><td><code>set</code>、<code>deleteProperty</code> 陷阱可检测</td></tr><tr><td><code>key in obj</code>、<code>for...in</code>/<code>Object.keys</code></td><td>依赖不到新增的 key</td><td><code>has</code>、<code>ownKeys</code> 陷阱可追踪</td></tr><tr><td>数组下标赋值、改 <code>length</code></td><td>检测不到，靠重写 7 个变异方法</td><td>直接检测</td></tr><tr><td>Map/Set</td><td>不支持</td><td><code>collectionHandlers</code> 支持</td></tr><tr><td>原对象</td><td>原地修改，加上 getter/setter 和 <code>__ob__</code></td><td>不修改原对象，返回代理；修改原对象不会触发更新</td></tr><tr><td>浏览器</td><td>ES5，支持 IE9+</td><td>Proxy 无法 polyfill，Vue 3 不支持 IE11</td></tr></tbody></table>
<p>官方 Vue 3 文档说明：Vue 2 因为浏览器支持的限制只用 getter/setter；Vue 3 对 reactive 对象用 Proxy，对 ref 用 getter/setter。迁移指南也写明，在基于 Proxy 的变更检测下，<code>$set</code> 和 <code>$delete</code> 不再需要。</p>
<h2>初始化开销有什么不同</h2>
<p>Vue 2 在创建实例时一次性递归转换所有嵌套属性。数据越大，初始化越慢，哪怕有些属性从来没被渲染过。所以大型只读数据常用 <code>Object.freeze</code> 跳过转换。</p>
<p>Vue 3 的 <code>reactive()</code> 一开始只代理顶层。get 陷阱返回的值如果是对象，才调用 <code>reactive(res)</code> 给它创建代理，并且用一个 <code>WeakMap</code>（<code>proxyMap</code>）缓存起来，同一个原对象总是得到同一个代理。</p>
<p>不过 Proxy 也有代价，每次访问属性都要经过代理的陷阱函数。大数据可以用 <code>shallowRef</code>、<code>shallowReactive</code> 或 <code>markRaw</code> 跳过深层代理。两者的性能差多少，取决于数据规模和访问方式，这里不给具体倍数。</p>
<h2>effect、track、trigger 怎么配合</h2>
<p>Vue 3.5 的结构是这样的。全局有一个 <code>targetMap: WeakMap&lt;target, Map&lt;key, Dep&gt;&gt;</code>，记录“某个对象的某个 key 被哪些 effect 依赖”。<code>track(target, type, key)</code> 在当前有正在运行的 effect 时，找到或创建对应的 <code>Dep</code> 并登记。<code>trigger(target, type, key)</code> 取出对应的 <code>Dep</code> 通知订阅者。</p>
<p>新增或删除属性时，<code>trigger</code> 还会触发一个专门给遍历用的 <code>ITERATE_KEY</code>，因为 <code>Object.keys</code> 这类遍历的结果变了；数组改 <code>length</code> 时，会触发受影响的那些下标。组件渲染、<code>computed</code>、<code>watch</code> 都建立在 effect 之上，组件更新再通过调度器进入异步队列。</p>
<p>更完整的过程见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>；<code>ref</code> 和 <code>reactive</code> 怎么选见<a href="/questions/vue-ref-reactive/">《Vue 3 中 ref 和 reactive 有什么区别？》</a>。</p>
<h2>实际跑一下</h2>
<p>下面这段代码把 Vue 2 检测不到的四种操作都做了一遍：新增属性、改 <code>length</code>、操作 Map、删除属性。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 用 Node 运行，vue@3.5.x</span>
<span class="hljs-keyword">const</span> { reactive, effect, toRaw } = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;vue&#x27;</span>);
<span class="hljs-keyword">const</span> s = <span class="hljs-title function_">reactive</span>({ <span class="hljs-attr">a</span>: { <span class="hljs-attr">b</span>: <span class="hljs-number">1</span> }, <span class="hljs-attr">list</span>: [<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>], <span class="hljs-attr">m</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>() });
<span class="hljs-keyword">const</span> log = [];
<span class="hljs-title function_">effect</span>(<span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-string">&#x27;c&#x27;</span> <span class="hljs-keyword">in</span> s}</span> <span class="hljs-subst">\${s.list.length}</span> <span class="hljs-subst">\${s.m.get(<span class="hljs-string">&#x27;k&#x27;</span>)}</span>\`</span>));

s.<span class="hljs-property">c</span> = <span class="hljs-number">1</span>; <span class="hljs-comment">// 新增属性</span>
s.<span class="hljs-property">list</span>.<span class="hljs-property">length</span> = <span class="hljs-number">1</span>; <span class="hljs-comment">// 改 length</span>
s.<span class="hljs-property">m</span>.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;k&#x27;</span>, <span class="hljs-number">2</span>); <span class="hljs-comment">// Map</span>
<span class="hljs-keyword">delete</span> s.<span class="hljs-property">c</span>; <span class="hljs-comment">// 删除属性</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log);
<span class="hljs-comment">// [ &#x27;false 3 undefined&#x27;, &#x27;true 3 undefined&#x27;, &#x27;true 1 undefined&#x27;, &#x27;true 1 2&#x27;, &#x27;false 1 2&#x27; ]</span>

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(s.<span class="hljs-property">a</span> === s.<span class="hljs-property">a</span>); <span class="hljs-comment">// true，嵌套代理被缓存</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">toRaw</span>(s).<span class="hljs-property">a</span> === <span class="hljs-title function_">toRaw</span>(s.<span class="hljs-property">a</span>)); <span class="hljs-comment">// true，原对象没有被替换</span>
</code></pre></div>
<p><code>log</code> 里有五行：第一行是 effect 首次执行，后面四行对应四次修改，每一次都被检测到了。<code>effect</code> 来自 <code>@vue/reactivity</code>，它是同步执行的，所以每次修改都立即记一行；组件渲染则会经过调度器合并。</p>
<p>最后两行说明了懒代理的两个特点。<code>s.a === s.a</code> 是 <code>true</code>，说明嵌套对象的代理被缓存了，不会每次读都新建一个。<code>toRaw(s).a === toRaw(s.a)</code> 也是 <code>true</code>，说明原对象里的 <code>a</code> 还是那个普通对象，Vue 3 没有改动原对象。</p>
<h2>常见追问</h2>
<p><strong>Vue 2.7 也有 <code>reactive()</code>，它也是用 Proxy 实现的吗？</strong></p>
<blockquote>
<p>不是。2.7 的 <code>reactive</code> 仍然基于 <code>defineProperty</code>，限制和 Vue 2 一样。</p>
</blockquote>
<p><strong>解构 reactive 对象为什么会失去响应式？</strong></p>
<blockquote>
<p>解构得到的是属性当时的普通值，之后读写这个变量都不会经过代理的 get 和 set，Vue 也就追踪不到了。</p>
</blockquote>`};export{e as default};