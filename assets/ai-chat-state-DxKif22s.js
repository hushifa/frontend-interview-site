var e={answerHtml:`<p>一个 loading 布尔值只能说明“忙或不忙”，无法表达 AI 对话中的实际阶段：请求已提交但没有输出、正在接收文本、等待工具批准、用户已停止、服务端仍在执行，或者回答只生成了一半就失败。</p>
<p>状态不清楚会直接影响体验：停止按钮过早消失、重复发送、错误答案被标记为完成，以及重试后旧文本串进新回答。</p>
<h3>请求状态、消息状态与工具状态应分开</h3>
<p>请求层可以描述等待响应、接收、结束或失败。AI SDK 的 useChat 提供 submitted、streaming、ready、error 等状态，但这些不等于所有业务状态都已建模。</p>
<p>一条消息还需要知道内容是否完整、是否保存、是否因取消中断。工具调用则可能处于参数接收、待批准、执行中、成功或失败。请求仍在 streaming 时，某个工具已经执行成功，并不矛盾。</p>
<p>不要让一个 status 字段同时承担所有层次，否则状态数量会膨胀，而且无法表达同一时刻多个 part 的不同进度。</p>
<h3>先建立稳定身份，再处理增量</h3>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Generation</span> = {
  <span class="hljs-attr">requestId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">assistantMessageId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;waiting&#x27;</span> | <span class="hljs-string">&#x27;streaming&#x27;</span> | <span class="hljs-string">&#x27;finished&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span> | <span class="hljs-string">&#x27;cancelled&#x27;</span>;
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">TextPart</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text&#x27;</span>;
  <span class="hljs-attr">text</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">complete</span>: <span class="hljs-built_in">boolean</span>;
};

<span class="hljs-keyword">type</span> <span class="hljs-title class_">ToolPart</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;tool&#x27;</span>;
  <span class="hljs-attr">callId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;receiving&#x27;</span> | <span class="hljs-string">&#x27;approval&#x27;</span> | <span class="hljs-string">&#x27;running&#x27;</span> | <span class="hljs-string">&#x27;succeeded&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span>;
};
</code></pre></div>
<p>这是应用建模示意，不是某个 SDK 的完整类型定义。requestId 区分一次生成，messageId 区分历史消息，part ID 定位消息中的具体片段，callId 关联工具调用及结果。</p>
<p>收到增量时按身份更新，不能始终追加到数组最后一项。用户切换对话、重试或多个请求并行时，“最后一项”很可能已经不是原任务的目标。</p>
<h3>状态转移必须对应真实事件</h3>
<p>提交后可以先显示等待首个输出；收到可展示内容后进入流式状态；只有协议确认正常结束，才把回答标记为完整。连接 EOF、用户停止和网络失败不能统一映射为 finished。</p>
<p>失败前已经收到的文本可以保留，并明确标记不完整。若重试会重新生成，应创建新尝试或明确替换关系，而不是不加区别地继续拼接旧文本。</p>
<p>工具参数尚未完整时显示“准备中”，不要把半截参数当成真实执行结果。需要批准时显示拟执行内容，工具执行成功与模型最后解释完成也应分开表示。</p>
<h3>前端重试不保证后端没有重复工作</h3>
<p>用户没收到首字节，服务端可能已经启动任务；再次发送相同请求可能产生另一份计算或工具副作用。需要时由服务端提供任务 ID、幂等或恢复机制，前端只靠禁用按钮不能解决所有重复请求。</p>
<p>断网后重新连接也可能只是恢复观看已有任务，与新建生成不同。恢复能力应有清楚协议，不能通过把 loading 设回 true 来假装续传成功。</p>
<p>保存状态同样独立：消息已显示但尚未持久化时，应能说明刷新后的风险。多标签页修改、历史删除或账号切换后，旧任务不应继续向当前会话提交内容。</p>
<h3>流式展示不要打断用户阅读</h3>
<p>用户停在底部时可以跟随输出；用户向上查看历史时，应暂停自动滚到底部，提供“有新内容”提示。每个 token 都重新测量并滚动，会增加性能成本，也会让页面难以阅读。</p>
<p>屏幕阅读器不宜逐 token 高频播报，可以按消息阶段或较完整片段提供适度通知。停止、重试和批准等操作需要明确可访问名称，焦点不应因每次消息更新反复跳动。</p>
<p>内容渲染仍按不可信输入处理。状态机能避免串流和错误状态，却不会自动防止恶意 Markdown、越权工具或伪造引用。</p>
<p>测试重点是阶段转换与竞态：首字节前取消、流中错误、停止后迟到增量、重试、切换对话、工具待批准和刷新恢复。把这些过程写清楚，比给所有状态显示同一个旋转图标更可靠。</p>`};export{e as default};