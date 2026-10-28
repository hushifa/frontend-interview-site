var e={answerHtml:`<h2>简答</h2>
<ul>
<li>只存最终文字会丢掉工具调用、工具结果和引用，下次继续对话时模型看不到这些上下文，界面也无法还原。</li>
<li>消息由有序片段组成，消息和片段都有稳定 ID，记录 schema 版本和所属用户。</li>
<li>界面记录不等于模型输入：重新调用模型前，从记录中转换出需要的消息，并在服务端校验角色和来源。</li>
<li>流式回答按检查点保存，关键事件（工具开始、成功、失败）立即落库。</li>
<li>附件保存受控的文件 ID，不保存 <code>blob:</code> URL 或会过期的签名链接。</li>
</ul>
<h2>数据结构</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Message</span> = {
  <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">conversationId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">ownerId</span>: <span class="hljs-built_in">string</span>;
  <span class="hljs-attr">role</span>: <span class="hljs-string">&#x27;user&#x27;</span> | <span class="hljs-string">&#x27;assistant&#x27;</span>;
  <span class="hljs-attr">schemaVersion</span>: <span class="hljs-built_in">number</span>;
  <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;streaming&#x27;</span> | <span class="hljs-string">&#x27;complete&#x27;</span> | <span class="hljs-string">&#x27;interrupted&#x27;</span> | <span class="hljs-string">&#x27;failed&#x27;</span>;
  <span class="hljs-attr">parts</span>: <span class="hljs-title class_">Array</span>&lt;
    | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;text&#x27;</span>; <span class="hljs-attr">text</span>: <span class="hljs-built_in">string</span> }
    | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;tool-call&#x27;</span>; <span class="hljs-attr">callId</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">name</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">args</span>: <span class="hljs-built_in">unknown</span> }
    | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;tool-result&#x27;</span>; <span class="hljs-attr">callId</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">result</span>: <span class="hljs-built_in">unknown</span> }
    | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;citation&#x27;</span>; <span class="hljs-attr">sourceId</span>: <span class="hljs-built_in">string</span> }
    | { <span class="hljs-attr">id</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;file&#x27;</span>; <span class="hljs-attr">fileId</span>: <span class="hljs-built_in">string</span>; <span class="hljs-attr">mediaType</span>: <span class="hljs-built_in">string</span> }
  &gt;;
};
</code></pre></div>
<ul>
<li>排序以服务端序号为准，不靠数组下标或客户端时间戳。</li>
<li>重试生成新的尝试记录，不覆盖失败的那次。</li>
<li>工具调用和工具结果按 <code>callId</code> 成对保存。只有调用没有结果，模型 API 通常会拒绝这段历史。</li>
</ul>
<h2>展示数据和模型输入</h2>
<p>界面记录里还有上传进度、按钮状态、调试信息等，发给模型时要过滤掉。客户端提交的历史不能直接信任：服务端从数据库读取历史，而不是采用浏览器传来的 <code>role: &#x27;system&#x27;</code> 或伪造的工具结果。</p>
<p>SDK 升级可能改变片段类型。旧记录能解析不代表语义一致，按 <code>schemaVersion</code> 写迁移逻辑，并测试旧会话能否展示、继续提问和删除。</p>
<h2>流式保存</h2>
<ul>
<li>只在结束时保存，进程中途退出会丢失整段回答；每个 token 都写库，写入量又太大。常见做法是每隔一段时间或一定字数存一次检查点。</li>
<li>写入带消息 ID 和版本号，旧检查点不能覆盖已完成的状态。</li>
<li>界面上&quot;已保存&quot;要区分本地草稿和服务端确认。</li>
<li>刷新后显示&quot;正在生成&quot;之前，先向服务端查询运行状态，恢复流程见&quot;AI 流式输出断线后，怎样恢复同一条生成任务？&quot;。</li>
</ul>
<h2>附件和本地草稿</h2>
<ul>
<li><code>blob:</code> URL 只在当前页面有效，签名 URL 会过期。保存文件 ID，展示时重新申请访问地址。</li>
<li>localStorage 或 IndexedDB 里的草稿要按账号隔离，退出登录时清除。</li>
<li>每次读取会话都校验归属。会话 ID 再长也不是权限凭证。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>历史太长怎么办？</strong> 持久化保存完整记录，发送给模型时再截断或摘要，规则见&quot;为什么不能用字符串长度准确计算 Token 和费用？&quot;。</li>
<li><strong>删除会话要删什么？</strong> 消息、片段、附件文件和相关日志都要按保留策略删除，而不只是在界面上隐藏。</li>
</ul>`};export{e as default};