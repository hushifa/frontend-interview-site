var e={answerHtml:`<p>判断一个 catch 能不能接住错误，首先看错误发生时是否仍在它对应的执行路径里。代码文本写在某个 try 里面，不意味着之后执行的所有回调也自动受这个 try 保护。</p>
<p>同步函数在 try 内抛错，会沿当前调用栈进入 catch；Promise 拒绝则需要在链上连接处理，或在 try 内用 await 等待它恢复为异常。</p>
<h3>把拒绝接入正在等待它的边界</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">demonstrate</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;处理失败&#x27;</span>);
    });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>); <span class="hljs-comment">// 处理失败</span>
  } <span class="hljs-keyword">finally</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;清理&#x27;</span>); <span class="hljs-comment">// 清理</span>
  }
}

<span class="hljs-title function_">demonstrate</span>();
</code></pre></div>
<p>then 回调抛错，会让 then 返回的新 Promise 拒绝。await 等待的是这个 Promise，因此拒绝会在 await 位置恢复为异常，进入当前 catch，最后执行清理。</p>
<p>async 函数内部抛错也通常表现为它返回的 Promise 拒绝。调用方如果既不 await，也不接 catch，这个拒绝不会因为函数名字叫“异步任务”就自动得到处理。给返回 Promise 的函数明确责任边界，是避免未处理拒绝的第一步。</p>
<h3>定时器回调为什么不能靠注册时的 try 保护</h3>
<p>setTimeout 注册后，当前函数可以先结束。真正的回调在后续任务中执行，它抛出的错误不会穿越时间回到已经结束的外层 try。</p>
<p>如果要把定时器中的工作建模成可等待任务，需要主动将回调失败转成拒绝：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">runTimerTask</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">try</span> {
        <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">parse</span>(<span class="hljs-string">&#x27;{broken}&#x27;</span>);
        <span class="hljs-title function_">resolve</span>();
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-title function_">reject</span>(error);
      }
    }, <span class="hljs-number">0</span>);
  });
}

<span class="hljs-title function_">runTimerTask</span>().<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>)); <span class="hljs-comment">// SyntaxError</span>
</code></pre></div>
<p>Promise 构造器会捕获其执行器同步执行期间的抛错，但不会自动捕获执行器所注册的后续定时器回调异常。因此示例中的内层 try/catch 不能随便删掉。</p>
<p>事件监听也是类似边界。一个 async 事件处理器返回 Promise，事件系统通常不会像业务代码一样自动 await 它；需要在处理器内部或明确的调用包装中处理拒绝。仅写 void 来忽略返回值，不会使实际失败消失。</p>
<h3>then 的第二个参数不捕获同一 then 成功回调里的错误</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> result = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-number">1</span>).<span class="hljs-title function_">then</span>(
  <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;后处理失败&#x27;</span>);
  },
  <span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;已处理原 Promise 的拒绝&#x27;</span>,
);

result.<span class="hljs-title function_">catch</span>(<span class="hljs-function"><span class="hljs-params">error</span> =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span>)); <span class="hljs-comment">// 后处理失败</span>
</code></pre></div>
<p>两个回调都是对前一个 Promise 的反应。原 Promise 已经成功，就执行第一个回调；这个回调抛错使返回的 result 拒绝，不会再倒回去调用并列的第二个回调。</p>
<p>在整段链尾添加 catch，能处理传递到这里的拒绝，但 catch 自己如果又抛错，也会产生一个新的拒绝。要确保最终负责处理的边界确实观察了最后返回的 Promise，而不只是链条中某个较早的节点。</p>
<h3>清理失败也要避免掩盖主要错误</h3>
<p>finally 适合恢复加载状态、归还局部资源或移除临时监听。它通常不应该 return 一个业务值或随意抛出另一个错误，否则会覆盖前面的结果或异常。</p>
<p>直接 return 一个尚未完成的 Promise，与在 try 中 return await 它，可能让当前 catch、finally 的作用时机不同。资源需要保持到异步操作结束时，应在相应范围内明确等待。</p>
<p>如果业务执行与清理都可能失败，需要决定主要错误如何传播、清理错误怎样记录。显式资源管理的 SuppressedError 等机制也有自己的规则，不能把不同协议的错误优先级想当然地视为相同。</p>
<h3>全局事件是兜底观测，不是业务恢复策略</h3>
<p>浏览器的 error 事件可以观察未被正常处理的运行时异常；资源加载失败也有 error 事件，但事件对象与传播方式不同。资源元素的错误通常不冒泡，统一观察时可能需要捕获阶段监听，并区分 ErrorEvent 与图片、脚本等资源元素的事件。</p>
<p>unhandledrejection 用于观察尚未得到相应拒绝处理的 Promise。之后补上处理器还可能触发 rejectionhandled，所以它不总等同于“这个拒绝以后永远不会被处理”。跨源脚本等场景也可能受到错误信息暴露限制，拿不到完整堆栈不必然说明代码没有失败。</p>
<p>全局处理器不知道用户当前操作是否可以重试，也不能自动把页面恢复到正确业务状态。需要恢复的错误，应在能理解上下文的边界处理；全局层负责汇总遗漏和诊断线索。</p>
<p>仅调用 preventDefault 隐藏默认控制台输出，不代表错误已经被修复。日志上报函数自身也要处理失败，避免它再次产生未处理拒绝，形成不断报告自己的循环。</p>
<h3>错误信息要帮助定位，也要表达给用户可执行的下一步</h3>
<p>网络暂时失败可以提示重试，表单字段错误应定位到字段，取消操作通常不必按系统故障处理；程序状态不符合约束则需要保留诊断信息，而不是统一回退成“成功但没有数据”。</p>
<p><code>catch(() =&gt; [])</code> 只有在业务明确把失败视为可接受的空结果时才合适。否则页面会把“请求失败”伪装成“确实没有记录”，既误导用户，也让监控丢失真实故障。</p>
<p>包装错误时可以使用 Error 的 cause 保留原始原因。记录操作类型、版本、请求关联标识和必要堆栈时，应避免直接上传整个表单、访问令牌或完整敏感响应。错误原因也不保证总是 Error 实例，来自第三方或任意 Promise 的拒绝值应先安全归一化。</p>
<p>最后，浏览器全局错误事件与 Node.js 的未捕获异常、未处理拒绝策略不是同一套接口。不要把前端的全局监听写法或“程序还能继续运行”的观察，直接推广到所有服务端进程；每个运行环境都需要明确最终失败策略。</p>`};export{e as default};