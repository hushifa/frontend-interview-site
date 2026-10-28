var e={answerHtml:`<h2>简答</h2>
<ul>
<li>BFF 必须重新校验所有输入和权限，不能信任前端已经做过的检查。</li>
<li>不要让客户端传入任意 URL 让服务端去请求，以免造成 SSRF。</li>
<li>每个下游调用都要设置超时、取消和有限的重试。</li>
<li>文件路径和系统命令不能用字符串拼接用户输入。</li>
</ul>
<p>前端代码通常在浏览器沙箱中运行；Node 服务却可能读取文件、连接内部网络、启动进程和访问密钥。一段在页面中只会造成显示错误的输入，到了服务端可能变成越权读取或内部请求。因此，不能因为服务只是“给前端拼一下接口”，就按可信代理来实现。</p>
<p>BFF 是面向特定前端的服务适配层，可以聚合接口、整理数据和处理会话，但它仍然是需要鉴权、限流和部署治理的服务。</p>
<h2>不相信“前端已经检查过了”</h2>
<p>用户可以绕过页面直接请求接口，所以参数类型、长度、枚举、数组规模和嵌套深度都要重新验证。客户端传来的 userId、价格、角色和资源归属不能直接成为业务事实。</p>
<p>认证回答“当前是谁”，授权回答“这个人能对这个资源做什么”。即使 BFF 已经验证会话，下游业务服务仍应在自己的边界落实授权。否则另一个调用方绕过 BFF，就可能跳过真正的权限检查。</p>
<p>上游响应也不能不加限制地信任。字段可能变化、返回异常 HTML 或体积超出预期；聚合前应检查状态、格式和大小，避免把错误内容直接透传给页面。</p>
<h2>代理地址不能由用户任意决定</h2>
<p>如果接口接受一个完整 URL 并替用户 fetch，就可能变成 SSRF 入口，让攻击者借服务访问内部地址或云环境敏感端点。更稳妥的方式是让客户端传业务 ID，由服务端选择固定上游及路径。</p>
<p>确实需要访问外部 URL 时，要限制协议、目标主机和重定向行为，并结合 DNS、地址范围和网络出口控制。只检查字符串是否以某个域名开头不可靠；即使首个 URL 合法，重定向也可能跳向不允许的位置。</p>
<p>转发请求头同样要选择性处理。不要把浏览器传来的 Cookie、Authorization 或 Host 不加判断地复制给所有上游，以免凭据被发送到错误服务。</p>
<h2>超时、取消与重试是资源边界</h2>
<p>一个页面请求聚合五个上游时，任何一个长期不返回都可能占住连接和内存。应定义整体请求预算，再分配上游超时、并发上限和响应大小限制。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 示例要求现代 Node，已有调用方的 AbortSignal。</span>
<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadProduct</span>(<span class="hljs-params">productId, requestSignal</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-regexp">/^[a-zA-Z0-9_-]{1,64}$/</span>.<span class="hljs-title function_">test</span>(productId)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;商品编号格式不正确&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> signal = <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([
    requestSignal,
    <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">3000</span>),
  ]);
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(
    <span class="hljs-string">\`https://catalog.example.com/products/<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(productId)}</span>\`</span>,
    { signal, <span class="hljs-attr">redirect</span>: <span class="hljs-string">&#x27;error&#x27;</span> },
  );
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) {
    <span class="hljs-keyword">await</span> response.<span class="hljs-property">body</span>?.<span class="hljs-title function_">cancel</span>();
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`商品服务返回异常状态：<span class="hljs-subst">\${response.status}</span>\`</span>);
  }
  <span class="hljs-keyword">return</span> response;
}
</code></pre></div>
<p>这个片段展示固定上游、参数限制、取消与超时；调用方仍要按上限消费响应体并校验数据。不能把 <code>response.json()</code> 当作自带体积上限的解析器。客户端断开连接后，服务也应将取消信号传给不再需要的上游工作。</p>
<p>重试会放大流量，尤其是每一层都重试时。只对适合重试的错误使用有上限的退避，并区分读取请求与可能产生副作用的操作；超时不代表远端一定没执行，创建订单等接口需要幂等机制。</p>
<h2>文件和命令不要靠字符串拼接授权</h2>
<p>文件访问尽量用服务端维护的 ID 映射，不接受任意路径。仅仅 path.join 并不能防止目录穿越；检查规范化路径仍要考虑符号链接、权限和竞争条件。</p>
<p>调用外部程序时优先避免 shell，使用固定可执行文件与明确参数，并验证参数语义。改用参数数组能减少 shell 注入，却不能阻止工具自身把某个参数解释成危险选项。不要把 eval 或动态执行用户代码用于普通数据转换。</p>
<h2>Node 的高并发不意味着资源无限</h2>
<p>超大 JSON、灾难性回溯正则、同步文件操作和 CPU 大循环都可能阻塞事件循环。请求体上限应尽早在网关或框架解析层施加，不能等全部读入内存后才判断太大。</p>
<p>服务还需要连接和请求超时、速率限制、并发控制以及必要的任务隔离。依赖安装和构建脚本也有权限风险，生产凭据应最小化，错误日志不要记录令牌、Cookie 和不必要的个人信息。</p>
<p>对客户端返回稳定、可理解的错误，对内部保留经过脱敏的诊断和关联 ID。上线前验证异常上游、取消、超大输入和越权请求，并准备回滚。BFF 的价值是适配体验，不是重新发明一套薄弱的权限系统。</p>`};export{e as default};