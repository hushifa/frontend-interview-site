var e={answerHtml:`<p>网络 chunk 是传输与缓冲形成的字节块，不是模型的一次 token，也不是一条业务事件。服务端一次写出完整 JSON，浏览器仍可能分几次读到；多次服务端写入也可能合并在一个读取结果中。</p>
<p>因此直接对每个 reader.read 的 value 解码后 JSON.parse，会在半个字符、半条消息或多条消息粘连时失败。</p>
<h3>至少有三层边界</h3>
<p>第一层是字节到字符。中文或 emoji 的 UTF-8 编码可能跨块，需要 TextDecoder 的流模式或 TextDecoderStream 保留未完成字符。</p>
<p>第二层是传输协议。SSE 用行与空行组织字段和事件，支持 LF、CRLF 等换行方式；多个 data 行需要按规则合并，注释、id 和 retry 也有各自含义。简单 split(&#x27;\\n\\n&#x27;) 无法完整覆盖它。</p>
<p>第三层才是业务 payload。只有取得一条完整 SSE 事件的数据后，才能按约定解析 JSON 并验证事件类型与字段。SSE data 本身不保证是 JSON，某些服务的结束标记也不是标准 JSON。</p>
<h3>让成熟解析器处理 SSE framing</h3>
<p>下面使用 eventsource-parser，示例协议约定每个带 data 的事件都包含一个 JSON 值。它只负责传输解码与分帧，业务 schema 校验留给 onEvent：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { createParser } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;eventsource-parser&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">consumeJsonSse</span>(<span class="hljs-params">response, onEvent</span>) {
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span> || !response.<span class="hljs-property">body</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;流式响应不可用&#x27;</span>);
  <span class="hljs-keyword">const</span> reader = response.<span class="hljs-property">body</span>.<span class="hljs-title function_">getReader</span>();
  <span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">TextDecoder</span>(<span class="hljs-string">&#x27;utf-8&#x27;</span>, { <span class="hljs-attr">fatal</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">let</span> receivedBytes = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> completed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> parser = <span class="hljs-title function_">createParser</span>({
    <span class="hljs-title function_">onEvent</span>(<span class="hljs-params">event</span>) {
      <span class="hljs-title function_">onEvent</span>({ <span class="hljs-attr">id</span>: event.<span class="hljs-property">id</span>, <span class="hljs-attr">event</span>: event.<span class="hljs-property">event</span>, <span class="hljs-attr">data</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(event.<span class="hljs-property">data</span>) });
    },
  });

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">while</span> (<span class="hljs-literal">true</span>) {
      <span class="hljs-keyword">const</span> { value, done } = <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">read</span>();
      <span class="hljs-keyword">if</span> (done) {
        parser.<span class="hljs-title function_">feed</span>(decoder.<span class="hljs-title function_">decode</span>());
        completed = <span class="hljs-literal">true</span>;
        <span class="hljs-keyword">break</span>;
      }
      receivedBytes += value.<span class="hljs-property">byteLength</span>;
      <span class="hljs-keyword">if</span> (receivedBytes &gt; <span class="hljs-number">2</span> * <span class="hljs-number">1024</span> * <span class="hljs-number">1024</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;示例流超过 2 MiB 上限&#x27;</span>);
      parser.<span class="hljs-title function_">feed</span>(decoder.<span class="hljs-title function_">decode</span>(value, { <span class="hljs-attr">stream</span>: <span class="hljs-literal">true</span> }));
    }
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">if</span> (!completed) <span class="hljs-keyword">await</span> reader.<span class="hljs-title function_">cancel</span>();
    } <span class="hljs-keyword">finally</span> {
      parser.<span class="hljs-title function_">reset</span>();
      reader.<span class="hljs-title function_">releaseLock</span>();
    }
  }
}
</code></pre></div>
<p>onEvent 在这个例子中约定同步处理，不应启动无限个未等待的异步任务。需要耗时处理时，应建立有界队列与消费机制。2 MiB 是示例的整条响应上限，不是通用模型响应限制，也不等于所有内存占用上限。</p>
<p>解析器只在完整事件边界交付数据。连接突然结束时，半条事件不应被“猜着补齐”后当成成功结果。还需要业务终止事件来判断回答是否真正完成，EOF 本身不证明正常结束。</p>
<p>如果实际服务使用 <code>[DONE]</code> 或其他非 JSON 约定，应在业务适配层识别，不要把例子的 JSON.parse 原样套上去。使用 AI SDK 的 UI 消息协议时，优先使用匹配版本的 SDK 解码与 transport，不能混用不同供应商的事件格式。</p>
<h3>文本、工具与引用应该走不同状态更新</h3>
<p>一条流可能包含文本 delta、工具参数增量、执行结果、引用、错误和结束信息。收到工具事件时不能把整个 JSON 字符串追加进回答正文；收到错误后也不能继续标记为完整成功。</p>
<p>建议用消息 ID、part ID 和必要的序号定位更新目标。不同 part 的增量分别累积，完成后再冻结或转为可持久化结构。工具参数还没接收完整时，不应因为局部 JSON 看起来可解析就提前执行。</p>
<h3>EventSource 与 fetch 流并非任意互换</h3>
<p>原生 EventSource 适合它支持的 SSE 连接方式，并具有相应重连机制；fetch 可以支持自定义方法、请求体和头，但读取流时要自己管理解析、取消与恢复。使用 fetch 实现 SSE，不会自动继承 EventSource 的所有行为。</p>
<p>即使事件有 id，也不意味着服务器保留了可恢复历史。要续传，必须约定恢复位置、保留期限、去重和任务身份。断线后重新发起生成，可能得到另一份回答，不能伪装成原流无缝继续。</p>
<p>测试应把同一段协议字节在任意位置切开，覆盖多字节字符、CRLF、多行 data、多个事件同块和尾部截断。只用服务端恰好一写一读的演示，最容易漏掉真实网络边界问题。</p>`};export{e as default};