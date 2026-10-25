var e={answerHtml:`<p>JavaScript 的原始类型有 undefined、null、boolean、number、bigint、string、symbol，其他常见数据形态如普通对象、数组和函数属于对象。比较值时，首先要判断是在比较原始值，还是两个对象的身份。</p>
<p>两个变量都指向同一个对象时，通过其中一个变量修改对象，另一个也能观察到变化；两个独立创建的对象，即便属性完全一样，也不是同一个对象。不能把“看起来一样”直接等同于语言中的相等。</p>
<h3>先区分几种相等规则</h3>
<table><thead><tr><th>对比</th><th><code>==</code></th><th><code>===</code></th><th><code>Object.is</code></th><th>SameValueZero</th></tr></thead><tbody><tr><td>数字 1 与字符串 &#x27;1&#x27;</td><td>true</td><td>false</td><td>false</td><td>false</td></tr><tr><td>NaN 与 NaN</td><td>false</td><td>false</td><td>true</td><td>true</td></tr><tr><td>+0 与 -0</td><td>true</td><td>true</td><td>false</td><td>true</td></tr><tr><td>null 与 undefined</td><td>true</td><td>false</td><td>false</td><td>false</td></tr><tr><td>两次分别创建的空对象</td><td>false</td><td>false</td><td>false</td><td>false</td></tr></tbody></table>
<p><code>===</code> 不做隐式类型转换。类型不同就不会因为看起来表示相同内容而相等；类型相同时，再遵循该类型的比较规则。因此 NaN 与自己也不严格相等，而正负零严格相等。</p>
<p><code>Object.is</code> 同样不做类型转换，但把 NaN 视为与自身相同，并区分正负零。它不是“所有时候都比 === 更严格”：在 NaN 这一项上，它反而接受了 === 不接受的相同性。</p>
<p>SameValueZero 与 Object.is 的主要差别是把正负零也视为相同。Map 的键比较、Set 去重和数组 includes 等操作使用这一类规则。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">NaN</span> === <span class="hljs-title class_">NaN</span>); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Object</span>.<span class="hljs-title function_">is</span>(+<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-title class_">NaN</span>, <span class="hljs-title class_">NaN</span>, +<span class="hljs-number">0</span>, -<span class="hljs-number">0</span>]).<span class="hljs-property">size</span>); <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>Set 中最终是一项 NaN 和一项零，不是四个互不相同的条目。判断是否为 NaN 时，通常直接使用 Number.isNaN 比绕着相等运算表达意图更清楚；全局 isNaN 还会先做转换，语义不同。</p>
<h3>对象相等比较的是身份，不是属性展开结果</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> first = { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> };
<span class="hljs-keyword">const</span> second = { <span class="hljs-attr">count</span>: <span class="hljs-number">1</span> };
<span class="hljs-keyword">const</span> alias = first;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first === second); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first === alias);  <span class="hljs-comment">// true</span>
alias.<span class="hljs-property">count</span> = <span class="hljs-number">2</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(first.<span class="hljs-property">count</span>);      <span class="hljs-comment">// 2</span>
</code></pre></div>
<p>赋值给 alias 没有复制对象，只是让另一个绑定保存了指向同一个对象的值。修改 alias.count 是修改共享对象，所以 first.count 跟着变化。</p>
<p>这也解释了为什么 <code>new Set([{ id: 1 }, { id: 1 }])</code> 不会自动按 id 去重，Map 用一个新建的 <code>{ id: 1 }</code> 也读不到以另一个对象为键存进去的数据。需要按业务 ID 比较时，应明确提取 ID，或定义符合业务的比较规则。</p>
<p>JavaScript 参数传递仍然是传值。把对象值传给函数后，函数可以修改那个共享对象；但如果函数仅把自己的参数重新赋值为另一个对象，不会顺便改掉调用者变量的绑定。把这一点简单说成“对象按引用传参”，容易把修改对象与替换变量混淆。</p>
<h3>宽松相等不是随便把两边都变成字符串</h3>
<p><code>==</code> 使用一组按类型区分的转换规则。数字与字符串比较时可能转换字符串，布尔值会按规则转成数值；对象与某些原始值比较时可能先把对象转成原始值。两个对象彼此比较时则仍然检查身份，不会先各自转成字符串再比较。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> == <span class="hljs-string">&#x27;&#x27;</span>);       <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-literal">false</span> == <span class="hljs-string">&#x27;0&#x27;</span>);  <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([] == <span class="hljs-literal">false</span>);  <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([] == []);     <span class="hljs-comment">// false</span>
</code></pre></div>
<p>这些结果不说明空数组是假值。空数组在布尔条件中是真值，第三行发生的是宽松相等算法的转换，不能把它换成 <code>Boolean([])</code> 去猜结果。</p>
<p>业务代码通常用 ===，并在数据入口按明确规则处理字符串、数字和空值。对于有意用 <code>value == null</code> 同时接受 null 与 undefined 的代码，团队可以明确约定其含义；浏览器历史兼容对象 document.all 还存在特殊行为，不宜把这个习惯写成对所有宿主值都无例外的数学定律。</p>
<h3>typeof、包装对象与不可变性要分开看</h3>
<p><code>typeof null</code> 返回 &#x27;object&#x27; 是历史遗留结果，不表示 null 真的是可以访问属性的普通对象。判断 null 应直接比较；识别数组应使用 Array.isArray，而不是只看 typeof。</p>
<p>函数是对象，但 typeof 对可调用对象会返回 &#x27;function&#x27;。<code>new Number(1)</code>、<code>new Boolean(false)</code> 则产生包装对象，不能当成普通原始值使用，尤其后者在布尔条件中仍然是真值。</p>
<p>原始值不可变，并不意味着变量永远不能重新赋值。给变量换一个字符串是在改变绑定的值，不是在原地修改原字符串；对象属性则可以在同一身份下变化。内存到底放在栈还是堆，是引擎实现细节，不能用一句“基础类型在栈、对象在堆”替代这些可观察的语义。</p>
<h3>如果业务需要深度相等</h3>
<p>深度比较必须决定哪些信息算内容：数组顺序是否重要，Date 比较时间还是身份，Map 的键如何比较，循环引用怎样处理，原型和不可枚举属性是否参与。这些没有一个通用运算符替你全部决定。</p>
<p>简单地比较 JSON.stringify 的结果，会受到属性顺序、无法序列化的值和序列化转换规则影响。多数界面业务如果有稳定 ID，直接按 ID 判断是否是同一个业务实体更明确；确实要比较结构时，再选择语义符合需求的比较实现。</p>`};export{e as default};