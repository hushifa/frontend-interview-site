var e={answerHtml:`<h2>简答</h2>
<ul>
<li>把会话、运行和步骤分开建模，一次运行可能有并行步骤，单一进度条会误导用户。</li>
<li>运行状态来自服务端事件，而不是从模型文本里推断。</li>
<li>人工确认放在具体副作用之前，并展示真实会执行的参数。</li>
<li>刷新后先取服务端快照再续订事件，事件要能去重；失败界面要告诉用户下一步能做什么。</li>
</ul>
<h2>用户真正想知道的不是“模型正在思考”</h2>
<p>一个 Agent 任务可能先读取项目文件，再检索资料，接着提出修改方案，等待用户批准，最后调用工具写入文件。只放一个转圈图标，用户无法判断它是在等待网络、等待权限、执行工具，还是已经失败。</p>
<p>更麻烦的是，模型的自然语言不是执行事实。模型说“文件已经保存”，只代表它生成了这句话；只有受控执行端返回成功，界面才能把文件标记为已保存。前端要展示的是可验证的运行过程，而不是把模型措辞当作进度条。</p>
<h2>先把会话、运行和步骤分开</h2>
<p>会话是用户看到的长期对话；运行是用户点击一次“执行”后产生的一次尝试；步骤是这次运行中的模型请求、检索、工具调用或人工审批。一次运行可能有并行步骤，所以用一条从 0% 到 100% 的进度条往往会传递错误信息。</p>
<p>可以用这样的结构保存状态：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Step</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;model&#x27;</span> | <span class="hljs-string">&#x27;retrieval&#x27;</span> | <span class="hljs-string">&#x27;tool&#x27;</span> | <span class="hljs-string">&#x27;approval&#x27;</span>;
  <span class="hljs-attr">title</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;queued&#x27;</span> | <span class="hljs-string">&#x27;running&#x27;</span> | <span class="hljs-string">&#x27;waiting-approval&#x27;</span> | <span class="hljs-string">&#x27;succeeded&#x27;</span>
    | <span class="hljs-string">&#x27;failed&#x27;</span> | <span class="hljs-string">&#x27;cancelled&#x27;</span> | <span class="hljs-string">&#x27;unknown&#x27;</span>;
  <span class="hljs-attr">startedAt</span>?: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">finishedAt</span>?: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">result</span>?: { <span class="hljs-attr">summary</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">links</span>?: <span class="hljs-built_in">string</span>[] };
  <span class="hljs-attr">error</span>?: { <span class="hljs-attr">code</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">retryable</span>: <span class="hljs-built_in">boolean</span> };
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">AgentRun</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;running&#x27;</span> | <span class="hljs-string">&#x27;waiting&#x27;</span> | <span class="hljs-string">&#x27;succeeded&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span> | <span class="hljs-string">&#x27;cancelled&#x27;</span>;
  <span class="hljs-attr">version</span>: <span class="hljs-built_in">number</span>;
  <span class="hljs-attr">steps</span>: <span class="hljs-title class_">Step</span>[];
};
</code></pre></div>
<p>每个步骤要有稳定 ID。重试最好创建新的 attempt 或新的步骤记录，而不是覆盖第一次失败，这样用户才能知道系统确实失败过，也能在故障排查时还原过程。</p>
<h2>状态必须来自事件，而不是来自文本</h2>
<p>前端可以接收类似下面的事件：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">run.started
step.started(kind=retrieval)
step.succeeded(result=documents)
step.waiting-approval(tool=writeFile)
approval.granted
step.started(kind=tool)
step.succeeded(result=file-version)
run.succeeded
</code></pre></div>
<p>模型流式输出的“我准备读取配置”可以作为说明展示，但不能触发 <code>step.succeeded</code>。工具执行器返回的文件版本、记录 ID 或校验结果，才是成功状态的依据。参数还在流式接收时，步骤应是 <code>running</code> 或 <code>receiving-args</code>，不能提前显示批准按钮。</p>
<p>网络断开尤其容易误判。工具请求发出后连接中断，工具可能已经成功写入。此时把步骤标成失败并自动重试，可能造成重复发信或重复创建订单。更准确的状态是 <code>unknown</code>，先根据调用 ID 查询外部结果。</p>
<h2>人工确认应放在具体副作用之前</h2>
<p>确认卡片不能只写“是否允许调用工具”。用户需要看到真正会执行的动作，例如收件人、文件路径、写入内容、附件数量和使用的账号。长文本可以折叠，但影响风险的参数不能隐藏。</p>
<p>用户确认后，执行端仍要重新授权；审批记录绑定哪些字段、参数变化后为什么要重新确认，见“模型提出工具调用后，前端应该怎样展示和确认？”。</p>
<p>多个步骤并行时，一步等待批准不代表所有步骤都必须停止。只读检索可以继续，但任何依赖批准的写入、发送或删除都不能提前发生。界面要表达这种依赖，避免用户误以为一次允许就授权了整个 Agent。</p>
<h2>刷新和重连不能丢失事实</h2>
<p>长任务页面刷新后，不能从内存数组恢复运行状态。前端应先获取服务端快照，再从快照版本继续订阅事件。事件必须带运行 ID、步骤 ID 和版本号，重复事件要幂等，迟到事件不能把已完成状态改回运行中。</p>
<p>展示历史步骤不会重新执行工具。重放日志是恢复界面，重放副作用则需要单独的幂等协议和明确授权。用户再次点击“继续”时，也应根据服务端状态决定从哪个安全节点恢复，而不是从最后一条文本继续猜。</p>
<h2>失败界面要帮助用户做下一步</h2>
<p>失败不能都显示成“AI 出错了”。权限不足应告诉用户需要什么权限；用户拒绝应显示未执行；网络中断应说明结果是否待确认；可重试的检索失败可以提供重试按钮；不可重试的工具错误应保留诊断 ID。</p>
<p>成功结果也不应只显示“完成”。应给出修改摘要、产物链接、验证命令和未完成事项。原始工具日志默认折叠并按权限脱敏，避免把环境变量、完整请求头或内部路径直接展示给普通用户。</p>
<p>这样的界面不是为了让 Agent 看起来更聪明，而是让用户能理解、控制和恢复一次可能持续很久的自动化任务。</p>`};export{e as default};