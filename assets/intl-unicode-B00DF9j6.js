var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>&#x27;😀&#x27;.length</code> 是 2，一个全家福 emoji <code>&#x27;👨‍👩‍👧‍👦&#x27;.length</code> 是 11，可它们在屏幕上都只是一个字符。因为 <code>length</code> 数的是 UTF-16 码元，不是用户看到的字符。</p>
<p>所以“字符”至少有四种数法。UTF-16 码元是 <code>length</code> 和 <code>slice</code> 用的；码点是 <code>[...text]</code> 遍历出来的；字素簇是用户眼里的一个字符；UTF-8 字节是存储和传输时的大小。</p>
<p>按“看得见的字符”截断，要用 <code>Intl.Segmenter</code> 的 <code>grapheme</code> 粒度。<code>slice</code> 可能把一个 emoji 从中间切开，<code>[...text]</code> 也可能拆散组合字符和 emoji 序列。中文、日文、泰文词之间没有空格，分词也用 <code>Intl.Segmenter</code>，选 <code>word</code> 粒度并过滤 <code>isWordLike</code>。</p>
<p>还要注意，<code>&#x27;\\u00E9&#x27;</code> 和 <code>&#x27;e\\u0301&#x27;</code> 都显示成 é，但并不相等，比较或去重前要先 <code>normalize(&#x27;NFC&#x27;)</code>。</p>
</blockquote>
<h2>四种数法差多少</h2>
<p>下面对几个字符串分别数码元、码点和字素簇，再数一个汉字的字节。结果是 Node 22 实测的。</p>
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
<p>为什么 <code>😀</code> 的 <code>length</code> 是 2？它的编号超出了 UTF-16 一个码元能表示的范围，只好用两个码元拼起来，这两个码元叫代理对。</p>
<p><code>&#x27;e\\u0301&#x27;</code> 是字母 e 加上一个组合用的重音符号，两个码点，显示出来是一个 é。全家福更夸张，是四个人的 emoji 用三个连接符拼在一起，一共 7 个码点、11 个码元。浏览器把这些拼在一起显示的整体，叫字素簇，也就是用户眼里的“一个字”。</p>
<p>所以做“昵称最多 20 个字符”这种限制时，先定义清楚字符指的是字素簇，前后端用同一套规则校验。数据库字段按字节限制时，就用 <code>TextEncoder</code> 数字节。</p>
<h2>怎样按字素簇截断</h2>
<p>下面截取前几个看得见的字符，超出时加省略号。</p>
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
<p>全家福被完整保留了，没有被切成半个。这是因为 <code>part.index</code> 是每个字素簇在原字符串里的 UTF-16 下标，交给 <code>slice</code> 时正好落在字素簇的边界上。找到截断点就直接返回，不用把整段文本先转成数组。</p>
<p>这里的 <code>limit</code> 是保留的原文字素簇数，省略号不算在内；<code>limit</code> 为 0 且文本非空时，只返回一个省略号。如果产品要求总长度包含省略号，要另外算额度。HTML 摘要也不能按源码截断，否则会切坏标签和实体，要先提取纯文本再处理。</p>
<p>运行环境没有 <code>Intl.Segmenter</code> 时，可以用维护中的兼容实现。<code>Array.from</code> 只按码点切，会拆散组合字符和 emoji 序列，不能拿来当降级方案。</p>
<h2>怎样分词</h2>
<p>英文词之间有空格，中文没有，所以分词不能靠 <code>split(&#x27; &#x27;)</code>。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> words = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;en&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;word&#x27;</span> });
[...words.<span class="hljs-title function_">segment</span>(<span class="hljs-string">&#x27;Hello, world!&#x27;</span>)]
  .<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">isWordLike</span>)
  .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> ({ <span class="hljs-attr">text</span>: s.<span class="hljs-property">segment</span>, <span class="hljs-attr">index</span>: s.<span class="hljs-property">index</span> }));
<span class="hljs-comment">// [{ text: &#x27;Hello&#x27;, index: 0 }, { text: &#x27;world&#x27;, index: 7 }]</span>

<span class="hljs-keyword">const</span> zh = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Intl</span>.<span class="hljs-title class_">Segmenter</span>(<span class="hljs-string">&#x27;zh&#x27;</span>, { <span class="hljs-attr">granularity</span>: <span class="hljs-string">&#x27;word&#x27;</span> });
[...zh.<span class="hljs-title function_">segment</span>(<span class="hljs-string">&#x27;我喜欢国际化&#x27;</span>)].<span class="hljs-title function_">filter</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">isWordLike</span>).<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> s.<span class="hljs-property">segment</span>);
<span class="hljs-comment">// [&#x27;我&#x27;, &#x27;喜欢&#x27;, &#x27;国际&#x27;, &#x27;化&#x27;]（结果取决于运行时的分词数据）</span>
</code></pre></div>
<p><code>word</code> 粒度会把标点和空格也切出来，所以要用 <code>isWordLike</code> 过滤，只留下真正的词。</p>
<p>中文的结果把“国际化”切成了“国际”和“化”。分词靠的是运行时自带的语言数据，不保证符合业务词典或搜索引擎的切词规则。另外还有 <code>granularity: &#x27;sentence&#x27;</code> 按句子切分，碰到缩写、引号和复杂标点时，要拿目标语言的样本验证。</p>
<p>做搜索高亮时，用 <code>index</code> 和 <code>segment.length</code> 定位原文的区间，再用文本节点和 <code>&lt;mark&gt;</code> 渲染，不要拼进 <code>innerHTML</code>。如果匹配前做了大小写折叠或规范化，字符串长度可能会变，这时要维护新旧位置的对应关系，不能拿新字符串的下标去切原文。</p>
<h2>看起来一样的字符为什么不相等</h2>
<p>é 有两种写法：一个现成的码点，或者 e 加组合重音。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> composed = <span class="hljs-string">&#x27;\\u00E9&#x27;</span>;
<span class="hljs-keyword">const</span> decomposed = <span class="hljs-string">&#x27;e\\u0301&#x27;</span>;
composed === decomposed; <span class="hljs-comment">// false</span>
composed.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>) === decomposed.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>); <span class="hljs-comment">// true</span>
</code></pre></div>
<p>两种写法显示一样，<code>===</code> 却是 <code>false</code>，因为码点不同。<code>normalize(&#x27;NFC&#x27;)</code> 把它们统一成同一种写法，之后才能比较。</p>
<p>规范化只处理 Unicode 规定的等价写法。它不会把西里尔字母 <code>а</code> 和拉丁字母 <code>a</code> 当成同一个字符，要防范仿冒用户名，得另外检查。</p>
<h2>常见追问</h2>
<p><strong>输入框实时限制长度会有什么问题？</strong></p>
<blockquote>
<p>中文输入法正在组合拼音时，也就是 <code>compositionstart</code> 到 <code>compositionend</code> 之间，不要截断，否则会把用户的输入打断。等组合结束再检查长度。</p>
</blockquote>
<p><strong><code>Intl.Segmenter</code> 能算出文字在屏幕上占多宽吗？</strong></p>
<blockquote>
<p>不能。宽度由字体和渲染决定，它只管怎么切分，要知道宽度得测量实际布局。</p>
</blockquote>`};export{e as default};