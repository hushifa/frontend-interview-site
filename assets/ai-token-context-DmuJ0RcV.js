var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>string.length</code> 是 UTF-16 码元数，UTF-8 字节数是存储大小，Token 是模型分词器切出的单位，三者不一样。同一段文字换个模型，Token 数也会变。</li>
<li>实际请求远比输入框长：系统提示、历史消息、工具定义、检索片段、图片都要计入。</li>
<li>上下文窗口要给输出留出空间。截断历史时按整条消息删除，工具调用和它的结果要一起保留或一起删掉。</li>
<li>准确计数用服务商的计数接口；费用以响应里的 <code>usage</code> 为准，输入、输出、缓存读写的单价各不相同。</li>
</ul>
<h2>一个预算分配示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// count 应调用与目标模型一致的计数方式；前端只用于提前提示</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">buildContext</span>(<span class="hljs-params">{ system, history, docs, limit, outputBudget, count }</span>) {
  <span class="hljs-keyword">const</span> fixed = <span class="hljs-title function_">count</span>(system) + outputBudget;
  <span class="hljs-keyword">if</span> (fixed &gt;= limit) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;系统提示和输出预留已经超过上限&#x27;</span>);

  <span class="hljs-keyword">let</span> remaining = limit - fixed;
  <span class="hljs-keyword">const</span> recent = [];
  <span class="hljs-comment">// 从最新消息往前取，整条保留</span>
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = history.<span class="hljs-property">length</span> - <span class="hljs-number">1</span>; i &gt;= <span class="hljs-number">0</span>; i--) {
    <span class="hljs-keyword">const</span> size = <span class="hljs-title function_">count</span>(history[i]);
    <span class="hljs-keyword">if</span> (size &gt; remaining * <span class="hljs-number">0.5</span>) <span class="hljs-keyword">break</span>; <span class="hljs-comment">// 给检索内容留一半</span>
    recent.<span class="hljs-title function_">unshift</span>(history[i]);
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
<p>服务端发送前还要按完整请求重新计数并强制执行上限，不能依赖浏览器的估算。</p>
<h2>历史太长时</h2>
<ul>
<li>按消息删除，保留系统约束和最近几轮。</li>
<li>工具调用和结果成对处理，否则模型 API 可能报错。</li>
<li>用摘要压缩更早的历史时，保留用户的约束、关键决定、未完成事项和重要 ID。摘要会丢信息，需要精确数据的场景保留原文。</li>
<li>检索内容过多时先去重、重排、限制单篇长度，塞进更多内容不一定让回答更准。</li>
</ul>
<h2>隐私</h2>
<p>权限过滤和敏感字段脱敏要在检索和构造请求之前完成。被截断的内容已经经过处理链路，不能靠截断防止泄露。</p>
<h2>常见追问</h2>
<ul>
<li><strong>接近上限时界面怎么提示？</strong> 告诉用户会丢掉哪些历史或资料，而不是静默删除刚输入的内容，或者报一个笼统的网络错误。</li>
<li><strong>缓存命中的 Token 还算钱吗？</strong> 算，只是读取单价更低，见&quot;AI Prompt Caching 对前端请求设计有什么影响？&quot;。</li>
</ul>`};export{e as default};