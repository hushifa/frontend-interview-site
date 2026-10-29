var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>普通对象的键只能是字符串或 Symbol，适合字段固定的记录，比如一个用户的信息。<code>Map</code> 的键可以是任意值，包括对象，有 <code>size</code> 属性，按插入顺序遍历，适合键会动态增减的字典。</p>
<p><code>Set</code> 存的是不重复的值。ES2025 给它加了集合运算，比如并集 <code>union</code>、交集 <code>intersection</code>、差集 <code>difference</code>、对称差 <code>symmetricDifference</code>，还有判断子集的 <code>isSubsetOf</code> 等。<code>Map</code> 和 <code>Set</code> 判断两个键是否相同时，用的是 SameValueZero 规则：<code>NaN</code> 等于自己，对象看是不是同一个。</p>
<p><code>WeakMap</code> 和 <code>WeakSet</code> 的键必须是对象，或者没有注册过的 Symbol。它们不会阻止键被回收，所以适合给对象附加私有数据或者做缓存，对象没了，对应的条目自动消失。</p>
<p>也正因为键随时可能被回收，它们没有 <code>size</code>，也不能遍历。</p>
</blockquote>
<h2>为什么对象作键要用 Map</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = {};
<span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[key, <span class="hljs-number">1</span>]]);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>(key)); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(values.<span class="hljs-title function_">get</span>({}));  <span class="hljs-comment">// undefined</span>
</code></pre></div>
<p>用 <code>key</code> 能取到 1，可用另一个看起来一样的 <code>{}</code> 去取，得到的是 <code>undefined</code>。因为 <code>Map</code> 比较对象键时只看是不是同一个对象，两个 <code>{}</code> 是不同的对象。</p>
<p>如果用普通对象存，问题更大。普通对象的键只能是字符串或 Symbol，用对象作键时会被转成字符串 <code>&#x27;[object Object]&#x27;</code>，于是所有对象键都变成了同一个键，互相覆盖。</p>
<h2>Map 和普通对象怎么选</h2>
<table><thead><tr><th></th><th>普通对象</th><th><code>Map</code></th></tr></thead><tbody><tr><td>键类型</td><td>字符串、Symbol</td><td>任意值</td></tr><tr><td>大小</td><td><code>Object.keys(o).length</code></td><td><code>map.size</code></td></tr><tr><td>原型上的键</td><td>可能冲突（如 <code>&#x27;constructor&#x27;</code>）</td><td>无</td></tr><tr><td>JSON</td><td>直接序列化</td><td>需先 <code>Object.fromEntries</code></td></tr><tr><td>频繁增删</td><td>一般</td><td>针对此优化</td></tr></tbody></table>
<p>“原型上的键可能冲突”是指普通对象会继承 <code>Object.prototype</code> 上的属性，用户输入的键正好叫 <code>constructor</code> 时，读到的可能是继承来的东西。想要一个没有原型的纯字典，也可以用 <code>Object.create(null)</code> 创建。</p>
<h2>Set 怎样做并集和交集</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> a = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>]);
<span class="hljs-keyword">const</span> b = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>]);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...a.<span class="hljs-title function_">union</span>(b)]);        <span class="hljs-comment">// [1, 2, 3, 4]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...a.<span class="hljs-title function_">intersection</span>(b)]); <span class="hljs-comment">// [2, 3]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...a.<span class="hljs-title function_">difference</span>(b)]);   <span class="hljs-comment">// [1]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(a.<span class="hljs-title function_">isSubsetOf</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">4</span>]))); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>这些方法都返回新的 Set，不会修改原来的集合。参数也不一定要是 Set，只要是“类 Set”对象就行，也就是有 <code>size</code>、<code>has</code>、<code>keys</code> 的对象，所以也可以直接传一个 <code>Map</code>。</p>
<h2>WeakMap 适合做什么</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> cache = <span class="hljs-keyword">new</span> <span class="hljs-title class_">WeakMap</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getLayout</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">if</span> (!cache.<span class="hljs-title function_">has</span>(element)) cache.<span class="hljs-title function_">set</span>(element, element.<span class="hljs-title function_">getBoundingClientRect</span>());
  <span class="hljs-keyword">return</span> cache.<span class="hljs-title function_">get</span>(element);
}
</code></pre></div>
<p>这里用元素作键，缓存它的布局信息。等元素从 DOM 移除、也没有别的地方引用它时，这条缓存会跟着可以被回收。</p>
<p>如果换成 <code>Map</code>，<code>Map</code> 会一直牢牢引用着这个元素作键，元素从页面上删了也释放不掉，缓存越积越多。</p>
<p>那为什么 <code>WeakMap</code> 不能遍历、没有 <code>size</code>？因为对象什么时候被回收由引擎决定，代码观察不到。如果能遍历，结果就会随回收时机随机变化。需要在对象被回收后执行回调，可以用 <code>FinalizationRegistry</code>，但回调什么时候执行不确定，不能用于必须完成的清理。</p>
<h2>常见追问</h2>
<p><strong>数组怎样去重？</strong></p>
<blockquote>
<p>写 <code>[...new Set(arr)]</code>。要注意对象元素是按身份去重的，两个内容相同的不同对象会都保留下来。</p>
</blockquote>
<p><strong><code>WeakRef</code> 是什么？</strong></p>
<blockquote>
<p>它持有对象的弱引用，不阻止对象被回收。用 <code>deref()</code> 取对象，可能拿到 <code>undefined</code>，说明对象已经被回收了，所以只适合做丢了也没关系的缓存。</p>
</blockquote>`};export{e as default};