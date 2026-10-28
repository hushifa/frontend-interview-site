var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>401</code> 表示没有有效身份，引导登录或刷新令牌；<code>403</code> 表示身份已知但无权限，重新登录也没用。</li>
<li><code>429</code> 和 <code>503</code> 是暂时性的，按 <code>Retry-After</code> 等待后重试；<code>400</code>、<code>404</code>、<code>422</code> 这类重试也不会成功。</li>
<li><code>204</code> 没有正文，直接调用 <code>response.json()</code> 会报错。</li>
<li><code>301</code>、<code>302</code>、<code>307</code>、<code>308</code> 会被 <code>fetch</code> 自动跟随，脚本通常看不到；<code>304</code> 由浏览器缓存处理。</li>
</ul>
<h2>常用状态码</h2>
<table><thead><tr><th>状态码</th><th>含义</th><th>前端处理</th></tr></thead><tbody><tr><td>200</td><td>成功</td><td>读取正文</td></tr><tr><td>201</td><td>已创建</td><td>可读 <code>Location</code> 头获取新资源地址</td></tr><tr><td>202</td><td>已接受，尚未处理完</td><td>轮询任务状态或等待推送</td></tr><tr><td>204</td><td>成功，无正文</td><td>不解析正文</td></tr><tr><td>301 / 308</td><td>永久重定向</td><td>308 保持方法和请求体</td></tr><tr><td>302 / 307</td><td>临时重定向</td><td>307 保持方法和请求体</td></tr><tr><td>304</td><td>未修改</td><td>浏览器复用缓存</td></tr><tr><td>400</td><td>请求格式错误</td><td>修正请求，不重试</td></tr><tr><td>401</td><td>未认证</td><td>登录或刷新令牌</td></tr><tr><td>403</td><td>已认证但无权限</td><td>提示无权限</td></tr><tr><td>404</td><td>资源不存在</td><td>显示空状态</td></tr><tr><td>409</td><td>冲突，如版本过期</td><td>提示刷新后重试</td></tr><tr><td>422</td><td>语义校验失败</td><td>显示字段错误</td></tr><tr><td>429</td><td>请求过多</td><td>按 <code>Retry-After</code> 退避</td></tr><tr><td>500</td><td>服务器内部错误</td><td>提示稍后再试，可有限重试幂等请求</td></tr><tr><td>502 / 504</td><td>网关错误或超时</td><td>可有限重试幂等请求</td></tr><tr><td>503</td><td>暂时不可用</td><td>按 <code>Retry-After</code> 退避</td></tr></tbody></table>
<p>301 和 302 在历史上会被客户端把 <code>POST</code> 改成 <code>GET</code>，307 和 308 明确要求不改方法，所以接口重定向优先用后两个。</p>
<h2>统一处理示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">request</span>(<span class="hljs-params">url, init</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, init);
  <span class="hljs-keyword">if</span> (response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">return</span> response.<span class="hljs-property">status</span> === <span class="hljs-number">204</span> ? <span class="hljs-literal">null</span> : response.<span class="hljs-title function_">json</span>();

  <span class="hljs-keyword">switch</span> (response.<span class="hljs-property">status</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-number">401</span>:
      <span class="hljs-title function_">redirectToLogin</span>();
      <span class="hljs-keyword">break</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-number">429</span>:
    <span class="hljs-keyword">case</span> <span class="hljs-number">503</span>: {
      <span class="hljs-keyword">const</span> seconds = <span class="hljs-title class_">Number</span>(response.<span class="hljs-property">headers</span>.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;Retry-After&#x27;</span>));
      <span class="hljs-keyword">throw</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;稍后重试&#x27;</span>), { <span class="hljs-attr">retryAfter</span>: seconds || <span class="hljs-number">5</span> });
    }
  }
  <span class="hljs-keyword">throw</span> <span class="hljs-title class_">Object</span>.<span class="hljs-title function_">assign</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>), { <span class="hljs-attr">status</span>: response.<span class="hljs-property">status</span> });
}
</code></pre></div>
<p><code>Retry-After</code> 也可能是 HTTP 日期格式，生产代码要两种都解析。<code>fetch</code> 本身的错误处理见《为什么 fetch 收到 404 不一定进入 catch？》。</p>
<h2>常见追问</h2>
<ul>
<li>业务错误该用 200 加错误码，还是用 4xx？用 HTTP 状态码表达协议层结果，监控、缓存和网关能正确识别；业务细节放在响应体里。</li>
<li>跨源重定向会怎样？<code>fetch</code> 跟随时会重新做 CORS 检查，重定向目标也必须允许该来源。</li>
</ul>`};export{e as default};