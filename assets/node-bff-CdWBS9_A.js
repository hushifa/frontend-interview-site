var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写页面时，代码跑在用户的浏览器里，能做的事有限。写 Node 服务就不一样了，它能读写文件、发内网请求、启动子进程、拿到数据库密码。所以前端在页面上做的校验，到了服务端都要重新做一遍，因为用户完全可以绕过页面直接调接口。参数的类型、长度、取值范围要校验，“这条数据是不是你的”也要逐条检查。</p>
<p>有几类输入绝不能直接用。客户端传来的完整 URL 不能拿去请求，否则就是 SSRF，应该只收业务 ID，由服务端决定请求哪个上游。文件路径用服务端维护的 ID 映射；外部命令用 <code>execFile</code> 或 <code>spawn</code> 加参数数组，不经过 shell 拼字符串。</p>
<p>资源也要设上限：请求体大小、超时、并发和速率。另外同步的重计算和回溯严重的正则会卡住整个事件循环，所有请求都会跟着变慢。</p>
<p>最后，日志和错误响应里不要出现令牌、Cookie 和内部堆栈，依赖和生产凭据按最小权限管理。</p>
</blockquote>
<h2>为什么页面校验过了，服务端还要再校验</h2>
<p>页面上的表单校验只是为了体验，攻击者可以用 curl 直接发请求。所以服务端要在入口把参数校验一遍，后面的代码只用校验后的值：</p>
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
<p>客户端提交的 <code>userId</code>、<code>role</code>、价格，都不能当成事实，要从会话和数据库里取。</p>
<p>还有一个容易漏的点。认证回答的是“你是谁”，授权回答的是“你能不能操作这条数据”。如果只检查了登录状态，不检查资源归属，用户把 URL 里的 ID 改一下，就能读到别人的数据。这是最常见的越权漏洞，叫 IDOR。</p>
<h2>为什么不能让客户端决定请求哪个地址</h2>
<p>假设接口接受 <code>?url=</code> 参数，替用户去抓取内容。攻击者就可以传一个内网地址，或者云厂商的元数据地址，让你的服务器帮他访问本来访问不到的东西。这种攻击叫 SSRF，服务端请求伪造。</p>
<p>稳妥的做法是客户端只传业务 ID，上游地址写死在服务端：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> <span class="hljs-variable constant_">UPSTREAM</span> = <span class="hljs-string">&#x27;https://catalog.internal.example&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadProduct</span>(<span class="hljs-params">productId, signal</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-regexp">/^[\\w-]{1,64}$/</span>.<span class="hljs-title function_">test</span>(productId)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;商品编号格式不正确&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`<span class="hljs-subst">\${UPSTREAM}</span>/products/<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(productId)}</span>\`</span>, {
    <span class="hljs-attr">signal</span>: <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([signal, <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">3000</span>)]),
    <span class="hljs-attr">redirect</span>: <span class="hljs-string">&#x27;error&#x27;</span>,
  });
}
</code></pre></div>
<p>确实需要抓取外部 URL 时，要限制协议和目标主机，解析 DNS 后拒绝内网地址段，禁止重定向或者每一跳都重新校验，最好再加一层网络出口限制。只检查字符串前缀是不够的，<code>https://example.com.evil.net</code> 也是以 <code>https://example.com</code> 开头的。</p>
<p>转发请求头时也只带必要的几个。如果把浏览器的 Cookie、Authorization 原样转给所有上游，凭据就可能被发到不该去的服务。</p>
<h2>文件路径和命令为什么不能拼用户输入</h2>
<p>先说文件。<code>path.join(base, userInput)</code> 拦不住 <code>../</code>，用户可以一路往上跳到任意目录，这叫路径穿越。最安全的是按 ID 查表得到文件名；必须接受路径时，<code>path.resolve</code> 之后检查结果还在允许的目录下，并考虑符号链接。</p>
<p>再说命令。<code>exec(\\</code>convert \${name}\`)<code> 会交给 shell 解析，</code>name<code>里的</code>;<code>、</code>$()<code>都能让攻击者执行任意命令。改成</code>execFile(&#x27;convert&#x27;, [name])<code>，参数不经过 shell。不过参数数组只能防 shell 注入，以 </code>-\` 开头的参数仍可能被工具当成选项，需要额外校验。</p>
<p>还有，不要用 <code>eval</code>、<code>new Function</code> 或 <code>vm</code> 处理用户数据，<code>vm</code> 不是安全沙箱。</p>
<h2>资源要设哪些上限</h2>
<table><thead><tr><th>风险</th><th>处理</th></tr></thead><tbody><tr><td>超大请求体</td><td>在框架解析前限制大小，例如 1MB，超出直接返回 413</td></tr><tr><td>下游不返回</td><td>每个调用都有超时，整次请求有总预算</td></tr><tr><td>正则回溯</td><td>避免嵌套量词，限制输入长度</td></tr><tr><td>暴力请求</td><td>按 IP 或用户限流</td></tr><tr><td>同步重计算</td><td>移到 Worker，见<a href="/questions/node-worker-threads/">《Node.js Worker Threads 适合解决什么问题？》</a></td></tr></tbody></table>
<p>Node.js HTTP 服务器的 <code>requestTimeout</code> 默认 300 秒，<code>headersTimeout</code> 默认 60 秒。它们限制的是接收完整个请求的时间，用来防慢速请求攻击。处理请求本身花多久，要靠业务代码里的超时来控制。</p>
<h2>依赖和密钥怎么管</h2>
<p>密钥放在环境变量或密钥管理服务里，不提交到仓库，也不能写进前端构建产物。</p>
<p>依赖要锁定版本，在 CI 里运行 <code>npm audit</code> 等检查。安装脚本会以当前用户的权限运行，不认识的包先审查再装。</p>
<p>错误响应只返回 <code>code</code> 和请求 ID，详细堆栈留在服务端日志里，日志同样要脱敏。</p>
<h2>常见追问</h2>
<p><strong>BFF 已经校验过，下游还要校验吗？</strong></p>
<blockquote>
<p>要。其他调用方可能绕过 BFF 直接访问下游，每个服务都要守住自己的边界。</p>
</blockquote>
<p><strong>Node.js 的权限模型能防住这些问题吗？</strong></p>
<blockquote>
<p><code>--permission</code> 能限制进程读写哪些文件、能不能创建子进程，漏洞被利用以后影响范围会小一些。但它代替不了输入校验和授权。</p>
</blockquote>`};export{e as default};