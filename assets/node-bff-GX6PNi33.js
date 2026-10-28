var e={answerHtml:`<h2>简答</h2>
<ul>
<li>用户可以绕过页面直接调用接口，参数类型、长度、枚举和资源归属都要在服务端重新校验；认证确认身份，授权还要按资源逐项检查。</li>
<li>不接受客户端传来的完整 URL 让服务端去请求，客户端只传业务 ID，由服务端选择固定的上游，否则会出现 SSRF。</li>
<li>文件访问用服务端维护的 ID 映射，外部命令用 <code>execFile</code> 或 <code>spawn</code> 加参数数组，不经过 shell 拼接字符串。</li>
<li>请求体大小、超时、并发和速率都要设上限；同步的重计算和回溯严重的正则会阻塞整个事件循环。</li>
<li>日志和错误响应中不出现令牌、Cookie 和内部堆栈，依赖与生产凭据按最小权限管理。</li>
</ul>
<h2>输入与授权</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">parseListQuery</span>(<span class="hljs-params">query</span>) {
  <span class="hljs-keyword">const</span> page = <span class="hljs-title class_">Number</span>(query.<span class="hljs-property">page</span> ?? <span class="hljs-number">1</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isSafeInteger</span>(page) || page &lt; <span class="hljs-number">1</span> || page &gt; <span class="hljs-number">1000</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;page 必须是 1 到 1000 的整数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> sort = query.<span class="hljs-property">sort</span> ?? <span class="hljs-string">&#x27;latest&#x27;</span>;
  <span class="hljs-keyword">if</span> (![<span class="hljs-string">&#x27;latest&#x27;</span>, <span class="hljs-string">&#x27;popular&#x27;</span>].<span class="hljs-title function_">includes</span>(sort)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;不支持的排序方式&#x27;</span>);
  }
  <span class="hljs-keyword">return</span> { page, sort };
}
</code></pre></div>
<p>校验在服务端边界做一次，后续代码只使用校验后的值。客户端提交的 <code>userId</code>、<code>role</code>、价格不能当作事实，应从会话和数据库中取得。</p>
<p>认证回答&quot;你是谁&quot;，授权回答&quot;你能不能操作这条数据&quot;。只校验登录状态而不检查资源归属，用户改一下 URL 里的 ID 就能读到别人的数据，这是最常见的越权漏洞（IDOR）。</p>
<h2>SSRF：下游地址由服务端决定</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">UPSTREAM</span> = <span class="hljs-string">&#x27;https://catalog.internal.example&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadProduct</span>(<span class="hljs-params">productId, signal</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-regexp">/^[\\w-]{1,64}$/</span>.<span class="hljs-title function_">test</span>(productId)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;商品编号格式不正确&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${UPSTREAM}</span>/products/<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(productId)}</span>\`</span>, {
    <span class="hljs-attr">signal</span>: <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([signal, <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">3000</span>)]),
    <span class="hljs-attr">redirect</span>: <span class="hljs-string">&#x27;error&#x27;</span>,
  });
}
</code></pre></div>
<p>如果接口接受 <code>?url=</code> 并替用户请求，攻击者就能让服务端访问内网服务或云厂商的元数据地址。确实需要抓取外部 URL 时，要限制协议和目标主机，解析 DNS 后拒绝内网地址段，禁止或逐跳校验重定向，最好再加一层网络出口限制。只检查字符串前缀不够：<code>https://example.com.evil.net</code> 也以 <code>https://example.com</code> 开头。</p>
<p>转发请求头时只带必要的几个。把浏览器的 Cookie、Authorization 原样转给所有上游，凭据就可能发到不该去的服务。</p>
<h2>文件与命令</h2>
<ul>
<li><code>path.join(base, userInput)</code> 无法阻止 <code>../</code> 穿越。按 ID 查表得到文件名最安全；必须接受路径时，<code>path.resolve</code> 后检查结果仍在允许的目录下，并考虑符号链接。</li>
<li><code>exec(\\</code>convert \${name}\`)<code> 会经过 shell 解析，</code>name<code>里的</code>;<code>、</code>$()<code>都能执行任意命令。改用</code>execFile(&#x27;convert&#x27;, [name])<code>。参数数组能防 shell 注入，但以 </code>-\` 开头的参数仍可能被工具当成选项，需要额外校验。</li>
<li>不要用 <code>eval</code>、<code>new Function</code> 或 <code>vm</code> 处理用户数据，<code>vm</code> 不是安全沙箱。</li>
</ul>
<h2>资源上限</h2>
<table><thead><tr><th>风险</th><th>处理</th></tr></thead><tbody><tr><td>超大请求体</td><td>在框架解析前限制大小，例如 1MB，超出直接返回 413</td></tr><tr><td>下游不返回</td><td>每个调用都有超时，整次请求有总预算</td></tr><tr><td>正则回溯</td><td>避免嵌套量词，限制输入长度</td></tr><tr><td>暴力请求</td><td>按 IP 或用户限流</td></tr><tr><td>同步重计算</td><td>移到 Worker，见<a href="/questions/node-worker-threads/">《Node.js Worker Threads 适合解决什么问题？》</a></td></tr></tbody></table>
<p>Node.js HTTP 服务器的 <code>requestTimeout</code> 默认 300 秒，<code>headersTimeout</code> 默认 60 秒，限制的是接收完整个请求的时间，用来防慢速请求攻击，处理请求本身的耗时要靠业务代码里的超时来控制。</p>
<h2>依赖与密钥</h2>
<ul>
<li>密钥放在环境变量或密钥管理服务中，不提交到仓库，不写进前端构建产物。</li>
<li>锁定依赖版本，在 CI 中运行 <code>npm audit</code> 等检查；安装脚本会以当前用户权限运行，不认识的包要先审查。</li>
<li>错误响应只返回 <code>code</code> 和请求 ID，详细堆栈留在服务端日志里，日志同样要脱敏。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>BFF 已经校验过，下游还要校验吗？</strong> 要。其他调用方可能绕过 BFF 直接访问下游，每个服务都要守住自己的边界。</li>
<li><strong>Node.js 的权限模型能防住这些问题吗？</strong> <code>--permission</code> 能限制进程读写哪些文件、能否创建子进程，可以减小漏洞被利用后的影响范围，但不能代替输入校验和授权。</li>
</ul>`};export{e as default};