var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>每次请求模型，工具定义、系统规则、历史对话往往都是一样的，模型每次都要重新处理一遍。Prompt Caching 就是把这段相同开头的处理结果存起来，下次请求直接复用，输入更便宜，第一个字也来得更快。缓存的只是输入，回答每次还是重新生成的。</p>
<p>它有个前提：开头部分必须逐字节相同才能命中。所以工具定义、系统规则这些稳定内容放前面，时间戳、检索结果、用户新问题放后面。</p>
<p>以 Anthropic API 为例，可以在请求最外层写一个 <code>cache_control</code>，系统会自动把缓存断点放在最后一个可缓存的块上，对话变长时断点跟着往后移；也可以在具体内容块上手动打断点，最多 4 个。默认有效期 5 分钟，每次命中会刷新；设成 <code>ttl: &#x27;1h&#x27;</code> 写入价格更高。命中没有，看返回的 <code>usage</code> 里的 <code>cache_read_input_tokens</code> 和 <code>cache_creation_input_tokens</code>。</p>
<p>要注意，缓存只影响成本和速度，不是存储。对话历史还是要自己存，不同租户的数据要在构造请求之前就隔离好。</p>
</blockquote>
<h2>为什么顺序决定能不能命中</h2>
<p>缓存匹配的是“前缀”，也就是从请求开头算起的那一段。Anthropic 按 <code>tools</code> → <code>system</code> → <code>messages</code> 的顺序计算前缀。哪一层变了，这一层和它后面的缓存就都失效了。</p>
<p>举个例子。如果你在系统提示词里写了“当前时间：10:31:05”，每次请求时间都不一样，那系统提示词这一层每次都变，它后面的所有对话历史就永远命中不了。</p>
<p>所以要做到这几点：工具列表保持固定顺序，不要每次随机排，也不要按用户动态增减；系统提示词里不放当前时间、请求 ID 这类每次都变的值；本轮检索到的文档和用户的问题，放在最后一条消息里。</p>
<h2>多轮对话怎么自动缓存历史</h2>
<p>多轮对话的历史每一轮都在变长。下面的写法在请求最外层加了 <code>cache_control</code>，断点会自动落在最新的可缓存块上：</p>
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
<p>这一轮请求结束后，到断点为止的内容被写进缓存。下一轮请求时，前面几轮的内容原封不动，就能从缓存里读，只有新增的部分要重新处理。</p>
<p>如果系统规则很长，而且希望它单独保留更久，可以在 system 块上再手动加一个断点。手动断点和自动缓存共用 4 个名额。</p>
<h2>怎么确认缓存真的生效了</h2>
<p>看响应里的 <code>usage</code> 字段，有三个数要关心：<code>cache_creation_input_tokens</code> 是这次写进缓存的输入量；<code>cache_read_input_tokens</code> 是这次从缓存读出来的输入量；<code>input_tokens</code> 是最后一个断点之后、没走缓存的输入量。总输入量等于这三个加起来。</p>
<p>如果两项缓存字段都是 0，常见原因是前缀太短，没达到模型的最小可缓存长度，不同模型从 512 到 4096 tokens 不等。这时请求照常处理，不会报错，只是没缓存，所以很容易没发现。</p>
<p>别的服务商机制不一样。有的完全自动按前缀缓存，不用打标记，字段名和计费方式也不同。换服务商时要按对方文档重新确认。</p>
<h2>缓存和权限、持久化的关系</h2>
<p>用户 A 的私有资料，不要放进可能和用户 B 共用的前缀里。正确顺序是先按租户过滤检索结果，再构造请求。</p>
<p>缓存几分钟就过期了，它不是数据库。用户刷新页面、换设备继续聊，历史要从自己的数据库读。</p>
<p>没命中缓存时，请求结果照样正确，只是更贵、更慢。所以应用逻辑不能依赖“一定会命中”。</p>
<h2>常见追问</h2>
<p><strong>写缓存要额外付费吗？</strong></p>
<blockquote>
<p>要。5 分钟缓存的写入按基础输入价的 1.25 倍算，1 小时缓存是 2 倍，读取比基础价便宜很多。所以一个前缀如果只会请求一次，开缓存反而更贵。</p>
</blockquote>
<p><strong>前端能做什么？</strong></p>
<blockquote>
<p>前端一般不直接调模型 API，但消息的结构往往是前端决定的。保持历史消息的顺序稳定，不要每一轮往里插临时字段，后端的命中率就会高。</p>
</blockquote>`};export{e as default};