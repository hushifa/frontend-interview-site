var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>状态码的第一位就是大类：2 开头是成功，3 开头是重定向，4 开头是请求方的问题，5 开头是服务器的问题。但前端不能只看大类，要按具体的码决定怎么做。</p>
<p>最常被问的是 401 和 403。401 是“不知道你是谁”，要去登录或刷新令牌；403 是“知道你是谁，但你没权限”，重新登录也没用。</p>
<p>再就是要不要重试。429 和 503 是暂时的，按 <code>Retry-After</code> 等一会再试；400、404、422 这类问题出在请求本身，重试多少次都一样。</p>
<p>还有两个小坑。204 没有正文，直接调 <code>response.json()</code> 会报错。301、302、307、308 这些重定向 <code>fetch</code> 会自动跟随，脚本一般看不到；304 由浏览器缓存自己处理。</p>
</blockquote>
<h2>常用状态码和前端怎么处理</h2>
<table><thead><tr><th>状态码</th><th>含义</th><th>前端处理</th></tr></thead><tbody><tr><td>200</td><td>成功</td><td>读取正文</td></tr><tr><td>201</td><td>已创建</td><td>可读 <code>Location</code> 头获取新资源地址</td></tr><tr><td>202</td><td>已接受，尚未处理完</td><td>轮询任务状态或等待推送</td></tr><tr><td>204</td><td>成功，无正文</td><td>不解析正文</td></tr><tr><td>301 / 308</td><td>永久重定向</td><td>308 保持方法和请求体</td></tr><tr><td>302 / 307</td><td>临时重定向</td><td>307 保持方法和请求体</td></tr><tr><td>304</td><td>未修改</td><td>浏览器复用缓存</td></tr><tr><td>400</td><td>请求格式错误</td><td>修正请求，不重试</td></tr><tr><td>401</td><td>未认证</td><td>登录或刷新令牌</td></tr><tr><td>403</td><td>已认证但无权限</td><td>提示无权限</td></tr><tr><td>404</td><td>资源不存在</td><td>显示空状态</td></tr><tr><td>409</td><td>冲突，如版本过期</td><td>提示刷新后重试</td></tr><tr><td>422</td><td>语义校验失败</td><td>显示字段错误</td></tr><tr><td>429</td><td>请求过多</td><td>按 <code>Retry-After</code> 退避</td></tr><tr><td>500</td><td>服务器内部错误</td><td>提示稍后再试，可有限重试幂等请求</td></tr><tr><td>502 / 504</td><td>网关错误或超时</td><td>可有限重试幂等请求</td></tr><tr><td>503</td><td>暂时不可用</td><td>按 <code>Retry-After</code> 退避</td></tr></tbody></table>
<h2>307、308 和 301、302 差在哪</h2>
<p>这四个都是重定向，看起来差不多，区别在会不会改请求方法。</p>
<p>历史上，客户端遇到 301 和 302 时，会把 <code>POST</code> 改成 <code>GET</code> 再去新地址，请求体也丢了。307 和 308 是后来专门补上的，明确要求不许改方法、保留请求体。307 是临时的，308 是永久的。所以接口要做重定向时，优先用 307 和 308。</p>
<h2>统一处理怎么写</h2>
<p>实际项目里一般在请求函数里统一分流：</p>
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
<p>成功时先判断 204，避免解析空正文报错。429 和 503 把等待秒数挂在错误上，交给调用方决定什么时候重试。</p>
<p>这里的 <code>Number(...)</code> 只处理了秒数。<code>Retry-After</code> 还可能是一个 HTTP 日期，这时 <code>Number</code> 得到 <code>NaN</code>，代码退回默认 5 秒。生产代码要两种格式都解析。<code>fetch</code> 本身什么时候进 catch，见<a href="/questions/http-fetch-errors/">《为什么 fetch 收到 404 不一定进入 catch？》</a>。</p>
<h2>常见追问</h2>
<p><strong>业务错误该用 200 加错误码，还是用 4xx？</strong></p>
<blockquote>
<p>用 HTTP 状态码表达协议层的结果，这样监控、缓存和网关都能正确识别。业务上的细节放在响应体里。</p>
</blockquote>
<p><strong>跨源重定向会怎样？</strong></p>
<blockquote>
<p><code>fetch</code> 跟随重定向时会重新做一次 CORS 检查，重定向的目标也必须允许这个来源。</p>
</blockquote>`};export{e as default};