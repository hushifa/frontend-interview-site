var e={answerHtml:`<h2>简答</h2>
<ul>
<li>数据属性有 <code>value</code>、<code>writable</code>、<code>enumerable</code>、<code>configurable</code>；访问器属性用 <code>get</code>、<code>set</code> 代替前两个。</li>
<li><code>Object.defineProperty</code> 未写明的特性默认为 <code>false</code>；普通赋值创建的属性三个特性都是 <code>true</code>。</li>
<li><code>preventExtensions</code> 禁止新增属性，<code>seal</code> 再禁止删除和重新配置，<code>freeze</code> 再把数据属性设为不可写。</li>
<li><code>freeze</code> 是浅冻结，嵌套对象仍可修改；严格模式下写入被冻结的属性抛 <code>TypeError</code>，非严格模式静默失败。</li>
<li><code>const</code> 只禁止重新赋值绑定，TypeScript 的 <code>readonly</code> 只在编译期检查，运行时都不冻结对象。</li>
</ul>
<h2>浅冻结</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> item = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">freeze</span>({ <span class="hljs-attr">nested</span>: { <span class="hljs-attr">count</span>: <span class="hljs-number">0</span> } });
item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span> += <span class="hljs-number">1</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(item.<span class="hljs-property">nested</span>.<span class="hljs-property">count</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p><code>item.nested</code> 这个属性不能改指向，但它指向的对象没被冻结。需要深冻结时递归调用 <code>Object.freeze</code>，并注意跳过已冻结对象以处理循环引用。</p>
<h2>描述符</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> config = {};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(config, <span class="hljs-string">&#x27;version&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">1</span> });

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getOwnPropertyDescriptor</span>(config, <span class="hljs-string">&#x27;version&#x27;</span>));
<span class="hljs-comment">// { value: 1, writable: false, enumerable: false, configurable: false }</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(config)); <span class="hljs-comment">// []</span>
</code></pre></div>
<ul>
<li><code>writable: false</code>：不能赋值，但若 <code>configurable: true</code> 仍可用 <code>defineProperty</code> 改值。</li>
<li><code>enumerable: false</code>：不出现在 <code>Object.keys</code>、<code>for...in</code>、<code>JSON.stringify</code> 中。</li>
<li><code>configurable: false</code>：不能删除，不能改成访问器，也不能把 <code>enumerable</code> 改回来；仍可写时可以修改 <code>value</code>，或把 <code>writable</code> 从 <code>true</code> 改为 <code>false</code>，反向不行。</li>
</ul>
<h2>三种对象级限制</h2>
<table><thead><tr><th>方法</th><th>新增</th><th>删除</th><th>修改值</th><th>检查</th></tr></thead><tbody><tr><td><code>Object.preventExtensions</code></td><td>否</td><td>是</td><td>是</td><td><code>Object.isExtensible</code></td></tr><tr><td><code>Object.seal</code></td><td>否</td><td>否</td><td>是</td><td><code>Object.isSealed</code></td></tr><tr><td><code>Object.freeze</code></td><td>否</td><td>否</td><td>否</td><td><code>Object.isFrozen</code></td></tr></tbody></table>
<p>访问器属性被冻结后 setter 仍可调用，setter 改的是闭包或别处的状态。<code>Map</code>、<code>Set</code>、<code>Date</code> 的数据存在内部槽里，<code>Object.freeze(map)</code> 后 <code>map.set()</code> 照样生效。</p>
<h2>各层次的&quot;只读&quot;</h2>
<table><thead><tr><th>机制</th><th>作用对象</th><th>时机</th></tr></thead><tbody><tr><td><code>const</code></td><td>变量绑定</td><td>运行时</td></tr><tr><td><code>writable: false</code></td><td>单个属性</td><td>运行时</td></tr><tr><td><code>Object.freeze</code></td><td>对象的一层属性</td><td>运行时</td></tr><tr><td>TS <code>readonly</code> / <code>Readonly&lt;T&gt;</code></td><td>类型</td><td>仅编译期</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>冻结对象对性能有影响吗？现代引擎上冻结本身开销很小，但深冻结大对象图需要遍历。</li>
<li>React 状态需要冻结吗？不需要，约定不直接修改即可；开发阶段可以用 Immer 等库自动冻结来发现误改。</li>
</ul>`};export{e as default};