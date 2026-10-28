var e={answerHtml:`<h2>简答</h2>
<ul>
<li>模型返回的工具调用只是建议，执行前要经过参数校验、用户确认和服务端授权三道关。</li>
<li>一次 Agent 运行由多个步骤组成，每个步骤有稳定 ID 和自己的状态；状态由执行端事件驱动，模型说&quot;已保存&quot;不算数。</li>
<li>确认卡片展示真正会执行的参数，例如收件人、路径、金额；确认记录绑定调用 ID、参数摘要和过期时间，参数一变就要重新确认。</li>
<li>请求发出后连接中断时，结果是&quot;未知&quot;而不是&quot;失败&quot;，先用原调用 ID 查询状态，再决定是否重试。</li>
</ul>
<h2>运行、步骤和状态</h2>
<p>用户点一次&quot;执行&quot;产生一次运行，运行里包含模型请求、检索、工具调用、等待审批等步骤，步骤之间可能并行：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">StepStatus</span> =
  | <span class="hljs-string">&#x27;receiving-args&#x27;</span> <span class="hljs-comment">// 参数还在流式接收</span>
  | <span class="hljs-string">&#x27;needs-approval&#x27;</span>
  | <span class="hljs-string">&#x27;executing&#x27;</span>
  | <span class="hljs-string">&#x27;succeeded&#x27;</span>
  | <span class="hljs-string">&#x27;failed&#x27;</span>
  | <span class="hljs-string">&#x27;cancelled&#x27;</span>
  | <span class="hljs-string">&#x27;unknown&#x27;</span>; <span class="hljs-comment">// 请求已发出但没收到结果</span>

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Step</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-comment">// 工具步骤即 callId，同时作为幂等键</span>
  <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;model&#x27;</span> | <span class="hljs-string">&#x27;retrieval&#x27;</span> | <span class="hljs-string">&#x27;tool&#x27;</span>;
  <span class="hljs-attr">status</span>: <span class="hljs-title class_">StepStatus</span>;
  <span class="hljs-attr">args</span>?: <span class="hljs-built_in">unknown</span>;
  <span class="hljs-attr">result</span>?: { <span class="hljs-attr">summary</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">evidence</span>?: <span class="hljs-built_in">string</span> }; <span class="hljs-comment">// 记录 ID、文件版本等</span>
  <span class="hljs-attr">error</span>?: { <span class="hljs-attr">code</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">retryable</span>: <span class="hljs-built_in">boolean</span> };
};
</code></pre></div>
<p>一条进度条无法表达&quot;检索已完成、写文件在等批准&quot;这种并行状态，所以按步骤展示。</p>
<p>状态只由执行端事件推进，例如 <code>step.started</code>、<code>step.waiting-approval</code>、<code>step.succeeded</code>。模型流式输出的说明文字可以展示，但不改变步骤状态。参数接收完整并通过 Schema 校验之前，不显示批准按钮。</p>
<h2>确认卡片展示什么</h2>
<ul>
<li>发邮件：收件人、主题、正文摘要、附件、发件账号，是否发往外部域名。</li>
<li>删除：具体资源和数量。</li>
<li>支付：金额、币种、收款方。</li>
</ul>
<p>影响风险的字段不能折叠隐藏。模型生成的 URL、文件名按不可信文本渲染。</p>
<p>用户点击确认后，前端只是把审批 ID 交给服务端。服务端执行前重新检查用户身份、租户、资源权限、工具白名单，以及审批是否过期、参数摘要是否和审批时一致。浏览器提交的 <code>approved: true</code> 不能跳过这些检查。</p>
<h2>结果未知时怎样重试</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">retryStep</span>(<span class="hljs-params">callId, approval</span>) {
  <span class="hljs-keyword">const</span> { status, error } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getExecutionStatus</span>(callId);
  <span class="hljs-keyword">if</span> (status === <span class="hljs-string">&#x27;succeeded&#x27;</span> || status === <span class="hljs-string">&#x27;executing&#x27;</span>) <span class="hljs-keyword">return</span> { status };
  <span class="hljs-keyword">if</span> (status === <span class="hljs-string">&#x27;failed&#x27;</span> &amp;&amp; !error.<span class="hljs-property">retryable</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;failed&#x27;</span> };
  <span class="hljs-keyword">if</span> (status !== <span class="hljs-string">&#x27;failed&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;unknown&#x27;</span> }; <span class="hljs-comment">// 查不到确定结果，交给用户决定</span>

  <span class="hljs-comment">// 审批过期或参数变化，回到待确认</span>
  <span class="hljs-keyword">const</span> { argsDigest } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getCall</span>(callId);
  <span class="hljs-keyword">if</span> (approval.<span class="hljs-property">expiresAt</span> &lt;= <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() || argsDigest !== approval.<span class="hljs-property">argsDigest</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;needs-approval&#x27;</span> };
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">executeAgain</span>({ callId, <span class="hljs-attr">approvalId</span>: approval.<span class="hljs-property">id</span> });
}
</code></pre></div>
<p>重试沿用原 <code>callId</code>，服务端据此去重，避免重复发信或重复下单。取消只能阻止还没开始的步骤，已经完成的外部写入要走业务的撤销或补偿流程。</p>
<h2>刷新与失败展示</h2>
<ul>
<li>刷新页面后先拉取运行的服务端快照，再从快照版本继续订阅事件。事件带运行 ID、步骤 ID 和版本号，重复或迟到的事件不能把已完成的步骤改回执行中。</li>
<li>展示历史步骤不会重新执行工具。</li>
<li>失败按原因区分：参数错误、权限不足、用户拒绝、外部服务失败、结果未知，并附上诊断 ID。</li>
<li>成功时展示真实证据，例如外部记录 ID、文件版本、链接。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>只读工具也要确认吗？</strong> 由产品策略决定。只读检索通常自动执行；任何写入、发送、删除或花钱的操作都需要确认。</li>
<li><strong>一次批准能覆盖后续所有调用吗？</strong> 可以提供&quot;本次会话内允许此工具&quot;之类的选项，但范围要写清楚，服务端照样逐次授权。</li>
</ul>`};export{e as default};