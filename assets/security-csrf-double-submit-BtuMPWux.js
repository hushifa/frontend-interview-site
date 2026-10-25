var e={answerHtml:`<p>CSRF 利用的是浏览器自动携带身份凭证的行为。用户已经登录银行网站，随后打开攻击者页面；攻击者诱导浏览器向银行发送修改请求。浏览器可能带上银行的登录 Cookie，但服务器仅凭这个 Cookie 无法判断请求是用户在银行页面主动发起的，还是被外部页面诱导的。</p>
<p>Double Submit Cookie 在自动携带的 Cookie 之外，再要求一份由合法前端显式提交的 CSRF 令牌。攻击者通常可以诱导发送 Cookie，却不能读取目标站点的令牌并填进另一个位置。</p>
<h3>一次正常请求中有两份令牌</h3>
<p>服务端签发 CSRF 令牌，浏览器保存对应 Cookie。合法前端读取令牌，并把它放入自定义请求头，例如 X-CSRF-Token。于是一次请求中包含：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">POST /api/profile HTTP/1.1
Cookie: __Host-session=会话凭证; __Host-csrf=签名后的令牌
X-CSRF-Token: 签名后的令牌
Content-Type: application/json
</code></pre></div>
<p>服务端不只检查登录 Cookie，还检查 CSRF Cookie 与请求头中的令牌是否符合规则。只有自动携带的 Cookie 而没有请求头令牌，应拒绝状态修改操作。</p>
<p>登录 Cookie 和 CSRF Cookie 职责不同：登录 Cookie 应尽量设为 HttpOnly，避免页面脚本读取会话凭证；若前端需要直接从 Cookie 读取 CSRF 令牌，那么这个 CSRF Cookie 就不能是 HttpOnly。不要为了读取 CSRF 令牌，把登录 Cookie 的 HttpOnly 一起去掉。</p>
<h3>为什么只比较“两个值相等”还不可靠</h3>
<p>朴素方案只检查 Cookie 中的 token 与请求头或表单中的 token 相等。这依赖攻击者无法控制目标 Cookie。若存在子域接管、宽泛 Domain 或其他 Cookie 注入能力，攻击者可能把已知的值植入 Cookie，再提交同一个值，使比较通过。</p>
<p>因此 OWASP 推荐使用<strong>与当前登录会话绑定的签名双重提交方案</strong>。不能把“随机”“有签名”“绑定当前会话”当作同一件事；如果令牌没有绑定会话，攻击者自己会话中取得的有效令牌仍可能被拿去尝试替换受害者的值。</p>
<p>一种设计是由服务端用密钥计算 HMAC，输入包含当前会话对应的服务端值与随机数。发送给客户端的令牌由摘要和随机数组成，不能把原始会话凭证顺便暴露在可读令牌里。消息编码必须无歧义，例如使用长度前缀，避免简单拼接造成不同输入产生同一个待签名字符串。</p>
<p>验证时，服务端应检查 Cookie 和显式提交值一致，再根据当前已认证会话验证签名，并使用适当的恒定时间比较。密钥保留在服务端，不能写进前端包。实际项目优先采用框架提供的成熟实现，而不是把教学示意当作完整密码学实现。</p>
<h3>前端只负责取令牌并明确发送</h3>
<p>下面假设应用与 API 同源，服务器已经设置 <code>__Host-csrf</code> Cookie，且令牌使用适合 Cookie 的编码：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readCsrfToken</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> prefix = <span class="hljs-string">&#x27;__Host-csrf=&#x27;</span>;
  <span class="hljs-keyword">const</span> item = <span class="hljs-variable language_">document</span>.<span class="hljs-property">cookie</span>
    .<span class="hljs-title function_">split</span>(<span class="hljs-string">&#x27;;&#x27;</span>)
    .<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">part</span>) =&gt;</span> part.<span class="hljs-title function_">trim</span>())
    .<span class="hljs-title function_">find</span>(<span class="hljs-function">(<span class="hljs-params">part</span>) =&gt;</span> part.<span class="hljs-title function_">startsWith</span>(prefix));

  <span class="hljs-keyword">if</span> (!item) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;缺少安全令牌，请刷新页面后重试&#x27;</span>);
  <span class="hljs-keyword">const</span> token = <span class="hljs-built_in">decodeURIComponent</span>(item.<span class="hljs-title function_">slice</span>(prefix.<span class="hljs-property">length</span>));
  <span class="hljs-keyword">if</span> (!token) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;安全令牌为空&#x27;</span>);
  <span class="hljs-keyword">return</span> token;
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">updateNickname</span>(<span class="hljs-params">nickname</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/profile&#x27;</span>, {
    <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
    <span class="hljs-attr">credentials</span>: <span class="hljs-string">&#x27;same-origin&#x27;</span>,
    <span class="hljs-attr">headers</span>: {
      <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span>,
      <span class="hljs-string">&#x27;X-CSRF-Token&#x27;</span>: <span class="hljs-title function_">readCsrfToken</span>(),
    },
    <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ nickname }),
  });

  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`修改失败：<span class="hljs-subst">\${response.status}</span>\`</span>);
}
</code></pre></div>
<p>这段代码没有验证签名，也不应该在前端保存签名密钥；它只是传递服务器签发的令牌。服务端必须在执行修改前验证，不能仅因为请求头存在就放行。令牌不应放进 URL，以免进入访问日志、历史记录等位置。</p>
<p>跨源 API 需要另外设计令牌获取和 CORS。主站脚本不能直接读取另一主机的 host-only Cookie，不能机械把这个同源示例搬过去，再通过扩大所有 Cookie 的 Domain 来“修好”。</p>
<h3>它与其他防护如何配合</h3>
<p>同步令牌模式把令牌与服务端会话关联存储，再比较请求中的值；签名双重提交则可以避免额外保存每个 CSRF 令牌，但依然可能使用有状态的登录会话。所谓“无状态令牌校验”不等于整个系统没有会话。</p>
<p>SameSite、Origin/Referer 检查和 Fetch Metadata 可以增加防护层，自定义头还能使跨源脚本请求进入预检流程。但服务端不能对任意来源开放凭据 CORS，也不能让同一修改接口接受一个不校验令牌的降级路径。</p>
<p>最后，CSRF 防护不解决 XSS：若恶意脚本已经在可信页面执行，它往往可以读取 CSRF 令牌并正常发请求。也不应把 CSRF 令牌当作业务权限证明；“请求确实经过可信页面”与“这个用户有权修改这条记录”仍需分别验证。</p>`};export{e as default};