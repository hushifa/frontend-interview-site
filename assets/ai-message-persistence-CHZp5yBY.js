var e={answerHtml:`<p>只保存最后一段回答，会丢失会话继续运行所需要的结构。一次完整交互通常包含用户消息、助手消息、消息 ID、按顺序排列的内容片段、工具调用、工具结果、来源、错误和完成状态；流式生成中途刷新时，最后保存的文本甚至可能还不是一个完整句子。</p>
<p>持久化记录应区分“展示给用户的 UI 消息”和“再次发送给模型的输入”。前者可以包含状态、引用、文件预览和工具进度，后者则要按照模型接口的格式重新组装。不要把服务端返回的任意 JSON 直接当成可信消息，也不要用数组下标当成长期 ID。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">StoredMessage</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;user&#x27;</span> | <span class="hljs-string">&#x27;assistant&#x27;</span> | <span class="hljs-string">&#x27;tool&#x27;</span>;
  <span class="hljs-attr">parts</span>: <span class="hljs-title class_">Array</span>&lt;{ <span class="hljs-attr">type</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">data</span>: <span class="hljs-built_in">unknown</span> }&gt;;
  <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;pending&#x27;</span> | <span class="hljs-string">&#x27;complete&#x27;</span> | <span class="hljs-string">&#x27;error&#x27;</span> | <span class="hljs-string">&#x27;cancelled&#x27;</span>;
  <span class="hljs-attr">createdAt</span>: <span class="hljs-built_in">string</span>;
};
</code></pre></div>
<p>服务端保存会话时要校验用户归属、版本和数据大小，重试时按消息或请求 ID 做幂等处理，避免一次生成被重复写入。SDK 升级、消息格式变化和工具参数变化都需要迁移策略；旧记录能解析成 JSON，不代表它仍符合新版本语义。</p>
<p>客户端断开后是否继续生成，要和后台任务、取消、恢复和计费策略保持一致。<code>localStorage</code> 适合保存本地草稿，但不能自动提供跨设备同步、访问权限或可靠的敏感数据保护；这些能力需要服务端持久化和明确的删除策略。</p>`};export{e as default};