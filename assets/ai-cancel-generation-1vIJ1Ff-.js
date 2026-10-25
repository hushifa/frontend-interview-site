var e={answerHtml:`<p>不一定。点击“停止生成”可以停止前端接收和显示，但模型请求可能仍在服务端运行。要实现真正的停止，需要把取消从界面传到请求、服务端任务和上游模型调用，并处理各层已经完成的工作。</p>
<p>更准确的状态是“客户端已停止等待”“取消已发送”“服务端已确认结束”，而不是只隐藏 loading 就宣称整个任务已经停止。</p>
<h3>停止按钮要能在任务进行中触发取消</h3>
<p>取消函数不能写在一个很长的 await 后面，否则代码走到它时任务可能已经结束。应先创建任务与 controller，把 stop 暴露给事件处理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startGeneration</span>(<span class="hljs-params">run, onValue</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> accepting = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">const</span> done = (<span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">run</span>({
        <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
        <span class="hljs-title function_">emit</span>(<span class="hljs-params">value</span>) {
          <span class="hljs-keyword">if</span> (accepting) <span class="hljs-title function_">onValue</span>(value);
        },
      });
      <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span> ? <span class="hljs-string">&#x27;cancelled&#x27;</span> : <span class="hljs-string">&#x27;completed&#x27;</span> };
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;cancelled&#x27;</span> };
      <span class="hljs-keyword">throw</span> error;
    } <span class="hljs-keyword">finally</span> {
      accepting = <span class="hljs-literal">false</span>;
    }
  })();

  <span class="hljs-keyword">return</span> {
    done,
    <span class="hljs-title function_">stop</span>(<span class="hljs-params"></span>) {
      accepting = <span class="hljs-literal">false</span>;
      controller.<span class="hljs-title function_">abort</span>();
    },
  };
}
</code></pre></div>
<p>run 是应用提供的异步任务，必须把 signal 交给 fetch、SDK 或自身可取消步骤。例子同时关闭前端 emit 通道，防止不支持取消的后处理继续追加旧结果。</p>
<p>这不意味着 run 会被强制终止。若它忽略信号且一直不结束，done 也可能继续等待；界面可以先显示停止状态，但服务端确认仍需另行处理。调用方也应处理 done 的拒绝，避免把真实错误吞成静默失败。</p>
<h3>取消链必须逐层连接</h3>
<p>AI SDK 的客户端 stop 一类方法可以中止当前 HTTP 请求。服务端还需由运行环境感知断连，并把 request 的 signal 或任务取消信号传入上游调用，例如对应的 abortSignal 参数。</p>
<p>代理缓冲、运行平台和后台任务架构都可能改变断连传播。若生成已经转成独立后台任务，关闭浏览器连接通常不应自动假定任务取消，需要带任务 ID 的显式取消接口和服务端状态机。</p>
<p>模型供应商也可能只能停止后续输出，已经执行的计算或计费不能由客户端回滚。因此不要向用户承诺点击停止就一定零新增费用，应按真实服务端结果解释。</p>
<h3>保留部分答案与标记完成不同</h3>
<p>用户停止后可以保留已收到文本，但应标记为中断，不能把它与完整回答混为一谈。网络错误、主动停止和模型正常结束应有不同原因，方便重试、审计和理解。</p>
<p>新的生成应有新的请求身份。即使已经调用 abort，旧回调仍可能迟到；只有当前任务可以更新对应消息，不能简单让“最后一个返回值”覆盖当前对话。</p>
<p>持久化时也应保存任务 ID、消息 ID、部分内容及结束原因。刷新后恢复页面，不应把一条半截答案误显示为已完成。</p>
<h3>工具副作用需要独立确认</h3>
<p>一次生成可能已经发出邮件、创建订单或修改文件。停止模型输出不会撤销这些操作，已经提交的外部调用可能继续完成。</p>
<p>取消时应阻止尚未开始的后续步骤，并查询执行中工具的真实状态。需要撤销时采用业务补偿或专门撤销能力，不能重新执行一次相反操作就假定绝对恢复。</p>
<p>对于高风险动作，执行前的授权与幂等保护比事后取消更关键。页面停止按钮不是工具事务的回滚按钮。</p>
<h3>停止与断线续传可能采用不同设计</h3>
<p>有些产品希望关闭页面后任务继续，回来后续看；另一些希望断连就节省资源。两者不能同时靠一个隐含行为实现，应明确区分“停止任务”与“暂时断开观看”。</p>
<p>具体 SDK 的流恢复与 abort 可能互斥或有特殊要求，应按所用版本核对。测试要覆盖等待首个输出时停止、流中停止、停止后立即重试、服务端迟到确认和工具已执行，而不是只验证按钮文字变化。</p>`};export{e as default};