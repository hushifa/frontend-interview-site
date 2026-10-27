var e={answerHtml:`<h2>“模型想做”不等于“系统允许做”</h2>
<p>模型可能生成一个 <code>sendEmail</code> 调用，但参数还没接收完整，收件人可能没有权限，正文也可能被检索内容污染。前端如果看到工具名就显示“已发送”，会把建议、授权和执行三个完全不同的阶段混在一起。</p>
<p>一次调用至少要经历：参数接收、结构校验、风险展示、用户确认、服务端授权、执行和结果核对。每个阶段都可能失败，界面要让用户知道失败发生在哪里。</p>
<h2>用状态机代替多个 loading 布尔值</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">ApprovalState</span> =
  | <span class="hljs-string">&#x27;receiving-args&#x27;</span>
  | <span class="hljs-string">&#x27;invalid-args&#x27;</span>
  | <span class="hljs-string">&#x27;needs-approval&#x27;</span>
  | <span class="hljs-string">&#x27;approved&#x27;</span>
  | <span class="hljs-string">&#x27;executing&#x27;</span>
  | <span class="hljs-string">&#x27;succeeded&#x27;</span>
  | <span class="hljs-string">&#x27;failed&#x27;</span>
  | <span class="hljs-string">&#x27;unknown&#x27;</span>
  | <span class="hljs-string">&#x27;cancelled&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">canApprove</span>(<span class="hljs-params"><span class="hljs-attr">state</span>: <span class="hljs-title class_">ApprovalState</span></span>) {
  <span class="hljs-keyword">return</span> state === <span class="hljs-string">&#x27;needs-approval&#x27;</span>;
}
</code></pre></div>
<p>参数仍在流式接收时只能展示预览，不能点击批准。完整参数经过 Schema 校验、目标解析和风险判断后，才进入 <code>needs-approval</code>。用户点击后进入 <code>approved</code>，服务端接受并开始工作后才是 <code>executing</code>。这样网络重试、刷新和迟到事件不会因为几个布尔值互相覆盖而重新显示确认按钮。</p>
<p>每次调用需要稳定的 call ID。确认、执行日志和返回结果都关联它，不能因为聊天文本出现“正在发送”就提前改变状态。</p>
<h2>确认内容要能让用户判断影响</h2>
<p>“是否允许发送邮件”远远不够。确认卡片应展示实际收件人、主题、正文摘要、附件、使用的账号和是否会向外部域名发送。删除操作要显示具体资源与数量，金额操作要显示币种和对象，批量操作要明确是全部批准还是单项批准。</p>
<p>长参数可以折叠，但不能隐藏决定风险的字段。模型生成的 URL、文件名和收件人按不可信文本渲染，限制链接协议。确认记录应绑定调用 ID、用户、参数摘要和过期时间；参数发生任何影响结果的变化都必须重新确认。</p>
<h2>执行端必须重新授权</h2>
<p>Schema 校验只说明参数形状正确，不能证明用户有权限。执行前还要检查用户身份、租户、资源版本、业务状态和工具白名单。不能因为浏览器提交了 <code>approved: true</code> 就跳过服务端检查，用户可以自己构造请求。</p>
<p>高风险工具应使用最小权限凭据，限制文件路径、网络目标和调用次数。审批用于让用户在允许范围内做选择，不能让用户通过点击确认绕过禁止访问的资源。</p>
<h2>重试要区分失败和结果未知</h2>
<p>发送请求后连接中断，外部系统可能已经完成副作用。直接新建一个调用重试，可能导致重复付款、重复发信或重复创建记录。应使用原 call ID 作为幂等键，并先查询执行状态：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">retryExecution</span>(<span class="hljs-params">callId, approvalId</span>) {
  <span class="hljs-keyword">const</span> status = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getExecutionStatus</span>(callId);
  <span class="hljs-keyword">if</span> (status === <span class="hljs-string">&#x27;succeeded&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;succeeded&#x27;</span> };
  <span class="hljs-keyword">if</span> (status === <span class="hljs-string">&#x27;executing&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;executing&#x27;</span> };
  <span class="hljs-keyword">if</span> (status === <span class="hljs-string">&#x27;failed&#x27;</span> &amp;&amp; <span class="hljs-title function_">isRetryable</span>(status)) {
    <span class="hljs-keyword">return</span> <span class="hljs-title function_">executeAgain</span>({ callId, approvalId });
  }
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">state</span>: <span class="hljs-string">&#x27;unknown&#x27;</span> };
}
</code></pre></div>
<p>“取消”也有边界：它可以阻止尚未开始的步骤，但已经完成的外部写入需要补偿或撤销流程。关闭确认弹窗不能证明后台执行已经停止。</p>
<h2>成功和失败都要给出证据</h2>
<p>成功应展示真实产物、外部记录 ID、文件版本或校验结果，而不是复述模型的自然语言。失败应区分参数错误、权限不足、用户拒绝、外部服务失败和结果未知，保留可用于排查的诊断 ID。</p>
<p>工具结果本身仍是不可信内容，不能把它当成新的授权或系统指令。日志记录谁批准了什么、执行了哪个工具版本和最终结果，但敏感参数按最小必要原则脱敏。</p>
<p>好的审批设计不是让用户频繁点击“允许”，而是让每次高风险动作都具体、可核验、范围明确，并且无论用户是否点击确认，执行端都保持自己的安全边界。</p>`};export{e as default};