var e={answerHtml:`<p>前端详情页可能同时需要题目正文、用户收藏状态、推荐列表和评论摘要。如果浏览器直接调用四个后端服务，就要处理多套认证、CORS、错误、版本和瀑布；BFF 可以为这个页面提供一个面向任务的接口，把后端细节留在服务端。</p>
<p>BFF 不是把任意 URL 转发一遍的代理。它应有明确的客户端契约、输入校验、权限边界、超时预算、数据聚合和可观测性；下游服务仍要保留自己的授权和领域规则。</p>
<h2>BFF 输出页面需要的模型</h2>
<p>不要直接把四个后端响应拼成一个巨大对象，也不要把数据库字段全部透传给浏览器。BFF 应按页面任务定义稳定输出：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;question&quot;: { &quot;id&quot;: &quot;js-event-loop&quot;, &quot;title&quot;: &quot;事件循环&quot;, &quot;body&quot;: &quot;...&quot; },
  &quot;bookmarked&quot;: true,
  &quot;recommendations&quot;: [{ &quot;id&quot;: &quot;js-promise&quot;, &quot;title&quot;: &quot;Promise&quot; }],
  &quot;comments&quot;: { &quot;items&quot;: [], &quot;total&quot;: 0 },
  &quot;warnings&quot;: []
}
</code></pre></div>
<p>字段命名、空值、分页、错误和版本应由 BFF 契约定义。敏感字段、内部 ID、下游令牌和调试堆栈不应因为“前端暂时没用到”就发送出去。前端仍要在边界解析和校验数据，不能把 TypeScript 类型当成服务器保证。</p>
<h2>并行调用要有整体预算</h2>
<p>题目正文是关键数据，推荐和评论可能是可降级区域。可以并行发起独立读取，但每个下游和整次 BFF 请求都要有超时：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadQuestionPage</span>(<span class="hljs-params">{ questionId, user, signal }</span>) {
  <span class="hljs-keyword">const</span> group = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> requestSignal = <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([
    ...(signal ? [signal] : []),
    group.<span class="hljs-property">signal</span>,
    <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">2500</span>),
  ]);

  <span class="hljs-comment">// 先为所有分支建立 Promise，再启动调用，统一捕获同步抛错。</span>
  <span class="hljs-keyword">const</span> questionPromise = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">loadQuestion</span>(questionId, requestSignal));
  <span class="hljs-keyword">const</span> bookmarkPromise = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> user
    ? <span class="hljs-title function_">loadBookmark</span>(user.<span class="hljs-property">id</span>, questionId, requestSignal)
    : <span class="hljs-literal">false</span>);
  <span class="hljs-keyword">const</span> recommendationsPromise = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">loadRecommendations</span>(questionId, requestSignal));

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> [question, bookmark, recommendations] = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
    questionPromise,
    bookmarkPromise,
    recommendationsPromise,
  ]);

    <span class="hljs-keyword">return</span> { question, <span class="hljs-attr">bookmarked</span>: bookmark, recommendations };
  } <span class="hljs-keyword">catch</span> (error) {
    group.<span class="hljs-title function_">abort</span>(error);
    <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>这是展示请求协作的简化代码，真实 BFF 还要处理各个下游的独立错误和部分成功。<code>Promise.all</code> 中一个可选服务失败会让整个结果拒绝；对于推荐和评论，可以用 <code>Promise.allSettled</code> 或受控包装返回空状态和 warning，但核心题目数据失败时应返回明确错误。</p>
<p>这里约定三个 load 函数遵守传入的 signal。Promise.resolve().then 包装同步抛错和异步拒绝，先让 Promise.all 注册各分支的处理，再启动下游调用。Promise.all 本身不取消其他请求，所以失败后显式取消同组工作。已经开始的下游仍需要协作处理取消，不能保证零额外请求。AbortSignal.any 需要相应 Node.js 版本支持，例如 Node.js 20.3+；本例的 2500 毫秒仅是教学预算。</p>
<p>allSettled 会等待所有分支结束，不是“可选服务失败就立即返回”的工具。推荐接口即使可降级，也应设置比整体请求更短的独立截止时间；否则它一直不返回，正文也会被拖住。超时要覆盖响应体读取与解析所处流程，而不是只等到收到 HTTP 响应头就清除计时器。</p>
<p>客户端取消只表示 BFF 不再需要等待，不能保证下游已经撤销，也不能撤销已经发生的写操作。服务端应把请求的 AbortSignal 传给支持取消的 fetch、数据库查询和流，并在写入前后明确副作用语义。</p>
<h2>错误响应要能指导前端恢复</h2>
<p>不要把所有下游失败转成 BFF 的 500。可以区分：</p>
<ul>
<li>题目不存在：返回稳定的 404 页面状态；</li>
<li>用户未登录：收藏状态按未登录展示，并提供登录入口；</li>
<li>推荐暂时失败：保留正文，返回空推荐和可观测 warning；</li>
<li>下游超时：根据业务返回部分内容或明确重试状态；</li>
<li>权限拒绝：不能把下游内部 403 原样透传成用户可利用的权限信息。</li>
</ul>
<p>错误响应应有稳定 code、用户可理解的 message 和 request ID；内部日志保留下游服务、耗时、版本和关联 ID，但不要记录 Cookie、令牌和完整用户内容。可预期的业务失败和程序异常要使用不同处理路径。</p>
<h2>权限检查不能只在 BFF 做一次</h2>
<p>BFF 可以根据当前会话判断页面能返回哪些字段，但下游服务仍要检查资源权限。用户可以绕过 BFF 直接调用后端，也可能在页面打开后权限变化。BFF 传给下游的身份上下文应由受控服务端生成，不应信任前端提交的 <code>userId</code> 或 <code>role</code>。</p>
<p>代理目标、请求头和重定向也要限制。不要让客户端传任意 URL 并让 BFF fetch，否则可能造成 SSRF；不要把浏览器 Cookie、Authorization 或 Host 无条件复制给所有下游。固定上游、允许列表和最小请求头更容易审计。</p>
<h2>API 版本和缓存要按页面契约设计</h2>
<p>BFF 输出契约可以独立于下游服务版本演进，但下游字段改名时需要兼容窗口、适配层或契约测试。不要让前端直接依赖某个后端数据库字段名，再把 BFF 变成无意义的透传层。</p>
<p>公开题目页面和用户收藏状态的缓存策略不同。公共正文可以按版本或短 TTL 缓存；个性化收藏不能进入共享缓存。缓存键要包含语言、用户和真正影响结果的维度，失效要考虑下游更新和已经打开的客户端页面。</p>
<h2>观测和测试要覆盖聚合故障</h2>
<p>BFF 需要记录每个下游的耗时、状态和超时原因，并用 trace/request ID 关联前端、BFF 和下游日志。总响应变慢时，只有整体耗时无法说明是哪一个服务拖慢了页面。</p>
<p>测试至少覆盖：核心服务成功、可选服务超时、认证失效、下游返回格式错误、重复请求、客户端提前断开、缓存命中/失效和部分结果。Mock 可以稳定覆盖分支，但仍要有少量真实集成测试验证认证、协议、CORS 和部署网络。</p>
<p>BFF 的价值是把一次用户任务组织成清晰、稳定、可观测的接口。它不应成为所有业务规则、所有缓存和所有服务的无边界汇聚点；当聚合逻辑、团队边界和部署成本超过收益时，应重新评估领域 API、客户端并行请求或独立后端服务的取舍。</p>`};export{e as default};