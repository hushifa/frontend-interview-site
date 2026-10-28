var e={answerHtml:`<h2>简答</h2>
<ul>
<li>带 <code>g</code> 或 <code>y</code> 标志的正则对象有状态：<code>test</code>、<code>exec</code> 会从 <code>lastIndex</code> 开始匹配并更新它，复用同一个对象会得到交替的结果。</li>
<li>校验整个输入要加 <code>^</code> 和 <code>$</code>；不加时只要包含匹配片段就返回 <code>true</code>。</li>
<li>把用户输入拼进正则前必须转义元字符，ES2025 提供 <code>RegExp.escape</code>。</li>
<li>处理 emoji 或其他非 BMP 字符时加 <code>u</code> 或 <code>v</code> 标志，<code>\\p{...}</code> 属性类也需要它们。</li>
<li><code>(a+)+</code> 这类嵌套量词在不匹配时会指数级回溯，正则运行在主线程上，会冻结页面。</li>
</ul>
<h2>lastIndex 的状态</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> pattern = <span class="hljs-regexp">/a/g</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>)); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(pattern.<span class="hljs-property">lastIndex</span>); <span class="hljs-comment">// 0</span>
</code></pre></div>
<p>第一次匹配后 <code>lastIndex</code> 变为 1，第二次从位置 1 开始找不到，返回 <code>false</code> 并把 <code>lastIndex</code> 重置为 0。只判断是否匹配时不要加 <code>g</code>；<code>String.prototype.match</code>、<code>matchAll</code>、<code>replace</code> 不受这个问题影响。</p>
<h2>校验与搜索</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">/\\d+<span class="hljs-regexp">/.test(&#x27;abc123&#x27;);    /</span>/ <span class="hljs-literal">true</span>，包含数字
/^\\d+$/.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;abc123&#x27;</span>);  <span class="hljs-comment">// false，整串必须是数字</span>
</code></pre></div>
<h2>动态拼接要转义</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> keyword = <span class="hljs-string">&#x27;a.b&#x27;</span>;
<span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(keyword).<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;axb&#x27;</span>);                 <span class="hljs-comment">// true，. 匹配任意字符</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">RegExp</span>(<span class="hljs-title class_">RegExp</span>.<span class="hljs-built_in">escape</span>(keyword)).<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;axb&#x27;</span>);  <span class="hljs-comment">// false</span>
</code></pre></div>
<p><code>RegExp.escape</code> 是 ES2025 特性，MDN 标注为 Baseline 2025（2025 年 5 月起主流浏览器最新版可用）。需要兼容旧环境时用 core-js 等 polyfill，或自行转义 <code>[.*+?^\${}()|[\\]\\\\]</code>。</p>
<h2>Unicode</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">/^.<span class="hljs-property">$</span>/.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;😀&#x27;</span>);    <span class="hljs-comment">// false，emoji 是两个 UTF-16 码元</span>
<span class="hljs-regexp">/^.$/u</span>.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;😀&#x27;</span>);   <span class="hljs-comment">// true</span>
<span class="hljs-regexp">/\\p{Script=Han}/u</span>.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;汉&#x27;</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p><code>v</code> 标志（ES2024）是 <code>u</code> 的升级版，支持字符类集合运算，如 <code>[\\p{L}--[a-z]]</code>。</p>
<h2>具名捕获组</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> { year, month } = <span class="hljs-regexp">/(?&lt;year&gt;\\d{4})-(?&lt;month&gt;\\d{2})/</span>.<span class="hljs-title function_">exec</span>(<span class="hljs-string">&#x27;2026-10&#x27;</span>).<span class="hljs-property">groups</span>;
</code></pre></div>
<p><code>replace</code> 中用 <code>$&lt;year&gt;</code> 引用。ES2025 起不同分支可以使用同名捕获组。</p>
<h2>ReDoS</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">/^(a+)+$/.<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;a&#x27;</span>.<span class="hljs-title function_">repeat</span>(<span class="hljs-number">30</span>) + <span class="hljs-string">&#x27;b&#x27;</span>); <span class="hljs-comment">// 可能耗时数分钟</span>
</code></pre></div>
<p>不匹配时引擎会尝试所有拆分方式。防护措施：</p>
<ul>
<li>避免嵌套量词和可重叠的分支，例如把 <code>(a+)+</code> 改成 <code>a+</code>。</li>
<li>限制输入长度后再匹配。</li>
<li>对不受信任的正则或长文本，放到 Worker 里执行，超时后 <code>terminate()</code>。<code>setTimeout</code> 无法打断正在运行的同步匹配。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>replace</code> 和 <code>replaceAll</code> 的区别？<code>replace</code> 传字符串只替换第一个；<code>replaceAll</code> 传正则时必须带 <code>g</code>。</li>
<li><code>s</code> 标志做什么？让 <code>.</code> 也匹配换行符。</li>
<li><code>d</code> 标志做什么？在结果的 <code>indices</code> 属性中返回每个捕获组的起止位置。</li>
</ul>`};export{e as default};