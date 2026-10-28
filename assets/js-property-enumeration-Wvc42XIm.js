var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>Object.keys</code> / <code>values</code> / <code>entries</code>：自身、可枚举、字符串键。</li>
<li><code>for...in</code>：自身和原型链上的可枚举字符串键。</li>
<li><code>Object.getOwnPropertyNames</code>：自身字符串键，包括不可枚举；<code>Object.getOwnPropertySymbols</code>：自身 Symbol 键。</li>
<li><code>Reflect.ownKeys</code>：全部自身键，等于上面两者之和。</li>
<li>键顺序：整数索引按数值升序在前，其余字符串键按创建顺序，Symbol 键最后按创建顺序。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> key = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;内部标记&#x27;</span>);
<span class="hljs-keyword">const</span> object = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>({ <span class="hljs-attr">inherited</span>: <span class="hljs-number">1</span> });
object.<span class="hljs-property">visible</span> = <span class="hljs-number">2</span>;
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(object, <span class="hljs-string">&#x27;hidden&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">3</span> });
object[key] = <span class="hljs-number">4</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(object).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// visible</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">ownKeys</span>(object).<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(object, <span class="hljs-string">&#x27;inherited&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>Reflect.ownKeys</code> 返回 <code>visible</code>、<code>hidden</code> 和 Symbol 键，不含继承的 <code>inherited</code>。<code>for (const k in object)</code> 会得到 <code>visible</code> 和 <code>inherited</code>。</p>
<h2>总览</h2>
<table><thead><tr><th>API</th><th>自身</th><th>继承</th><th>不可枚举</th><th>Symbol</th></tr></thead><tbody><tr><td><code>Object.keys</code></td><td>✓</td><td></td><td></td><td></td></tr><tr><td><code>for...in</code></td><td>✓</td><td>✓</td><td></td><td></td></tr><tr><td><code>Object.getOwnPropertyNames</code></td><td>✓</td><td></td><td>✓</td><td></td></tr><tr><td><code>Object.getOwnPropertySymbols</code></td><td>✓</td><td></td><td>✓</td><td>✓</td></tr><tr><td><code>Reflect.ownKeys</code></td><td>✓</td><td></td><td>✓</td><td>✓</td></tr><tr><td><code>JSON.stringify</code></td><td>✓</td><td></td><td></td><td></td></tr><tr><td><code>{ ...obj }</code> / <code>Object.assign</code></td><td>✓</td><td></td><td></td><td>✓</td></tr></tbody></table>
<p>展开和 <code>Object.assign</code> 复制自身可枚举的字符串键和 Symbol 键。</p>
<h2>键顺序</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> o = { <span class="hljs-attr">b</span>: <span class="hljs-number">1</span>, <span class="hljs-number">2</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">a</span>: <span class="hljs-number">1</span>, <span class="hljs-number">1</span>: <span class="hljs-number">1</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(o)); <span class="hljs-comment">// [&#x27;1&#x27;, &#x27;2&#x27;, &#x27;b&#x27;, &#x27;a&#x27;]</span>
</code></pre></div>
<p>需要可控顺序时用 <code>Map</code> 或数组。</p>
<h2>判断属性存在</h2>
<ul>
<li><code>Object.hasOwn(obj, key)</code>：只看自身，替代 <code>obj.hasOwnProperty(key)</code>，对 <code>Object.create(null)</code> 创建的对象也能用。</li>
<li><code>key in obj</code>：包括原型链。</li>
<li><code>obj.key !== undefined</code>：属性存在但值为 <code>undefined</code> 时判断错误。</li>
</ul>
<h2>读取键与读取值</h2>
<p><code>Object.keys</code> 只读取键，不会调用 getter；<code>Object.entries</code>、<code>JSON.stringify</code>、展开会读取值，触发 getter。对 Proxy 对象，<code>Object.keys</code> 会触发 <code>ownKeys</code> 和 <code>getOwnPropertyDescriptor</code> 陷阱。</p>
<h2>常见追问</h2>
<ul>
<li>为什么 class 的方法不出现在 <code>Object.keys</code> 里？方法在原型上，且是不可枚举的。</li>
<li><code>for...of</code> 能遍历普通对象吗？不能，普通对象不可迭代；用 <code>for (const [k, v] of Object.entries(obj))</code>。</li>
</ul>`};export{e as default};