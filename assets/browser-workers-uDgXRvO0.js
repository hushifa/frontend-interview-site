var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Web Worker 在独立线程执行 JavaScript，适合把重计算移出主线程。</li>
<li>主线程和 Worker 默认不共享普通对象，消息通过结构化克隆传递，ArrayBuffer 可以转移所有权。</li>
<li>页面端要为任务定义成功、失败和取消三种结果。</li>
<li>取消消息无法打断 Worker 中正在执行的同步循环；DOM 操作和布局问题也不能交给 Worker。</li>
</ul>
<p>用户输入时页面卡住，可能是主线程正在解析大量数据、构建搜索索引或处理图片。如果这部分工作不需要访问 DOM，可以放进 Worker，让它在独立的执行上下文中完成，再把必要结果交回页面。</p>
<p>Worker 的主要价值是减少这些计算对页面主线程的占用，不是保证计算总耗时一定缩短。创建环境、加载脚本、传递数据和合并结果都有成本，小计算反而可能不值得搬过去。</p>
<h2>哪些工作能搬，哪些不能直接搬</h2>
<p>比较适合的工作包括大块纯数据处理、编码解码、压缩、搜索索引和部分图像计算。Worker 可以使用相应的网络、存储和其他 Worker 可用 API，但它没有页面的 window、document，也不能直接读写页面 DOM。</p>
<p>如果卡顿来自一次插入十万行 DOM、复杂布局或大量绘制，把一个数组处理函数移到 Worker 只能解决其中一部分。最终渲染仍要减少节点、控制更新范围或采用合适的绘图方案。</p>
<p>OffscreenCanvas 等能力可以把某些图形工作移出主线程，但它不是让 Worker 获得任意 DOM 操作权限，也有自己的兼容与传输要求。</p>
<h2>主线程与 Worker 默认不共享普通对象</h2>
<p><code>postMessage()</code> 使用结构化克隆传递支持的数据。接收端得到对应的数据副本，修改普通对象不会直接改动发送端的同一个对象引用。函数和 DOM 节点等不能直接克隆过去。</p>
<p>对于 ArrayBuffer 等可转移对象，可以通过 transfer 列表交出所有权，减少复制大块数据的需要。转移后发送端的 ArrayBuffer 会被分离，原有视图不能再按原样使用；同一缓冲区的其他视图也受影响。</p>
<p>仅把缓冲区写进 transfer 列表并不会替你把它加入消息内容。接收端还必须通过消息里的相应字段获得它。SharedArrayBuffer 则是共享内存，具有不同的安全条件和同步要求，不能放进普通的转移列表当成同一种操作。</p>
<h2>一个 Worker 文件：接收字节并返回求和结果</h2>
<p>下面两个文件应放在同一目录，由支持模块脚本的 HTTP/HTTPS 服务提供。第一个是 <code>byte-sum-worker.js</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">self</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> message = event.<span class="hljs-property">data</span>;
  <span class="hljs-keyword">if</span> (!message || message.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;sum&#x27;</span> || !<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(message.<span class="hljs-property">id</span>)) <span class="hljs-keyword">return</span>;

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">if</span> (!(message.<span class="hljs-property">bytes</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Uint8Array</span>)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;需要 Uint8Array 字节数据&#x27;</span>);
    }

    <span class="hljs-keyword">let</span> total = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> byte <span class="hljs-keyword">of</span> message.<span class="hljs-property">bytes</span>) total += byte;
    <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">id</span>: message.<span class="hljs-property">id</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;result&#x27;</span>, total });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">self</span>.<span class="hljs-title function_">postMessage</span>({ <span class="hljs-attr">id</span>: message.<span class="hljs-property">id</span>, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-title class_">String</span>(error.<span class="hljs-property">message</span> ?? error) });
  }
});
</code></pre></div>
<p>这个计算只用于演示数据和任务的传递，并不是值得为三个字节创建 Worker 的性能建议。真实任务的数据量与计算成本应经过测量。</p>
<h2>页面端：让任务有明确的成功、失败和取消结果</h2>
<p>第二个文件是模块脚本 <code>worker-client.js</code>。每次调用创建一个专用 Worker，任务结束后销毁，因此取消当前任务不会误伤其他调用。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> nextTaskId = <span class="hljs-number">0</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">sumBytesInWorker</span>(<span class="hljs-params">bytes, { signal } = {}</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (!(bytes <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Uint8Array</span>) || !(bytes.<span class="hljs-property">buffer</span> <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">ArrayBuffer</span>)) {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;需要由普通 ArrayBuffer 支持的 Uint8Array&#x27;</span>);
    }
    <span class="hljs-keyword">if</span> (signal?.<span class="hljs-property">aborted</span>) {
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-keyword">const</span> worker = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Worker</span>(<span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(<span class="hljs-string">&#x27;./byte-sum-worker.js&#x27;</span>, <span class="hljs-keyword">import</span>.<span class="hljs-property">meta</span>.<span class="hljs-property">url</span>), {
      <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;module&#x27;</span>,
    });
    <span class="hljs-keyword">const</span> id = ++nextTaskId;
    <span class="hljs-keyword">let</span> settled = <span class="hljs-literal">false</span>;

    <span class="hljs-keyword">function</span> <span class="hljs-title function_">finish</span>(<span class="hljs-params">ok, value</span>) {
      <span class="hljs-keyword">if</span> (settled) <span class="hljs-keyword">return</span>;
      settled = <span class="hljs-literal">true</span>;
      signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      worker.<span class="hljs-title function_">terminate</span>();
      <span class="hljs-keyword">if</span> (ok) <span class="hljs-title function_">resolve</span>(value);
      <span class="hljs-keyword">else</span> <span class="hljs-title function_">reject</span>(value);
    }

    <span class="hljs-keyword">function</span> <span class="hljs-title function_">onAbort</span>(<span class="hljs-params"></span>) {
      <span class="hljs-title function_">finish</span>(<span class="hljs-literal">false</span>, signal.<span class="hljs-property">reason</span>);
    }

    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
    worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;error&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
      <span class="hljs-title function_">finish</span>(<span class="hljs-literal">false</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(event.<span class="hljs-property">message</span> || <span class="hljs-string">&#x27;Worker 启动或执行失败&#x27;</span>));
    });
    worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;messageerror&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
      <span class="hljs-title function_">finish</span>(<span class="hljs-literal">false</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;无法读取 Worker 返回的数据&#x27;</span>));
    });
    worker.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
      <span class="hljs-keyword">const</span> data = event.<span class="hljs-property">data</span>;
      <span class="hljs-keyword">if</span> (!data || data.<span class="hljs-property">id</span> !== id) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">if</span> (data.<span class="hljs-property">type</span> === <span class="hljs-string">&#x27;result&#x27;</span> &amp;&amp; <span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(data.<span class="hljs-property">total</span>) &amp;&amp; data.<span class="hljs-property">total</span> &gt;= <span class="hljs-number">0</span>) {
        <span class="hljs-title function_">finish</span>(<span class="hljs-literal">true</span>, data.<span class="hljs-property">total</span>);
      } <span class="hljs-keyword">else</span> {
        <span class="hljs-title function_">finish</span>(<span class="hljs-literal">false</span>, <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(data.<span class="hljs-property">message</span> || <span class="hljs-string">&#x27;Worker 返回了无效结果&#x27;</span>));
      }
    });

    <span class="hljs-keyword">try</span> {
      worker.<span class="hljs-title function_">postMessage</span>({ id, <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;sum&#x27;</span>, bytes }, [bytes.<span class="hljs-property">buffer</span>]);
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-title function_">finish</span>(<span class="hljs-literal">false</span>, error);
    }
  });
}
</code></pre></div>
<p>在另一个模块中 import 这个函数，传入 <code>[1, 2, 3]</code> 构成的 Uint8Array 后，结果是 6；调用已经执行转移后，原视图的 byteLength 变成 0。若主线程还需要原数据，应事先复制，例如传入 <code>bytes.slice()</code>，并接受相应复制成本。</p>
<p>任务 ID 用于区分协议中的任务，即使以后改成复用 Worker，也不会仅靠“最后一次回调”猜结果属于谁。一次任务如何关联、失败如何结束，应从示例阶段就明确。</p>
<p>函数会拒绝不支持的数据、初始化异常、运行错误、消息反序列化错误和取消。调用方必须处理返回 Promise 的拒绝；按需传入超时信号，避免错误脚本一直没有响应时永久等待。</p>
<h2>取消消息并不能打断 Worker 内的任意同步循环</h2>
<p>如果 Worker 正在执行一个长同步循环，它自己的事件循环也忙着，通常无法立即处理主线程发来的“取消”消息。需要消息式协作取消时，应在 Worker 内把计算分段，让它有机会处理消息；共享内存取消标志则涉及额外的隔离与原子操作设计。</p>
<p>本例直接 terminate 当前专用 Worker，并由页面封装显式拒绝 Promise。terminate 不会替业务运行一套可靠的收尾流程，也不会自动让所有外部保存成功。已经转移的数据不会因为取消就自动转回主线程。</p>
<p>如果多个任务共用一个 Worker，terminate 会影响全部任务，此时需要更完整的任务队列、取消协议和失败传播，不能照搬本例的一任务一实例策略。</p>
<h2>消息返回了，也不一定应该更新当前界面</h2>
<p>用户快速修改筛选条件时，旧任务可能比新任务更晚完成。应检查任务 ID 或请求版本，丢弃不再相关的结果；或者主动取消旧任务，且仍保留过期结果保护。</p>
<p>也不应每算出一个数字就给主线程发一条消息。大量细碎通信和 DOM 更新，可能把原本省下的时间又消耗掉。可以按批次传递结果，或者只返回真正需要的统计与索引信息。</p>
<p>正式项目若频繁处理任务，通常会复用 Worker 或使用有上限的工作池，避免不断创建线程环境。线程数量不是越多越好，设备核心、内存、其他应用负载和消息成本都会限制收益。</p>
<p>最后，Worker 仍运行在浏览器安全模型内，不能绕过 CORS、CSP 或访问任意系统文件。部署时应验证模块脚本地址、媒体类型、worker-src 等策略与加载失败路径。页面能正常启动，不代表后台任务脚本也一定成功加载。</p>`};export{e as default};