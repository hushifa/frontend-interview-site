var e={answerHtml:`<h2>简答</h2>
<ul>
<li>一个 loading 分不清等待首字、正在输出、等待工具审批、用户已停止和中途失败，而这几种状态下用户能做的事不同。</li>
<li>按请求、消息、片段三层建模：请求有生命周期，消息由多个片段组成，片段可以是文本、工具调用或引用。</li>
<li>只有收到协议的正常结束事件才标记完成；断线或停止后保留的文字要标成不完整。</li>
<li>每次尝试有新的请求 ID，旧请求的迟到事件不能写进当前消息。</li>
<li>用户向上翻阅时暂停自动滚动；读屏器按段落或状态播报，不逐 token 播报。</li>
</ul>
<h2>状态怎样分层</h2>
<p>以 Vercel AI SDK 的 <code>useChat</code> 为例，它的 <code>status</code> 有四个值：<code>submitted</code>（已发送，等待响应流开始）、<code>streaming</code>（正在接收）、<code>ready</code>（完成，可发下一条）、<code>error</code>。消息内容放在 <code>parts</code> 数组里，按 <code>type</code> 区分文本、推理、文件、来源和工具调用。</p>
<p>这四个值描述的是请求层。业务还需要更细的信息：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Generation</span> = {
  <span class="hljs-attr">requestId</span>: <span class="hljs-built_in">string</span>; <span class="hljs-comment">// 每次尝试一个新 ID</span>
  <span class="hljs-attr">messageId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;submitted&#x27;</span> | <span class="hljs-string">&#x27;streaming&#x27;</span> | <span class="hljs-string">&#x27;finished&#x27;</span> | <span class="hljs-string">&#x27;stopped&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span>;
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Part</span> =
  | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text&#x27;</span>; <span class="hljs-attr">text</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">complete</span>: <span class="hljs-built_in">boolean</span> }
  | {
      <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
      <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;tool&#x27;</span>;
      <span class="hljs-attr">callId</span>: <span class="hljs-built_in">string</span>;
      <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;receiving-args&#x27;</span> | <span class="hljs-string">&#x27;needs-approval&#x27;</span> | <span class="hljs-string">&#x27;executing&#x27;</span> | <span class="hljs-string">&#x27;succeeded&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span>;
    };
</code></pre></div>
<p>请求还在 streaming 时，某个工具片段已经 succeeded 是正常情况，所以不要把所有状态压成一个全局字段。工具片段的确认和执行流程见<a href="/questions/ai-tool-approval/">《模型提出工具调用后，前端应该怎样展示和确认？》</a>。</p>
<h2>状态转换规则</h2>
<ul>
<li>发送后进入 <code>submitted</code>，显示&quot;等待回复&quot;和停止按钮。</li>
<li>收到第一个可展示片段进入 <code>streaming</code>。</li>
<li>收到协议的结束事件才进入 <code>finished</code>。连接 EOF、用户停止、服务端报错分别进入 <code>stopped</code> 或 <code>failed</code>，已收到的文字保留并标注&quot;未完成&quot;。</li>
<li>每个增量事件按 <code>requestId</code> 和片段 ID 定位目标；<code>requestId</code> 不是当前请求的事件直接丢弃。</li>
</ul>
<h2>重试与重复任务</h2>
<p>用户没看到首字就点重试时，服务端可能已经开始生成，再发一次会产生第二个任务。重试要带上原任务 ID 或幂等键，由服务端决定是复用还是新建。断线后怎样接回同一个任务，见<a href="/questions/ai-stream-recovery/">《AI 流式输出断线后，怎样恢复同一条生成任务？》</a>。</p>
<h2>滚动和无障碍</h2>
<ul>
<li>用户停在底部时跟随输出；向上滚动后停止跟随，并显示&quot;有新内容&quot;按钮。</li>
<li>不要每个 token 都触发滚动和布局测量，可以按帧合并更新。</li>
<li>读屏器用 live region 播报阶段变化（开始回答、回答完成、需要确认），不要逐字播报。</li>
<li>停止、重试、批准按钮的可访问名称保持稳定，内容更新时不移动焦点。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>停止按钮什么时候可用？</strong> <code>submitted</code> 和 <code>streaming</code> 时都可用，等待首字时用户也可能想取消。停止对服务端的影响见<a href="/questions/ai-cancel-generation/">《点击“停止生成”后，服务端一定停止调用模型吗？》</a>。</li>
<li><strong>测试要覆盖哪些情况？</strong> 首字前取消、流中出错、停止后迟到增量、快速重试、切换会话、工具待审批。</li>
</ul>`};export{e as default};