var e={answerHtml:`<h2>一个 loading 无法说明用户现在面对什么</h2>
<p>请求可能已经发出但还没有首个输出，正在流式接收文字，等待工具批准，用户主动停止，服务端仍在执行，或者只生成了一半就断线。它们都可以看起来像“忙”，但用户下一步完全不同：等待、停止、批准、重试还是核对结果。</p>
<p>如果只用一个布尔值，常见错误包括：停止按钮过早消失、重复提交、半截回答显示成完成，以及重试后新旧文字拼在一起。</p>
<h2>分层建模，不要让一个字段包住全部状态</h2>
<p>请求、消息、消息片段和工具调用是不同层次：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Generation</span> = {
  <span class="hljs-attr">requestId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">messageId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;submitted&#x27;</span> | <span class="hljs-string">&#x27;streaming&#x27;</span> | <span class="hljs-string">&#x27;finished&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span> | <span class="hljs-string">&#x27;cancelled&#x27;</span> | <span class="hljs-string">&#x27;unknown&#x27;</span>;
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">Part</span> =
  | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text&#x27;</span>; <span class="hljs-attr">text</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">complete</span>: <span class="hljs-built_in">boolean</span> }
  | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;tool&#x27;</span>; <span class="hljs-attr">callId</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
      <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;receiving&#x27;</span> | <span class="hljs-string">&#x27;approval&#x27;</span> | <span class="hljs-string">&#x27;running&#x27;</span> | <span class="hljs-string">&#x27;succeeded&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span> };
</code></pre></div>
<p>SDK 的 <code>submitted</code>、<code>streaming</code>、<code>ready</code>、<code>error</code> 可以作为请求层信号，但业务还要记录消息是否完整、是否持久化、工具是否成功和结果是否未知。一次生成正在 streaming 时，其中一个工具 part 已经 succeeded 是合理状态，不能强行压成一个全局 phase。</p>
<p><code>requestId</code> 区分一次尝试，<code>messageId</code> 定位历史消息，<code>partId</code> 和 <code>callId</code> 让增量、工具结果和重试有准确目标。更新不能总是追加到数组最后一项，因为用户可能已经切换会话或启动了新的请求。</p>
<h2>只有协议确认结束才能标记完成</h2>
<p>提交后可以显示等待首个输出；收到可展示片段后进入 streaming；只有收到正常结束事件，才把消息标记为完整。网络 EOF、用户停止和服务端拒绝都不能自动当成 finished。失败前已收到的文字可以保留，但必须标明不完整。</p>
<p>工具参数正在接收时，不能展示成功；需要审批时显示真正会执行的参数；工具执行成功与模型最后写出的总结是两件事。迟到事件应检查 requestId 和版本，旧请求不能覆盖新对话。</p>
<h2>重试和恢复不是同一个动作</h2>
<p>用户没有收到首字节时，服务端可能已经开始生成，再点一次可能产生第二个任务或重复副作用。可靠系统需要任务 ID、幂等键和状态查询，前端禁用按钮只能减少误触，不能解决网络重试。</p>
<p>断线后重新连接可能是恢复已有任务的事件流，也可能是重新发起生成。协议要明确最后事件游标、任务有效期和结果未知状态，不能把 loading 重新设为 true 就假装续传成功。</p>
<p>消息已显示但尚未写入服务端时，刷新存在丢失风险。持久化状态、历史删除、账号切换和多标签同步也要独立处理，旧任务不能继续向当前会话提交增量。</p>
<h2>流式阅读和无障碍要有自己的策略</h2>
<p>用户停在消息底部时可以跟随输出；用户向上查看历史时，应暂停自动滚动并显示“有新内容”。每个 token 都触发滚动和布局测量会增加主线程成本，也会打断阅读。</p>
<p>读屏器不应逐 token 高频播报，可以按完整片段、阶段或重要状态通知。停止、重试、审批按钮需要稳定的可访问名称，消息更新不能让焦点反复跳动。Markdown、引用和工具输出仍按不可信内容安全渲染，状态机不会自动解决 XSS 或越权。</p>
<p>测试要覆盖首字节前取消、流中错误、停止后迟到增量、重试、切换会话、工具待审批、刷新恢复和结果未知。真正可靠的聊天界面，核心是让每个状态都对应真实事件，并让用户知道下一步能做什么。</p>`};export{e as default};