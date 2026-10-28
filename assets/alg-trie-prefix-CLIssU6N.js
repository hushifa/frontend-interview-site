var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Trie 的每条边是一个字符，从根到某个节点的路径就是一个前缀；节点上的 <code>terminal</code> 标记区分&quot;这是一个完整的词&quot;和&quot;只是路径经过&quot;。</li>
<li>判断前缀是否存在只需走 m 步（m 是前缀长度），与词条总数无关；列出所有建议还要遍历该前缀下的子树。</li>
<li>重复插入同一个词不会新增节点，只需检查 <code>terminal</code> 是否已经为 <code>true</code>。</li>
<li>插入和查询前都用 <code>normalize(&#x27;NFC&#x27;)</code> 归一化，否则字形相同的 <code>café</code> 可能有两种编码；用 <code>for...of</code> 按码点遍历，避免把 emoji 的代理对拆开。</li>
<li>词条只有几百个时，<code>filter</code> 加 <code>startsWith</code> 已经足够快；需要容错、拼写纠正或子串匹配时，应使用模糊搜索库或倒排索引。</li>
</ul>
<h2>实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">Trie</span> {
  #root = { <span class="hljs-attr">terminal</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">children</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>() };

  #<span class="hljs-title function_">normalize</span>(<span class="hljs-params">word</span>) {
    <span class="hljs-keyword">return</span> word.<span class="hljs-title function_">normalize</span>(<span class="hljs-string">&#x27;NFC&#x27;</span>).<span class="hljs-title function_">toLocaleLowerCase</span>(<span class="hljs-string">&#x27;en&#x27;</span>);
  }

  <span class="hljs-title function_">insert</span>(<span class="hljs-params">word</span>) {
    <span class="hljs-keyword">const</span> key = <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">normalize</span>(word);
    <span class="hljs-keyword">if</span> (key === <span class="hljs-string">&#x27;&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    <span class="hljs-keyword">let</span> node = <span class="hljs-variable language_">this</span>.#root;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> key) {
      <span class="hljs-keyword">if</span> (!node.<span class="hljs-property">children</span>.<span class="hljs-title function_">has</span>(char)) {
        node.<span class="hljs-property">children</span>.<span class="hljs-title function_">set</span>(char, { <span class="hljs-attr">terminal</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">children</span>: <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>() });
      }
      node = node.<span class="hljs-property">children</span>.<span class="hljs-title function_">get</span>(char);
    }
    <span class="hljs-keyword">if</span> (node.<span class="hljs-property">terminal</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
    node.<span class="hljs-property">terminal</span> = <span class="hljs-literal">true</span>;
    <span class="hljs-comment">// 保存原始写法，用于展示。</span>
    node.<span class="hljs-property">word</span> = word;
    <span class="hljs-keyword">return</span> <span class="hljs-literal">true</span>;
  }

  #<span class="hljs-title function_">find</span>(<span class="hljs-params">prefix</span>) {
    <span class="hljs-keyword">let</span> node = <span class="hljs-variable language_">this</span>.#root;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> char <span class="hljs-keyword">of</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">normalize</span>(prefix)) {
      node = node.<span class="hljs-property">children</span>.<span class="hljs-title function_">get</span>(char);
      <span class="hljs-keyword">if</span> (!node) <span class="hljs-keyword">return</span> <span class="hljs-literal">undefined</span>;
    }
    <span class="hljs-keyword">return</span> node;
  }

  <span class="hljs-title function_">has</span>(<span class="hljs-params">word</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">find</span>(word)?.<span class="hljs-property">terminal</span> === <span class="hljs-literal">true</span>;
  }

  <span class="hljs-title function_">suggest</span>(<span class="hljs-params">prefix, limit = <span class="hljs-number">5</span></span>) {
    <span class="hljs-keyword">const</span> start = <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">find</span>(prefix);
    <span class="hljs-keyword">if</span> (!start) <span class="hljs-keyword">return</span> [];
    <span class="hljs-keyword">const</span> result = [];
    <span class="hljs-keyword">const</span> stack = [start];
    <span class="hljs-keyword">while</span> (stack.<span class="hljs-property">length</span> &gt; <span class="hljs-number">0</span> &amp;&amp; result.<span class="hljs-property">length</span> &lt; limit) {
      <span class="hljs-keyword">const</span> node = stack.<span class="hljs-title function_">pop</span>();
      <span class="hljs-keyword">if</span> (node.<span class="hljs-property">terminal</span>) result.<span class="hljs-title function_">push</span>(node.<span class="hljs-property">word</span>);
      <span class="hljs-comment">// 反向入栈，让字符较小的子节点先被访问，结果按字典序输出。</span>
      <span class="hljs-keyword">const</span> children = [...node.<span class="hljs-property">children</span>].<span class="hljs-title function_">sort</span>(<span class="hljs-function">(<span class="hljs-params">[a], [b]</span>) =&gt;</span> (a &lt; b ? <span class="hljs-number">1</span> : -<span class="hljs-number">1</span>));
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> [, child] <span class="hljs-keyword">of</span> children) stack.<span class="hljs-title function_">push</span>(child);
    }
    <span class="hljs-keyword">return</span> result;
  }
}

<span class="hljs-keyword">const</span> commands = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Trie</span>();
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> word <span class="hljs-keyword">of</span> [<span class="hljs-string">&#x27;Open File&#x27;</span>, <span class="hljs-string">&#x27;Open Folder&#x27;</span>, <span class="hljs-string">&#x27;Open Recent&#x27;</span>, <span class="hljs-string">&#x27;Save&#x27;</span>, <span class="hljs-string">&#x27;Open File&#x27;</span>]) {
  commands.<span class="hljs-title function_">insert</span>(word);
}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(commands.<span class="hljs-title function_">suggest</span>(<span class="hljs-string">&#x27;open f&#x27;</span>)); <span class="hljs-comment">// [&#x27;Open File&#x27;, &#x27;Open Folder&#x27;]</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(commands.<span class="hljs-title function_">has</span>(<span class="hljs-string">&#x27;open&#x27;</span>)); <span class="hljs-comment">// false，只是前缀</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(commands.<span class="hljs-title function_">suggest</span>(<span class="hljs-string">&#x27;x&#x27;</span>)); <span class="hljs-comment">// []</span>
</code></pre></div>
<p>第二次插入 <code>Open File</code> 返回 <code>false</code>，不会产生重复建议。<code>limit</code> 让遍历在找够建议后停止，前缀很短、词条很多时也不会遍历整棵子树。</p>
<h2>Unicode 的两个问题</h2>
<table><thead><tr><th>问题</th><th>例子</th><th>处理</th></tr></thead><tbody><tr><td>同一个字形有多种编码</td><td><code>é</code> 可以是一个码点，也可以是 <code>e</code> 加组合重音符</td><td>插入和查询都做 NFC 归一化</td></tr><tr><td>一个字符占两个 UTF-16 码元</td><td><code>&#x27;👍🏽&#x27;.length</code> 是 4，<code>[...&#x27;👍🏽&#x27;].length</code> 是 2</td><td>用 <code>for...of</code> 按码点遍历</td></tr></tbody></table>
<p>肤色修饰的 emoji 由两个码点组成，按码点遍历仍会拆成两条边，对前缀匹配没有影响。需要按用户感知的字符计数时，用 <code>Intl.Segmenter</code>。大小写转换固定了 <code>en</code> 区域，避免土耳其语环境下 <code>I</code> 转成无点的 <code>ı</code>。</p>
<h2>什么时候不用 Trie</h2>
<ul>
<li>词条少：线性 <code>startsWith</code> 实现简单，几百条数据的耗时可以忽略。</li>
<li>需要按热度或最近使用排序：Trie 只能按字典序遍历，要在节点上额外存储权重，或者取出候选后再排序。</li>
<li>需要模糊匹配：用户输入 <code>opn fl</code> 也想匹配 <code>Open File</code>，这需要子序列匹配或编辑距离，VS Code 的命令面板就是这样。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>空间复杂度？</strong> 最坏是所有词条字符数之和。共享前缀越多越省；中文这类字符集大、前缀共享少的场景，节点数接近总字符数。</li>
<li><strong>怎样删除词条？</strong> 把 <code>terminal</code> 改为 <code>false</code>，再从下往上删除没有子节点、也不是词尾的节点。</li>
</ul>`};export{e as default};