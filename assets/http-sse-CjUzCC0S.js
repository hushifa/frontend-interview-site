var e={answerHtml:`<p>假设用户上传文件后，服务器要花一分钟生成报表。页面需要不断知道“处理到多少了”，但用户并不会每一秒都向服务器发送操作。SSE 很适合这种场景：浏览器发出一个 HTTP 请求，服务器保持响应开放，在同一个响应里持续写入进度事件。</p>
<p>SSE 是 Server-Sent Events，主要解决服务端向客户端的文本推送。WebSocket 则允许双方在连接建立后持续收发消息，更适合聊天、协作操作等频繁双向通信。SSE 页面当然仍能发送请求，例如点击“取消任务”时另外发一个 POST；只是客户端操作不通过 EventSource 的那条事件流上传。</p>
<table><thead><tr><th>对比项</th><th>SSE + 原生 EventSource</th><th>浏览器原生 WebSocket</th></tr></thead><tbody><tr><td>消息方向</td><td>事件流从服务端到客户端</td><td>双方都能主动发送</td></tr><tr><td>数据形式</td><td>UTF-8 文本，遵循 SSE 字段格式</td><td>文本或二进制消息</td></tr><tr><td>建立方式</td><td>普通 HTTP 请求得到持续响应</td><td>WebSocket 握手建立连接</td></tr><tr><td>断线恢复</td><td>API 内置重连机制，业务续传仍需设计</td><td>应用自行实现重连和状态恢复</td></tr><tr><td>请求配置</td><td>通常是 GET，不能任意设置请求头和请求体</td><td>构造函数也不能任意设置请求头</td></tr><tr><td>常见用途</td><td>通知、任务进度、日志、文本增量推送</td><td>聊天、协同编辑、双向实时交互</td></tr></tbody></table>
<p>选择时先看消息方向、认证方式和部署条件。不能只因 SSE 使用 HTTP，就断言它一定比 WebSocket 慢；也不能因 EventSource 有重连，就认为消息绝不会丢失。</p>
<h2>服务端写出的内容必须符合事件格式</h2>
<p>响应的媒体类型应为 <code>text/event-stream</code>，正文使用 UTF-8 编码。下面是一个事件流片段，每个事件块后都有空行：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">retry: 2000

id: 41
event: progress
data: {&quot;percent&quot;:35}

id: 42
event: progress
data: {&quot;percent&quot;:80}

: 保持连接的注释

id: 43
event: done
data: {}

</code></pre></div>
<p>这里几个字段各有自己的职责：</p>
<ul>
<li><code>data</code> 是事件数据。它可以存 JSON 文本，但 SSE 本身不会自动执行 <code>JSON.parse</code>。</li>
<li><code>event</code> 决定浏览器派发的事件名。<code>event: progress</code> 对应 <code>addEventListener(&#x27;progress&#x27;, ...)</code>，不会交给默认的 <code>onmessage</code>。</li>
<li><code>id</code> 更新事件 ID，业务可以用它作为恢复游标；它是字符串，协议不要求它是递增数字。</li>
<li><code>retry</code> 提供重连等待时间，单位是毫秒，字段值必须符合整数格式。浏览器也可能因网络状态等原因延后重连，不应把它当成精确计时器。</li>
<li>以冒号开头的是注释，不会作为业务消息触发回调，可用于让连接保持活跃。</li>
</ul>
<p>一个事件包含多行 <code>data</code> 时，浏览器用换行符连接这些行。例如 <code>data: 第一行</code> 和 <code>data: 第二行</code> 属于同一事件时，<code>event.data</code> 是 <code>第一行\\n第二行</code>。因此不能把每行都当成独立 JSON，更不能认为每次底层网络读取刚好等于一个完整事件。</p>
<p>空行是重要的分隔符。服务器若只写了 <code>data: ...</code> 却迟迟没有完成事件块，客户端不会立即收到相应事件。自定义解析器还要处理 CRLF、LF 等换行形式，以及 UTF-8 字符和事件字段被网络分块拆开的情况。</p>
<h2>用原生 EventSource 订阅进度</h2>
<p>下面约定 <code>progress</code> 事件携带 0 到 100 的绝对进度，<code>done</code> 表示任务已经完成。后端需要实现这些业务事件，EventSource 不会自动创造它们。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">subscribeProgress</span>(<span class="hljs-params">url, onProgress, onStatus</span>) {
  <span class="hljs-keyword">const</span> source = <span class="hljs-keyword">new</span> <span class="hljs-title class_">EventSource</span>(url);
  <span class="hljs-keyword">let</span> stopped = <span class="hljs-literal">false</span>;

  source.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;open&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (!stopped) <span class="hljs-title function_">onStatus</span>(<span class="hljs-string">&#x27;已连接&#x27;</span>);
  });

  source.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;progress&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (stopped) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">let</span> data;
    <span class="hljs-keyword">try</span> {
      data = <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(event.<span class="hljs-property">data</span>);
    } <span class="hljs-keyword">catch</span> {
      <span class="hljs-title function_">onStatus</span>(<span class="hljs-string">&#x27;进度数据无法解析&#x27;</span>);
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-keyword">if</span> (
      !data ||
      <span class="hljs-keyword">typeof</span> data.<span class="hljs-property">percent</span> !== <span class="hljs-string">&#x27;number&#x27;</span> ||
      !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(data.<span class="hljs-property">percent</span>) ||
      data.<span class="hljs-property">percent</span> &lt; <span class="hljs-number">0</span> ||
      data.<span class="hljs-property">percent</span> &gt; <span class="hljs-number">100</span>
    ) {
      <span class="hljs-title function_">onStatus</span>(<span class="hljs-string">&#x27;进度数据格式不正确&#x27;</span>);
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-title function_">onProgress</span>(data.<span class="hljs-property">percent</span>, event.<span class="hljs-property">lastEventId</span>);
  });

  source.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;done&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (stopped) <span class="hljs-keyword">return</span>;
    stopped = <span class="hljs-literal">true</span>;
    source.<span class="hljs-title function_">close</span>();
    <span class="hljs-title function_">onStatus</span>(<span class="hljs-string">&#x27;任务完成&#x27;</span>);
  });

  source.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (stopped) <span class="hljs-keyword">return</span>;
    <span class="hljs-title function_">onStatus</span>(
      source.<span class="hljs-property">readyState</span> === <span class="hljs-title class_">EventSource</span>.<span class="hljs-property">CONNECTING</span>
        ? <span class="hljs-string">&#x27;连接中断，等待重新连接&#x27;</span>
        : <span class="hljs-string">&#x27;连接已结束&#x27;</span>,
    );
  });

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    stopped = <span class="hljs-literal">true</span>;
    source.<span class="hljs-title function_">close</span>();
  };
}
</code></pre></div>
<p>调用时把进度显示和状态提示作为函数传入；页面离开或用户取消订阅时，调用返回的清理函数。<code>close()</code> 只结束这条订阅连接，不会自动取消服务器正在生成的报表，取消业务任务要另有接口。</p>
<p>示例用“当前进度为 35%”，而不是“进度再加 5%”，这样重复收到同一条进度不会重复累加。但它没有实现跨连接事件排序；需要防止旧进度覆盖新进度时，应再加入任务版本或明确有序的业务序号。</p>
<p>普通网络断开时，原生 EventSource 通常会尝试重连，所以不能在每次 <code>error</code> 中都立刻创建一个新的 EventSource，否则可能出现多条连接并行重试。认证、状态码或响应类型错误等情况可能使连接终止，不应断言所有错误都会无限重连。客户端主动 <code>close()</code> 会停止，服务端也可用 HTTP <code>204 No Content</code> 告知客户端不要继续重连。</p>
<h2>自动重连为什么仍可能丢消息</h2>
<p>若最后收到的事件 ID 是 <code>42</code>，同一个 EventSource 自动重连时，可以通过 <code>Last-Event-ID: 42</code> 告诉服务器自己的进度。可是服务器仍要有事件历史，并根据这个 ID 决定从哪里重放。只在事件里加一个 <code>id</code>，却没有保存和重放逻辑，不能实现断点续传。</p>
<p>而且浏览器记住“已经派发的事件 ID”，不代表你的业务已经成功保存了数据。比如事件回调里异步写数据库失败了，浏览器并不知道业务没有处理成功。对可靠性要求高的业务，要自己管理成功处理的游标、去重和恢复策略。</p>
<p>如果刷新页面后重新创建 EventSource，也不能期待旧实例的游标自动持久化。应用可以保存业务游标，再通过约定的 URL 参数传给服务端；游标不应包含秘密，服务端仍要验证它所属的用户和订阅范围。历史过期时，应返回快照或让客户端重新查询完整状态。</p>
<h2>为什么有时已经推送了，页面却一大段一起出现</h2>
<p>SSE 会经过应用服务器、反向代理和可能存在的 CDN。任何一层如果把小块数据缓冲起来，浏览器就可能很久收不到事件，随后一次收到很多。需要检查服务端是否及时刷新输出、代理是否启用了响应缓冲、压缩层是否延迟输出，以及连接的空闲超时设置。</p>
<p><code>X-Accel-Buffering: no</code> 是部分代理环境可识别的配置方式，不是所有服务器通用的 SSE 开关。HTTP/1.1 下每个来源的并发连接数也会限制多个标签页的长连接；HTTP/2 可以复用连接中的多个流，但仍受协商的并发流数量和服务端容量限制，不能理解成无限连接。</p>
<p>原生 EventSource 不提供消费背压控制。服务端发送得太快时，仍要合并状态、限制消息频率或减少订阅内容。</p>
<h2>需要 POST 或自定义认证头时怎么办</h2>
<p>原生 EventSource 的请求配置能力有限。跨源携带 Cookie 可以使用 <code>{ withCredentials: true }</code>，同时服务端必须正确配置 CORS，浏览器的 Cookie 策略也仍然生效。</p>
<p>如果接口要求 POST 请求体或自定义 <code>Authorization</code> 头，可以用 <code>fetch</code> 读取响应流，再交给成熟的 SSE 解析库。但这是“用 fetch 消费 SSE 格式”，并不自动具备 EventSource 的重连、<code>Last-Event-ID</code> 和事件派发行为；这些能力要由选用的库或应用实现。</p>
<p>特别是生成类接口，重连时重新 POST 可能启动第二次任务。更稳妥的设计可以是先创建任务获得 ID，再订阅该任务的事件。传输能恢复和业务只执行一次，是两项需要分别设计的能力。</p>`};export{e as default};