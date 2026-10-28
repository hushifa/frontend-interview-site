var e={answerHtml:`<h2>简答</h2>
<ul>
<li>reader.read 返回的是任意字节块，不对应字符、SSE 事件或完整 JSON。</li>
<li>先用流式解码处理多字节字符，再按协议分帧。</li>
<li>SSE 按行和空行组织事件，不能只用 split 切分。</li>
<li>文本、工具参数和引用按各自的 ID 累积；测试要在任意字节位置切开流。</li>
</ul>
<h2>chunk 不是 token，也不是消息</h2>
<p>网络层可以把服务端一次写出的 JSON 拆成多次读取，也可以把多次写入合并到一次读取。一个 UTF-8 中文字符或 emoji 还可能被拆在两个字节块之间。因此把每个 <code>reader.read()</code> 的结果直接解码并 <code>JSON.parse</code>，会在半个字符、半条事件和多条事件粘连时失败。</p>
<p>流式解析至少有三层边界：字节到字符、传输协议到事件、事件 payload 到业务对象。每层都必须完成后才能交给下一层。</p>
<h2>SSE 的分帧不能只用 <code>split(&#x27;\\n\\n&#x27;)</code></h2>
<p>SSE 按行和空行组织事件，支持 LF、CRLF、多行 <code>data</code>、注释、<code>id</code> 和 <code>retry</code> 字段。一个事件的数据本身也不一定是 JSON，结束标记可能是 <code>[DONE]</code> 或服务商自定义文本。</p>
<p>可以使用成熟解析器处理字符和 SSE framing，再在业务层解析。下面采用 eventsource-parser 4.1.3 的 createParser({ onEvent }) 接口；其他主版本应核对对应 API，不能照搬旧版回调签名：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createParser } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;eventsource-parser&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consume</span>(<span class="hljs-params">response, onEvent</span>) {
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span> || !response.<span class="hljs-property">body</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;流不可用&#x27;</span>);
  <span class="hljs-keyword">const</span> reader = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>(<span class="hljs-string">&#x27;utf-8&#x27;</span>, { <span class="hljs-attr">fatal</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">let</span> completed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> parser = <span class="hljs-title function_">createParser</span>({
    <span class="hljs-title function_">onEvent</span>(<span class="hljs-params">event</span>) {
      <span class="hljs-keyword">if</span> (completed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">if</span> (event.<span class="hljs-property">data</span> === <span class="hljs-string">&#x27;[DONE]&#x27;</span>) {
        completed = <span class="hljs-literal">true</span>;
        <span class="hljs-title function_">onEvent</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;done&#x27;</span> });
        <span class="hljs-keyword">return</span>;
      }
      <span class="hljs-keyword">const</span> value = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(event.<span class="hljs-property">data</span>);
      <span class="hljs-title function_">onEvent</span>({ <span class="hljs-attr">id</span>: event.<span class="hljs-property">id</span>, <span class="hljs-attr">event</span>: event.<span class="hljs-property">event</span>, value });
    },
  });

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) {
        parser.<span class="hljs-title function_">feed</span>(decoder.<span class="hljs-title function_">decode</span>());
        <span class="hljs-keyword">if</span> (!completed) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;连接结束但没有业务完成标记&#x27;</span>);
        <span class="hljs-keyword">break</span>;
      }
      parser.<span class="hljs-title function_">feed</span>(decoder.<span class="hljs-title function_">decode</span>(value, { <span class="hljs-attr">stream</span>: <span class="hljs-literal">true</span> }));
      <span class="hljs-keyword">if</span> (completed) {
        <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>();
        <span class="hljs-keyword">break</span>;
      }
    }
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-comment">// 解析或回调失败时取消读取，不只释放锁；保留原始错误。</span>
    <span class="hljs-keyword">try</span> { <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>(error); } <span class="hljs-keyword">catch</span> {}
    <span class="hljs-keyword">throw</span> error;
  } <span class="hljs-keyword">finally</span> {
    parser.<span class="hljs-title function_">reset</span>();
    reader.<span class="hljs-title function_">releaseLock</span>();
  }
}
</code></pre></div>
<p>真实应用还要设置总字节数、事件大小和单个字段长度上限，避免无限流拖垮内存。<code>onEvent</code> 不应为每个事件启动无界异步任务；耗时处理要进入有界队列。</p>
<p>示例约定 JSON SSE 事件后必须有独立的 [DONE] 事件，这是教学协议，不是所有 AI SDK 的通用格式。收到完成标记后停止处理后续事件并取消剩余读取；EOF 前未完成就拒绝。releaseLock 只解除读取器绑定，不等于取消底层流，因此解析失败时显式调用 cancel。同步 onEvent 回调如果抛错也会进入取消路径；异步回调的 Promise 不会被此解析器自动等待。</p>
<p>连接 EOF 只表示字节流结束，不证明模型正常完成。半条事件不能猜着补齐，应该标记为截断或失败；业务协议需要明确的结束事件和错误事件。</p>
<h2>文本、工具和引用不是同一种增量</h2>
<p>一条 AI 流可能同时包含文本 delta、工具参数、工具结果、引用、错误和结束状态。文本 part 可以追加，工具参数应该按 call ID 累积，引用要按来源 ID 关联，错误不能继续把运行标记为成功。</p>
<p>应用应使用 message ID、part ID 和序号定位更新目标，而不是把所有 payload 拼进一个字符串。工具参数尚未完整时，即使局部 JSON 恰好能解析，也不能提前执行有副作用操作。最终状态要等协议确认并通过 Schema 校验后冻结。</p>
<h2>取消和断线恢复需要单独协议</h2>
<p><code>reader.cancel()</code> 只关闭当前连接，服务端可能仍在生成，取消怎样逐层传播见“点击“停止生成”后，服务端一定停止调用模型吗？”。事件带 <code>id</code> 也不代表能续传，游标与幂等应用见“AI 流式输出断线后，怎样恢复同一条生成任务？”。原生 EventSource 有自己的重连行为，fetch 实现 SSE 不会自动继承它。</p>
<p>如果使用 AI SDK 等库，应使用与服务端协议和版本匹配的解码器，不要把不同供应商的事件格式混用。协议层结束、模型完成、工具完成和消息持久化完成也可能是不同时间点。</p>
<h2>测试要主动制造坏边界</h2>
<p>把同一段流在任意字节位置切开，覆盖多字节字符、CRLF、多行 data、多个事件同块、空事件、非法 JSON、结束标记和尾部截断。再测试取消、重复事件、事件迟到、工具参数半截和断线恢复。</p>
<p>只用“服务端一次写出、客户端一次读到”的本地演示，最容易掩盖真实网络中的分块和时序问题。</p>`};export{e as default};