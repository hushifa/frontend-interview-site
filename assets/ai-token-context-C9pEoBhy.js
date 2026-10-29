var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>因为这是三种不同的东西。<code>string.length</code> 数的是 UTF-16 码元，UTF-8 字节数是存储大小，Token 是模型的分词器把文字切出来的小块。同一段话换一个模型，Token 数也会变。</p>
<p>而且真正发给模型的请求，比输入框里的字长得多，系统提示、历史消息、工具定义、检索到的片段、图片都要算进去。</p>
<p>上下文窗口也不能全用来装输入，要给输出留出空间。历史太长要截断时，按整条消息删，工具调用和它的结果要么一起留、要么一起删。</p>
<p>要准确的数字，就用服务商的计数接口。费用以响应里的 <code>usage</code> 为准，因为输入、输出、缓存读写的单价都不一样。</p>
</blockquote>
<h2>先看三种长度为什么不一样</h2>
<p>下面这段代码可以直接用 node 运行，比较同一个字符串的两种长度：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> text = <span class="hljs-string">&#x27;你好😀&#x27;</span>;
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(text.<span class="hljs-property">length</span>); <span class="hljs-comment">// 4</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(text).<span class="hljs-property">length</span>); <span class="hljs-comment">// 10</span>
</code></pre></div>
<p>“你好😀”看起来是 3 个字，<code>length</code> 却是 4。原因是 😀 在 UTF-16 里要用两个码元表示，<code>length</code> 数的是码元，不是我们眼里的“字”。换成 UTF-8 字节，两个汉字各 3 字节，😀 是 4 字节，一共 10。</p>
<p>Token 又是另一回事。它由模型的分词器决定，常见的词可能一个 Token，生僻字可能拆成好几个，没法从字符数直接换算。所以前端算出来的只能是估计值。</p>
<h2>一个分配预算的例子</h2>
<p>下面的函数在固定上限里，给历史消息和检索资料分配空间。注意看两点：先扣掉系统提示和输出预留；历史是从最新的消息往前取，而且整条保留。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// count 应调用与目标模型一致的计数方式；前端只用于提前提示</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">buildContext</span>(<span class="hljs-params">{ system, history, docs, limit, outputBudget, count }</span>) {
  <span class="hljs-keyword">const</span> fixed = <span class="hljs-title function_">count</span>(system) + outputBudget;
  <span class="hljs-keyword">if</span> (fixed &gt;= limit) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;系统提示和输出预留已经超过上限&#x27;</span>);

  <span class="hljs-keyword">let</span> remaining = limit - fixed;
  <span class="hljs-comment">// 历史消息最多占剩余额度的一半，另一半留给检索内容</span>
  <span class="hljs-keyword">let</span> historyBudget = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>(remaining / <span class="hljs-number">2</span>);
  <span class="hljs-keyword">const</span> recent = [];
  <span class="hljs-comment">// 从最新消息往前取，整条保留</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = history.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) {
    <span class="hljs-keyword">const</span> size = <span class="hljs-title function_">count</span>(history[i]);
    <span class="hljs-keyword">if</span> (size &gt; historyBudget) <span class="hljs-keyword">break</span>;
    recent.<span class="hljs-title function_">unshift</span>(history[i]);
    historyBudget -= size;
    remaining -= size;
  }

  <span class="hljs-keyword">const</span> selected = [];
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> doc <span class="hljs-keyword">of</span> docs) {
    <span class="hljs-keyword">const</span> size = <span class="hljs-title function_">count</span>(doc);
    <span class="hljs-keyword">if</span> (size &gt; remaining) <span class="hljs-keyword">break</span>;
    selected.<span class="hljs-title function_">push</span>(doc);
    remaining -= size;
  }
  <span class="hljs-keyword">return</span> { system, <span class="hljs-attr">history</span>: recent, <span class="hljs-attr">docs</span>: selected };
}
</code></pre></div>
<p>为什么要先留出 <code>outputBudget</code>？因为上下文窗口是输入和输出共用的。输入塞满了，模型就没地方写回答，可能写到一半就被截断。</p>
<p>这段代码在前端只是用来提前提示用户。服务端真正发请求之前，还要按完整请求重新计数，并强制执行上限，不能相信浏览器算的数。</p>
<h2>历史太长了怎么办</h2>
<p>按整条消息删除，保留系统约束和最近几轮对话。工具调用和工具结果要成对处理，只留一半的话，模型 API 可能直接报错。</p>
<p>也可以把更早的历史压成一段摘要。摘要里要保留用户提过的约束、做过的关键决定、没完成的事和重要的 ID。但摘要一定会丢信息，需要精确数据的场景要保留原文。</p>
<p>检索资料太多时，先去重、重新排序、限制每篇的长度。塞进更多资料，不一定让回答更准，反而可能把重要内容淹没。</p>
<h2>截断能防止隐私泄露吗</h2>
<p>不能。权限过滤和敏感字段脱敏，要在检索和构造请求之前就做完。就算某段内容最后因为太长被截掉了，它也已经在处理链路里走过一遍了。</p>
<h2>常见追问</h2>
<p><strong>快到上限时，界面怎么提示？</strong></p>
<blockquote>
<p>直接告诉用户会丢掉哪些历史或资料。不要悄悄删掉用户刚输入的内容，也不要报一个笼统的“网络错误”。</p>
</blockquote>
<p><strong>缓存命中的 Token 还算钱吗？</strong></p>
<blockquote>
<p>算，只是读取的单价更低，见<a href="/questions/ai-prompt-caching/">《AI Prompt Caching 对前端请求设计有什么影响？》</a>。</p>
</blockquote>`};export{e as default};