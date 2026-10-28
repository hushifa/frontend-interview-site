var e={answerHtml:`<h2>简答</h2>
<ul>
<li>JavaScript 字符串按 UTF-16 码元组织，length 统计的是码元数。</li>
<li>一个码点可能占两个码元，一个用户可见字符可能由多个码点组成。</li>
<li>按 length 截断可能拆开代理对，按码点截断仍可能拆散组合字符，完整做法是按字素簇切分。</li>
<li>外观相同的字符串可能编码不同，比较前需要规范化；slice 等方法使用码元索引。</li>
</ul>
<p>JavaScript 字符串的 length 统计 UTF-16 码元，不是屏幕上看见的文字个数。要理解差别，需要区分三层：码元是字符串索引使用的单位，码点是 Unicode 编码空间中的值，字素簇则更接近用户感知的一个文字单位。</p>
<h2>一个字符可能跨越多个单位</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> segmenter = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;grapheme&#x27;</span> });

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> text <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;😀&#x27;</span>, <span class="hljs-string">&#x27;e\\u0301&#x27;</span>, <span class="hljs-string">&#x27;👨‍👩‍👧‍👦&#x27;</span>]) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(
    text.<span class="hljs-property">length</span>,
    [...text].<span class="hljs-property">length</span>,
    [...segmenter.<span class="hljs-title function_">segment</span>(text)].<span class="hljs-property">length</span>,
  );
}
<span class="hljs-comment">// 1 1 1</span>
<span class="hljs-comment">// 2 1 1</span>
<span class="hljs-comment">// 2 2 1</span>
<span class="hljs-comment">// 11 7 1</span>
</code></pre></div>
<p>第一列是 UTF-16 码元数；第二列通过字符串迭代统计码点；第三列按字素簇分割。</p>
<p>😀 的码点需要一对代理码元表示，因此 length 为 2，展开后为 1。<code>e\\u0301</code> 由字母 e 和组合重音组成，两个码点一起显示为带重音的字母。家庭 emoji 又包含多个 emoji 与零宽连接符，展开成码点仍会把用户看到的整体拆开。</p>
<p>字素簇也是基于 Unicode 规则定义的分割单位，不等于一个固定宽度的字形；字体和渲染环境仍会影响显示。</p>
<h2>按 length 截断会在哪里出错</h2>
<p><code>&#x27;😀&#x27;.slice(0, 1)</code> 只留下半个代理对，可能显示替换字符；先 <code>[...text]</code> 再截断能避免拆开有效代理对，却仍可能拆散组合重音或连接 emoji；按字素簇截断的完整写法见“Intl.Segmenter 怎样处理用户看到的字符和词？”。</p>
<p>如果昵称要求“最多 20 个可见字符”，应先明确这里的字符采用字素簇规则，再让前端和服务端按相同定义验证。数据库字段、接口字节限制与 UI 字符限制可能不是同一种单位，需要分别约束。</p>
<p>例如：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;你&#x27;</span>.<span class="hljs-property">length</span>); <span class="hljs-comment">// 1</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;你&#x27;</span>).<span class="hljs-property">length</span>); <span class="hljs-comment">// 3</span>
</code></pre></div>
<p>前者是 UTF-16 码元数，后者是 UTF-8 字节数。限制上传文本占用的字节数时，不能拿字符串 length 直接代替。</p>
<h2>看起来一样，也可能不完全相等</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> composed = <span class="hljs-string">&#x27;\\u00E9&#x27;</span>;
<span class="hljs-keyword">const</span> decomposed = <span class="hljs-string">&#x27;e\\u0301&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(composed === decomposed); <span class="hljs-comment">// false</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(composed.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>) === decomposed.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>)); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>两种写法可能显示为同一个 é，但编码序列不同。NFC 规范化可以处理这类规范等价关系，适合在明确需要一致表示的流程中使用。</p>
<p>规范化不是翻译，也不是安全去重算法。它不会自动消除拉丁字母和其他文字中的相似字符，不会把所有看起来相近的用户名变成相同账号。NFKC 还会折叠兼容字符差异，是否适用必须由业务决定，不能对密码或标识任意处理。</p>
<h2>索引单位与显示单位要保持清楚</h2>
<p>字符串 slice、substring、indexOf 等通常使用 UTF-16 索引，Intl.Segmenter 返回的 index 也按原字符串的码元位置计算。不要把“第几个字素簇”直接拿去作为 slice 的下标。</p>
<p>文字输入还涉及输入法组合过程、光标位置和浏览器控件行为。中文输入尚未完成时就按截断规则强行改 value，可能打断用户输入。因此长度展示、提交校验与输入交互需要一起设计。</p>
<p>正确做法不是永远不用 length，而是按需求选单位：底层字符串索引用码元，编码存储限制看字节，码点遍历使用迭代，用户感知计数考虑字素簇。</p>`};export{e as default};