var e={answerHtml:`<h2>简答</h2>
<ul>
<li>恢复的前提是服务端把每次生成保存为一个运行（run），有 ID、状态和按序号保存的事件日志。</li>
<li>客户端记录最后一个已经应用的事件序号，重连时带上它，服务端只补发后面的事件。</li>
<li>客户端按&quot;运行 ID + 事件序号&quot;去重，序号必须连续，出现缺口就停止并拉取快照。</li>
<li>恢复和重新生成是两件事。日志过期或运行失败时，展示已收到的部分并让用户选择重新生成，不要自动重发。</li>
<li>最终消息用运行 ID 做幂等写入，重复的完成事件不会生成两条消息。</li>
</ul>
<h2>服务端保存什么</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">runId = run_123
1 message-start
2 text-delta &quot;你&quot;
3 text-delta &quot;好&quot;
4 message-complete
</code></pre></div>
<p>事件日志保留一段时间（例如几分钟到几小时），过期后运行标记为&quot;不可恢复&quot;。运行 ID 不可预测，每次查询都校验它属于当前用户。</p>
<h2>重连请求</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /api/runs/run_123/events?after=3
Accept: text/event-stream
</code></pre></div>
<p>服务端补发序号大于 3 的事件。如果运行在断线期间已经完成，补发剩余事件后就结束；日志已过期则返回当前状态和最终消息（如果有）。</p>
<p>SSE 的 <code>Last-Event-ID</code> 请求头可以承载这个游标，但只有服务端真的保存了事件并按 ID 补发，它才有意义。用 fetch 实现 SSE 时，浏览器不会自动带这个头，要自己传。</p>
<h2>客户端应用事件</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">applyEvent</span>(<span class="hljs-params">state, event</span>) {
  <span class="hljs-keyword">if</span> (state.<span class="hljs-property">status</span> !== <span class="hljs-string">&#x27;streaming&#x27;</span> || event.<span class="hljs-property">runId</span> !== state.<span class="hljs-property">runId</span>) <span class="hljs-keyword">return</span> state;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">seq</span> &lt;= state.<span class="hljs-property">lastSeq</span>) <span class="hljs-keyword">return</span> state; <span class="hljs-comment">// 重复事件</span>
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">seq</span> !== state.<span class="hljs-property">lastSeq</span> + <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;gap&#x27;</span> };

  <span class="hljs-keyword">switch</span> (event.<span class="hljs-property">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;text-delta&#x27;</span>:
      <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">text</span>: state.<span class="hljs-property">text</span> + event.<span class="hljs-property">delta</span>, <span class="hljs-attr">lastSeq</span>: event.<span class="hljs-property">seq</span> };
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;message-complete&#x27;</span>:
      <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;completed&#x27;</span>, <span class="hljs-attr">lastSeq</span>: event.<span class="hljs-property">seq</span> };
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">lastSeq</span>: event.<span class="hljs-property">seq</span> }; <span class="hljs-comment">// 本例不渲染的事件只推进游标</span>
  }
}
</code></pre></div>
<ul>
<li>按事件身份去重，不按文本内容去重，因为模型可能合法地输出相同片段。</li>
<li>序号是本应用自定义的连续整数。SSE 规范里的 <code>id</code> 是字符串，没有连续性保证，需要在协议适配层转换。</li>
<li>出现 <code>gap</code> 时关闭连接，拉取运行快照（已累积文本和最新序号），再从快照位置重新订阅。</li>
<li>游标存进 IndexedDB 时，要和对应的文本一起保存。只存了游标、没存文本，刷新后会跳过那一段。</li>
</ul>
<h2>界面状态</h2>
<table><thead><tr><th>情况</th><th>界面</th></tr></thead><tbody><tr><td>正在重连</td><td>保留已有文字，显示&quot;连接中断，正在恢复&quot;</td></tr><tr><td>恢复成功</td><td>继续追加，无需用户操作</td></tr><tr><td>运行已完成</td><td>直接显示最终消息</td></tr><tr><td>日志过期或运行失败</td><td>保留部分文字并标注&quot;未完成&quot;，提供&quot;重新生成&quot;按钮</td></tr></tbody></table>
<p>重新生成会创建新运行，消息记录里保存新旧运行的关系。</p>
<p>重连使用指数退避，避免服务端恢复时大量客户端同时涌入。</p>
<h2>常见追问</h2>
<ul>
<li><strong>只把最后一段文字发给服务端让它&quot;接着写&quot;行不行？</strong> 那是一次新生成，结果可能和原来的回答对不上，还会重复计费。</li>
<li><strong>取消怎么记录？</strong> 取消请求针对运行 ID，服务端写入终止事件，其他标签页恢复时也能看到&quot;已停止&quot;。</li>
</ul>`};export{e as default};