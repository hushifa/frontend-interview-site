var e={answerHtml:`<h2>简答</h2>
<ul>
<li>原始值和函数直接返回；对象先查 <code>WeakMap</code>，复制过就返回已有副本，这样循环引用和共享引用都能保持原来的结构。</li>
<li>副本要在递归子属性之前写入 <code>WeakMap</code>，否则子属性指回自身时会无限递归。</li>
<li><code>Date</code>、<code>RegExp</code>、<code>Map</code>、<code>Set</code> 的数据不在普通属性上，需要按类型新建；<code>Map</code> 的键和值都要递归复制。</li>
<li><code>Object.keys</code> 和 <code>for...in</code> 拿不到 Symbol 键，要用 <code>Reflect.ownKeys</code> 再筛选可枚举属性。用 <code>Object.create(原型)</code> 创建副本可以保留类实例的方法。</li>
<li><code>structuredClone</code> 能处理循环引用、Date、Map、Set 等，但不复制 Symbol 键，类实例会变成普通对象，函数和 DOM 节点会抛出 <code>DataCloneError</code>。</li>
</ul>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">deepClone</span>(<span class="hljs-params">value, seen = <span class="hljs-keyword">new</span> <span class="hljs-built_in">WeakMap</span>()</span>) {
  <span class="hljs-keyword">if</span> (value === <span class="hljs-literal">null</span> || <span class="hljs-keyword">typeof</span> value !== <span class="hljs-string">&#x27;object&#x27;</span>) <span class="hljs-keyword">return</span> value;
  <span class="hljs-keyword">if</span> (seen.<span class="hljs-title function_">has</span>(value)) <span class="hljs-keyword">return</span> seen.<span class="hljs-title function_">get</span>(value);

  <span class="hljs-keyword">if</span> (value <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Date</span>) <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(value.<span class="hljs-title function_">getTime</span>());
  <span class="hljs-keyword">if</span> (value <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">RegExp</span>) {
    <span class="hljs-keyword">const</span> copy = <span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(value.<span class="hljs-property">source</span>, value.<span class="hljs-property">flags</span>);
    copy.<span class="hljs-property">lastIndex</span> = value.<span class="hljs-property">lastIndex</span>;
    <span class="hljs-keyword">return</span> copy;
  }
  <span class="hljs-keyword">if</span> (value <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Map</span>) {
    <span class="hljs-keyword">const</span> copy = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
    seen.<span class="hljs-title function_">set</span>(value, copy);
    value.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">v, k</span>) =&gt;</span> copy.<span class="hljs-title function_">set</span>(<span class="hljs-title function_">deepClone</span>(k, seen), <span class="hljs-title function_">deepClone</span>(v, seen)));
    <span class="hljs-keyword">return</span> copy;
  }
  <span class="hljs-keyword">if</span> (value <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Set</span>) {
    <span class="hljs-keyword">const</span> copy = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>();
    seen.<span class="hljs-title function_">set</span>(value, copy);
    value.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">v</span>) =&gt;</span> copy.<span class="hljs-title function_">add</span>(<span class="hljs-title function_">deepClone</span>(v, seen)));
    <span class="hljs-keyword">return</span> copy;
  }

  <span class="hljs-keyword">const</span> copy = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(value) ? [] : <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(value));
  <span class="hljs-comment">// 先登记再递归，子属性引用自身时能拿到这个副本</span>
  seen.<span class="hljs-title function_">set</span>(value, copy);
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> <span class="hljs-title class_">Reflect</span>.<span class="hljs-title function_">ownKeys</span>(value)) {
    <span class="hljs-keyword">const</span> descriptor = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getOwnPropertyDescriptor</span>(value, key);
    <span class="hljs-keyword">if</span> (descriptor.<span class="hljs-property">enumerable</span>) copy[key] = <span class="hljs-title function_">deepClone</span>(value[key], seen);
  }
  <span class="hljs-keyword">return</span> copy;
}
</code></pre></div>
<p>用 <code>WeakMap</code> 而不是 <code>Map</code>，是因为它只在本次拷贝期间使用，键是对象，不会阻止原对象被回收。</p>
<h2>验证</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> id = <span class="hljs-title class_">Symbol</span>(<span class="hljs-string">&#x27;id&#x27;</span>);
<span class="hljs-keyword">const</span> source = {
  <span class="hljs-attr">date</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>),
  <span class="hljs-attr">map</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>([[<span class="hljs-string">&#x27;k&#x27;</span>, { <span class="hljs-attr">n</span>: <span class="hljs-number">1</span> }]]),
  <span class="hljs-attr">set</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-number">1</span>]),
  [id]: <span class="hljs-string">&#x27;sym&#x27;</span>,
  <span class="hljs-attr">list</span>: [<span class="hljs-number">1</span>, { <span class="hljs-attr">x</span>: <span class="hljs-number">2</span> }],
};
source.<span class="hljs-property">self</span> = source;

<span class="hljs-keyword">const</span> copy = <span class="hljs-title function_">deepClone</span>(source);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">self</span> === copy); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">date</span> !== source.<span class="hljs-property">date</span> &amp;&amp; copy.<span class="hljs-property">date</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Date</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy.<span class="hljs-property">map</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;k&#x27;</span>) !== source.<span class="hljs-property">map</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;k&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(copy[id]); <span class="hljs-comment">// &#x27;sym&#x27;</span>

<span class="hljs-keyword">const</span> native = <span class="hljs-title function_">structuredClone</span>(source);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(native.<span class="hljs-property">self</span> === native); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(native[id]); <span class="hljs-comment">// undefined</span>
</code></pre></div>
<h2>structuredClone 的边界</h2>
<table><thead><tr><th>情况</th><th>deepClone（上面实现）</th><th>structuredClone</th></tr></thead><tbody><tr><td>循环引用</td><td>支持</td><td>支持</td></tr><tr><td>Date、RegExp、Map、Set</td><td>支持</td><td>支持</td></tr><tr><td>Symbol 键</td><td>复制</td><td>丢弃</td></tr><tr><td>类实例的原型</td><td>保留</td><td>变成普通对象</td></tr><tr><td>函数</td><td>共享原函数</td><td>抛出 <code>DataCloneError</code></td></tr><tr><td>ArrayBuffer、TypedArray、Blob 等</td><td>未处理</td><td>支持</td></tr></tbody></table>
<p>实际项目里复制纯数据优先用 <code>structuredClone</code>；它和 JSON 方案、浅拷贝的取舍见<a href="/questions/js-copy-structured-clone/">《浅拷贝、深拷贝和 structuredClone 如何选择？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>为什么函数不复制？函数可能引用闭包里的变量，无法可靠地复制这些变量，通常直接共享。</li>
<li>getter 和不可枚举属性怎么办？上面的实现读取 getter 的当前值并跳过不可枚举属性。需要保留完整属性描述符时，改用 <code>Object.defineProperty</code> 写入复制后的描述符。</li>
<li>数据很深时会不会栈溢出？递归实现有调用栈深度限制，极深的结构可以改用显式栈迭代。</li>
</ul>`};export{e as default};