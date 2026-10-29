var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写英文文案时，很多人用 <code>count === 1 ? 单数 : 复数</code>。可这只适合英语：中文只有 <code>other</code> 一个类别，阿拉伯语有六个，俄语里 21 和 1 还属于同一类。<code>Intl.PluralRules</code> 就是按语言告诉你，一个数字属于哪个复数类别。</p>
<p>它的 <code>select(n)</code> 返回的是类别名，比如 <code>&#x27;one&#x27;</code>、<code>&#x27;few&#x27;</code>，不是文案。应用拿这个类别去查完整的翻译句子。</p>
<p>类别名不等于具体数值。俄语的 <code>one</code> 包含 1、21、31，<code>few</code> 包含 2、3、4、22。另外，序数（1st、2nd、3rd）的规则和基数不同，要用 <code>type: &#x27;ordinal&#x27;</code>。</p>
<p>还有一点要注意，显示 <code>1.0</code> 和显示 <code>1</code> 的类别可能不一样，所以 <code>PluralRules</code> 的小数位选项要和界面实际显示的一致。</p>
</blockquote>
<h2>各语言的类别差多少</h2>
<p>下面用同几个数字，看看不同语言怎么分类。结果是 Node 22 实测的。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">select</span>(n)); <span class="hljs-comment">// [&#x27;other&#x27;, &#x27;one&#x27;, &#x27;other&#x27;]</span>
[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-title function_">select</span>(n)); <span class="hljs-comment">// [&#x27;other&#x27;, &#x27;other&#x27;, &#x27;other&#x27;]</span>
[<span class="hljs-number">0</span>, <span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">11</span>, <span class="hljs-number">100</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;ar&#x27;</span>).<span class="hljs-title function_">select</span>(n));
<span class="hljs-comment">// [&#x27;zero&#x27;, &#x27;one&#x27;, &#x27;two&#x27;, &#x27;few&#x27;, &#x27;many&#x27;, &#x27;other&#x27;]</span>
[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">5</span>, <span class="hljs-number">21</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;ru&#x27;</span>).<span class="hljs-title function_">select</span>(n)); <span class="hljs-comment">// [&#x27;one&#x27;, &#x27;few&#x27;, &#x27;many&#x27;, &#x27;one&#x27;]</span>

<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>).<span class="hljs-title function_">resolvedOptions</span>().<span class="hljs-property">pluralCategories</span>; <span class="hljs-comment">// [&#x27;other&#x27;]</span>
</code></pre></div>
<p>英文里 0 也是 <code>other</code>，所以“0 files”用复数。中文全是 <code>other</code>。阿拉伯语六个类别全用上了。俄语的 21 又回到了 <code>one</code>，因为俄语看的是末位数字，不是“是不是 1”。</p>
<p>最后一行的 <code>pluralCategories</code> 列出这种语言的全部类别。拿它可以检查每种语言的翻译有没有把需要的类别都写全。</p>
<h2>用类别选出完整的句子</h2>
<p>下面按类别选模板，再把格式化后的数字填进去。</p>
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
<p>为什么每个类别都写一整句，而不是只换个词尾 <code>s</code>？因为别的语言里，变化的可能不只是名词，动词、形容词也要跟着变。所以一个类别对应一整句话最安全。</p>
<p>实际项目里，一般把这些分支直接写进 ICU 消息，见<a href="/questions/i18n-icu-message/">《ICU MessageFormat 为什么适合复杂国际化文案？》</a>。</p>
<h2>序数为什么要单独处理</h2>
<p>英文的 1st、2nd、3rd 用的是序数规则，和上面的基数规则不同。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> ordinal = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ordinal&#x27;</span> });
<span class="hljs-keyword">const</span> suffix = { <span class="hljs-attr">one</span>: <span class="hljs-string">&#x27;st&#x27;</span>, <span class="hljs-attr">two</span>: <span class="hljs-string">&#x27;nd&#x27;</span>, <span class="hljs-attr">few</span>: <span class="hljs-string">&#x27;rd&#x27;</span>, <span class="hljs-attr">other</span>: <span class="hljs-string">&#x27;th&#x27;</span> };
[<span class="hljs-number">1</span>, <span class="hljs-number">2</span>, <span class="hljs-number">3</span>, <span class="hljs-number">11</span>, <span class="hljs-number">12</span>, <span class="hljs-number">13</span>, <span class="hljs-number">21</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">n</span>) =&gt;</span> <span class="hljs-string">\`<span class="hljs-subst">\${n}</span><span class="hljs-subst">\${suffix[ordinal.select(n)]}</span>\`</span>);
<span class="hljs-comment">// [&#x27;1st&#x27;, &#x27;2nd&#x27;, &#x27;3rd&#x27;, &#x27;11th&#x27;, &#x27;12th&#x27;, &#x27;13th&#x27;, &#x27;21st&#x27;]</span>
</code></pre></div>
<p>注意 11、12、13 都是 <code>th</code>。手写 <code>n % 10</code> 判断时，最容易在这里写成“11st”“12nd”。<code>type: &#x27;ordinal&#x27;</code> 已经把这些例外处理好了。</p>
<h2>小数位会改变类别</h2>
<p>同一个 1，显示方式不同，类别也不同。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>).<span class="hljs-title function_">select</span>(<span class="hljs-number">1</span>); <span class="hljs-comment">// &#x27;one&#x27;</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">PluralRules</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">minimumFractionDigits</span>: <span class="hljs-number">1</span> }).<span class="hljs-title function_">select</span>(<span class="hljs-number">1</span>); <span class="hljs-comment">// &#x27;other&#x27;，对应显示 &quot;1.0&quot;</span>
</code></pre></div>
<p>英文里写“1 star”，却要写“1.0 stars”。所以界面上显示“1.0”时，<code>PluralRules</code> 也要用同样的小数位选项，否则会选错句子。</p>
<h2>常见追问</h2>
<p><strong>中文就不用处理复数了吗？</strong></p>
<blockquote>
<p>翻译目录里，中文只需要写 <code>other</code> 一条。可代码仍要走同一套复数逻辑，不然切换到其他语言时就会出错。</p>
</blockquote>
<p><strong><code>=0</code> 和 <code>zero</code> 有什么区别？</strong></p>
<blockquote>
<p><code>=0</code> 是 ICU 消息里的精确匹配，任何语言都能用，专门处理数量正好是 0 的情况。<code>zero</code> 是复数类别，只有阿拉伯语等部分语言才有。</p>
</blockquote>`};export{e as default};