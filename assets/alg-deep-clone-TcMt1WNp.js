var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>深拷贝就是把对象里每一层都复制一份，改副本不会影响原对象。手写的思路是递归：原始值和函数直接返回，对象就新建一个，再把每个属性递归复制过去。</p>
<p>难点是循环引用，比如 <code>obj.self = obj</code>，直接递归会无限循环。解决办法是用一个 <code>WeakMap</code> 记下“这个对象已经复制过了，副本是谁”，再碰到就直接返回副本。而且副本要在递归子属性之前就登记进去，不然子属性指回自己时还是会死循环。</p>
<p>还有几类要特别处理。<code>Date</code>、<code>RegExp</code>、<code>Map</code>、<code>Set</code> 的数据不在普通属性上，要按类型新建，<code>Map</code> 的键和值都要递归复制。<code>Object.keys</code> 和 <code>for...in</code> 拿不到 Symbol 键，要用 <code>Reflect.ownKeys</code>。用 <code>Object.create(原型)</code> 创建副本，类实例的方法就能保留下来。</p>
<p><code>structuredClone</code> 是浏览器和 Node 自带的深拷贝，能处理循环引用、Date、Map、Set 这些。但它不复制 Symbol 键，类实例会变成普通对象，碰到函数或 DOM 节点会抛出 <code>DataCloneError</code>。</p>
</blockquote>
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
<p>第一行就把原始值和函数挡在外面了。<code>typeof</code> 函数得到的是 <code>&#x27;function&#x27;</code>，不是 <code>&#x27;object&#x27;</code>，所以函数会被原样返回，副本和原对象共用同一个函数。</p>
<p>为什么 <code>seen.set</code> 要写在循环之前？以 <code>source.self = source</code> 为例。复制 <code>source</code> 时，先建好空的 <code>copy</code> 并登记；接着复制 <code>self</code> 属性，又碰到 <code>source</code>，这时 <code>seen</code> 里已经有它了，直接返回 <code>copy</code>。如果登记写在循环之后，复制 <code>self</code> 时 <code>seen</code> 里还没有，就会再从头复制一遍，永远停不下来。</p>
<p><code>Map</code> 和 <code>Set</code> 分支里也是先登记再递归，道理一样。</p>
<p>为什么用 <code>WeakMap</code> 而不是 <code>Map</code>？这个表只在这次拷贝期间用，键都是对象。<code>WeakMap</code> 不会阻止这些对象被垃圾回收。</p>
<h2>验证一下</h2>
<p>下面这个对象里，日期、Map、Set、Symbol 键、嵌套数组、循环引用都有：</p>
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
<p><code>copy.self === copy</code> 说明循环引用被正确还原了：副本的 <code>self</code> 指向副本自己，而不是原对象。Map 里的值也是新对象，Symbol 键也拷过来了。</p>
<p><code>structuredClone</code> 也正确处理了循环引用，可是 <code>native[id]</code> 是 <code>undefined</code>，Symbol 键被丢掉了。</p>
<h2>和 structuredClone 的区别</h2>
<table><thead><tr><th>情况</th><th>deepClone（上面实现）</th><th>structuredClone</th></tr></thead><tbody><tr><td>循环引用</td><td>支持</td><td>支持</td></tr><tr><td>Date、RegExp、Map、Set</td><td>支持</td><td>支持</td></tr><tr><td>Symbol 键</td><td>复制</td><td>丢弃</td></tr><tr><td>类实例的原型</td><td>保留</td><td>变成普通对象</td></tr><tr><td>函数</td><td>共享原函数</td><td>抛出 <code>DataCloneError</code></td></tr><tr><td>ArrayBuffer、TypedArray、Blob 等</td><td>未处理</td><td>支持</td></tr></tbody></table>
<p>可以看出两者各有长短。实际项目里，复制纯数据优先用 <code>structuredClone</code>。它和 JSON 方案、浅拷贝怎么选，见<a href="/questions/js-copy-structured-clone/">《浅拷贝、深拷贝和 structuredClone 如何选择？》</a>。</p>
<h2>常见追问</h2>
<p><strong>为什么函数不复制？</strong></p>
<blockquote>
<p>函数可能用到闭包里的变量，这些变量没办法可靠地复制出来，所以一般直接共用原函数。</p>
</blockquote>
<p><strong>getter 和不可枚举属性怎么办？</strong></p>
<blockquote>
<p>上面的实现会读取 getter 当前的值，存成普通属性，并跳过不可枚举的属性。如果要完整保留属性描述符，可以改用 <code>Object.defineProperty</code>，把复制后的描述符写进去。</p>
</blockquote>
<p><strong>数据很深的时候会不会栈溢出？</strong></p>
<blockquote>
<p>会有这个风险。递归受调用栈深度的限制，特别深的结构可以改成用一个数组当栈，自己循环处理。</p>
</blockquote>`};export{e as default};