var e={answerHtml:`<h2>一段最终文字不是一次完整运行</h2>
<p>用户看到的助手回答可能由流式文本、引用、工具调用、工具结果和附件组成。生成中途断网时，最后一段文字既不能说明哪些内容已保存，也不能说明工具是否已经执行。刷新后显示一张聊天截图，不等于能继续一次真实对话。</p>
<p>要先区分三件事：恢复历史展示、重新构造模型输入、恢复仍在执行的后台任务。它们可能引用同一批记录，但权限、数据和一致性要求不同。</p>
<h2>用稳定 ID 表达消息和片段</h2>
<p>消息不能依赖数组下标。一个助手消息可以由多个有顺序的 part 组成，每个 part 有自己的 ID 和状态：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Message</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">conversationId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;user&#x27;</span> | <span class="hljs-string">&#x27;assistant&#x27;</span> | <span class="hljs-string">&#x27;tool&#x27;</span>;
  <span class="hljs-attr">parts</span>: <span class="hljs-title class_">Array</span>&lt;{
    <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
    <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text&#x27;</span> | <span class="hljs-string">&#x27;citation&#x27;</span> | <span class="hljs-string">&#x27;tool-call&#x27;</span> | <span class="hljs-string">&#x27;tool-result&#x27;</span>;
    <span class="hljs-attr">sequence</span>: <span class="hljs-built_in">number</span>;
    <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;streaming&#x27;</span> | <span class="hljs-string">&#x27;complete&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span>;
    <span class="hljs-attr">data</span>: <span class="hljs-built_in">unknown</span>;
  }&gt;;
  <span class="hljs-attr">version</span>: <span class="hljs-built_in">number</span>;
};
</code></pre></div>
<p>记录还需要所属用户或租户、创建时间、schema 版本和服务端排序。时间戳可能相同，数组下标会因删除变化，迟到事件应该根据 message ID、part ID、sequence 和版本合并。重试可以创建新的 attempt，不能让第一次失败的事件和第二次结果混成一条。</p>
<h2>展示数据不等于模型输入</h2>
<p>持久化的 UI 记录可能包含上传进度、按钮状态、调试信息、临时 URL 和内部错误；重新调用模型时只应转换出当前任务需要的消息和工具结果。客户端提交的历史角色不能因为写成 <code>system</code> 或 <code>tool</code> 就自动被信任，服务端要校验来源和权限，并保证工具调用与真实执行结果配对。</p>
<p>SDK 升级可能改变 part 类型和状态字段。旧 JSON 能解析不代表语义兼容，应保存 schema 版本、提供迁移逻辑，并测试旧会话展示、继续提问和删除。</p>
<h2>流式保存要处理成本和丢失窗口</h2>
<p>只在生成结束后保存，进程退出会丢失整个回答；每个 token 写数据库又会制造大量无意义版本。可以按时间或内容量保存检查点，把工具开始、需要审批、成功、失败和取消等关键事件及时落盘。</p>
<p>写入应带 run ID、message ID 和事件序号，重复事件幂等；并发更新使用版本检查，旧检查点不能覆盖已完成状态。界面显示“已保存”时，要明确是本地草稿还是服务端确认，不能把内存状态当成持久化成功。</p>
<h2>断线恢复需要查询权威任务状态</h2>
<p>刷新后看到“正在生成”不代表服务器仍在运行。客户端应查询运行状态、最后事件游标和有效期：任务可能已经成功、失败、取消、过期或根本不存在。服务端支持重连时按游标补事件并去重；不支持时应明确保留部分答案并提供重新生成，不能把新请求伪装成旧任务继续。</p>
<p>历史展示绝不能重新执行已经成功的工具。恢复副作用时需要原调用 ID、审批记录、外部结果和幂等协议；连接中断时先查询，再决定是否重试。</p>
<h2>附件和本地草稿要保存可恢复引用</h2>
<p><code>blob:</code> URL 只在当前浏览器资源生命周期内有效，不能直接放进跨设备历史。应保存受控文件 ID、必要元数据和权限关系，展示时重新申请有效访问地址。签名 URL 也会过期，不能当成永久链接。</p>
<p>localStorage 或 IndexedDB 可以保存本地草稿，却不提供跨设备同步、租户授权或可靠秘密保护。多个账号共用设备时，要在切换账号和退出时清理或隔离草稿。服务端每次读取会话都要检查归属，长随机 chat ID 不是权限凭证。</p>
<p>测试要覆盖生成中断、重复事件、跨标签同步、旧 schema 迁移、附件过期、取消后刷新和工具结果未知。能重新显示最后一句话，只是持久化最浅的一层。</p>`};export{e as default};