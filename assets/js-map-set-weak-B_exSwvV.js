var e={answerHtml:`<h2>简答</h2>
<ul>
<li>普通对象的键只能是字符串或 Symbol，适合固定字段的记录；<code>Map</code> 的键可以是任意值，有 <code>size</code>，按插入顺序迭代，适合动态字典。</li>
<li><code>Map</code>、<code>Set</code> 用 SameValueZero 比较键：<code>NaN</code> 等于自身，对象按身份。</li>
<li><code>Set</code> 存唯一值；ES2025 新增 <code>union</code>、<code>intersection</code>、<code>difference</code>、<code>symmetricDifference</code>、<code>isSubsetOf</code> 等方法。</li>
<li><code>WeakMap</code>、<code>WeakSet</code> 的键必须是对象或未注册的 Symbol，不阻止键被回收，因此没有 <code>size</code>，也不能遍历。</li>
<li><code>WeakMap</code> 适合给对象附加私有数据或缓存，对象被回收后对应条目自动消失。</li>
</ul>
<h2>对象作键</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = {};
<span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[key, <span class="hljs-number">1</span>]]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>(key)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>({}));  <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>用普通对象存同样的数据，<code>key</code> 会被转成字符串 <code>&#x27;[object Object]&#x27;</code>，所有对象键都会冲突。</p>
<h2>Map 与普通对象</h2>
<table><thead><tr><th></th><th>普通对象</th><th><code>Map</code></th></tr></thead><tbody><tr><td>键类型</td><td>字符串、Symbol</td><td>任意值</td></tr><tr><td>大小</td><td><code>Object.keys(o).length</code></td><td><code>map.size</code></td></tr><tr><td>原型上的键</td><td>可能冲突（如 <code>&#x27;constructor&#x27;</code>）</td><td>无</td></tr><tr><td>JSON</td><td>直接序列化</td><td>需先 <code>Object.fromEntries</code></td></tr><tr><td>频繁增删</td><td>一般</td><td>针对此优化</td></tr></tbody></table>
<p>需要无原型的字典时也可以用 <code>Object.create(null)</code>。</p>
<h2>Set 集合运算（ES2025）</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> a = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]);
<span class="hljs-keyword">const</span> b = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>]);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...a.<span class="hljs-title function_">union</span>(b)]);        <span class="hljs-comment">// [1, 2, 3, 4]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...a.<span class="hljs-title function_">intersection</span>(b)]); <span class="hljs-comment">// [2, 3]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...a.<span class="hljs-title function_">difference</span>(b)]);   <span class="hljs-comment">// [1]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a.<span class="hljs-title function_">isSubsetOf</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>]))); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>这些方法返回新 Set，不修改原集合。参数只需是&quot;类 Set&quot;对象（有 <code>size</code>、<code>has</code>、<code>keys</code>），也可以传 <code>Map</code>。</p>
<h2>WeakMap 的用途</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakMap</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getLayout</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">if</span> (!cache.<span class="hljs-title function_">has</span>(element)) cache.<span class="hljs-title function_">set</span>(element, element.<span class="hljs-title function_">getBoundingClientRect</span>());
  <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(element);
}
</code></pre></div>
<p>元素从 DOM 移除且没有其他引用后，缓存条目随之可回收。用 <code>Map</code> 做同样的事，缓存会一直持有元素。</p>
<p>回收时机由引擎决定，不能观测，所以 WeakMap 不提供遍历和计数。需要在回收后执行回调时用 <code>FinalizationRegistry</code>，但回调时间不确定，不能用于必须执行的清理。</p>
<h2>常见追问</h2>
<ul>
<li>数组去重？<code>[...new Set(arr)]</code>，对象元素按身份去重。</li>
<li><code>WeakRef</code> 是什么？持有对象的弱引用，<code>deref()</code> 可能返回 <code>undefined</code>，用于可丢弃的缓存。</li>
</ul>`};export{e as default};