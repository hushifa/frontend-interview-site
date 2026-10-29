var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>因为一条助手回答不只有文字，中间可能调用了工具、拿到了工具结果、附带了引用来源。只存最后那段文字，下次接着聊的时候，模型看不到这些上下文，界面也还原不出来。</p>
<p>所以一条消息要存成有顺序的多个片段，消息和片段都有稳定的 ID，还要记下数据格式的版本号和这条消息属于哪个用户。</p>
<p>存下来的记录也不能原样发给模型。界面上的东西有很多模型用不到，重新调用模型前要转换一遍，并且由服务端校验每条消息的角色和来源。</p>
<p>流式回答要隔一段时间存一次，工具开始、成功、失败这类关键事件马上存。附件存的是文件 ID，不要存 <code>blob:</code> 地址或会过期的签名链接。</p>
</blockquote>
<h2>一条消息要存哪些东西</h2>
<p>先看数据结构。注意 <code>parts</code> 数组，一条消息的内容就是由这些片段组成的：</p>
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
<p>消息之间的顺序，以服务端分配的序号为准。不要靠数组下标，也不要靠客户端时间戳，用户电脑的时钟可能不准，多个设备同时写也会乱。</p>
<p>重试时生成一条新的尝试记录，不要覆盖失败的那一次，这样出问题时还能查。</p>
<p>工具调用和工具结果要按 <code>callId</code> 成对保存。为什么要强调成对？因为模型 API 通常要求每个工具调用后面都跟着它的结果，如果历史里只有调用、没有结果，API 一般会直接拒绝这段历史。</p>
<h2>给界面看的和发给模型的，为什么要分开</h2>
<p>界面记录里有很多模型用不到的东西，比如上传进度、按钮状态、调试信息，发给模型之前要过滤掉。</p>
<p>更重要的是安全问题。客户端提交上来的历史不能直接信。如果服务端直接用浏览器传来的历史，别人就可以在里面塞一条 <code>role: &#x27;system&#x27;</code> 的消息，或者伪造一个工具结果，模型会以为这是真的。所以服务端要从自己的数据库里读历史，而不是用浏览器传来的。</p>
<p>还有格式升级的问题。SDK 升级可能改变片段的类型，旧记录能解析出来，不代表意思没变。要按 <code>schemaVersion</code> 写迁移逻辑，并且测一下旧会话能不能正常显示、继续提问和删除。</p>
<h2>流式回答什么时候保存</h2>
<p>只在结束时保存，服务进程中途挂了，整段回答就丢了；每来一个 token 就写一次库，写入量又太大。常见做法是折中：每隔一段时间或者每多一定字数，存一次检查点。</p>
<p>写入时带上消息 ID 和版本号。为什么？因为写入可能乱序到达，一个旧的检查点晚到了，不能把已经标成“完成”的状态又覆盖回去。</p>
<p>界面上显示“已保存”时，要分清是存在本地的草稿，还是服务端已经确认了。刷新页面以后，要先问服务端这次生成还在不在跑，再决定显不显示“正在生成”，恢复流程见<a href="/questions/ai-stream-recovery/">《AI 流式输出断线后，怎样恢复同一条生成任务？》</a>。</p>
<h2>附件和本地草稿</h2>
<p><code>blob:</code> 地址只在当前页面有效，刷新就没了；签名 URL 过一段时间会过期。所以要保存文件 ID，每次展示时再去申请访问地址。</p>
<p>存在 localStorage 或 IndexedDB 里的草稿，要按账号分开，退出登录时清掉，不然换个人登录就能看到上一个人的草稿。</p>
<p>每次读取会话都要校验它是不是属于当前用户。会话 ID 再长、再随机，也不能当成权限凭证。</p>
<h2>常见追问</h2>
<p><strong>历史太长怎么办？</strong></p>
<blockquote>
<p>存的时候还是存完整记录，发给模型的时候再截断或者做摘要，具体规则见<a href="/questions/ai-token-context/">《为什么不能用字符串长度准确计算 Token 和费用？》</a>。</p>
</blockquote>
<p><strong>删除会话要删哪些东西？</strong></p>
<blockquote>
<p>消息、片段、附件文件，还有相关的日志，都要按保留策略删掉，而不是只在界面上隐藏起来。</p>
</blockquote>`};export{e as default};