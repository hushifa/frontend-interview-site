var e={answerHtml:`<h2>一个停止按钮可能只停止了观看</h2>
<p>用户点击停止后，前端可以立刻停止接收和显示增量，但服务端可能仍在调用模型；服务端收到断连后，也可能只能停止后续输出，已经完成的计算和工具副作用不会被撤销。</p>
<p>因此界面要区分“客户端停止显示”“取消请求已发送”“服务端确认任务结束”和“结果未知”，不能隐藏 loading 后就告诉用户整个任务已经停止。</p>
<h2>前端先关闭结果通道，再发出取消</h2>
<p>取消函数必须在任务开始时就暴露，而不是等一个很长的 <code>await</code> 完成后才创建：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startGeneration</span>(<span class="hljs-params">run, onChunk</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> accepting = <span class="hljs-literal">true</span>;

  <span class="hljs-keyword">const</span> done = <span class="hljs-title function_">run</span>({
    <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
    <span class="hljs-title function_">emit</span>(<span class="hljs-params">chunk</span>) {
      <span class="hljs-keyword">if</span> (accepting) <span class="hljs-title function_">onChunk</span>(chunk);
    },
  })
    .<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> ({ <span class="hljs-attr">status</span>: controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span> ? <span class="hljs-string">&#x27;cancelled&#x27;</span> : <span class="hljs-string">&#x27;completed&#x27;</span> }))
    .<span class="hljs-title function_">catch</span>(<span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> {
      <span class="hljs-keyword">if</span> (controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;cancelled&#x27;</span> };
      <span class="hljs-keyword">throw</span> error;
    })
    .<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> { accepting = <span class="hljs-literal">false</span>; });

  <span class="hljs-keyword">return</span> {
    done,
    <span class="hljs-title function_">stop</span>(<span class="hljs-params"></span>) {
      accepting = <span class="hljs-literal">false</span>;
      controller.<span class="hljs-title function_">abort</span>();
    },
  };
}
</code></pre></div>
<p>关闭 <code>emit</code> 通道是 UI 层保护，即使底层任务不响应 signal，迟到结果也不会继续追加旧回答。它不等于底层函数被强制终止；不支持取消的 SDK、同步计算或代理任务仍可能继续运行。调用方要处理 <code>done</code> 的拒绝，不能把真实错误都吞成“已停止”。</p>
<h2>取消必须逐层传播</h2>
<p>客户端的 <code>AbortController</code> 可以中止浏览器到自己服务的 HTTP 请求。服务端运行环境需要感知连接断开，再把 request signal 或独立任务取消信号传给上游模型调用。代理缓冲、边缘平台和后台队列可能让断连无法自动传播。</p>
<p>如果生成已经变成独立后台任务，关闭浏览器连接不应默认等同于取消。产品要提供带任务 ID 的显式取消接口，服务端状态机返回 <code>cancelling</code>、<code>cancelled</code>、<code>completed</code> 或 <code>unknown</code>。供应商也可能只停止继续生成，不能承诺点击停止就一定没有新增费用。</p>
<h2>部分答案不等于完整答案</h2>
<p>停止后可以保留已收到的文本，但要标记为中断，并保存结束原因。主动停止、网络错误、模型拒绝和正常完成不能显示成同一种状态。新一轮生成要有新的 request ID；旧回调即使迟到，也不能覆盖当前消息。</p>
<p>持久化时保存任务 ID、消息 ID、已有片段和结束原因。刷新后不要把半截答案显示成已完成，也不要因为重新打开页面就自动重新执行原请求。</p>
<h2>工具副作用需要独立处理</h2>
<p>生成过程中可能已经发邮件、创建订单或写入文件。停止模型输出不会撤销这些动作，已提交的工具可能继续完成。取消时只阻止尚未开始的后续步骤，并用调用 ID 查询执行中工具的真实状态。</p>
<p>需要撤销时使用业务提供的补偿或撤销接口，不能简单执行一个“相反操作”就假设绝对恢复。高风险动作更依赖执行前授权、幂等键和审计，停止按钮不是事务回滚按钮。</p>
<h2>明确“取消任务”和“停止观看”</h2>
<p>有的产品希望关闭页面后任务继续，用户回来再查看；有的产品希望断连就节省模型资源。这是两种不同协议，不能靠一个隐含的断连行为同时实现。前者要支持任务持久化和恢复，后者要提供可靠取消并报告结果未知。</p>
<p>测试至少覆盖首个输出前停止、流中停止、停止后立即重试、服务端迟到确认、网络断开、模型仍在运行和工具已执行。按钮文字变化只是最浅的一层验证。</p>`};export{e as default};