var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>count === 1 ? 单数 : 复数</code> 只适合英语。中文只有 <code>other</code> 一个类别，阿拉伯语有六个，俄语里 21 和 1 属于同一类。</li>
<li><code>select(n)</code> 返回类别名，不返回文案。应用用类别去查完整的翻译句子。</li>
<li>类别名不等于数值：俄语的 <code>one</code> 包含 1、21、31，<code>few</code> 包含 2、3、4、22。</li>
<li><code>type: &#x27;ordinal&#x27;</code> 用于序数（1st、2nd、3rd），规则和基数不同。</li>
<li>显示 <code>1.0</code> 和显示 <code>1</code> 的类别可能不同，<code>PluralRules</code> 的小数位选项要和实际显示一致。</li>
</ul>
<h2>各语言的类别（Node 22 实测）</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">select</span>(n)); <span class="hljs-comment">// [&#x27;other&#x27;, &#x27;one&#x27;, &#x27;other&#x27;]</span>
[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-title function_">select</span>(n)); <span class="hljs-comment">// [&#x27;other&#x27;, &#x27;other&#x27;, &#x27;other&#x27;]</span>
[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">11</span>, <span class="hljs-number">100</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;ar&#x27;</span>).<span class="hljs-title function_">select</span>(n));
<span class="hljs-comment">// [&#x27;zero&#x27;, &#x27;one&#x27;, &#x27;two&#x27;, &#x27;few&#x27;, &#x27;many&#x27;, &#x27;other&#x27;]</span>
[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">21</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;ru&#x27;</span>).<span class="hljs-title function_">select</span>(n)); <span class="hljs-comment">// [&#x27;one&#x27;, &#x27;few&#x27;, &#x27;many&#x27;, &#x27;one&#x27;]</span>

<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-title function_">resolvedOptions</span>().<span class="hljs-property">pluralCategories</span>; <span class="hljs-comment">// [&#x27;other&#x27;]</span>
</code></pre></div>
<p><code>pluralCategories</code> 可以用来检查每种语言的翻译是否覆盖了所需的全部类别。</p>
<h2>选择完整文案</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> messages = {
  <span class="hljs-attr">one</span>: <span class="hljs-string">&#x27;You have {count} unread message.&#x27;</span>,
  <span class="hljs-attr">other</span>: <span class="hljs-string">&#x27;You have {count} unread messages.&#x27;</span>,
};
<span class="hljs-keyword">const</span> rules = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>);
<span class="hljs-keyword">const</span> number = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en-US&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">unreadMessage</span>(<span class="hljs-params">count</span>) {
  <span class="hljs-keyword">const</span> template = messages[rules.<span class="hljs-title function_">select</span>(count)] ?? messages.<span class="hljs-property">other</span>;
  <span class="hljs-keyword">return</span> template.<span class="hljs-title function_">replace</span>(<span class="hljs-string">&#x27;{count}&#x27;</span>, number.<span class="hljs-title function_">format</span>(count));
}

<span class="hljs-title function_">unreadMessage</span>(<span class="hljs-number">1</span>); <span class="hljs-comment">// &#x27;You have 1 unread message.&#x27;</span>
<span class="hljs-title function_">unreadMessage</span>(<span class="hljs-number">1200</span>); <span class="hljs-comment">// &#x27;You have 1,200 unread messages.&#x27;</span>
</code></pre></div>
<p>每个类别对应一整句，不要只替换词尾。实际项目里通常把这些分支写进 ICU 消息，见<a href="/questions/i18n-icu-message/">《ICU MessageFormat 为什么适合复杂国际化文案？》</a>。</p>
<h2>序数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ordinal = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ordinal&#x27;</span> });
<span class="hljs-keyword">const</span> suffix = { <span class="hljs-attr">one</span>: <span class="hljs-string">&#x27;st&#x27;</span>, <span class="hljs-attr">two</span>: <span class="hljs-string">&#x27;nd&#x27;</span>, <span class="hljs-attr">few</span>: <span class="hljs-string">&#x27;rd&#x27;</span>, <span class="hljs-attr">other</span>: <span class="hljs-string">&#x27;th&#x27;</span> };
[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">11</span>, <span class="hljs-number">12</span>, <span class="hljs-number">13</span>, <span class="hljs-number">21</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${n}</span><span class="hljs-subst">\${suffix[ordinal.select(n)]}</span>\`</span>);
<span class="hljs-comment">// [&#x27;1st&#x27;, &#x27;2nd&#x27;, &#x27;3rd&#x27;, &#x27;11th&#x27;, &#x27;12th&#x27;, &#x27;13th&#x27;, &#x27;21st&#x27;]</span>
</code></pre></div>
<p>11、12、13 属于 <code>other</code>，这是手写 <code>n % 10</code> 判断时最常见的错误。</p>
<h2>小数位</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">select</span>(<span class="hljs-number">1</span>); <span class="hljs-comment">// &#x27;one&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">minimumFractionDigits</span>: <span class="hljs-number">1</span> }).<span class="hljs-title function_">select</span>(<span class="hljs-number">1</span>); <span class="hljs-comment">// &#x27;other&#x27;，对应显示 &quot;1.0&quot;</span>
</code></pre></div>
<p>界面显示&quot;1.0 stars&quot;时，要用同样的小数位选项选择类别。</p>
<h2>常见追问</h2>
<ul>
<li><strong>中文就不用处理复数了吗？</strong> 翻译目录里中文只需要 <code>other</code> 一条，但代码仍要走同一套复数逻辑，其他语言才能正确工作。</li>
<li><strong><code>=0</code> 和 <code>zero</code> 有什么区别？</strong> <code>=0</code> 是 ICU 消息里的精确匹配，任何语言都能用；<code>zero</code> 是复数类别，只有部分语言（如阿拉伯语）有。</li>
</ul>`};export{e as default};