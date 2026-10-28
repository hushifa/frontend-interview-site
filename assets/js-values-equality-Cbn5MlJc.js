var e={answerHtml:`<h2>简答</h2>
<ul>
<li>原始类型有 7 种：<code>undefined</code>、<code>null</code>、<code>boolean</code>、<code>number</code>、<code>bigint</code>、<code>string</code>、<code>symbol</code>，其余都是对象。</li>
<li>原始值按值比较；对象按身份比较，两个属性相同的对象也不相等。</li>
<li><code>===</code> 不转换类型，但 <code>NaN !== NaN</code>，<code>+0 === -0</code>。</li>
<li><code>Object.is</code> 认为 <code>NaN</code> 等于自身，并区分 <code>+0</code> 和 <code>-0</code>。</li>
<li><code>Map</code>、<code>Set</code>、<code>includes</code> 用 SameValueZero：<code>NaN</code> 等于自身，<code>+0</code> 等于 <code>-0</code>。</li>
</ul>
<h2>四种比较规则</h2>
<table><thead><tr><th>比较</th><th><code>==</code></th><th><code>===</code></th><th><code>Object.is</code></th><th>SameValueZero</th></tr></thead><tbody><tr><td><code>1</code> 与 <code>&#x27;1&#x27;</code></td><td>true</td><td>false</td><td>false</td><td>false</td></tr><tr><td><code>NaN</code> 与 <code>NaN</code></td><td>false</td><td>false</td><td>true</td><td>true</td></tr><tr><td><code>+0</code> 与 <code>-0</code></td><td>true</td><td>true</td><td>false</td><td>true</td></tr><tr><td><code>null</code> 与 <code>undefined</code></td><td>true</td><td>false</td><td>false</td><td>false</td></tr><tr><td>两个 <code>{}</code></td><td>false</td><td>false</td><td>false</td><td>false</td></tr></tbody></table>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">NaN</span> === <span class="hljs-title class_">NaN</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(+<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>, +<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>]).<span class="hljs-property">size</span>); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>判断 NaN 用 <code>Number.isNaN</code>。全局 <code>isNaN</code> 会先转数字，<code>isNaN(&#x27;abc&#x27;)</code> 也是 <code>true</code>。</p>
<h2>对象比较身份</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> first = { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> };
<span class="hljs-keyword">const</span> second = { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> };
<span class="hljs-keyword">const</span> alias = first;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first === second); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first === alias);  <span class="hljs-comment">// true</span>
alias.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">count</span>);      <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>所以 <code>new Set([{ id: 1 }, { id: 1 }])</code> 有两项。按业务 ID 去重时应提取 ID 作为键。</p>
<p>函数参数是按值传递的，只是对象的&quot;值&quot;是引用。函数内修改参数对象的属性，调用方能看到；函数内给参数重新赋值，调用方的变量不变。</p>
<h2>宽松相等</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> == <span class="hljs-string">&#x27;&#x27;</span>);       <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-literal">false</span> == <span class="hljs-string">&#x27;0&#x27;</span>);  <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([] == <span class="hljs-literal">false</span>);  <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([] == []);     <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>==</code> 把布尔值转成数字，字符串和数字比较时把字符串转成数字，对象和原始值比较时先把对象转成原始值。<code>[] == false</code> 是 <code>&#x27;&#x27; == 0</code>，结果为 true，但 <code>Boolean([])</code> 是 true。两个对象比较时只看身份。</p>
<p>日常用 <code>===</code>。<code>value == null</code> 同时匹配 <code>null</code> 和 <code>undefined</code>，是唯一常见的有意使用。</p>
<h2>typeof 的特例</h2>
<ul>
<li><code>typeof null === &#x27;object&#x27;</code> 是历史遗留。</li>
<li>函数返回 <code>&#x27;function&#x27;</code>，数组返回 <code>&#x27;object&#x27;</code>，判断数组用 <code>Array.isArray</code>。</li>
<li><code>new Boolean(false)</code> 是对象，在条件判断中为真。</li>
</ul>
<h2>深度相等</h2>
<p>语言没有内置深度比较。实现时要决定：数组顺序是否重要、<code>Date</code> 比时间值、<code>Map</code> 和 <code>Set</code> 如何比、循环引用、原型是否参与。<code>JSON.stringify</code> 比较会受属性顺序影响，并丢失 <code>undefined</code>、函数等值。有稳定 ID 的业务数据直接比 ID。</p>
<h2>常见追问</h2>
<ul>
<li>&quot;原始值在栈上、对象在堆上&quot;对吗？这是引擎实现细节，语言规范只规定可观察的语义。</li>
<li>原始值不可变是什么意思？<code>str[0] = &#x27;x&#x27;</code> 不会改变字符串；给变量赋新字符串是换绑定的值。</li>
</ul>`};export{e as default};