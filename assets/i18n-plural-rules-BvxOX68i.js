var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Intl.PluralRules 返回 one、few、many 等复数类别，类别名称不对应固定数值。</li>
<li>每个类别映射到完整的文案，而不是拼接词尾。</li>
<li>cardinal 用于“多少个”，ordinal 用于“第几个”。</li>
<li>复数规则要和显示时使用的数字精度保持一致。</li>
</ul>
<p>英文可以说 1 item、2 items，中文通常不需要随数量改变“项目”的形式，但其他语言可能有更多分支。把所有语言都写成 <code>count === 1 ? 单数 : 复数</code>，会把英文规则强加给其他语言。</p>
<p>Intl.PluralRules 的作用是根据语言和数值选择一个语法类别。它不会翻译名词，也不会自动生成完整句子；文案仍由翻译资源提供。</p>
<h2>类别名称不是固定数值标签</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> en = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>);
<span class="hljs-keyword">const</span> zh = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>);
<span class="hljs-keyword">const</span> ar = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;ar&#x27;</span>);

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> en.<span class="hljs-title function_">select</span>(n))); <span class="hljs-comment">// [&#x27;other&#x27;, &#x27;one&#x27;, &#x27;other&#x27;]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> zh.<span class="hljs-title function_">select</span>(n))); <span class="hljs-comment">// [&#x27;other&#x27;, &#x27;other&#x27;, &#x27;other&#x27;]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">11</span>, <span class="hljs-number">100</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> ar.<span class="hljs-title function_">select</span>(n)));
<span class="hljs-comment">// [&#x27;zero&#x27;, &#x27;one&#x27;, &#x27;two&#x27;, &#x27;few&#x27;, &#x27;many&#x27;, &#x27;other&#x27;]</span>
</code></pre></div>
<p>可能的类别有 zero、one、two、few、many、other，但每种语言只使用其中一部分。类别的含义由语言规则定义，不能把 one 永远写成 <code>n === 1</code>，也不能认为所有语言的 0 都会返回 zero。</p>
<p>如果产品希望“0 条消息”显示成“暂无消息”，这通常是一个明确的业务分支，不必等语言规则返回 zero。ICU 消息中的 <code>=0</code> 就能表达精确数值匹配，与名为 zero 的语法类别不同。</p>
<h2>把分支映射到完整文案</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> rules = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>);
<span class="hljs-keyword">const</span> numbers = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">NumberFormat</span>(<span class="hljs-string">&#x27;en&#x27;</span>);
<span class="hljs-keyword">const</span> messages = {
  <span class="hljs-attr">one</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-string">\`You have <span class="hljs-subst">\${value}</span> unread message.\`</span>,
  <span class="hljs-attr">other</span>: <span class="hljs-function">(<span class="hljs-params">value</span>) =&gt;</span> <span class="hljs-string">\`You have <span class="hljs-subst">\${value}</span> unread messages.\`</span>,
};

<span class="hljs-keyword">function</span> <span class="hljs-title function_">unreadMessage</span>(<span class="hljs-params">count</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(count) || count &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;未读数量必须是非负安全整数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> category = rules.<span class="hljs-title function_">select</span>(count);
  <span class="hljs-keyword">const</span> render = messages[category] ?? messages.<span class="hljs-property">other</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">render</span>(numbers.<span class="hljs-title function_">format</span>(count));
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">unreadMessage</span>(<span class="hljs-number">1</span>)); <span class="hljs-comment">// You have 1 unread message.</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">unreadMessage</span>(<span class="hljs-number">1200</span>)); <span class="hljs-comment">// You have 1,200 unread messages.</span>
</code></pre></div>
<p>示例只实现英文文案。增加语言时要连同规则和完整翻译一起切换，不能只换 PluralRules 的 locale，却继续使用英文句子。完整句子还允许翻译调整词序、动词和代词，避免只给名词末尾补一个 s。</p>
<p>other 用作兜底，但不应拿它掩盖目标语言本来需要的其他翻译分支。实际项目通常让成熟消息库管理这些映射。</p>
<h2>基数和序数使用不同规则</h2>
<p>默认 type 是 cardinal，适用于“多少个”。ordinal 适用于“第几个”，例如英语的 1st、2nd、3rd：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ordinal = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ordinal&#x27;</span> });
<span class="hljs-keyword">const</span> suffix = { <span class="hljs-attr">one</span>: <span class="hljs-string">&#x27;st&#x27;</span>, <span class="hljs-attr">two</span>: <span class="hljs-string">&#x27;nd&#x27;</span>, <span class="hljs-attr">few</span>: <span class="hljs-string">&#x27;rd&#x27;</span>, <span class="hljs-attr">other</span>: <span class="hljs-string">&#x27;th&#x27;</span> };
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>([<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">11</span>, <span class="hljs-number">12</span>, <span class="hljs-number">13</span>, <span class="hljs-number">21</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${n}</span><span class="hljs-subst">\${suffix[ordinal.select(n)]}</span>\`</span>));
<span class="hljs-comment">// [&#x27;1st&#x27;, &#x27;2nd&#x27;, &#x27;3rd&#x27;, &#x27;11th&#x27;, &#x27;12th&#x27;, &#x27;13th&#x27;, &#x27;21st&#x27;]</span>
</code></pre></div>
<p>只看个位数会错误地把 11 写成 11st。这个后缀表仍然是英文专用，不是其他语言都能复用的序数算法。</p>
<h2>显示精度也会影响规则选择</h2>
<p>复数规则会考虑用于规则计算的数字表示和舍入选项。若显示时保留一位小数，规则却按另一个精度选择，可能出现数字与词形不一致。对于距离、重量等小数场景，应让 NumberFormat 与 PluralRules 使用协调的精度设置，或交给消息格式化库统一处理。</p>
<p>同样，区间不应简单按终点选择词形；可评估 selectRange 及目标环境支持，或使用专门的区间消息。测试应选取目标语言真正不同的类别，并覆盖零、小数、舍入边界，而不是只测 1 和 2。</p>`};export{e as default};