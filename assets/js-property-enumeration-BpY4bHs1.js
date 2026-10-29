var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>区分这几个方法，要看三件事：属性是自己的还是继承的，是不是可枚举，键是字符串还是 Symbol。</p>
<p><code>Object.keys</code>，还有 <code>Object.values</code>、<code>Object.entries</code>，只返回自己的、可枚举的、字符串键。<code>for...in</code> 在这基础上还会带上原型链上可枚举的字符串键。<code>Object.getOwnPropertyNames</code> 返回自己所有的字符串键，不可枚举的也算；<code>Object.getOwnPropertySymbols</code> 返回自己的 Symbol 键。<code>Reflect.ownKeys</code> 最全，自己的所有键都返回，等于前面这两个加起来。</p>
<p>键的顺序也有规则：像数组下标那样的整数键按数值从小到大排在前面，其他字符串键按创建顺序，Symbol 键排在最后，也按创建顺序。</p>
</blockquote>
<h2>同一个对象，不同方法拿到什么</h2>
<p>下面这个对象有四种属性：继承来的、普通的、不可枚举的、Symbol 键的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;内部标记&#x27;</span>);
<span class="hljs-keyword">const</span> object = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">inherited</span>: <span class="hljs-number">1</span> });
object.<span class="hljs-property">visible</span> = <span class="hljs-number">2</span>;
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(object, <span class="hljs-string">&#x27;hidden&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">3</span> });
object[key] = <span class="hljs-number">4</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(object).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// visible</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">ownKeys</span>(object).<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(object, <span class="hljs-string">&#x27;inherited&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>Object.keys</code> 只拿到了 <code>visible</code>。<code>inherited</code> 是从原型继承来的，<code>hidden</code> 用 <code>defineProperty</code> 创建，默认不可枚举，Symbol 键也不算，所以都被排除了。</p>
<p><code>Reflect.ownKeys</code> 拿到 3 个：<code>visible</code>、<code>hidden</code> 和那个 Symbol 键。它不管可不可枚举，也包括 Symbol，但还是只看自己的属性，不含 <code>inherited</code>。<code>Object.hasOwn</code> 返回 <code>false</code> 也说明了这一点。</p>
<p>如果用 <code>for (const k in object)</code> 遍历，会得到 <code>visible</code> 和 <code>inherited</code>，它会去原型链上找可枚举的属性。</p>
<h2>各个方法的范围总览</h2>
<table><thead><tr><th>API</th><th>自身</th><th>继承</th><th>不可枚举</th><th>Symbol</th></tr></thead><tbody><tr><td><code>Object.keys</code></td><td>✓</td><td></td><td></td><td></td></tr><tr><td><code>for...in</code></td><td>✓</td><td>✓</td><td></td><td></td></tr><tr><td><code>Object.getOwnPropertyNames</code></td><td>✓</td><td></td><td>✓</td><td></td></tr><tr><td><code>Object.getOwnPropertySymbols</code></td><td>✓</td><td></td><td>✓</td><td>✓</td></tr><tr><td><code>Reflect.ownKeys</code></td><td>✓</td><td></td><td>✓</td><td>✓</td></tr><tr><td><code>JSON.stringify</code></td><td>✓</td><td></td><td></td><td></td></tr><tr><td><code>{ ...obj }</code> / <code>Object.assign</code></td><td>✓</td><td></td><td></td><td>✓</td></tr></tbody></table>
<p>最后一行容易记错：展开语法和 <code>Object.assign</code> 会复制自己的可枚举属性，字符串键和 Symbol 键都会复制。</p>
<h2>键为什么不按写的顺序排</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> o = { <span class="hljs-attr">b</span>: <span class="hljs-number">1</span>, <span class="hljs-number">2</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">a</span>: <span class="hljs-number">1</span>, <span class="hljs-number">1</span>: <span class="hljs-number">1</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(o)); <span class="hljs-comment">// [&#x27;1&#x27;, &#x27;2&#x27;, &#x27;b&#x27;, &#x27;a&#x27;]</span>
</code></pre></div>
<p>写的顺序是 <code>b</code>、<code>2</code>、<code>a</code>、<code>1</code>，结果 <code>&#x27;1&#x27;</code> 和 <code>&#x27;2&#x27;</code> 跑到了最前面。因为整数键总是按数值升序排在前面，剩下的字符串键才按创建顺序。所以需要完全由自己控制顺序时，用 <code>Map</code> 或者数组。</p>
<h2>怎样判断属性存不存在</h2>
<p><code>Object.hasOwn(obj, key)</code> 只看自己的属性，用来代替 <code>obj.hasOwnProperty(key)</code>。用 <code>Object.create(null)</code> 创建的对象没有原型，也就没有 <code>hasOwnProperty</code> 方法，<code>Object.hasOwn</code> 照样能用。</p>
<p><code>key in obj</code> 会连原型链一起查。<code>obj.key !== undefined</code> 不可靠，属性存在但值恰好是 <code>undefined</code> 时，它会判断错。</p>
<h2>取键会不会触发 getter</h2>
<p><code>Object.keys</code> 只读取键，不会调用 getter。<code>Object.entries</code>、<code>JSON.stringify</code> 和展开语法要读取值，所以会触发 getter。如果对象是 Proxy，<code>Object.keys</code> 会触发 <code>ownKeys</code> 和 <code>getOwnPropertyDescriptor</code> 这两个陷阱。</p>
<h2>常见追问</h2>
<p><strong>为什么 class 的方法不出现在 <code>Object.keys</code> 里？</strong></p>
<blockquote>
<p>因为方法定义在原型上，不是实例自己的属性，而且 class 的方法本身就是不可枚举的。</p>
</blockquote>
<p><strong><code>for...of</code> 能遍历普通对象吗？</strong></p>
<blockquote>
<p>不能，普通对象不是可迭代对象。要遍历键值对，就写 <code>for (const [k, v] of Object.entries(obj))</code>。</p>
</blockquote>`};export{e as default};