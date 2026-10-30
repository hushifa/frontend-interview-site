var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写一个工具函数，参数可能是字符串、数组、日期或者 <code>null</code>，要分别处理。只用 <code>typeof</code> 会发现数组、日期和 <code>null</code> 都返回 <code>&quot;object&quot;</code>，分不出来，所以实际判断类型要几种方法配合。</p>
<p><code>typeof</code> 适合判断原始类型和函数，<code>typeof null</code> 返回 <code>&quot;object&quot;</code> 是语言早期遗留下来的问题。<code>instanceof</code> 检查构造函数的 <code>prototype</code> 在不在对象的原型链上，适合判断自定义类的实例，但对原始值总是 <code>false</code>，跨 iframe 时也会失效，因为每个 iframe 有自己的一套 <code>Array</code>、<code>Object</code>。</p>
<p><code>Object.prototype.toString.call(value)</code> 返回 <code>&quot;[object Array]&quot;</code>、<code>&quot;[object Null]&quot;</code> 这样的字符串，能区分大部分内置类型，常用来写通用的 <code>getType</code>。它的局限是自定义类的实例都返回 <code>&quot;[object Object]&quot;</code>，而且对象可以通过 <code>Symbol.toStringTag</code> 改写结果。</p>
<p>所以实践中按场景选：原始类型用 <code>typeof</code> 加 <code>=== null</code>，数组用 <code>Array.isArray</code>，自定义类用 <code>instanceof</code>，内置对象用 <code>toString</code>。</p>
</blockquote>
<h2>三种方法各自的结果</h2>
<p>下面把容易出错的情况放在一起，重点看每种方法在哪里给出“意外”的答案。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> <span class="hljs-literal">null</span>); <span class="hljs-comment">// object</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> []); <span class="hljs-comment">// object</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> <span class="hljs-title class_">NaN</span>); <span class="hljs-comment">// number</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> <span class="hljs-keyword">function</span> (<span class="hljs-params"></span>) {}); <span class="hljs-comment">// function</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">typeof</span> undeclaredVariable); <span class="hljs-comment">// undefined</span>

<span class="hljs-keyword">const</span> bare = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">create</span>(<span class="hljs-literal">null</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(bare <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Object</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Number</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Number</span>(<span class="hljs-number">1</span>) <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Number</span>); <span class="hljs-comment">// true</span>

<span class="hljs-keyword">function</span> <span class="hljs-title function_">getType</span>(<span class="hljs-params">value</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">toString</span>.<span class="hljs-title function_">call</span>(value).<span class="hljs-title function_">slice</span>(<span class="hljs-number">8</span>, -<span class="hljs-number">1</span>);
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getType</span>(<span class="hljs-literal">null</span>)); <span class="hljs-comment">// Null</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getType</span>([])); <span class="hljs-comment">// Array</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getType</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>())); <span class="hljs-comment">// Date</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getType</span>(<span class="hljs-regexp">/a/</span>)); <span class="hljs-comment">// RegExp</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getType</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>())); <span class="hljs-comment">// Map</span>

<span class="hljs-keyword">class</span> <span class="hljs-title class_">Point</span> {}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getType</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Point</span>())); <span class="hljs-comment">// Object</span>
<span class="hljs-keyword">const</span> fake = { [<span class="hljs-title class_">Symbol</span>.<span class="hljs-property">toStringTag</span>]: <span class="hljs-string">&#x27;Array&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">getType</span>(fake)); <span class="hljs-comment">// Array</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(fake)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>为什么 <code>typeof null</code> 是 <code>&quot;object&quot;</code>？MDN 的解释是，JavaScript 最早的实现里，值由类型标签和值组成，对象的类型标签是 0，而 <code>null</code> 用空指针表示，标签也是 0，于是被当成了对象。这个结果一直保留到现在，所以判断 <code>null</code> 要直接写 <code>value === null</code>。</p>
<p><code>typeof</code> 对没声明过的变量返回 <code>&quot;undefined&quot;</code>，不会报错，这是它的一个方便之处。可是 MDN 也提醒，用 <code>let</code>、<code>const</code>、<code>class</code> 声明的变量在声明之前用 <code>typeof</code> 访问，会因为暂时性死区抛出 <code>ReferenceError</code>。另外函数（包括 class）返回 <code>&quot;function&quot;</code>，<code>NaN</code> 虽然叫“不是数字”，类型仍然是 <code>&quot;number&quot;</code>。</p>
<p><code>instanceof</code> 的规则是看构造函数的 <code>prototype</code> 是否出现在对象的原型链上。<code>Object.create(null)</code> 创建的对象没有原型，链上找不到 <code>Object.prototype</code>，所以是 <code>false</code>。原始值 <code>1</code> 不是对象，没有原型链，结果也是 <code>false</code>，只有用 <code>new Number(1)</code> 包装出来的对象才是 <code>true</code>。</p>
<p><code>getType</code> 里的 <code>slice(8, -1)</code> 去掉的是前面的 <code>&quot;[object &quot;</code> 和最后的 <code>&quot;]&quot;</code>。它能认出 <code>Null</code>、<code>Array</code>、<code>Date</code> 等，但自定义的 <code>Point</code> 返回 <code>Object</code>。更大的问题在最后两行：MDN 说对象可以定义 <code>Symbol.toStringTag</code> 来改变 <code>toString</code> 的结果，所以一个普通对象就能伪装成 <code>Array</code>，而 <code>Array.isArray</code> 不受影响。</p>
<h2>跨 realm 时 instanceof 为什么失效</h2>
<p>MDN 把每个窗口、iframe 称为一个 realm，每个 realm 有自己的全局对象和内置构造函数。iframe 里创建的数组，原型是那个 iframe 的 <code>Array.prototype</code>，和当前页面的 <code>Array.prototype</code> 不是同一个对象。下面用 Node 的 <code>vm</code> 模块创建一个新的上下文来模拟。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> vm = <span class="hljs-built_in">require</span>(<span class="hljs-string">&#x27;node:vm&#x27;</span>);
<span class="hljs-keyword">const</span> otherArray = vm.<span class="hljs-title function_">runInNewContext</span>(<span class="hljs-string">&#x27;[1, 2]&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(otherArray <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Array</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(otherArray)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-property"><span class="hljs-keyword">prototype</span></span>.<span class="hljs-property">toString</span>.<span class="hljs-title function_">call</span>(otherArray)); <span class="hljs-comment">// [object Array]</span>
</code></pre></div>
<p><code>instanceof Array</code> 返回 <code>false</code>，因为这个数组原型链上的是另一个上下文的 <code>Array.prototype</code>。MDN 推荐判断数组时优先用 <code>Array.isArray()</code>，正是因为它能跨 realm 工作。<code>toString</code> 也能认出来，因为 ECMAScript 规范里它判断 <code>Array</code> 用的是和 <code>Array.isArray</code> 相同的 IsArray 检查，不看原型链。</p>
<h2>常见追问</h2>
<p><strong>instanceof 的结果能被改变吗？</strong></p>
<blockquote>
<p>能。构造函数如果定义了静态方法 <code>Symbol.hasInstance</code>，<code>instanceof</code> 会优先调用它。另外修改对象的原型，或者修改构造函数的 <code>prototype</code> 属性，也会改变结果。所以 <code>instanceof</code> 判断的是原型关系，不是“对象由谁创建”。</p>
</blockquote>
<p><strong>怎样判断一个值是不是普通对象？</strong></p>
<blockquote>
<p>先排除 <code>null</code> 和非对象，再看原型：<code>Object.getPrototypeOf(value)</code> 是 <code>Object.prototype</code> 或 <code>null</code> 时，可以认为是普通对象。不同库对“普通对象”的定义不完全一样，跨 realm 的对象原型也不是当前的 <code>Object.prototype</code>，写的时候要明确自己需要哪种定义。</p>
</blockquote>
<p><strong>typeof 和相等比较、类型转换有什么关系？</strong></p>
<blockquote>
<p><code>typeof</code> 只是读出值的类型，不会转换值。<code>===</code>、<code>Object.is</code> 的区别见<a href="/questions/js-values-equality/">《JavaScript 的值类型与相等比较应该怎样理解？》</a>，<code>==</code> 的转换规则见<a href="/questions/js-coercion/">《隐式类型转换有哪些容易踩坑的规则？》</a>。</p>
</blockquote>`};export{e as default};