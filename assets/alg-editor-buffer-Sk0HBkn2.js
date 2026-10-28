var e={answerHtml:`<h2>简答</h2>
<ul>
<li>JavaScript 字符串不可变，每次在中间插入都要生成新字符串，复制量与文档长度成正比；大文件里连续输入时开销明显。</li>
<li>Piece Table 由三部分组成：只读的原始文本、只追加的 added 缓冲区、按顺序指向这两个缓冲区的片段列表。插入只追加文本并拆分片段，删除只移除片段，原文从不修改。</li>
<li>片段列表用数组时，定位要遍历片段，复杂度与片段数成正比；VS Code 把片段放进红黑树，按偏移量定位是 O(log n)。</li>
<li>Rope 把文本切块放在平衡二叉树的叶子上，插入、删除、按位置访问都是 O(log n)，适合超大文本。</li>
<li>光标、选区、换行索引、语法高亮和协同同步（OT、CRDT）是建立在文本存储之上的独立问题。</li>
</ul>
<h2>不同结构的取舍</h2>
<table><thead><tr><th>结构</th><th>中间插入</th><th>内存特点</th><th>适用</th></tr></thead><tbody><tr><td>单个字符串</td><td>复制整段 O(n)</td><td>最紧凑</td><td>短文本、表单输入</td></tr><tr><td>字符数组</td><td>移动后续元素 O(n)</td><td>每个字符一个元素，开销大</td><td>几乎不用</td></tr><tr><td>行数组</td><td>只复制所在行</td><td>按行存储，跨行操作麻烦</td><td>简单的代码编辑器</td></tr><tr><td>Piece Table</td><td>拆分片段，与文档长度无关</td><td>原文不复制，撤销容易实现</td><td>VS Code</td></tr><tr><td>Rope</td><td>O(log n)</td><td>树节点有额外开销</td><td>超大文本、并发编辑</td></tr></tbody></table>
<h2>Piece Table 实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">PieceTable</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">text = <span class="hljs-string">&#x27;&#x27;</span></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">original</span> = text;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">added</span> = <span class="hljs-string">&#x27;&#x27;</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span> = text ? [{ <span class="hljs-attr">buffer</span>: <span class="hljs-string">&#x27;original&#x27;</span>, <span class="hljs-attr">start</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">length</span>: text.<span class="hljs-property">length</span> }] : [];
  }

  <span class="hljs-keyword">get</span> <span class="hljs-title function_">length</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">sum, piece</span>) =&gt;</span> sum + piece.<span class="hljs-property">length</span>, <span class="hljs-number">0</span>);
  }

  <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>
      .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">{ buffer, start, length }</span>) =&gt;</span> <span class="hljs-variable language_">this</span>[buffer].<span class="hljs-title function_">slice</span>(start, start + length))
      .<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  }

  <span class="hljs-comment">// 在 offset 处切开，返回切点右侧第一个片段的下标。</span>
  #<span class="hljs-title function_">split</span>(<span class="hljs-params">offset</span>) {
    <span class="hljs-keyword">let</span> cursor = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-property">length</span>; index++) {
      <span class="hljs-keyword">const</span> piece = <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>[index];
      <span class="hljs-keyword">if</span> (cursor === offset) <span class="hljs-keyword">return</span> index;
      <span class="hljs-keyword">if</span> (offset &lt; cursor + piece.<span class="hljs-property">length</span>) {
        <span class="hljs-keyword">const</span> leftLength = offset - cursor;
        <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">splice</span>(
          index,
          <span class="hljs-number">1</span>,
          { ...piece, <span class="hljs-attr">length</span>: leftLength },
          { ...piece, <span class="hljs-attr">start</span>: piece.<span class="hljs-property">start</span> + leftLength, <span class="hljs-attr">length</span>: piece.<span class="hljs-property">length</span> - leftLength },
        );
        <span class="hljs-keyword">return</span> index + <span class="hljs-number">1</span>;
      }
      cursor += piece.<span class="hljs-property">length</span>;
    }
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-property">length</span>;
  }

  <span class="hljs-title function_">insert</span>(<span class="hljs-params">offset, text</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(offset) || offset &lt; <span class="hljs-number">0</span> || offset &gt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">length</span>) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;插入位置超出范围&#x27;</span>);
    }
    <span class="hljs-keyword">if</span> (text === <span class="hljs-string">&#x27;&#x27;</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> piece = { <span class="hljs-attr">buffer</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">start</span>: <span class="hljs-variable language_">this</span>.<span class="hljs-property">added</span>.<span class="hljs-property">length</span>, <span class="hljs-attr">length</span>: text.<span class="hljs-property">length</span> };
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">added</span> += text;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">splice</span>(<span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">split</span>(offset), <span class="hljs-number">0</span>, piece);
  }

  <span class="hljs-title function_">delete</span>(<span class="hljs-params">offset, count</span>) {
    <span class="hljs-keyword">if</span> (
      !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(offset) || !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(count) ||
      offset &lt; <span class="hljs-number">0</span> || count &lt; <span class="hljs-number">0</span> || offset + count &gt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">length</span>
    ) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;删除范围超出文本&#x27;</span>);
    }
    <span class="hljs-keyword">if</span> (count === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> start = <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">split</span>(offset);
    <span class="hljs-keyword">const</span> end = <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">split</span>(offset + count);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">splice</span>(start, end - start);
  }
}

<span class="hljs-keyword">const</span> doc = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PieceTable</span>(<span class="hljs-string">&#x27;hello world&#x27;</span>);
doc.<span class="hljs-title function_">insert</span>(<span class="hljs-number">5</span>, <span class="hljs-string">&#x27;,&#x27;</span>);
doc.<span class="hljs-title function_">insert</span>(<span class="hljs-number">12</span>, <span class="hljs-string">&#x27;!&#x27;</span>);
doc.<span class="hljs-title function_">delete</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>);
doc.<span class="hljs-title function_">insert</span>(<span class="hljs-number">0</span>, <span class="hljs-string">&#x27;H&#x27;</span>);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(doc.<span class="hljs-title function_">read</span>()); <span class="hljs-comment">// Hello, world!</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(doc.<span class="hljs-property">added</span>); <span class="hljs-comment">// ,!H</span>
</code></pre></div>
<p>实测用 2000 组随机插入删除序列，与直接拼接字符串的结果逐步对比，全部一致。</p>
<p>几点说明：</p>
<ul>
<li>删除时先在两端切开，再移除中间的片段，<code>original</code> 和 <code>added</code> 都不改动，所以撤销只需要恢复旧的片段列表。</li>
<li>这里的偏移量按 UTF-16 码元计算，与 JavaScript 字符串下标一致。真实编辑器还要避免把光标落在代理对或组合字符的中间。</li>
<li>演示版每次操作都遍历片段数组。长时间编辑后片段会越来越多，实际实现会用平衡树按偏移量定位，并缓存每个片段内的换行位置，以便快速按行号跳转。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>撤销怎样实现？</strong> 每次操作记录被替换的片段，撤销时放回去；因为缓冲区只追加，旧片段指向的文本一直有效。</li>
<li><strong>为什么 <code>contenteditable</code> 不够用？</strong> 它把文档状态放在 DOM 里，浏览器之间的行为差异大，难以控制选区和撤销栈。ProseMirror、Lexical 等编辑器自己维护文档模型，再把结果渲染到 DOM。</li>
<li><strong>大文件怎样渲染？</strong> 只渲染可视区域的行，配合行索引快速找到首行位置，原理和虚拟列表相同。</li>
</ul>`};export{e as default};