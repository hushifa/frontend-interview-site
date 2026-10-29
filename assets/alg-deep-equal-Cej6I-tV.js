var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>表单提交前想判断用户有没有改过数据，直接 <code>oldData === newData</code> 不行，两个内容一样的对象引用不同，结果总是 <code>false</code>。这时需要深比较：一层层往下比，所有值都相同才算相等。</p>
<p>写法是递归。原始值用 <code>===</code> 比较；两边都是对象时，先看原型是否相同，排除数组和普通对象混比，再比较自有可枚举键的数量，最后逐个键递归比较值。<code>Date</code> 要比时间戳，<code>RegExp</code> 要比 <code>source</code> 和 <code>flags</code>，它们的数据不在可枚举属性里。</p>
<p>有几处要明确取舍。<code>NaN === NaN</code> 是 <code>false</code>，但深比较一般希望两个 <code>NaN</code> 相等；<code>+0 === -0</code> 是 <code>true</code>，<code>Object.is</code> 却把它们区分开，按业务选一种并写清楚。键数要比较，否则 <code>{ a: 1 }</code> 和 <code>{ a: 1, b: undefined }</code> 会被误判相等。</p>
<p>还要处理循环引用。对象的属性指回自己时，递归会无限进行，所以用 <code>WeakMap</code> 记下正在比较的对象对，再次遇到同一对就直接返回 <code>true</code>。</p>
</blockquote>
<h2>实现与测试</h2>
<p>下面的实现按“原始值 → 原型 → 特殊对象 → 循环引用 → 键”的顺序判断，重点看每一步排除了哪类情况。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">isEqual</span>(<span class="hljs-params">a, b, seen = <span class="hljs-keyword">new</span> <span class="hljs-built_in">WeakMap</span>()</span>) {
  <span class="hljs-comment">// NaN 和自己相等；+0 和 -0 也当作相等，和 === 保持一致</span>
  <span class="hljs-keyword">if</span> (a === b || (<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isNaN</span>(a) &amp;&amp; <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isNaN</span>(b))) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> a !== <span class="hljs-string">&#x27;object&#x27;</span> || <span class="hljs-keyword">typeof</span> b !== <span class="hljs-string">&#x27;object&#x27;</span> || a === <span class="hljs-literal">null</span> || b === <span class="hljs-literal">null</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
  <span class="hljs-keyword">if</span> (<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(a) !== <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">getPrototypeOf</span>(b)) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">if</span> (a <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Date</span>) <span class="hljs-keyword">return</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(a.<span class="hljs-title function_">getTime</span>(), b.<span class="hljs-title function_">getTime</span>());
  <span class="hljs-keyword">if</span> (a <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">RegExp</span>) <span class="hljs-keyword">return</span> a.<span class="hljs-property">source</span> === b.<span class="hljs-property">source</span> &amp;&amp; a.<span class="hljs-property">flags</span> === b.<span class="hljs-property">flags</span>;

  <span class="hljs-comment">// 已经在比较这一对，说明遇到了循环引用，先假定相等，结论由其他字段决定</span>
  <span class="hljs-keyword">if</span> (seen.<span class="hljs-title function_">get</span>(a) === b) <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  seen.<span class="hljs-title function_">set</span>(a, b);

  <span class="hljs-keyword">const</span> keysA = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(a);
  <span class="hljs-keyword">const</span> keysB = <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">keys</span>(b);
  <span class="hljs-keyword">if</span> (keysA.<span class="hljs-property">length</span> !== keysB.<span class="hljs-property">length</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> key <span class="hljs-keyword">of</span> keysA) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">hasOwn</span>(b, key) || !<span class="hljs-title function_">isEqual</span>(a[key], b[key], seen)) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
  <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>({ <span class="hljs-attr">a</span>: [<span class="hljs-number">1</span>, { <span class="hljs-attr">b</span>: <span class="hljs-number">2</span> }] }, { <span class="hljs-attr">a</span>: [<span class="hljs-number">1</span>, { <span class="hljs-attr">b</span>: <span class="hljs-number">2</span> }] })); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>(<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>(<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>({ <span class="hljs-attr">a</span>: <span class="hljs-number">1</span> }, { <span class="hljs-attr">a</span>: <span class="hljs-number">1</span>, <span class="hljs-attr">b</span>: <span class="hljs-literal">undefined</span> })); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>], { <span class="hljs-number">0</span>: <span class="hljs-number">1</span>, <span class="hljs-number">1</span>: <span class="hljs-number">2</span> })); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>), <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>))); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>(<span class="hljs-regexp">/a/g</span>, <span class="hljs-regexp">/a/i</span>)); <span class="hljs-comment">// false</span>

<span class="hljs-keyword">const</span> x = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;x&#x27;</span> };
x.<span class="hljs-property">self</span> = x;
<span class="hljs-keyword">const</span> y = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;x&#x27;</span> };
y.<span class="hljs-property">self</span> = y;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">isEqual</span>(x, y)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>为什么 <code>{ a: 1 }</code> 和 <code>{ a: 1, b: undefined }</code> 不相等？如果只遍历 <code>a</code> 的键，<code>b</code> 多出来的 <code>b</code> 属性根本不会被检查；就算遍历 <code>b</code> 的键，<code>a.b</code> 读出来也是 <code>undefined</code>，会被误判相等。所以先比较键的数量，再用 <code>Object.hasOwn</code> 确认键真的存在。</p>
<p>为什么 <code>[1, 2]</code> 和 <code>{ 0: 1, 1: 2 }</code> 不相等？它们的键和值完全一样，<code>Object.keys</code> 都是 <code>[&#x27;0&#x27;, &#x27;1&#x27;]</code>，区别只在原型：一个是 <code>Array.prototype</code>，一个是 <code>Object.prototype</code>。比较原型这一步顺便保证了后面 <code>a instanceof Date</code> 成立时 <code>b</code> 也是 <code>Date</code>。</p>
<p>为什么 <code>Date</code> 和 <code>RegExp</code> 要单独处理？<code>Object.keys(new Date(0))</code> 是空数组，时间值存在对象内部，不是可枚举属性，不单独处理的话任意两个日期都会被判为相等。<code>Date</code> 用 <code>getTime()</code> 取时间戳，用 <code>Object.is</code> 比较是为了让两个无效日期（时间戳都是 <code>NaN</code>）也算相等。<code>RegExp</code> 的 <code>flags</code> 返回所有标志组成的字符串，和 <code>source</code> 一起就能确定一个正则。</p>
<h2>NaN 和 +0、-0 怎样取舍</h2>
<p>先看三种比较方式在这两个值上的差别。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">NaN</span> === <span class="hljs-title class_">NaN</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> === -<span class="hljs-number">0</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>) === <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>(<span class="hljs-number">0</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>MDN 说 <code>Object.is</code> 和 <code>===</code> 的唯一区别，就在于对 <code>NaN</code> 和正负零的处理。深比较关心“内容是否一样”，两个 <code>NaN</code> 通常应该相等，所以实现里单独判断了 <code>Number.isNaN</code>。至于 <code>+0</code> 和 <code>-0</code>，大部分业务数据里它们没有区别，上面的实现跟随 <code>===</code> 当作相等。如果需要区分（比如数值计算里关心符号），把第一行改成 <code>Object.is(a, b)</code> 即可，<code>NaN</code> 也会一起被当作相等。</p>
<h2>循环引用怎样处理</h2>
<p><code>x.self</code> 指向 <code>x</code> 自己。不做处理的话，比较 <code>x.self</code> 和 <code>y.self</code> 又回到比较 <code>x</code> 和 <code>y</code>，递归停不下来，最后栈溢出。</p>
<p><code>seen</code> 记录“<code>a</code> 正在和哪个 <code>b</code> 比较”。第二次遇到 <code>x</code> 和 <code>y</code> 这一对时直接返回 <code>true</code>，意思是“这一对是否相等，由外层还在进行的比较决定”。外层会继续比较 <code>name</code> 等其他字段，任何一个不同都会返回 <code>false</code>。用 <code>WeakMap</code> 是因为键是对象，比较结束后不会阻止这些对象被回收。</p>
<h2>常见追问</h2>
<p><strong>为什么不用 JSON.stringify 比较？</strong></p>
<blockquote>
<p><code>JSON.stringify</code> 结果依赖键的顺序，<code>{ a: 1, b: 2 }</code> 和 <code>{ b: 2, a: 1 }</code> 会被判为不同；它还会丢掉 <code>undefined</code> 和函数，把 <code>NaN</code> 变成 <code>null</code>，遇到循环引用直接抛错。只在数据结构简单、顺序固定时才能凑合用。</p>
</blockquote>
<p><strong>Map、Set 和 Symbol 键要怎样处理？</strong></p>
<blockquote>
<p>上面的实现没有覆盖它们。<code>Map</code> 要比较 <code>size</code>，再逐个键取值递归比较；<code>Set</code> 的元素如果是对象，需要两两匹配，成本更高。<code>Object.keys</code> 不包含 Symbol 键，需要的话改用 <code>Reflect.ownKeys</code>。面试时说明这些边界，并说出怎样扩展就可以。</p>
</blockquote>
<p><strong>深比较和深拷贝的实现有什么共同点？</strong></p>
<blockquote>
<p>都要递归遍历、按类型分支、用 <code>WeakMap</code> 处理循环引用。深拷贝的写法可以看<a href="/questions/alg-deep-clone/">《怎样手写深拷贝？和 structuredClone 有什么区别？》</a>。</p>
</blockquote>`};export{e as default};