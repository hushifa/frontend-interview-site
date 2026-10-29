var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>每个属性背后都有几个开关，合起来叫属性描述符。普通的数据属性有 <code>value</code>、<code>writable</code>（能不能改值）、<code>enumerable</code>（会不会被遍历出来）、<code>configurable</code>（能不能删、能不能改这些开关）。访问器属性用 <code>get</code>、<code>set</code> 代替前两个。直接赋值创建的属性，三个开关都是 <code>true</code>；用 <code>Object.defineProperty</code> 创建时，没写的开关默认都是 <code>false</code>。</p>
<p>想限制整个对象，有三个由弱到强的方法：<code>preventExtensions</code> 不让加新属性，<code>seal</code> 再加上不让删、不让改配置，<code>freeze</code> 再把所有数据属性都变成不可写。</p>
<p>要注意 <code>freeze</code> 只冻一层，嵌套的对象还能改。写入冻结的属性，严格模式下抛 <code>TypeError</code>，非严格模式下什么也不发生。</p>
<p>另外 <code>const</code> 只是不让变量重新赋值，TypeScript 的 <code>readonly</code> 只在编译时检查，它们在运行时都不会冻结对象。</p>
</blockquote>
<h2>冻结以后为什么还能改</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> item = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ <span class="hljs-attr">nested</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> } });
item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p><code>item</code> 已经冻结了，可 <code>item.nested.count</code> 还是从 0 变成了 1。</p>
<p>因为 <code>freeze</code> 只冻结 <code>item</code> 自己的属性。<code>item.nested</code> 这个属性确实不能再指向别的对象了，但它指向的那个对象本身没有被冻结，里面的 <code>count</code> 照样能改。这就叫浅冻结。</p>
<p>需要深冻结时，就递归地对每一层调用 <code>Object.freeze</code>。递归时跳过已经冻结的对象，碰到循环引用才不会死循环。</p>
<h2>用 defineProperty 创建的属性有什么不同</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> config = {};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(config, <span class="hljs-string">&#x27;version&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">1</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getOwnPropertyDescriptor</span>(config, <span class="hljs-string">&#x27;version&#x27;</span>));
<span class="hljs-comment">// { value: 1, writable: false, enumerable: false, configurable: false }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(config)); <span class="hljs-comment">// []</span>
</code></pre></div>
<p>只写了 <code>value</code>，其他三个开关都成了 <code>false</code>。所以 <code>Object.keys</code> 返回空数组，因为这个属性不可枚举。</p>
<p>每个开关的效果是这样的。<code>writable: false</code> 时不能赋值，但如果 <code>configurable</code> 还是 <code>true</code>，仍然可以用 <code>defineProperty</code> 改它的值。<code>enumerable: false</code> 时，它不会出现在 <code>Object.keys</code>、<code>for...in</code> 和 <code>JSON.stringify</code> 里。</p>
<p><code>configurable: false</code> 的限制最多：不能删除，不能改成访问器属性，<code>enumerable</code> 也改不回来了。不过如果它还可写，仍然可以修改 <code>value</code>，或者把 <code>writable</code> 从 <code>true</code> 改成 <code>false</code>，反过来改回 <code>true</code> 就不行了。</p>
<h2>三种对象级限制怎么选</h2>
<table><thead><tr><th>方法</th><th>新增</th><th>删除</th><th>修改值</th><th>检查</th></tr></thead><tbody><tr><td><code>Object.preventExtensions</code></td><td>否</td><td>是</td><td>是</td><td><code>Object.isExtensible</code></td></tr><tr><td><code>Object.seal</code></td><td>否</td><td>否</td><td>是</td><td><code>Object.isSealed</code></td></tr><tr><td><code>Object.freeze</code></td><td>否</td><td>否</td><td>否</td><td><code>Object.isFrozen</code></td></tr></tbody></table>
<p>冻结也有管不到的地方。访问器属性被冻结后，setter 还是能调用，它改的是闭包里或者别处的状态，不是这个属性本身。<code>Map</code>、<code>Set</code>、<code>Date</code> 的数据也不存在属性里，而是存在引擎内部的槽里，所以 <code>Object.freeze(map)</code> 以后，<code>map.set()</code> 照样生效。</p>
<h2>各种“只读”分别管什么</h2>
<table><thead><tr><th>机制</th><th>作用对象</th><th>时机</th></tr></thead><tbody><tr><td><code>const</code></td><td>变量绑定</td><td>运行时</td></tr><tr><td><code>writable: false</code></td><td>单个属性</td><td>运行时</td></tr><tr><td><code>Object.freeze</code></td><td>对象的一层属性</td><td>运行时</td></tr><tr><td>TS <code>readonly</code> / <code>Readonly&lt;T&gt;</code></td><td>类型</td><td>仅编译期</td></tr></tbody></table>
<p><code>const</code> 管的是变量这个名字不能重新指向别的值，对象里面怎么改它不管。TypeScript 的 <code>readonly</code> 编译成 JavaScript 以后就没了，运行时完全不起作用。</p>
<h2>常见追问</h2>
<p><strong>冻结对象对性能有影响吗？</strong></p>
<blockquote>
<p>在现代引擎上，冻结本身的开销很小。但深冻结一个很大的对象图要把每一层都遍历一遍，这一步会有开销。</p>
</blockquote>
<p><strong>React 的状态需要冻结吗？</strong></p>
<blockquote>
<p>不需要，约定好不直接修改就行。开发阶段可以用 Immer 这类会自动冻结的库，误改时能马上发现。</p>
</blockquote>`};export{e as default};