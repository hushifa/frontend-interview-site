var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>JavaScript 的原始类型有 7 种：<code>undefined</code>、<code>null</code>、<code>boolean</code>、<code>number</code>、<code>bigint</code>、<code>string</code>、<code>symbol</code>，除此之外都是对象。</p>
<p>原始值比较的是值本身，对象比较的是身份，也就是是不是同一个对象。两个属性完全一样的对象，只要不是同一个，就不相等。</p>
<p>不转换类型的比较有三种，区别只在两个特殊值上。<code>===</code> 认为 <code>NaN</code> 不等于自己，<code>+0</code> 等于 <code>-0</code>。<code>Object.is</code> 正好相反，<code>NaN</code> 等于自己，<code>+0</code> 和 <code>-0</code> 不相等。<code>Map</code>、<code>Set</code>、<code>includes</code> 用的是 SameValueZero，<code>NaN</code> 等于自己，<code>+0</code> 也等于 <code>-0</code>。</p>
<p><code>==</code> 会先转换类型再比较，转换规则见<a href="/questions/js-coercion/">《隐式类型转换有哪些容易踩坑的规则？》</a>，日常都用 <code>===</code>。语言也没有内置任何一种深度比较。</p>
</blockquote>
<h2>四种比较规则差在哪</h2>
<table><thead><tr><th>比较</th><th><code>==</code></th><th><code>===</code></th><th><code>Object.is</code></th><th>SameValueZero</th></tr></thead><tbody><tr><td><code>1</code> 与 <code>&#x27;1&#x27;</code></td><td>true</td><td>false</td><td>false</td><td>false</td></tr><tr><td><code>NaN</code> 与 <code>NaN</code></td><td>false</td><td>false</td><td>true</td><td>true</td></tr><tr><td><code>+0</code> 与 <code>-0</code></td><td>true</td><td>true</td><td>false</td><td>true</td></tr><tr><td><code>null</code> 与 <code>undefined</code></td><td>true</td><td>false</td><td>false</td><td>false</td></tr><tr><td>两个 <code>{}</code></td><td>false</td><td>false</td><td>false</td><td>false</td></tr></tbody></table>
<p>下面用代码确认表里关于 <code>NaN</code> 和正负零的几格：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">NaN</span> === <span class="hljs-title class_">NaN</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(+<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>, +<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>]).<span class="hljs-property">size</span>); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p><code>NaN === NaN</code> 是 <code>false</code>，这是浮点数标准规定的。<code>Set</code> 里放了四个值，最后只剩 2 个，因为 SameValueZero 认为两个 <code>NaN</code> 相同，<code>+0</code> 和 <code>-0</code> 也相同。</p>
<p>所以判断一个值是不是 <code>NaN</code>，不能用 <code>===</code>，要用 <code>Number.isNaN</code>。全局的 <code>isNaN</code> 也不可靠，它会先把参数转成数字，<code>isNaN(&#x27;abc&#x27;)</code> 也是 <code>true</code>。</p>
<h2>对象为什么按身份比较</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> first = { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> };
<span class="hljs-keyword">const</span> second = { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> };
<span class="hljs-keyword">const</span> alias = first;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first === second); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first === alias);  <span class="hljs-comment">// true</span>
alias.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">count</span>);      <span class="hljs-comment">// 2</span>
</code></pre></div>
<p><code>first</code> 和 <code>second</code> 内容一模一样，比较结果却是 <code>false</code>，因为它们是两个不同的对象。<code>alias = first</code> 没有复制对象，只是让 <code>alias</code> 也指向同一个对象，所以它们相等，通过 <code>alias</code> 改了属性，<code>first</code> 也能看到。</p>
<p>这也解释了为什么 <code>new Set([{ id: 1 }, { id: 1 }])</code> 有两项。想按业务 ID 去重，就把 ID 取出来作为键。</p>
<p>函数传参也是这个道理。参数是按值传递的，只是对象的“值”就是对它的引用。所以函数里改参数对象的属性，调用方能看到；函数里给参数重新赋值，只是让参数指向了别的东西，调用方的变量不变。</p>
<h2>表里 == 的结果从哪来</h2>
<p>表里 <code>==</code> 那一列的结果来自类型转换，比如 <code>1 == &#x27;1&#x27;</code> 是因为字符串先转成了数字，具体规则见<a href="/questions/js-coercion/">《隐式类型转换有哪些容易踩坑的规则？》</a>。判断一个值属于哪种类型、<code>typeof null</code> 为什么是 <code>&#x27;object&#x27;</code>，见<a href="/questions/js-type-checking/">《怎样准确判断一个值的类型？typeof、instanceof 和 Object.prototype.toString 各有什么局限？》</a>。</p>
<h2>怎样判断两个对象内容相同</h2>
<p>语言没有内置深度比较，要自己写或者用库。写之前要想清楚很多规则：数组顺序算不算，<code>Date</code> 是不是比时间值，<code>Map</code> 和 <code>Set</code> 怎么比，碰到循环引用怎么办，原型要不要一样。</p>
<p>用 <code>JSON.stringify</code> 比较看起来简单，但属性顺序不同结果就不同，而且会丢掉 <code>undefined</code>、函数这些值。业务数据如果有稳定的 ID，直接比 ID 最可靠。</p>
<h2>常见追问</h2>
<p><strong>“原始值存在栈上、对象存在堆上”这种说法对吗？</strong></p>
<blockquote>
<p>这是引擎内部怎么实现的问题，语言规范没有这么规定，规范只规定了能观察到的行为，比如对象按身份比较。面试时可以说这是常见的实现方式，但不是语言规则。</p>
</blockquote>
<p><strong>原始值不可变是什么意思？</strong></p>
<blockquote>
<p>原始值本身不能被修改。比如写 <code>str[0] = &#x27;x&#x27;</code>，字符串不会变。给变量赋一个新字符串，是让变量换了一个值，原来的字符串并没有被改。</p>
</blockquote>`};export{e as default};