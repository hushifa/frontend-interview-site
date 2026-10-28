var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Intl.Segmenter 按字素簇、词或句切分文本，比 string.length 更接近用户看到的字符。</li>
<li>截断摘要时按字素簇截断，避免拆散 emoji 或组合字符。</li>
<li>按词切分的结果里包含空格和标点，可以用 isWordLike 区分。</li>
<li>高亮时使用原字符串的 index；它不负责排版宽度和换行。</li>
</ul>
<p>Intl.Segmenter 根据语言和指定粒度划分字符串。它适合处理两个经常被简单切割弄错的需求：摘要不能截断一个 emoji，统计词数不能只按空格拆分。</p>
<p>它支持 grapheme、word、sentence 三种粒度，分别接近字素簇、词边界和句子边界。选择哪一种取决于功能，不是精度越细越好。</p>
<h2>截断摘要时保留完整字素簇</h2>
<p>下面把 limit 定义为“保留多少个原文字素簇”，省略号不计入这个额度：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> graphemes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, {
  <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;grapheme&#x27;</span>,
});

<span class="hljs-keyword">function</span> <span class="hljs-title function_">truncateText</span>(<span class="hljs-params">text, limit</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(limit) || limit &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;保留数量必须是非负整数&#x27;</span>);
  }

  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> part <span class="hljs-keyword">of</span> graphemes.<span class="hljs-title function_">segment</span>(text)) {
    <span class="hljs-keyword">if</span> (count === limit) {
      <span class="hljs-keyword">return</span> text.<span class="hljs-title function_">slice</span>(<span class="hljs-number">0</span>, part.<span class="hljs-property">index</span>) + <span class="hljs-string">&#x27;…&#x27;</span>;
    }
    count += <span class="hljs-number">1</span>;
  }
  <span class="hljs-keyword">return</span> text;
}

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">truncateText</span>(<span class="hljs-string">&#x27;A👨‍👩‍👧‍👦B&#x27;</span>, <span class="hljs-number">2</span>)); <span class="hljs-comment">// A👨‍👩‍👧‍👦…</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">truncateText</span>(<span class="hljs-string">&#x27;A😀&#x27;</span>, <span class="hljs-number">2</span>)); <span class="hljs-comment">// A😀</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title function_">truncateText</span>(<span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-number">0</span>)); <span class="hljs-comment">// 空字符串</span>
</code></pre></div>
<p>遇到第 limit + 1 个片段，才确定需要省略号；长度刚好等于 limit 时不额外添加。part.index 是原字符串的 UTF-16 下标，可以直接交给 slice，避免自己累加时混淆码点和码元。</p>
<p>这个循环不必先把整段文本转换为数组，找到截断点就能结束。limit 为 0 且文本非空时返回省略号；若产品希望总长度包含省略号，应另外定义额度，不能在实现后让用户猜规则。</p>
<h2>按词分割时还会得到空格和标点</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> words = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;word&#x27;</span> });
<span class="hljs-keyword">const</span> result = [...words.<span class="hljs-title function_">segment</span>(<span class="hljs-string">&#x27;Hello, world!&#x27;</span>)]
  .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">part</span>) =&gt;</span> part.<span class="hljs-property">isWordLike</span>)
  .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">part</span>) =&gt;</span> ({ <span class="hljs-attr">text</span>: part.<span class="hljs-property">segment</span>, <span class="hljs-attr">index</span>: part.<span class="hljs-property">index</span> }));

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result);
<span class="hljs-comment">// [{ text: &#x27;Hello&#x27;, index: 0 }, { text: &#x27;world&#x27;, index: 7 }]</span>
</code></pre></div>
<p>segment 返回可迭代结果，包含片段文本、起始位置以及原字符串等信息。word 粒度还提供 isWordLike，用来区分常见的词样片段与空白、标点；不能把所有片段数量直接当词数。</p>
<p>中文、日文、泰文等语言不依赖空格分隔每个词，Segmenter 比 split(&#x27; &#x27;) 更适合做语言相关边界处理。不过分词依赖运行时语言数据，不是理解句意的自然语言模型，也不能保证符合某个业务词典或搜索引擎的切词规则。</p>
<h2>高亮时保留原始片段与索引</h2>
<p>如果根据词边界构建搜索高亮，使用片段的 index 和 segment.length 对应原字符串范围，不要先删除标点或规范化全文后，再拿新字符串的下标切旧字符串。</p>
<p>大小写折叠、Unicode 规范化和字符替换可能改变匹配方式甚至长度。若业务先做这些转换，应维护位置映射，或者选择能保留原始范围的搜索方案。</p>
<p>渲染高亮应输出文本节点和明确的标记元素，不要把用户文本拼进 innerHTML。Segmenter 负责划分，不负责 HTML 转义或净化。</p>
<h2>它不负责所有文字布局问题</h2>
<p>sentence 粒度用于句子边界，但缩写、引用和复杂标点仍需结合目标语言样本验证。grapheme 分割也不保证某段文字能放进固定宽度容器，字符宽度、字体和换行属于排版问题。</p>
<p>对 HTML 摘要，不能把整段源码直接分割后截断，否则可能把标签或实体切坏。可以先提取纯文本，或者使用理解 DOM 结构的摘要策略。</p>
<p>浏览器支持及 Unicode/ICU 数据版本也要核对。缺少原生支持时可以使用维护的兼容实现；Array.from 只能提供码点级切割，不能宣称是等价的字素簇降级。测试应覆盖组合重音、肤色 emoji、连接 emoji 和目标语言的实际词句。</p>`};export{e as default};