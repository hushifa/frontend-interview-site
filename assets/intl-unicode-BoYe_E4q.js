var e={answerHtml:`<h2>简答</h2>
<ul>
<li>有四种单位：UTF-16 码元（<code>length</code>、<code>slice</code> 用的）、码点（<code>[...text]</code> 遍历出来的）、字素簇（用户眼中的一个字符）、UTF-8 字节（存储和传输大小）。</li>
<li><code>&#x27;😀&#x27;.length</code> 是 2，<code>&#x27;👨‍👩‍👧‍👦&#x27;.length</code> 是 11，但它们在屏幕上都是一个字符。</li>
<li>按&quot;可见字符&quot;截断要用 <code>Intl.Segmenter</code> 的 <code>grapheme</code> 粒度，<code>slice</code> 可能切开代理对，<code>[...text]</code> 可能拆散组合字符和 emoji 序列。</li>
<li>中文、日文、泰文的词之间没有空格，分词用 <code>Intl.Segmenter</code> 的 <code>word</code> 粒度并过滤 <code>isWordLike</code>。</li>
<li><code>&#x27;\\u00E9&#x27;</code> 和 <code>&#x27;e\\u0301&#x27;</code> 都显示为 é 但不相等，比较或去重前用 <code>normalize(&#x27;NFC&#x27;)</code>。</li>
</ul>
<h2>四种计数（Node 22 实测）</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> graphemes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;grapheme&#x27;</span> });

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> text <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;A&#x27;</span>, <span class="hljs-string">&#x27;😀&#x27;</span>, <span class="hljs-string">&#x27;e\\u0301&#x27;</span>, <span class="hljs-string">&#x27;👨‍👩‍👧‍👦&#x27;</span>]) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(text.<span class="hljs-property">length</span>, [...text].<span class="hljs-property">length</span>, [...graphemes.<span class="hljs-title function_">segment</span>(text)].<span class="hljs-property">length</span>);
}
<span class="hljs-comment">// 1 1 1</span>
<span class="hljs-comment">// 2 1 1</span>
<span class="hljs-comment">// 2 2 1</span>
<span class="hljs-comment">// 11 7 1</span>

<span class="hljs-string">&#x27;你&#x27;</span>.<span class="hljs-property">length</span>; <span class="hljs-comment">// 1</span>
<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(<span class="hljs-string">&#x27;你&#x27;</span>).<span class="hljs-property">length</span>; <span class="hljs-comment">// 3，UTF-8 字节</span>
</code></pre></div>
<p>限制&quot;昵称最多 20 个字符&quot;时，先定义字符指字素簇，前后端用同一规则校验。数据库字段按字节限制时，用字节数校验。</p>
<h2>按字素簇截断</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">truncateText</span>(<span class="hljs-params">text, limit</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(limit) || limit &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;保留数量必须是非负整数&#x27;</span>);
  }
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> part <span class="hljs-keyword">of</span> graphemes.<span class="hljs-title function_">segment</span>(text)) {
    <span class="hljs-keyword">if</span> (count === limit) <span class="hljs-keyword">return</span> text.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, part.<span class="hljs-property">index</span>) + <span class="hljs-string">&#x27;…&#x27;</span>;
    count += <span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">return</span> text;
}

<span class="hljs-title function_">truncateText</span>(<span class="hljs-string">&#x27;A👨‍👩‍👧‍👦B&#x27;</span>, <span class="hljs-number">2</span>); <span class="hljs-comment">// &#x27;A👨‍👩‍👧‍👦…&#x27;</span>
<span class="hljs-title function_">truncateText</span>(<span class="hljs-string">&#x27;A😀&#x27;</span>, <span class="hljs-number">2</span>); <span class="hljs-comment">// &#x27;A😀&#x27;，刚好两个，不加省略号</span>
<span class="hljs-title function_">truncateText</span>(<span class="hljs-string">&#x27;你好世界&#x27;</span>, <span class="hljs-number">2</span>); <span class="hljs-comment">// &#x27;你好…&#x27;</span>
</code></pre></div>
<p><code>part.index</code> 是原字符串里的 UTF-16 下标，可以直接交给 <code>slice</code>。循环找到截断点就返回，不必把整段文本转成数组。</p>
<p>这里 <code>limit</code> 是保留的原文字素簇数，省略号不计入；<code>limit</code> 为 0 且文本非空时只返回省略号。产品要求总长度包含省略号时，要另外定义额度。HTML 摘要不能按源码截断，否则会切坏标签和实体，先提取纯文本再处理。</p>
<p>没有 <code>Intl.Segmenter</code> 时可以用维护中的兼容实现。<code>Array.from</code> 只按码点切割，会拆散组合字符和 emoji 序列，不能当作字素簇的降级方案。</p>
<h2>分词</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> words = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;word&#x27;</span> });
[...words.<span class="hljs-title function_">segment</span>(<span class="hljs-string">&#x27;Hello, world!&#x27;</span>)]
  .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">isWordLike</span>)
  .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> ({ <span class="hljs-attr">text</span>: s.<span class="hljs-property">segment</span>, <span class="hljs-attr">index</span>: s.<span class="hljs-property">index</span> }));
<span class="hljs-comment">// [{ text: &#x27;Hello&#x27;, index: 0 }, { text: &#x27;world&#x27;, index: 7 }]</span>

<span class="hljs-keyword">const</span> zh = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;zh&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;word&#x27;</span> });
[...zh.<span class="hljs-title function_">segment</span>(<span class="hljs-string">&#x27;我喜欢国际化&#x27;</span>)].<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">isWordLike</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">segment</span>);
<span class="hljs-comment">// [&#x27;我&#x27;, &#x27;喜欢&#x27;, &#x27;国际&#x27;, &#x27;化&#x27;]（结果取决于运行时的分词数据）</span>
</code></pre></div>
<p>分词结果依赖运行时的语言数据，不保证符合业务词典或搜索引擎的切词规则。</p>
<p><code>granularity: &#x27;sentence&#x27;</code> 按句子切分，缩写、引号和复杂标点要用目标语言的样本验证。</p>
<p>做搜索高亮时，用 <code>index</code> 和 <code>segment.length</code> 定位原文区间，用文本节点和 <code>&lt;mark&gt;</code> 渲染，不要拼进 <code>innerHTML</code>。如果匹配前做了大小写折叠或规范化，字符串长度可能变化，要维护新旧位置的映射，不能用新字符串的下标切原文。</p>
<h2>规范化</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> composed = <span class="hljs-string">&#x27;\\u00E9&#x27;</span>;
<span class="hljs-keyword">const</span> decomposed = <span class="hljs-string">&#x27;e\\u0301&#x27;</span>;
composed === decomposed; <span class="hljs-comment">// false</span>
composed.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>) === decomposed.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>规范化只处理 Unicode 规定的等价写法，不会把西里尔字母 <code>а</code> 和拉丁字母 <code>a</code> 当成同一个字符，防范仿冒用户名要另外检查。</p>
<h2>常见追问</h2>
<ul>
<li><strong>输入框实时限制长度会有什么问题？</strong> 中文输入法组合过程中（<code>compositionstart</code> 到 <code>compositionend</code>）不要截断，否则会打断输入。</li>
<li><strong><code>Intl.Segmenter</code> 能决定文字在屏幕上占多宽吗？</strong> 不能。宽度由字体和渲染决定，要测量实际布局。</li>
</ul>`};export{e as default};