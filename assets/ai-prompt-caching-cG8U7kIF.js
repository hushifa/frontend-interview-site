var e={answerHtml:`<h2>简答</h2>
<ul>
<li>缓存的是输入前缀的处理结果，模型每次仍重新生成回答。</li>
<li>只有逐字节相同的前缀才能命中，所以工具定义、系统规则等稳定内容放前面，时间戳、检索结果和新问题放后面。</li>
<li>Anthropic API 可以在请求顶层写一个 <code>cache_control</code>，系统自动把断点放在最后一个可缓存块上，并随对话增长向后移动；也可以在具体内容块上手动打断点，最多 4 个。</li>
<li>默认有效期 5 分钟，每次命中刷新；<code>ttl: &#x27;1h&#x27;</code> 写入价格更高。命中情况看 <code>usage</code> 里的 <code>cache_read_input_tokens</code> 和 <code>cache_creation_input_tokens</code>。</li>
<li>缓存只影响成本和延迟。对话历史要自己持久化，租户隔离要在构造请求前完成。</li>
</ul>
<h2>前缀顺序决定能否命中</h2>
<p>Anthropic 按 <code>tools</code> → <code>system</code> → <code>messages</code> 的顺序计算前缀。某一层变化，这一层和之后的缓存都会失效。所以：</p>
<ul>
<li>工具列表保持固定顺序，不要每次请求随机排列或按用户动态增减。</li>
<li>系统提示词里不要放当前时间、请求 ID 这类每次都变的值。</li>
<li>本轮检索到的文档和用户问题放在最后一条消息里。</li>
</ul>
<h2>多轮对话：自动缓存历史</h2>
<p>多轮对话的历史消息每轮都在增长。用顶层 <code>cache_control</code>，断点会自动落在最新的可缓存块上，前几轮的内容在下一轮请求中被读取：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">buildRequest</span>(<span class="hljs-params">{ systemRules, tools, history, question }</span>) {
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">model</span>: <span class="hljs-string">&#x27;claude-opus-5-5&#x27;</span>,
    <span class="hljs-attr">max_tokens</span>: <span class="hljs-number">1024</span>,
    <span class="hljs-comment">// 自动缓存：断点随对话增长自动后移，历史消息也能命中</span>
    <span class="hljs-attr">cache_control</span>: { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;ephemeral&#x27;</span> },
    tools,
    <span class="hljs-attr">system</span>: systemRules,
    <span class="hljs-attr">messages</span>: [...history, { <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;user&#x27;</span>, <span class="hljs-attr">content</span>: question }],
  };
}
</code></pre></div>
<p>系统规则很长、而且希望单独保留更久时，可以再在 system 块上手动加一个断点。手动断点和自动缓存共用 4 个名额。</p>
<h2>用 usage 验证效果</h2>
<p>响应的 <code>usage</code> 字段：</p>
<ul>
<li><code>cache_creation_input_tokens</code>：本次写入缓存的输入量。</li>
<li><code>cache_read_input_tokens</code>：本次从缓存读取的输入量。</li>
<li><code>input_tokens</code>：最后一个断点之后、没有走缓存的输入量。</li>
</ul>
<p>总输入量等于三者之和。两项缓存字段都是 0，常见原因是前缀短于模型的最小可缓存长度（不同模型从 512 到 4096 tokens 不等），这时请求照常处理，不会报错。</p>
<p>其他服务商的机制不同：有的完全自动按前缀缓存，不需要标记，字段名和计费方式也不一样。换服务商时要按对方文档重新确认。</p>
<h2>缓存与权限、持久化</h2>
<ul>
<li>用户 A 的私有资料不要放进可能和用户 B 共用的前缀。先按租户过滤检索结果，再构造请求。</li>
<li>缓存几分钟就过期。刷新页面或跨设备继续对话时，历史从自己的数据库读取。</li>
<li>缓存未命中时请求仍然正确，只是更贵、更慢。应用逻辑不依赖命中。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>写缓存要额外付费吗？</strong> 5 分钟缓存的写入按基础输入价的 1.25 倍计费，1 小时缓存为 2 倍，读取远低于基础价。只请求一次的前缀开启缓存反而更贵。</li>
<li><strong>前端能做什么？</strong> 前端通常不直接调用模型 API，但会决定消息结构。保持历史顺序稳定、不在每轮插入临时字段，就能提高后端的命中率。</li>
</ul>`};export{e as default};