var e={answerHtml:`<h2>简答</h2>
<ul>
<li>u 或 v 标志让正则按 Unicode 码点处理，g、y 标志会让 lastIndex 产生状态。</li>
<li>具名捕获组 (?...) 比按序号取组更易维护。</li>
<li>把用户输入嵌入正则前要转义，ES2025 提供 RegExp.escape。</li>
<li>回溯过多的模式可能导致 ReDoS，校验不可信输入时要限制长度并避免嵌套量词。</li>
</ul>
<p>正则适合表达边界清楚的文本模式，例如某种编号、需要提取的标签片段或一类字符。它不只是“写出一个能匹配的表达式”就完成了：同一个模式是用于整段校验还是局部搜索，是否会重复使用，输入有多长，都会影响正确性与性能。</p>
<p>一个很常见的意外是，同样的字符串连续 test，两次结果竟然不同：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-regexp">/a/g</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-property">lastIndex</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>这不是随机结果。带 g 的模式成功后推进 lastIndex，第二次从上次结束位置继续寻找，失败后又把 lastIndex 重置为 0。用于单次布尔校验时，通常不需要 g；复用有状态正则时，就必须有意识地管理位置。</p>
<h2>字面量和构造函数分别转义哪一层</h2>
<p>固定模式可以使用正则字面量；模式需要动态生成时，可以用 RegExp 构造函数。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> literal = <span class="hljs-regexp">/\\d+/u</span>;
<span class="hljs-keyword">const</span> constructed = <span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(<span class="hljs-string">&#x27;\\\\d+&#x27;</span>, <span class="hljs-string">&#x27;u&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(literal.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;订单42&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(constructed.<span class="hljs-property">source</span> === literal.<span class="hljs-property">source</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>字面量中的 <code>\\d</code> 直接交给正则解析器；构造函数先接收一个 JavaScript 字符串，所以要用 <code>\\\\</code> 在字符串里保留一个反斜杠，再让正则解析器看到 <code>\\d</code>。少转义一层，模式就可能悄悄变成匹配字母 d。</p>
<p>这与把用户文字作为字面内容拼进正则是另一个问题：用户可能输入加号、括号、点号等正则元字符，即便字符串语法合法，也会改变模式含义。</p>
<h2>搜索存在与整个值合法，是不同需求</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> codePattern = <span class="hljs-regexp">/^[A-Z]{2}[0-9]{4}$/u</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(codePattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;AB1234&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(codePattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;prefixAB1234&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(codePattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;AB12345&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>如果去掉边界约束，模式可能只证明字符串里包含一个合法片段，而不是整个输入都符合规则。表单校验应明确是否接受前后空白、大小写差异和多行内容，而不是发现不匹配后无条件加几个 .*。</p>
<p>m 改变 ^、$ 对行边界的理解，不是让点号匹配换行；s 才会改变点号对行终止符的匹配范围。需要逐行处理的文本与只允许单行的字段，应使用不同的规则。</p>
<p>HTML 的 pattern 属性也有自己的整值匹配及编译规则，不能直接把包含斜杠的 JavaScript 正则字面量放进去，再假定两边语义完全相同。</p>
<h2>动态搜索应先决定是否真的需要正则</h2>
<p>如果用户只是查找一段原样文字，String.includes、indexOf 等接口更简单，不需要把输入变成模式。确实要把字面文字嵌入正则时，可以使用 ES2025 标准化的 RegExp.escape：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> keyword = <span class="hljs-string">&#x27;a+b&#x27;</span>;
<span class="hljs-keyword">const</span> search = <span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(<span class="hljs-title class_">RegExp</span>.<span class="hljs-built_in">escape</span>(keyword), <span class="hljs-string">&#x27;u&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(search.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a+b&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(search.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;aaab&#x27;</span>)); <span class="hljs-comment">// false</span>
</code></pre></div>
<p>没有转义时，a+b 会被解释成“一个或多个 a 后接 b”，而不是原样的加号。RegExp.escape 还处理了更复杂的嵌入上下文，不只是给几个常见符号前面加反斜杠。</p>
<p>这段例子要求运行环境支持 RegExp.escape。旧环境应使用与该标准语义兼容的实现或改用普通字符串搜索，不要把一条只覆盖常见字符的 replace 正则宣称为所有上下文都安全的完整实现。</p>
<p>如果产品本来就是允许用户输入正则的高级搜索，则不能转义掉全部语法，而应把它当成另一种功能：捕获构造时的 SyntaxError、明确支持的标志，并限制输入与执行成本。</p>
<h2>g、y 与空匹配都有状态问题</h2>
<p>g 允许从 lastIndex 开始继续向后寻找下一个匹配位置；y 则要求从指定位置粘连匹配，不会像一般全局搜索那样继续跳过不匹配片段。二者都会影响多次 exec、test 的状态。</p>
<p>如果手写 while 循环反复 exec，而模式可以匹配空字符串，需要额外保证位置推进，否则可能一直停在同一处。适用时可以使用 matchAll 等已有迭代接口，但它也有自身的标志和返回值规则，并不是给任意有状态匹配都自动消除问题。</p>
<p>单纯判断某个固定格式是否合法时，使用不带 g/y 的模式通常最容易推理。</p>
<h2>Unicode 模式不等于“一个用户字符”</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-regexp">/^.$/u</span>.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;💡&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-regexp">/^.$/u</span>.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;e\\u0301&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-keyword">const</span> segmenter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;zh&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;grapheme&#x27;</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([...segmenter.<span class="hljs-title function_">segment</span>(<span class="hljs-string">&#x27;e\\u0301&#x27;</span>)].<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
</code></pre></div>
<p>u 使相关匹配按 Unicode 码点语义处理，所以一个由代理对表示的灯泡 emoji 可以被一个点号匹配。但 e 加组合重音是两个码点，用户通常把它看成一个字素簇，单个点号并不会把它们自动合成一个。</p>
<p>复杂 emoji 序列也可能包含多个码点。需要按用户感知字符计数、截断时，Intl.Segmenter 往往更贴切，而不是不断扩大一个字符类。</p>
<p><code>\\d</code> 主要匹配 ASCII 数字，<code>\\w</code> 也不是“所有语言的文字”。需要 Unicode 属性时可以考虑模式下的属性转义，例如 <code>\\p{Letter}</code>。v 模式还引入更丰富的 Unicode 集合能力，与 u 不能同时启用，使用前应核对目标环境。</p>
<h2>回溯过多可能直接卡住主线程</h2>
<p>某些含重叠分支、嵌套重复的模式，在接近匹配但最终失败的长输入上，需要尝试大量路径。例如类似 <code>(a+)+</code> 的结构值得警惕；实际风险取决于完整模式、输入与引擎，不能只看正常短字符串很快就通过。</p>
<p>优先简化有歧义的模式，给不可信输入设置合理长度上限，并测试接近失败的边界。不要在页面主线程上拿超长输入反复尝试潜在高回溯模式。</p>
<p>普通的 setTimeout 或 Promise.race 无法中断已经占住同一线程的同步正则执行：线程不归还，超时回调也没机会运行。需要隔离重负载时，可以使用 Worker 并由外部控制终止，或选择符合需求的受限匹配引擎，但这也需要评估支持语法与结果语义。</p>
<p>最后，复杂 HTML、URL 或程序语言应优先使用解析器。邮箱等现实格式的前端校验也应以清楚提示为主，最终合法性、可达性或所有权并不能由一条正则证明。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/escape">MDN · RegExp.escape()</a>。</p>`};export{e as default};