var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>第一个坑是状态。带 <code>g</code> 或 <code>y</code> 标志的正则对象会记住上次匹配到哪里，存在 <code>lastIndex</code> 上，<code>test</code>、<code>exec</code> 会从这个位置开始找并更新它，所以同一个正则反复 <code>test</code> 会得到交替的结果。另外，校验整个输入时要加 <code>^</code> 和 <code>$</code>，不然只要包含一段能匹配的内容就返回 <code>true</code>。</p>
<p>第二个坑是拼接。把用户输入拼进正则之前，要把 <code>.</code>、<code>*</code> 这些有特殊含义的字符转义，ES2025 提供了 <code>RegExp.escape</code>。</p>
<p>第三个是 Unicode。emoji 这类字符在 JavaScript 里占两个位置，不加 <code>u</code> 或 <code>v</code> 标志时，<code>.</code> 只能匹配半个；<code>\\p{...}</code> 这种按字符属性匹配的写法也需要这两个标志。</p>
<p>最后是性能。<code>(a+)+</code> 这种嵌套量词，在匹配失败时可能要尝试指数级的组合。正则运行在主线程上，跑久了页面就卡死，这叫 ReDoS。</p>
</blockquote>
<h2>同一个正则为什么第二次就不匹配了</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-regexp">/a/g</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-property">lastIndex</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>同一个正则，同一个字符串，第一次是 <code>true</code>，第二次却是 <code>false</code>。</p>
<p>原因是带 <code>g</code> 的正则会记录位置。第一次匹配成功后，<code>lastIndex</code> 变成了 1，表示下次从第 1 个字符开始找。第二次从位置 1 开始，后面没有字符了，找不到，于是返回 <code>false</code>，同时把 <code>lastIndex</code> 重置为 0。所以第三次又会是 <code>true</code>，结果来回交替。</p>
<p>改法很简单：只判断匹不匹配时，不要加 <code>g</code>。<code>String.prototype.match</code>、<code>matchAll</code>、<code>replace</code> 这些字符串方法不受这个问题影响。</p>
<h2>校验时为什么要加 ^ 和 $</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">/\\d+<span class="hljs-regexp">/.test(&#x27;abc123&#x27;);    /</span>/ <span class="hljs-literal">true</span>，包含数字
/^\\d+$/.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;abc123&#x27;</span>);  <span class="hljs-comment">// false，整串必须是数字</span>
</code></pre></div>
<p><code>/\\d+/</code> 的意思是“包含至少一个数字”，<code>&#x27;abc123&#x27;</code> 里有数字，所以通过了。想校验“整串都是数字”，要用 <code>^</code> 和 <code>$</code> 把开头和结尾都锁住。</p>
<h2>用户输入拼进正则为什么要转义</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> keyword = <span class="hljs-string">&#x27;a.b&#x27;</span>;
<span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(keyword).<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;axb&#x27;</span>);                 <span class="hljs-comment">// true，. 匹配任意字符</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(<span class="hljs-title class_">RegExp</span>.<span class="hljs-built_in">escape</span>(keyword)).<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;axb&#x27;</span>);  <span class="hljs-comment">// false</span>
</code></pre></div>
<p>用户想搜的是字面的 <code>a.b</code>，可是 <code>.</code> 在正则里表示任意一个字符，<code>&#x27;axb&#x27;</code> 也被匹配上了。用 <code>RegExp.escape</code> 把 <code>.</code> 转义以后，它就只匹配真正的点号。</p>
<p><code>RegExp.escape</code> 是 ES2025 的特性，MDN 标注为 Baseline 2025，也就是 2025 年 5 月起主流浏览器的最新版都能用。需要兼容旧环境时，用 core-js 这类 polyfill，或者自己转义 <code>[.*+?^\${}()|[\\]\\\\]</code> 这些字符。</p>
<h2>emoji 为什么匹配不上</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">/^.<span class="hljs-property">$</span>/.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;😀&#x27;</span>);    <span class="hljs-comment">// false，emoji 是两个 UTF-16 码元</span>
<span class="hljs-regexp">/^.$/u</span>.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;😀&#x27;</span>);   <span class="hljs-comment">// true</span>
<span class="hljs-regexp">/\\p{Script=Han}/u</span>.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;汉&#x27;</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>/^.$/</code> 表示“正好一个字符”，可一个 emoji 却匹配失败了。因为 JavaScript 字符串按 UTF-16 码元存储，常用汉字占一个码元，emoji 这类字符要占两个。不加 <code>u</code> 时，<code>.</code> 只匹配一个码元，也就是半个 emoji。加上 <code>u</code> 后，正则按完整的字符来匹配，就对了。</p>
<p><code>\\p{Script=Han}</code> 表示“汉字”，这种按 Unicode 属性匹配的写法，也要加 <code>u</code> 才能用。ES2024 的 <code>v</code> 标志是 <code>u</code> 的升级版，还支持字符类之间的集合运算，比如 <code>[\\p{L}--[a-z]]</code> 表示“所有字母，去掉小写的 a 到 z”。</p>
<h2>具名捕获组怎样用</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { year, month } = <span class="hljs-regexp">/(?&lt;year&gt;\\d{4})-(?&lt;month&gt;\\d{2})/</span>.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;2026-10&#x27;</span>).<span class="hljs-property">groups</span>;
</code></pre></div>
<p>用 <code>(?&lt;名字&gt;...)</code> 给捕获组起名字，结果的 <code>groups</code> 上就能按名字取，不用记第几组。在 <code>replace</code> 里可以用 <code>$&lt;year&gt;</code> 引用。ES2025 起，不同的分支里可以用同一个组名。</p>
<h2>怎样避免正则卡死页面</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">/^(a+)+$/.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>.<span class="hljs-title function_">repeat</span>(<span class="hljs-number">30</span>) + <span class="hljs-string">&#x27;b&#x27;</span>); <span class="hljs-comment">// 可能耗时数分钟</span>
</code></pre></div>
<p>30 个 <code>a</code> 加一个 <code>b</code>，看着很短，却可能跑几分钟。</p>
<p>因为结尾的 <code>b</code> 让匹配注定失败，而引擎在宣布失败前，要把 30 个 <code>a</code> 在内外两层 <code>+</code> 之间的所有拆分方式都试一遍，组合数是指数级的。这个过程叫回溯，这种被恶意输入拖垮的情况叫 ReDoS。</p>
<p>防护办法有三个。第一，避免嵌套量词和可能重叠的分支，比如 <code>(a+)+</code> 其实就等于 <code>a+</code>。第二，匹配之前先限制输入长度。第三，正则或文本不可信时，放到 Worker 里执行，超时就调用 <code>terminate()</code> 结束它。<code>setTimeout</code> 是打断不了正在运行的同步匹配的，因为它的回调要等主线程空下来才能执行。</p>
<h2>常见追问</h2>
<p><strong><code>replace</code> 和 <code>replaceAll</code> 有什么区别？</strong></p>
<blockquote>
<p><code>replace</code> 第一个参数传字符串时，只替换第一个匹配。<code>replaceAll</code> 会替换全部，它传正则时，正则必须带 <code>g</code>，否则报错。</p>
</blockquote>
<p><strong><code>s</code> 标志做什么？</strong></p>
<blockquote>
<p>默认情况下 <code>.</code> 不匹配换行符，加上 <code>s</code> 以后，<code>.</code> 也能匹配换行。</p>
</blockquote>
<p><strong><code>d</code> 标志做什么？</strong></p>
<blockquote>
<p>加上 <code>d</code> 以后，匹配结果会多一个 <code>indices</code> 属性，记录每个捕获组在原字符串里的起止位置。</p>
</blockquote>`};export{e as default};