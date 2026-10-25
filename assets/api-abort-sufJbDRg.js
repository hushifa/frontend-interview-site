var e={answerHtml:`<p>AbortController 提供一个可以触发的取消信号。真正停止工作的是接收 signal 并实现了取消逻辑的 API，而不是 controller 强行杀死任意 JavaScript。</p>
<p>fetch、部分流操作和事件监听器支持 signal；普通 Promise、同步循环和你自己写的异步函数，不会因为旁边创建了一个 controller 就自动取消。</p>
<h3>Controller 发出信号，任务决定怎样响应</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-keyword">const</span> signal = controller.<span class="hljs-property">signal</span>;

<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(signal.<span class="hljs-property">aborted</span>); <span class="hljs-comment">// false</span>
controller.<span class="hljs-title function_">abort</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(signal.<span class="hljs-property">aborted</span>); <span class="hljs-comment">// true</span>
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(signal.<span class="hljs-property">reason</span>.<span class="hljs-property">name</span>); <span class="hljs-comment">// AbortError</span>
</code></pre></div>
<p>取消是单向状态变化，已经 aborted 的 signal 不能重置。新的一轮请求通常使用新的 controller；多个相关任务也可以共用同一个 signal，让一次取消结束整组工作。</p>
<p>abort 可以传入自定义 reason，部分组合信号还会产生 TimeoutError 等原因。因此处理错误不能永远只检查一个固定错误名，也不能把任何 catch 都解释成用户取消。</p>
<h3>fetch 取消不等于服务端回滚</h3>
<p>把 signal 传给 fetch 后，取消可以让请求或响应体消费失败。即使 fetch 已返回 Response，后续读取 body 时仍可能因取消而拒绝。</p>
<p>但服务器可能已经接收并执行了操作。用户点取消上传、创建订单请求超时，都不能直接推断远端没有发生修改。写操作需要幂等标识、状态查询或明确的撤销接口，客户端取消只是其中一部分。</p>
<p>同样，Promise.race 与一个超时 Promise 竞争，只会让外层先得到超时结果，不会自动停止输掉的请求。要结束实际工作，还需要对应 signal 或其他取消协议。</p>
<h3>自定义任务要主动订阅并清理</h3>
<p>下面让一个等待函数真正响应取消：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">delay</span>(<span class="hljs-params">ms, signal</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (signal?.<span class="hljs-property">aborted</span>) {
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
      <span class="hljs-keyword">return</span>;
    }

    <span class="hljs-keyword">const</span> <span class="hljs-title function_">onAbort</span> = (<span class="hljs-params"></span>) =&gt; {
      <span class="hljs-built_in">clearTimeout</span>(timer);
      signal.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
    };
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      <span class="hljs-title function_">resolve</span>();
    }, ms);
    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  });
}
</code></pre></div>
<p>先检查已经取消的状态，因为给已取消 signal 新增监听不会补发过去的 abort 事件。正常完成时移除监听，取消时清理计时器，避免任务结束后继续保留无用工作。</p>
<p>长循环可以在合理位置调用 throwIfAborted，但同步 JavaScript 不会被取消事件抢占。如果一直不让出主线程，用户点击取消也无法及时得到处理，需要分片或其他执行模型。</p>
<h3>取消旧请求后仍应防止旧结果提交</h3>
<p>搜索输入快速变化时，取消上一轮请求可以减少无用下载。不过旧任务可能已经完成网络阶段，正在做不支持取消的后处理；也可能某个依赖根本忽略 signal。</p>
<p>因此更新界面前还应检查任务版本或请求身份，确保当前结果仍对应最新输入。取消负责减少工作，身份检查负责防止过期提交，二者解决不同问题。</p>
<p>现代环境可用 AbortSignal.timeout 设置超时，或 AbortSignal.any 合并用户取消和超时信号；使用前仍应核对目标支持。超时也不是对所有后台、暂停状态下的精确墙钟保证，应按 API 行为设计体验。</p>
<p>最终要明确谁创建 controller、谁有权取消、取消后哪些资源需要释放，以及是否应显示错误。用户主动取消通常不应触发无限自动重试；如果需要重试，应创建新任务和新 signal，而不是继续复用已经取消的对象。</p>`};export{e as default};