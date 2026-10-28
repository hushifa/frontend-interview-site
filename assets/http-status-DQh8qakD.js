var e={answerHtml:`<h2>简答</h2>
<ul>
<li>状态码只是判断的一部分，还要检查正文能否解析、业务结果是否满足。</li>
<li>202 表示已接收但未完成，204 没有正文，304 是缓存验证结果而不是新正文。</li>
<li>401 与认证有关，403 是拒绝执行，不能都跳登录页；409、412、429 需要各自的恢复方式。</li>
<li>5xx 能帮助定位故障层，但 504 不能证明后端没有写入。</li>
<li>301/302 的 POST 可能被改成 GET，307/308 保留方法与正文。</li>
</ul>
<p>前端处理响应时，至少要区分：有没有取得可读的响应，HTTP 状态表达什么，正文能否按预期解析，以及业务结果是否满足要求。一个状态码不能替代全部判断。</p>
<p>常见分类是 1xx 信息响应、2xx 成功、3xx 重定向或相关控制、4xx 客户端请求相关问题、5xx 服务端处理相关失败。这里的“客户端问题”也不等于用户一定操作错误，例如身份过期和资源冲突需要不同恢复方式。</p>
<h2>2xx 里也有不同的完成程度</h2>
<table><thead><tr><th>状态</th><th>主要含义</th><th>前端应注意什么</th></tr></thead><tbody><tr><td>200</td><td>请求按相应语义成功</td><td>仍要检查正文类型与业务结构</td></tr><tr><td>201</td><td>创建了资源</td><td>可以按接口使用 Location 或返回数据定位新资源</td></tr><tr><td>202</td><td>已接收处理，但尚未完成</td><td>不应立即宣称最终操作成功，可能需要查询任务状态</td></tr><tr><td>204</td><td>成功且没有响应正文</td><td>不要无条件调用 json</td></tr><tr><td>206</td><td>返回所请求的部分表示</td><td>需要结合范围相关头处理，不等同于完整文件</td></tr></tbody></table>
<p>202 只说明服务器接受了处理，不保证未来一定成功。创建导出任务、长时间处理等流程，通常需要任务 ID、后续状态或其他完成通知。</p>
<p>204 则不是“返回了一个空 JSON 对象”：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> response = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Response</span>(<span class="hljs-literal">null</span>, { <span class="hljs-attr">status</span>: <span class="hljs-number">204</span> });
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(response.<span class="hljs-property">ok</span>); <span class="hljs-comment">// true</span>
<span class="hljs-keyword">try</span> {
  <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
} <span class="hljs-keyword">catch</span> (error) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// SyntaxError</span>
}
</code></pre></div>
<p>空正文不是合法 JSON。统一响应封装应根据请求方法和接口契约处理无正文情形，而不是只要 ok 就解析 JSON。</p>
<h2>304 是缓存验证结果，不是新的完整正文</h2>
<p>304 Not Modified 表示相应条件请求可以继续使用已有表示，它不会再携带完整资源正文。若浏览器自己完成了 HTTP 缓存验证，脚本最终可能拿到合并缓存后的正常响应，而开发工具网络层显示的是 304。</p>
<p>因此不能要求每个业务 fetch 都自己收到 304 再手动查缓存。若应用主动管理条件请求，则必须明确自己是否真的保存了可复用正文，不能拿一个单独的 304 当成新数据。</p>
<h2>认证、权限与资源问题不能都跳登录页</h2>
<table><thead><tr><th>状态</th><th>常见含义</th><th>合理处理方向</th></tr></thead><tbody><tr><td>400</td><td>请求格式或其他客户端请求问题</td><td>核对参数、编码与接口契约</td></tr><tr><td>401</td><td>缺少可接受的认证凭据等</td><td>按认证流程处理，不无限循环刷新或重试</td></tr><tr><td>403</td><td>服务器理解请求但拒绝执行</td><td>结合权限和业务错误码提示，重新登录未必能解决</td></tr><tr><td>404</td><td>未找到目标资源，或服务端选择不暴露其存在</td><td>显示适当缺失状态，核对路径与权限上下文</td></tr><tr><td>410</td><td>资源明确不再可用</td><td>按接口解释已移除或失效的资源</td></tr><tr><td>422</td><td>内容语法可能可理解，但语义无法按要求处理</td><td>常用于字段或业务约束错误</td></tr></tbody></table>
<p>401 的标准语义与认证挑战有关，服务端应提供相应 WWW-Authenticate 信息。真实应用还可能有特定的令牌、会话或业务错误结构，前端应按明确契约处理。</p>
<p>403 不必然说明“身份已经完全确认”，也不保证换一个登录入口就有权限。把所有 403 都重定向登录，可能掩盖真正的资源授权问题。</p>
<h2>冲突和限流需要不同于普通失败的恢复</h2>
<p>409 常用于当前资源状态与请求意图冲突，例如某项状态不允许继续变更。412 则表示请求中相应前置条件不满足，例如 If-Match 版本已经过期。处理方式可能是刷新、提示冲突或让用户重新确认，而不是原样无限重发。</p>
<p>429 表示受到限流。若响应包含 Retry-After，应按其支持的秒数或 HTTP 日期形式处理，并结合退避与业务重试策略。并非所有失败都应该立即重试，重试本身也可能继续加重限流。</p>
<p>这些状态的正文常常包含更细的错误码或字段信息，但仍应按结构检查，避免把任意服务器返回字符串直接当作可执行内容或用户界面的全部解释。</p>
<h2>5xx 也不只有一个“服务器挂了”</h2>
<p>500 是通用的服务器处理错误，502 通常涉及网关收到无效上游响应，503 表示服务暂时无法处理，504 则常表示网关等待上游超时。</p>
<p>它们有助于定位失败发生在哪一层，但不能单凭 504 就确认后端没有完成写入。重要变更在结果不确定时，需要幂等或状态查询，不能因为状态码看起来像超时就重复创建。</p>
<p>503 也可能提供 Retry-After。是否重试还取决于方法语义、当前用户操作和服务端约定，而不是只根据状态码位于 5xx 就统一自动重发。</p>
<h2>重定向可能改变请求方法</h2>
<p>301、302 与 307、308 的差别不只是永久或临时。浏览器 Fetch 在某些 301/302 的 POST 重定向中会改用 GET；303 通常引导后续获取资源；307、308 则要求保留相应方法与正文。</p>
<p>fetch 默认会按规则跟随重定向，所以脚本通常看到最终响应，而不是每个中间状态。response.redirected 与 url 可以提供一些线索，完整链路仍应结合开发工具观察。</p>
<p>浏览器中使用 redirect:&#x27;manual&#x27;，可能得到受限制的 opaqueredirect 响应，而不是一份能任意读取 Location 的普通 302。Node 等环境的表现可能不同，不应混着分析。</p>
<h2>status 为 0 不是服务端定义了一个特殊 HTTP 错误</h2>
<p>opaque、opaqueredirect 等过滤响应可能对脚本呈现 status:0。它表示脚本没有普通状态与正文访问能力，不是服务器真的在 HTTP 状态行里返回了 0。</p>
<p>网络失败、CORS 读取失败和取消则还可能让 fetch 本身拒绝，根本没有一个业务可读 Response。不要把这些情况与 404、500 这样的可读 HTTP 响应混成同一种错误对象。</p>
<p>最后，一些错误响应也可能被缓存。部署后持续看到旧 404，或临时错误长期复用时，应检查缓存策略。状态码、业务结果和缓存行为一起核对，才能给用户正确的恢复入口。</p>`};export{e as default};