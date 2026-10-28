var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>new Proxy(target, handler)</code> 返回一个新对象，对它的属性读写、<code>in</code>、<code>delete</code>、枚举、调用都会进入 handler 中对应的陷阱。</li>
<li><code>Reflect.get</code>、<code>Reflect.set</code> 等与陷阱一一对应，陷阱中用它们转发默认行为，并传入 <code>receiver</code>。</li>
<li>陷阱结果必须满足不变式，例如不可配置且不可写的属性，<code>get</code> 必须返回真实值，否则抛 <code>TypeError</code>。</li>
<li>代理和目标是不同对象，<code>proxy !== target</code>；直接修改目标不会经过陷阱。</li>
<li>私有字段 <code>#x</code> 和内部槽（<code>Map</code>、<code>Set</code>、<code>Date</code>）不经过陷阱，需要把方法绑定到原对象。</li>
</ul>
<h2>记录读取与校验写入</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> reads = [];
<span class="hljs-keyword">const</span> target = {
  <span class="hljs-attr">price</span>: <span class="hljs-number">10</span>,
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">total</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">price</span> * <span class="hljs-number">2</span>;
  },
};

<span class="hljs-keyword">const</span> product = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(target, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params">object, key, receiver</span>) {
    reads.<span class="hljs-title function_">push</span>(<span class="hljs-title class_">String</span>(key));
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">get</span>(object, key, receiver);
  },
  <span class="hljs-title function_">set</span>(<span class="hljs-params">object, key, value, receiver</span>) {
    <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;price&#x27;</span> &amp;&amp; (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(value) || value &lt; <span class="hljs-number">0</span>)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;价格必须是非负有限数值&#x27;</span>);
    }
    <span class="hljs-keyword">return</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">set</span>(object, key, value, receiver);
  },
});

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(product.<span class="hljs-property">total</span>); <span class="hljs-comment">// 20</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(reads.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// total,price</span>
product.<span class="hljs-property">price</span> = <span class="hljs-number">12</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(target.<span class="hljs-property">price</span>); <span class="hljs-comment">// 12</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(product === target); <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>Reflect.get(object, key, receiver)</code> 让 <code>total</code> 的 getter 以代理为 <code>this</code> 执行，所以内部读取 <code>this.price</code> 也被记录。写成 <code>return object[key]</code> 时 getter 的 <code>this</code> 是原对象，<code>price</code> 的读取不会被追踪。Vue 3 的响应式依赖这一点。</p>
<h2>常用陷阱</h2>
<table><thead><tr><th>操作</th><th>陷阱</th></tr></thead><tbody><tr><td><code>proxy.x</code></td><td><code>get</code></td></tr><tr><td><code>proxy.x = v</code></td><td><code>set</code></td></tr><tr><td><code>&#x27;x&#x27; in proxy</code></td><td><code>has</code></td></tr><tr><td><code>delete proxy.x</code></td><td><code>deleteProperty</code></td></tr><tr><td><code>Object.keys(proxy)</code>、<code>for...in</code></td><td><code>ownKeys</code> + <code>getOwnPropertyDescriptor</code></td></tr><tr><td><code>Object.defineProperty</code></td><td><code>defineProperty</code></td></tr><tr><td><code>proxy()</code>、<code>new proxy()</code></td><td><code>apply</code>、<code>construct</code>（目标必须可调用、可构造）</td></tr></tbody></table>
<p><code>set</code> 陷阱要返回 <code>true</code>，返回 <code>false</code> 在严格模式下会抛 <code>TypeError</code>。</p>
<h2>不变式</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> locked = {};
<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">defineProperty</span>(locked, <span class="hljs-string">&#x27;id&#x27;</span>, { <span class="hljs-attr">value</span>: <span class="hljs-number">7</span>, <span class="hljs-attr">writable</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">configurable</span>: <span class="hljs-literal">false</span> });

<span class="hljs-keyword">const</span> proxy = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(locked, { <span class="hljs-attr">get</span>: <span class="hljs-function">() =&gt;</span> <span class="hljs-number">8</span> });
<span class="hljs-keyword">try</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(proxy.<span class="hljs-property">id</span>);
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// TypeError</span>
}
</code></pre></div>
<p>类似规则：<code>ownKeys</code> 必须包含所有不可配置的键；目标不可扩展时，<code>ownKeys</code> 必须恰好是目标的键。</p>
<h2>内部槽</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> map = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">const</span> values = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Proxy</span>(map, {
  <span class="hljs-title function_">get</span>(<span class="hljs-params">target, key</span>) {
    <span class="hljs-keyword">const</span> value = <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">get</span>(target, key);
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">typeof</span> value === <span class="hljs-string">&#x27;function&#x27;</span> ? value.<span class="hljs-title function_">bind</span>(target) : value;
  },
});
values.<span class="hljs-title function_">set</span>(<span class="hljs-string">&#x27;a&#x27;</span>, <span class="hljs-number">1</span>); <span class="hljs-comment">// 不绑定时抛 TypeError</span>
</code></pre></div>
<p><code>Map.prototype.set</code> 要求 <code>this</code> 有 Map 的内部槽，代理没有。Vue 对集合类型使用专门的处理器。</p>
<h2>实现响应式还需要什么</h2>
<ul>
<li>嵌套对象在 <code>get</code> 时惰性包装，并用 <code>WeakMap</code> 缓存原对象到代理的映射，保证同一对象始终得到同一个代理。</li>
<li>数组的 <code>push</code> 会触发 <code>length</code> 的读写，需要避免重复触发。</li>
<li>依赖收集、批量调度、清理旧依赖都是代理之外的工作。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>Object.defineProperty</code> 实现的响应式有什么不足？只能劫持已存在的属性，新增属性、删除属性和数组索引需要额外 API，Vue 2 因此提供了 <code>Vue.set</code>。</li>
<li><code>Proxy.revocable</code> 做什么？返回 <code>{ proxy, revoke }</code>，撤销后对代理的任何操作都抛 <code>TypeError</code>，用于收回授予第三方的访问权。</li>
</ul>`};export{e as default};