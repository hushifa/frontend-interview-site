var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>能恢复的前提是服务端把每次生成存成一个“运行”，英文叫 run。它有 ID、有状态，还按序号保存了每一条事件。</p>
<p>客户端记住自己最后处理到第几条事件，重连时把这个序号带上，服务端只补发后面的。客户端按“运行 ID 加序号”去重，而且序号必须连续，中间缺了就停下来，去拉一份完整快照。</p>
<p>要分清恢复和重新生成。日志过期了或者运行失败了，就显示已经收到的部分，让用户自己选要不要重新生成，不要自动重发，因为那会生成一个不一样的回答，还要再花一次钱。</p>
<p>最后保存消息时，用运行 ID 做幂等写入，这样就算完成事件重复到达，也不会存出两条消息。</p>
</blockquote>
<h2>服务端要保存什么</h2>
<p>一次生成在服务端大概是这样存的：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">runId = run_123
1 message-start
2 text-delta &quot;你&quot;
3 text-delta &quot;好&quot;
4 message-complete
</code></pre></div>
<p>事件日志保留一段时间，比如几分钟到几小时，过期以后这个运行就标成“不可恢复”。运行 ID 要做成别人猜不到的，而且每次查询都要校验它是不是属于当前用户。</p>
<h2>重连时怎么请求</h2>
<p>假设客户端已经处理到第 3 条，重连时这样请求：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /api/runs/run_123/events?after=3
Accept: text/event-stream
</code></pre></div>
<p>服务端补发序号大于 3 的事件。如果断线期间运行已经结束了，补发完剩下的事件就关闭连接；如果日志已经过期，就返回当前状态，有最终消息的话也一起返回。</p>
<p>SSE 本来有个 <code>Last-Event-ID</code> 请求头，可以用来传这个位置。但它只是个请求头，只有服务端真的保存了事件、并且按 ID 补发，它才有用。另外，用 fetch 实现 SSE 时，浏览器不会自动带这个头，要自己加。</p>
<h2>客户端怎么处理收到的事件</h2>
<p>下面这个函数接收当前状态和一条事件，返回新状态。注意前面三行判断，它们处理的是重复、乱序和缺口：</p>
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
<p>为什么按序号去重，而不是看文字内容一样不一样？因为模型完全可能合法地连续输出两段一样的文字，比如两个“好”。按内容去重会把正常内容删掉。</p>
<p>这里的序号是我们应用自己定义的连续整数。SSE 规范里事件的 <code>id</code> 是字符串，没有“必须连续”的保证，所以要在协议适配那一层转成整数序号。</p>
<p>出现 <code>gap</code>，说明中间漏了事件。这时候要关闭连接，拉一份运行快照，里面有已经累积的文字和最新序号，然后从快照的位置重新订阅。</p>
<p>如果要把序号存进 IndexedDB，一定要和对应的文字一起存。只存了序号、没存文字，刷新以后会从那个序号往后补，中间那段文字就永远丢了。</p>
<h2>界面上怎么显示</h2>
<table><thead><tr><th>情况</th><th>界面</th></tr></thead><tbody><tr><td>正在重连</td><td>保留已有文字，显示“连接中断，正在恢复”</td></tr><tr><td>恢复成功</td><td>继续追加，无需用户操作</td></tr><tr><td>运行已完成</td><td>直接显示最终消息</td></tr><tr><td>日志过期或运行失败</td><td>保留部分文字并标注“未完成”，提供“重新生成”按钮</td></tr></tbody></table>
<p>用户点了重新生成，就会创建一个新的运行，消息记录里要记下新旧运行之间的关系。</p>
<p>重连要用指数退避，就是每次失败后等待的时间翻倍。不然服务端一恢复，大量客户端同时涌进来，又把它压垮了。</p>
<h2>常见追问</h2>
<p><strong>只把已经收到的文字发给服务端，让它“接着写”行不行？</strong></p>
<blockquote>
<p>不行。那其实是一次新的生成，接出来的内容可能和原来的思路对不上，而且又要计费一次。</p>
</blockquote>
<p><strong>用户取消怎么记录？</strong></p>
<blockquote>
<p>取消请求针对的是运行 ID。服务端收到后写一条终止事件，这样其他标签页恢复这个运行时，也能看到“已停止”。</p>
</blockquote>`};export{e as default};