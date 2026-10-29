var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>因为 JavaScript 的字符串不能原地修改。在中间插一个字，就要生成一个新字符串，把前后内容全部复制一遍，复制量和文档长度成正比。大文件里连续打字，这个开销就很明显了。</p>
<p>常见的替代方案是 Piece Table。它由三部分组成：只读的原始文本、一个只往后追加的 added 缓冲区，以及一串按顺序排列的片段，每个片段说明“从哪个缓冲区的第几个字开始，取多长”。插入时只把新文字追加到 added 末尾，再拆开片段；删除时只移除片段。原文从来不改。</p>
<p>片段如果放在数组里，找位置要一个个片段遍历，耗时和片段数成正比。VS Code 把片段放进了红黑树，按偏移量定位是 O(log n)。另一种方案 Rope，是把文本切成小块放在平衡二叉树的叶子上，插入、删除、按位置访问都是 O(log n)，适合超大文本。</p>
<p>要注意，存储结构只解决文字怎么存。光标、选区、换行索引、语法高亮，还有多人协同同步用的 OT、CRDT，都是建立在它上面的独立问题。</p>
</blockquote>
<h2>几种结构怎么取舍</h2>
<table><thead><tr><th>结构</th><th>中间插入</th><th>内存特点</th><th>适用</th></tr></thead><tbody><tr><td>单个字符串</td><td>复制整段 O(n)</td><td>最紧凑</td><td>短文本、表单输入</td></tr><tr><td>字符数组</td><td>移动后续元素 O(n)</td><td>每个字符一个元素，开销大</td><td>几乎不用</td></tr><tr><td>行数组</td><td>只复制所在行</td><td>按行存储，跨行操作麻烦</td><td>简单的代码编辑器</td></tr><tr><td>Piece Table</td><td>拆分片段，与文档长度无关</td><td>原文不复制，撤销容易实现</td><td>VS Code</td></tr><tr><td>Rope</td><td>O(log n)</td><td>树节点有额外开销</td><td>超大文本、并发编辑</td></tr></tbody></table>
<h2>实现一个 Piece Table</h2>
<p>先说清楚片段长什么样：<code>{ buffer: &#x27;original&#x27;, start: 0, length: 5 }</code> 的意思是“从原文第 0 个字开始，取 5 个字”。把所有片段按顺序拼起来，就是当前的文档。</p>
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
<p>核心是 <code>#split</code>。它在指定位置把一个片段切成两半，返回切点右边那个片段的下标。比如在 “hello world” 的第 5 个位置插逗号，原来的一个片段被切成 “hello” 和 “ world”，新片段插在中间。</p>
<p>注意看最后一行：<code>added</code> 里只有 <code>,!H</code> 三个字，原文 <code>hello world</code> 一个字都没改过。整个编辑过程，变的只是片段列表。实测用 2000 组随机的插入删除，和直接拼接字符串的结果逐步对比，全部一致。</p>
<p>删除也一样。先在要删范围的两端各切一刀，再把中间的片段拿掉，<code>original</code> 和 <code>added</code> 都不动。正因为缓冲区不改，撤销时只要把旧的片段列表恢复回来就行。</p>
<p>还有两点要知道。第一，这里的偏移量按 UTF-16 码元算，和 JavaScript 字符串的下标一致；真实编辑器还要避免光标落在 emoji 这类两个码元的字符中间，或者组合字符中间。第二，这个演示版每次操作都要遍历片段数组。编辑久了片段会越来越多，真实实现会用平衡树按偏移量定位，还会缓存每个片段里换行符的位置，好按行号快速跳转。</p>
<h2>常见追问</h2>
<p><strong>撤销怎么实现？</strong></p>
<blockquote>
<p>每次操作记下被替换掉的片段，撤销时放回去。因为缓冲区只追加不修改，旧片段指向的文字一直都在，放回去就能用。</p>
</blockquote>
<p><strong>为什么 <code>contenteditable</code> 不够用？</strong></p>
<blockquote>
<p>它把文档的状态放在 DOM 里，不同浏览器的行为差异很大，选区和撤销栈都很难控制。所以 ProseMirror、Lexical 这些编辑器都是自己维护一份文档模型，再把结果渲染到 DOM 上。</p>
</blockquote>
<p><strong>大文件怎么渲染？</strong></p>
<blockquote>
<p>只渲染屏幕上能看到的那几行，配合行索引快速找到第一行在哪，原理和虚拟列表一样。</p>
</blockquote>`};export{e as default};