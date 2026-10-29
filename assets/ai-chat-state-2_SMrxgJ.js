var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个 loading 分不清这几种情况：在等第一个字、正在一个字一个字地输出、在等用户批准工具调用、用户已经点了停止、中途出错了。这几种状态下，界面该显示什么、用户能点什么都不一样。</p>
<p>所以状态要分三层记：请求有自己的生命周期；一条消息由多个片段组成；片段可以是文字、工具调用或引用来源，每个片段也有自己的状态。</p>
<p>只有收到协议里正常的结束事件，才能标成“完成”。断线或用户停止时，已经收到的文字要保留，但标成“未完成”。</p>
<p>还有一点，每次重试都要用新的请求 ID，旧请求迟到的数据不能写进当前消息。</p>
</blockquote>
<h2>状态要分成几层</h2>
<p>先看一个现成的例子。Vercel AI SDK 的 <code>useChat</code> 有一个 <code>status</code>，取值有四个：<code>submitted</code> 表示已发送、还在等响应开始；<code>streaming</code> 表示正在接收；<code>ready</code> 表示完成了，可以发下一条；<code>error</code> 表示出错。消息的内容放在 <code>parts</code> 数组里，按 <code>type</code> 区分文字、推理过程、文件、来源和工具调用。</p>
<p>这四个值描述的只是“请求”这一层。实际业务还需要更细的信息，比如区分用户停止和出错，比如每个工具调用走到哪一步了。下面是一种建模方式：</p>
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
<p>为什么不把所有状态压成一个字段？因为它们会同时存在。请求还在 <code>streaming</code>，其中一个工具片段已经 <code>succeeded</code>，另一个还在 <code>needs-approval</code>，这是很正常的情况。只用一个全局字段，就表达不了。工具片段怎么确认和执行，见<a href="/questions/ai-tool-approval/">《模型提出工具调用后，前端应该怎样展示和确认？》</a>。</p>
<h2>状态什么时候切换</h2>
<p>用户发出消息后进入 <code>submitted</code>，界面显示“等待回复”，同时给出停止按钮。收到第一个能展示的片段，进入 <code>streaming</code>。</p>
<p>什么时候算完成？必须是收到协议规定的结束事件，才进入 <code>finished</code>。连接突然断了、用户点了停止、服务端报错，都不算完成，分别进入 <code>stopped</code> 或 <code>failed</code>。已经收到的文字保留下来，标上“未完成”，免得用户把半截回答当成完整答案。</p>
<p>每个增量事件进来时，按 <code>requestId</code> 和片段 ID 找到它该写到哪里。<code>requestId</code> 不是当前这次请求的，直接丢掉。</p>
<h2>为什么重试要带 ID</h2>
<p>用户还没看到第一个字就点了重试，可是服务端可能已经开始生成了。这时再发一次普通请求，服务端就会跑两个任务，既浪费钱，结果还可能混在一起。</p>
<p>所以重试要带上原任务 ID 或者一个幂等键，也就是“同一个键只处理一次”的标记，由服务端决定是复用原来的任务还是新建一个。断线后怎么接回同一个任务，见<a href="/questions/ai-stream-recovery/">《AI 流式输出断线后，怎样恢复同一条生成任务？》</a>。</p>
<h2>滚动和读屏器怎么处理</h2>
<p>用户停在底部时，界面跟着输出往下滚。用户往上翻看历史时，就不要再自动滚了，不然刚找到的位置会被拽走，可以显示一个“有新内容”的按钮。</p>
<p>不要每来一个 token 就触发一次滚动和布局计算，可以按动画帧把更新合并起来。</p>
<p>读屏器用户也要考虑。用 live region（页面上一块内容变化时会被读屏器自动朗读的区域）播报阶段变化，比如“开始回答”“回答完成”“需要确认”，不要逐字播报。停止、重试、批准这些按钮的名称保持稳定，内容更新时不要移动焦点。</p>
<h2>常见追问</h2>
<p><strong>停止按钮什么时候可用？</strong></p>
<blockquote>
<p><code>submitted</code> 和 <code>streaming</code> 时都要可用。用户在等第一个字的时候，也可能已经想取消了。点了停止以后服务端会不会真的停，见<a href="/questions/ai-cancel-generation/">《点击“停止生成”后，服务端一定停止调用模型吗？》</a>。</p>
</blockquote>
<p><strong>测试要覆盖哪些情况？</strong></p>
<blockquote>
<p>第一个字出来前取消、流到一半出错、停止以后又来了迟到的数据、快速连点重试、生成中切换会话、工具在等审批。</p>
</blockquote>`};export{e as default};