var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>a ?? b</code>：仅当 <code>a</code> 是 <code>null</code> 或 <code>undefined</code> 时返回 <code>b</code>；<code>a || b</code>：<code>a</code> 为任意假值时都返回 <code>b</code>。</li>
<li><code>a?.b</code>：<code>a</code> 为 <code>null</code> 或 <code>undefined</code> 时整条链短路，返回 <code>undefined</code>；<code>a &amp;&amp; a.b</code> 在 <code>a</code> 为 <code>0</code>、<code>&#x27;&#x27;</code> 时返回这个假值。</li>
<li><code>?.</code> 还能用于调用和索引：<code>fn?.()</code>、<code>obj?.[key]</code>。</li>
<li>短路会跳过整条链后面的表达式，包括参数求值。</li>
<li><code>??</code> 不能和 <code>||</code>、<code>&amp;&amp;</code> 直接混写，必须加括号。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> ?? <span class="hljs-number">10</span>); <span class="hljs-comment">// 0</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">0</span> || <span class="hljs-number">10</span>); <span class="hljs-comment">// 10</span>
<span class="hljs-keyword">const</span> user = <span class="hljs-literal">null</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(user?.<span class="hljs-property">profile</span>?.<span class="hljs-property">name</span> ?? <span class="hljs-string">&#x27;匿名&#x27;</span>); <span class="hljs-comment">// 匿名</span>
</code></pre></div>
<p>数量、页码、开关等字段的合法值可能是 <code>0</code> 或 <code>false</code>，用 <code>||</code> 设置默认值会把它们覆盖掉。</p>
<h2>可选链的范围</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> data = { <span class="hljs-attr">list</span>: [] };
data.<span class="hljs-property">list</span>?.[<span class="hljs-number">0</span>]?.<span class="hljs-property">name</span>;  <span class="hljs-comment">// undefined</span>
data.<span class="hljs-property">callback</span>?.();     <span class="hljs-comment">// undefined，不会抛 &quot;not a function&quot;</span>
data.<span class="hljs-property">missing</span>.<span class="hljs-property">deep</span>;     <span class="hljs-comment">// TypeError，没有写 ?.</span>

<span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-literal">null</span>?.<span class="hljs-title function_">method</span>(count++);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(count); <span class="hljs-comment">// 0，参数没有求值</span>
</code></pre></div>
<ul>
<li><code>?.</code> 只检查它左边那一个值。<code>a?.b.c</code> 中，<code>a</code> 存在而 <code>b</code> 为 <code>undefined</code> 时，<code>.c</code> 仍然抛错。</li>
<li><code>fn?.()</code> 只在 <code>fn</code> 为 <code>null</code> 或 <code>undefined</code> 时短路；<code>fn</code> 是其他非函数值时照样抛 <code>TypeError</code>。</li>
<li>可选链不能用于赋值左侧：<code>obj?.a = 1</code> 是语法错误。</li>
<li>getter 或函数内部抛出的异常不会被吞掉。</li>
</ul>
<h2>混用规则</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> value = (a || b) ?? c; <span class="hljs-comment">// 必须加括号</span>
</code></pre></div>
<p><code>a ?? b || c</code> 直接写是语法错误，这是为了避免优先级歧义。</p>
<h2>赋值运算符</h2>
<ul>
<li><code>a ??= b</code>：<code>a</code> 为空值时才赋值。</li>
<li><code>a ||= b</code>：<code>a</code> 为假值时才赋值。</li>
<li><code>a &amp;&amp;= b</code>：<code>a</code> 为真值时才赋值。</li>
</ul>
<p>它们都是短路的，条件不满足时不会对 <code>a</code> 执行写入，也不会触发 setter。</p>
<h2>常见追问</h2>
<ul>
<li>可选链会掩盖 bug 吗？会。必须存在的数据不要加 <code>?.</code>，否则错误会以 <code>undefined</code> 的形式传到更远处才暴露。</li>
<li><code>document.all ?? 1</code> 返回什么？<code>document.all</code> 是历史特殊对象，<code>typeof</code> 为 <code>&#x27;undefined&#x27;</code> 但它不是 <code>undefined</code>，<code>??</code> 返回它本身。</li>
</ul>`};export{e as default};