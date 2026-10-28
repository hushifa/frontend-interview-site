var e={answerHtml:`<p>文本框只有几百字时，<code>value = value.slice(0, index) + insert + value.slice(index)</code> 很简单；当文件达到几十 MB、用户持续输入、需要撤销和语法分析时，每次修改都复制整串内容会产生越来越大的分配和 GC 压力。</p>
<p>编辑器要同时处理文本存储、光标位置、撤销历史、行索引、增量解析和可视区域渲染。没有一种数据结构能自动解决所有问题，先明确哪种操作最频繁，再选择表示。</p>
<h2>常见表示各有代价</h2>
<table><thead><tr><th>表示</th><th>优点</th><th>主要问题</th></tr></thead><tbody><tr><td>单个字符串</td><td>简单、查找和序列化直接</td><td>中间插入/删除需要复制大量内容</td></tr><tr><td>字符数组</td><td>局部修改直观</td><td>单个字符的数组元素和移动成本很高</td></tr><tr><td>Piece Table</td><td>原始文本不可变，修改只追加描述片段</td><td>查找和索引需要维护片段结构</td></tr><tr><td>Rope</td><td>用树组织字符串片段，中间修改可控制</td><td>实现、平衡、行列索引和序列化更复杂</td></tr></tbody></table>
<p>JavaScript 字符串按 UTF-16 码元索引，用户看到的字素簇、编辑器列号和字节偏移不是同一个单位。中文、Emoji、组合字符和换行符都要在编辑模型中明确约定，不能直接把 <code>string.length</code> 当作用户光标列。</p>
<h2>Piece Table 为什么适合编辑器</h2>
<p>Piece Table 保存一份不可变的原始缓冲区和一份只追加的新文本缓冲区，当前文档由一串 piece 描述：每个 piece 指向哪个缓冲区、起点和长度。插入操作不复制旧文本，只追加新文本并调整 piece 序列；删除通常只是拆分或移除描述。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">PieceTable</span> {
  <span class="hljs-title function_">constructor</span>(<span class="hljs-params">text = <span class="hljs-string">&#x27;&#x27;</span></span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> text !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;初始内容必须是字符串&#x27;</span>);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">original</span> = text;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">added</span> = <span class="hljs-string">&#x27;&#x27;</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span> = text ? [{ <span class="hljs-attr">buffer</span>: <span class="hljs-string">&#x27;original&#x27;</span>, <span class="hljs-attr">start</span>: <span class="hljs-number">0</span>, <span class="hljs-attr">length</span>: text.<span class="hljs-property">length</span> }] : [];
  }

  <span class="hljs-title function_">read</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">piece</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> source = piece.<span class="hljs-property">buffer</span> === <span class="hljs-string">&#x27;original&#x27;</span> ? <span class="hljs-variable language_">this</span>.<span class="hljs-property">original</span> : <span class="hljs-variable language_">this</span>.<span class="hljs-property">added</span>;
      <span class="hljs-keyword">return</span> source.<span class="hljs-title function_">slice</span>(piece.<span class="hljs-property">start</span>, piece.<span class="hljs-property">start</span> + piece.<span class="hljs-property">length</span>);
    }).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  }

  <span class="hljs-title function_">insert</span>(<span class="hljs-params">offset, text</span>) {
    <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(offset) || offset &lt; <span class="hljs-number">0</span> || offset &gt; <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">length</span>()) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;插入位置超出范围&#x27;</span>);
    }
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> text !== <span class="hljs-string">&#x27;string&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;插入内容必须是字符串&#x27;</span>);
    <span class="hljs-keyword">if</span> (text.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">const</span> addStart = <span class="hljs-variable language_">this</span>.<span class="hljs-property">added</span>.<span class="hljs-property">length</span>;
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">added</span> += text;
    <span class="hljs-keyword">const</span> inserted = { <span class="hljs-attr">buffer</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">start</span>: addStart, <span class="hljs-attr">length</span>: text.<span class="hljs-property">length</span> };
    <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">splitAt</span>(offset);
    <span class="hljs-keyword">const</span> index = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">boundaryIndex</span>(offset);
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">splice</span>(index, <span class="hljs-number">0</span>, inserted);
  }

  <span class="hljs-title function_">length</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">reduce</span>(<span class="hljs-function">(<span class="hljs-params">total, piece</span>) =&gt;</span> total + piece.<span class="hljs-property">length</span>, <span class="hljs-number">0</span>);
  }

  <span class="hljs-title function_">boundaryIndex</span>(<span class="hljs-params">offset</span>) {
    <span class="hljs-keyword">let</span> cursor = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-property">length</span>; index += <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">if</span> (cursor === offset) <span class="hljs-keyword">return</span> index;
      cursor += <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>[index].<span class="hljs-property">length</span>;
    }
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-property">length</span>;
  }

  <span class="hljs-title function_">splitAt</span>(<span class="hljs-params">offset</span>) {
    <span class="hljs-keyword">let</span> cursor = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>; index &lt; <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-property">length</span>; index += <span class="hljs-number">1</span>) {
      <span class="hljs-keyword">const</span> piece = <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>[index];
      <span class="hljs-keyword">const</span> end = cursor + piece.<span class="hljs-property">length</span>;
      <span class="hljs-keyword">if</span> (offset &lt;= cursor || offset &gt;= end) {
        cursor = end;
        <span class="hljs-keyword">continue</span>;
      }
      <span class="hljs-keyword">const</span> left = { ...piece, <span class="hljs-attr">length</span>: offset - cursor };
      <span class="hljs-keyword">const</span> right = { ...piece, <span class="hljs-attr">start</span>: piece.<span class="hljs-property">start</span> + left.<span class="hljs-property">length</span>, <span class="hljs-attr">length</span>: end - offset };
      <span class="hljs-variable language_">this</span>.<span class="hljs-property">pieces</span>.<span class="hljs-title function_">splice</span>(index, <span class="hljs-number">1</span>, left, right);
      <span class="hljs-keyword">return</span>;
    }
  }
}
</code></pre></div>
<p>这段代码用字符串拼接实现 <code>read()</code>，是教学实现而不是生产编辑器；它展示了原始缓冲区和追加缓冲区的所有权关系。真实 Piece Table 通常还会用树或索引结构，让按偏移查找和修改不必每次扫描全部 piece。</p>
<p>这里 offset、start 和 length 全部按 UTF-16 码元计量，不会阻止调用方把插入位置放在代理对或字素簇中间。编辑器输入层必须先把合法光标位置映射到这一单位。不要改成 Array.from(text).length 后继续使用 slice 的码元索引，两套单位混用反而会损坏位置。</p>
<p>此外，added += text 在 JavaScript 中仍然是字符串拼接，具体复制与内部表示由引擎决定。本例并没有实现真正分块、只追加而不复制的底层缓冲，因此不能拿它证明大量编辑是常数时间。length、splitAt、boundaryIndex 和数组 splice 也会扫描或移动 piece；只演示结构关系，不宣称实现了 VS Code 的平衡树性能。</p>
<h2>不能只看插入复杂度</h2>
<p>即使 piece 修改本身很快，以下工作仍可能成为瓶颈：把片段拼成完整字符串、按行建立索引、语法高亮、诊断、搜索、撤销记录和发送协同操作。编辑器通常维护增量行索引和可视区缓存，避免每次输入都重新解析整份文件。</p>
<p>撤销历史可以保存操作（位置、删除文本、插入文本）或保存结构快照。只保存完整字符串会复制大量内存；只保存操作则要定义合并连续输入、光标移动、撤销边界和历史清理。历史记录不是无上限日志，应设置大小、时间和用户操作边界。</p>
<h2>Rope 适合频繁的大范围文本操作</h2>
<p>Rope 用平衡树组织多个字符串叶子，插入或删除通常只影响从根到相关叶子的路径，读取整篇文本再拼接时则需要遍历树。树不平衡、叶子过小或过大都会影响性能；光标偏移、行号和 UTF-16/字素簇索引需要额外维护。</p>
<p>选择 Rope 不是为了让每一个小输入都更快。短文本的树管理开销可能比原生字符串更大；应根据文件规模、编辑频率、搜索和解析需求做基准测试。</p>
<h2>存储模型和 DOM 渲染必须分开</h2>
<p>编辑器不应把每个字符都渲染成一个 DOM 节点。常见做法是只渲染可视行，使用行缓存和测量结果；文本输入可以使用隐藏 textarea 或受控输入层，把光标和选区映射到编辑模型。虚拟化会影响浏览器查找、复制、打印和屏幕阅读器，需要提供合理降级。</p>
<p>输入法组合、Emoji、双向文字和换行规范化都要经过模型处理。<code>compositionstart</code> 到 <code>compositionend</code> 期间不要把每个中间值都当成最终编辑操作，否则会打断中文输入或产生错误撤销记录。</p>
<h2>协同编辑又是另一层</h2>
<p>Piece Table 或 Rope 解决本地文本编辑效率，不自动解决多用户并发。协同还需要操作 ID、版本、OT/CRDT、离线队列、权限和冲突恢复。把本地 piece 数组直接广播给其他客户端，既浪费带宽，也没有定义并发合并语义。</p>
<p>最终选型应同时测量：插入/删除延迟、长文件内存、撤销成本、搜索和语法解析、可视区滚动、输入法、复制打印和协同同步。编辑器的数据结构是内核的一部分，不能只因为一个字符串示例更容易写，就把整份真实文档复制到每次按键的事件里。</p>`};export{e as default};