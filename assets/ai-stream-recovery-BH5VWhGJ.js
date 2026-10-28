var e={answerHtml:`<h2>简答</h2>
<ul>
<li>区分会话、消息和运行，恢复针对的是同一个运行。</li>
<li>客户端记录最后应用的事件序号，重连时携带游标。</li>
<li>按 runId 加 eventId 去重，序号不能倒退。</li>
<li>恢复和重新生成是不同操作；最终消息用运行 ID 做幂等落库。</li>
</ul>
<p>用户在手机网络切换时，AI 回答已经显示了半段。页面重新连接后，如果直接再次发起生成，可能得到另一份答案；如果把新流直接接在旧文本后面，又会出现内容重复。可靠恢复的关键不是“重新请求一次”，而是让服务端把一次生成当作有身份、可查询、可按游标补发的任务。</p>
<h2>先区分会话、消息和运行</h2>
<ul>
<li><strong>会话</strong>：用户和应用的对话容器。</li>
<li><strong>消息</strong>：用户输入或模型最终输出的业务记录。</li>
<li><strong>运行</strong>：一次具体的模型生成过程，包含状态、事件序号、取消状态和有效期。</li>
</ul>
<p>同一条消息可以有一次或多次运行，但客户端恢复时必须携带原来的 <code>runId</code>。只带会话 ID 或最后一段文字，服务端无法判断这是续传还是新生成。</p>
<p>服务端为每个运行保存递增事件序号，例如：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">runId = run_123
event 1: message-start
event 2: text-delta &quot;你&quot;
event 3: text-delta &quot;好&quot;
event 4: usage
event 5: message-complete
</code></pre></div>
<p>事件可以短期保存在事件日志或数据库中，超过保留期限后运行应明确变成不可恢复。事件 ID 必须在同一运行内唯一，不能用客户端时间戳代替。</p>
<h2>恢复请求应携带游标</h2>
<p>客户端记录最后一个已经成功应用的事件序号，断线后请求：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">GET /api/runs/run_123/events?after=3 HTTP/1.1
Accept: text/event-stream
Authorization: Bearer &lt;session-token&gt;
</code></pre></div>
<p>服务端先验证运行属于当前用户和会话，再补发序号大于 3 的事件。如果日志已经过期，应返回“不可恢复”以及当前权威状态，而不是从头重新生成。SSE 的 <code>Last-Event-ID</code> 可以表达游标，但只有服务端实际保存并按 ID 补发时才有恢复意义；事件带 ID 并不自动提供历史。</p>
<h2>客户端应用事件必须幂等</h2>
<p>网络重连、代理重试或客户端刷新可能让同一事件被收到两次。客户端应按 <code>runId + eventId</code> 去重，并检查序号不能倒退。对文本增量不要只按字符串内容去重，因为模型可能合法地产生相同片段；应按事件身份去重。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">applyEvent</span>(<span class="hljs-params">state, event</span>) {
  <span class="hljs-keyword">if</span> (state.<span class="hljs-property">status</span> !== <span class="hljs-string">&#x27;streaming&#x27;</span>) <span class="hljs-keyword">return</span> state;
  <span class="hljs-keyword">if</span> (!event || <span class="hljs-keyword">typeof</span> event !== <span class="hljs-string">&#x27;object&#x27;</span>) {
    <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;protocol-error&#x27;</span> };
  }
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">runId</span> !== state.<span class="hljs-property">runId</span>) <span class="hljs-keyword">return</span> state;
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(event.<span class="hljs-property">id</span>) || event.<span class="hljs-property">id</span> &lt; <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;protocol-error&#x27;</span> };
  }
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">id</span> &lt;= state.<span class="hljs-property">lastEventId</span>) <span class="hljs-keyword">return</span> state;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">id</span> !== state.<span class="hljs-property">lastEventId</span> + <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;gap&#x27;</span> };
  }

  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;text-delta&#x27;</span>) {
    <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> event.<span class="hljs-property">delta</span> !== <span class="hljs-string">&#x27;string&#x27;</span> || event.<span class="hljs-property">delta</span>.<span class="hljs-property">length</span> &gt; <span class="hljs-number">65536</span> ||
        state.<span class="hljs-property">text</span>.<span class="hljs-property">length</span> + event.<span class="hljs-property">delta</span>.<span class="hljs-property">length</span> &gt; <span class="hljs-number">1000000</span>) {
      <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;protocol-error&#x27;</span> };
    }
    <span class="hljs-keyword">return</span> {
      ...state,
      <span class="hljs-attr">text</span>: state.<span class="hljs-property">text</span> + event.<span class="hljs-property">delta</span>,
      <span class="hljs-attr">lastEventId</span>: event.<span class="hljs-property">id</span>,
    };
  }
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;message-complete&#x27;</span>) {
    <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;completed&#x27;</span>, <span class="hljs-attr">lastEventId</span>: event.<span class="hljs-property">id</span> };
  }
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;message-start&#x27;</span> &amp;&amp; event.<span class="hljs-property">id</span> === <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">lastEventId</span>: event.<span class="hljs-property">id</span> };
  }
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;usage&#x27;</span>) {
    <span class="hljs-comment">// 此教学渲染器不消费用量字段；计费以服务端权威记录为准。</span>
    <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">lastEventId</span>: event.<span class="hljs-property">id</span> };
  }
  <span class="hljs-keyword">return</span> { ...state, <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;protocol-error&#x27;</span> };
}
</code></pre></div>
<p>初始状态约定为 <code>{ runId: &#x27;run_123&#x27;, lastEventId: 0, text: &#x27;&#x27;, status: &#x27;streaming&#x27; }</code>。示例采用应用自定义的连续整数序号，SSE 标准中的 id 本身是字符串，并不承诺连续或数值含义。需要在协议适配层验证和转换，不能把任意 SSE id 直接当成数字。</p>
<p>遇到缺口或协议错误后冻结当前文本与游标，停止旧连接，查询权威快照后再显式恢复为 streaming；不能仍靠迟到的旧事件自动解除错误状态。完成后也不再追加文本。未知事件不推进游标，以免工具请求等新协议事件被静默跳过。文本上限按 JavaScript UTF-16 码元计数，只是教学保护值，真实项目还应在解码和 JSON 解析前限制输入字节数。</p>
<p>如果把游标保存到 IndexedDB，必须把对应文本或消息状态与游标一起提交；只保存较新的游标、却没有保存已应用文本，刷新后会永久跳过那段内容。服务端可提供带游标的快照帮助恢复。示例只处理文本展示事件，不实现工具执行或用量校验。</p>
<h2>断线恢复和重新生成是两种不同操作</h2>
<p>恢复是继续读取同一个运行已经产生的事件；重新生成是创建新运行。界面必须明确显示“正在恢复”“结果未知”“重新生成”等状态。若服务端在断线期间已经完成，恢复应读取最终消息；如果模型调用失败，客户端应展示失败原因和可重试入口；如果任务已过期，则保留已收到的部分文本并说明它不一定是完整答案。</p>
<p>不能因为恢复失败就自动重新生成，否则用户可能看到两份不同答案，甚至重复扣费。只有用户明确确认或产品定义了安全的自动重试策略时，才创建新运行，并在消息记录中保留新旧运行关系。</p>
<h2>取消也必须有运行身份</h2>
<p>用户点击停止时，应发送针对 <code>runId</code> 的取消请求，并写入终止事件，恢复时客户端才能看到这次运行已被取消。为什么关闭连接不等于停止计算，见“点击“停止生成”后，服务端一定停止调用模型吗？”。</p>
<h2>最终消息和增量事件的落库边界</h2>
<p>可以把增量事件短期写入日志，把最终规范化文本、工具调用和用量写入消息表。提交最终消息时要使用运行 ID 做幂等约束，重复的 <code>complete</code> 请求不能生成两条消息。部分事件落库失败时，客户端显示的文本和服务端最终记录可能不同，应通过状态查询和对账任务修复，而不是让客户端自行“猜测最终内容”。</p>
<p>流式 Markdown、工具调用和结构化输出还要分别定义边界：不完整的代码围栏不能当作最终 HTML 执行，半截 JSON 不能当作已通过 Schema 校验的结果，工具参数未完整且未获批准时不能执行。恢复协议只保证事件顺序，不保证内容本身安全或正确。</p>
<h2>安全、权限和资源限制</h2>
<p>运行 ID 应不可预测，并且每次查询都校验会话、租户和消息权限。事件日志要设置保留期限和大小上限，防止恶意创建大量运行或让一条回答无限增长。SSE 连接应设置心跳、空闲超时和并发上限；断线重连要使用退避，不能让大量客户端同时冲击服务端。</p>
<p>事件内容可能包含用户问题、模型回答、工具结果和内部错误。日志、监控和重连接口都要按最小权限返回，避免把内部提示词、凭据或其他用户数据作为事件广播给错误的客户端。</p>
<h2>测试恢复流程</h2>
<p>测试应在每个事件边界切断连接，覆盖重复事件、乱序、序号缺口、代理缓冲、运行完成后重连、取消与服务端超时。还要验证刷新页面、跨设备恢复、会话过期和事件日志过期时的用户提示。自动化测试可以伪造事件流，但真实浏览器和代理环境仍需验证连接关闭、心跳和缓存头。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://html.spec.whatwg.org/multipage/server.html#server-sent-events">WHATWG · Server-sent events</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events">MDN · Using server-sent events</a></li>
<li><a href="https://www.rfc-editor.org/rfc/rfc9110.html">RFC 9110 · HTTP 语义</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/AbortController">MDN · AbortController</a></li>
</ul>`};export{e as default};