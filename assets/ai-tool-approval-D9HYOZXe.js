var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>模型返回的工具调用只是一个建议，意思是“我想调用这个工具，参数是这些”。真正执行之前，要过三道关：参数校验、用户确认、服务端授权。</p>
<p>一次 Agent 运行会有多个步骤，每个步骤都有稳定的 ID 和自己的状态。状态要由真正执行的那一端发事件来推动，模型嘴上说“已保存”不算数。</p>
<p>确认卡片要展示真正会执行的参数，比如收件人、文件路径、金额。确认记录要绑定调用 ID、参数摘要和过期时间，参数一变就要重新确认。</p>
<p>还有一种情况容易处理错：请求发出去以后连接断了，这时结果是“未知”，不是“失败”。要先用原来的调用 ID 去查状态，再决定要不要重试。</p>
</blockquote>
<h2>为什么要按步骤展示</h2>
<p>用户点一次“执行”，就产生一次运行。运行里有模型请求、检索、工具调用、等待审批这些步骤，有的步骤还会同时进行。下面是步骤的数据结构：</p>
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
  <span class="hljs-attr">version</span>: <span class="hljs-built_in">number</span>; <span class="hljs-comment">// 每次状态变化加 1，用于丢弃迟到事件</span>
};
</code></pre></div>
<p>为什么不用一条进度条？因为进度条表达不了“检索已经做完了，写文件还在等批准”这种同时存在的状态。一个步骤在等批准时，只读的检索可以继续跑，但依赖这次批准的写入、发送、删除，不能提前执行。</p>
<p>状态只能由执行端的事件推进，比如 <code>step.started</code>、<code>step.waiting-approval</code>、<code>step.succeeded</code>。模型流式输出的说明文字可以显示出来，但不能改变步骤状态。为什么？因为模型可能说“我已经帮你保存好了”，实际上工具根本没执行成功。</p>
<p>参数还没接收完整、没通过 Schema 校验之前，不要显示批准按钮，不然用户批准的可能是半截参数。</p>
<h2>确认卡片要展示什么</h2>
<p>要展示真正会执行的东西。发邮件，就展示收件人、主题、正文摘要、附件、用哪个账号发，以及是不是发往外部域名。删除，就展示具体删哪些资源、一共多少个。支付，就展示金额、币种、收款方。</p>
<p>影响风险的字段不能折叠起来藏着。模型生成的 URL、文件名，要当成不可信的文字来显示，不要渲染成 HTML。</p>
<p>用户点了确认以后，前端做的只是把审批 ID 交给服务端。服务端执行前还要再查一遍：用户身份、租户、资源权限、工具在不在白名单里，审批有没有过期，参数摘要和批准时是不是一样。浏览器传上来一个 <code>approved: true</code>，不能让它跳过这些检查，因为这个值谁都能伪造。</p>
<h2>结果未知时怎么重试</h2>
<p>先看代码。重点是重试之前先去查这个调用的真实状态：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">retryStep</span>(<span class="hljs-params">callId, approval</span>) {
  <span class="hljs-keyword">const</span> { status, error } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getExecutionStatus</span>(callId);
  <span class="hljs-keyword">if</span> (status === <span class="hljs-string">&#x27;succeeded&#x27;</span> || status === <span class="hljs-string">&#x27;executing&#x27;</span>) <span class="hljs-keyword">return</span> { status };
  <span class="hljs-keyword">if</span> (status === <span class="hljs-string">&#x27;failed&#x27;</span> &amp;&amp; !error?.<span class="hljs-property">retryable</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;failed&#x27;</span> };
  <span class="hljs-keyword">if</span> (status !== <span class="hljs-string">&#x27;failed&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;unknown&#x27;</span> }; <span class="hljs-comment">// 查不到确定结果，交给用户决定</span>

  <span class="hljs-comment">// 审批过期或参数变化，回到待确认</span>
  <span class="hljs-keyword">const</span> { argsDigest } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">getCall</span>(callId);
  <span class="hljs-keyword">if</span> (approval.<span class="hljs-property">expiresAt</span> &lt;= <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() || argsDigest !== approval.<span class="hljs-property">argsDigest</span>) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;needs-approval&#x27;</span> };
  }
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">executeAgain</span>({ callId, <span class="hljs-attr">approvalId</span>: approval.<span class="hljs-property">id</span> });
}
</code></pre></div>
<p>为什么不能直接重试？因为连接断了，不代表操作没做。邮件可能已经发出去了，只是结果没传回来。直接重试，用户就会收到两封邮件。所以先查：已经成功或者还在执行，就不重试；明确失败且不能重试的，就停；查不到确定结果的，交给用户决定。</p>
<p>只有确认是可重试的失败，才会再执行。即便这样，也要检查审批有没有过期、参数有没有变，变了就回到待确认。</p>
<p>重试沿用原来的 <code>callId</code>，服务端根据它去重，就不会重复发信或者重复下单。每一次尝试另外记一条 attempt 记录，界面可以显示“第一次失败、第二次成功”，排查问题时也能还原经过。</p>
<p>取消只能阻止还没开始的步骤。已经完成的外部写入，要走业务自己的撤销或补偿流程。</p>
<h2>刷新页面和展示结果</h2>
<p>刷新页面以后，先从服务端拉一份这次运行的快照，再从快照的版本号继续订阅事件。事件都带着运行 ID、步骤 ID 和版本号，这样重复或迟到的事件，就不会把已经完成的步骤改回“执行中”。另外，展示历史步骤只是显示，不会重新执行工具。</p>
<p>失败要按原因分开显示：参数错误、权限不足、用户拒绝、外部服务出错、结果未知，并附上诊断 ID。</p>
<p>成功时要展示真实的证据，比如外部系统的记录 ID、文件版本、链接，还有修改了什么、怎么验证、还有哪些没做完。</p>
<p>原始的工具日志默认折叠起来，按权限脱敏，不要给普通用户看环境变量、完整请求头或者内部路径。</p>
<h2>常见追问</h2>
<p><strong>只读工具也要确认吗？</strong></p>
<blockquote>
<p>这由产品策略决定。只读的检索一般自动执行就行；任何写入、发送、删除、花钱的操作，都要用户确认。</p>
</blockquote>
<p><strong>一次批准能覆盖后面所有的调用吗？</strong></p>
<blockquote>
<p>可以提供“本次会话内允许这个工具”这类选项，但范围要写清楚。而且服务端照样要每次都授权，不能因为用户批准过一次就不查了。</p>
</blockquote>`};export{e as default};