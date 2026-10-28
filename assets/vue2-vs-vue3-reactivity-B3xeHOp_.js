var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Vue 2 已于 2023-12-31 停止维护，Vue 2 部分以 2.7 为准，Vue 3 部分以 3.5 为准。</li>
<li><code>defineProperty</code> 作用于单个已有属性，Vue 2 初始化时要递归遍历整个 data；<code>Proxy</code> 作用于整个对象，Vue 3 在 get 读到嵌套对象时才为它创建代理。</li>
<li>Proxy 的 <code>deleteProperty</code>、<code>has</code>、<code>ownKeys</code> 等陷阱让 Vue 3 能检测属性增删、<code>in</code>、遍历以及数组下标和 <code>length</code>，<code>Vue.set</code>/<code>Vue.delete</code> 因此被移除。</li>
<li>Map、Set、WeakMap、WeakSet 由单独的集合处理器拦截 <code>get</code>、<code>set</code>、<code>add</code> 等方法；Vue 2 不支持它们的响应式。</li>
<li>Vue 3 中 <code>effect</code> 执行时读取属性调用 <code>track</code> 登记依赖，写入时 <code>trigger</code> 找到依赖的 effect 重新执行或调度。</li>
</ul>
<h2>能力边界对比</h2>
<table><thead><tr><th></th><th>Vue 2（defineProperty）</th><th>Vue 3（Proxy）</th></tr></thead><tbody><tr><td>新增/删除属性</td><td>检测不到，需 <code>Vue.set</code>/<code>Vue.delete</code></td><td><code>set</code>、<code>deleteProperty</code> 陷阱可检测</td></tr><tr><td><code>key in obj</code>、<code>for...in</code>/<code>Object.keys</code></td><td>依赖不到新增的 key</td><td><code>has</code>、<code>ownKeys</code> 陷阱可追踪</td></tr><tr><td>数组下标赋值、改 <code>length</code></td><td>检测不到，靠重写 7 个变异方法</td><td>直接检测</td></tr><tr><td>Map/Set</td><td>不支持</td><td><code>collectionHandlers</code> 支持</td></tr><tr><td>原对象</td><td>原地修改，加上 getter/setter 和 <code>__ob__</code></td><td>不修改原对象，返回代理；修改原对象不会触发更新</td></tr><tr><td>浏览器</td><td>ES5，支持 IE9+</td><td>Proxy 无法 polyfill，Vue 3 不支持 IE11</td></tr></tbody></table>
<p>官方 Vue 3 文档说明：Vue 2 由于浏览器支持限制只用 getter/setter；Vue 3 对 reactive 对象使用 Proxy，对 ref 使用 getter/setter。迁移指南也写明 <code>$set</code>/<code>$delete</code> 在基于 Proxy 的变更检测下不再需要。</p>
<h2>初始化与性能</h2>
<ul>
<li>Vue 2 在创建实例时一次性递归转换所有嵌套属性，数据越大初始化越慢，即使有些属性从未被渲染。大型只读数据常用 <code>Object.freeze</code> 跳过转换。</li>
<li>Vue 3 的 <code>reactive()</code> 只代理顶层；get 陷阱返回值是对象时才调用 <code>reactive(res)</code>，并用 <code>WeakMap</code>（<code>proxyMap</code>）缓存，同一原对象总是得到同一个代理。</li>
<li>代价是每次属性访问都经过代理陷阱。大数据可用 <code>shallowRef</code>/<code>shallowReactive</code> 或 <code>markRaw</code> 跳过深层代理。</li>
</ul>
<p>这里不给出具体倍数，两者的性能差异取决于数据规模和访问模式。</p>
<h2>effect、track、trigger</h2>
<p>Vue 3.5 的结构：</p>
<ul>
<li>全局 <code>targetMap: WeakMap&lt;target, Map&lt;key, Dep&gt;&gt;</code> 保存&quot;对象的某个 key 被哪些 effect 依赖&quot;。</li>
<li><code>track(target, type, key)</code>：当前有活跃 effect 时，找到或创建对应的 <code>Dep</code> 并登记。</li>
<li><code>trigger(target, type, key)</code>：取出对应的 <code>Dep</code> 通知订阅者；新增或删除属性时还会触发遍历用的 <code>ITERATE_KEY</code>，数组改 <code>length</code> 时会触发受影响的下标。</li>
<li>组件渲染、<code>computed</code>、<code>watch</code> 都建立在 effect 之上，组件更新通过调度器进入异步队列。</li>
</ul>
<p>更完整的过程见<a href="/questions/vue-reactivity-tracking/">《Vue 3 响应式依赖是怎样收集和触发的？》</a>；<code>ref</code> 与 <code>reactive</code> 的选择见<a href="/questions/vue-ref-reactive/">《Vue 3 中 ref 和 reactive 有什么区别？》</a>。</p>
<h2>示例</h2>
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
<p><code>effect</code> 来自 <code>@vue/reactivity</code>，同步执行，所以每次修改都会立即记录一行；组件渲染则会经过调度器合并。</p>
<h2>常见追问</h2>
<ul>
<li>Vue 2.7 有 <code>reactive()</code>，它也是 Proxy 吗？不是。2.7 的 <code>reactive</code> 仍基于 <code>defineProperty</code>，限制与 Vue 2 相同。</li>
<li>解构 <code>reactive</code> 对象为什么会失去响应式？解构得到的是普通值，绕过了代理的 get。</li>
</ul>`};export{e as default};