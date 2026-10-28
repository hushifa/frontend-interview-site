var e={answerHtml:`<h2>简答</h2>
<ul>
<li>BFF 按页面任务定义输出模型，前端不依赖下游的字段名和数据结构，下游改动在 BFF 里适配。</li>
<li>独立的下游调用并行发起，整次请求有总超时；可降级的分支有更短的截止时间，失败时返回默认值并在 <code>warnings</code> 中标记。</li>
<li>核心数据失败时返回明确的错误码，可选数据失败时保留页面主体。</li>
<li>公共数据和个性化数据分开缓存；每个下游的耗时和状态都要记录，便于定位哪一个拖慢了页面。</li>
</ul>
<h2>输出页面需要的模型</h2>
<p>题目详情页需要正文、收藏状态、推荐列表。浏览器直接调用三个服务，就要处理三套认证、三种错误格式和请求瀑布。BFF 给页面提供一个接口：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;question&quot;: { &quot;id&quot;: &quot;js-event-loop&quot;, &quot;title&quot;: &quot;事件循环&quot; },
  &quot;bookmarked&quot;: true,
  &quot;recommendations&quot;: [],
  &quot;warnings&quot;: [&quot;recommendations&quot;]
}
</code></pre></div>
<p>字段名、空值、分页和错误格式由 BFF 契约决定。内部 ID、下游令牌和调试堆栈不应发给浏览器。</p>
<h2>并行调用与降级</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">withDeadline</span>(<span class="hljs-params">run, ms, parentSignal</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">run</span>(<span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([parentSignal, <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(ms)]));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">optional</span>(<span class="hljs-params">promise, fallback, warnings, name</span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> promise;
  } <span class="hljs-keyword">catch</span> {
    warnings.<span class="hljs-title function_">push</span>(name);
    <span class="hljs-keyword">return</span> fallback;
  }
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">loadQuestionPage</span>(<span class="hljs-params">{ questionId, user, signal }, api</span>) {
  <span class="hljs-comment">// 客户端断开或整体超时都会取消所有下游调用。</span>
  <span class="hljs-keyword">const</span> page = <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([signal, <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">2500</span>)]);
  <span class="hljs-keyword">const</span> warnings = [];

  <span class="hljs-keyword">const</span> [question, bookmarked, recommendations] = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
    api.<span class="hljs-title function_">loadQuestion</span>(questionId, page),
    <span class="hljs-title function_">optional</span>(
      user ? <span class="hljs-title function_">withDeadline</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> api.<span class="hljs-title function_">loadBookmark</span>(user.<span class="hljs-property">id</span>, questionId, s), <span class="hljs-number">800</span>, page) : <span class="hljs-literal">false</span>,
      <span class="hljs-literal">false</span>,
      warnings,
      <span class="hljs-string">&#x27;bookmark&#x27;</span>,
    ),
    <span class="hljs-title function_">optional</span>(
      <span class="hljs-title function_">withDeadline</span>(<span class="hljs-function">(<span class="hljs-params">s</span>) =&gt;</span> api.<span class="hljs-title function_">loadRecommendations</span>(questionId, s), <span class="hljs-number">800</span>, page),
      [],
      warnings,
      <span class="hljs-string">&#x27;recommendations&#x27;</span>,
    ),
  ]);

  <span class="hljs-keyword">return</span> { question, bookmarked, recommendations, warnings };
}
</code></pre></div>
<p>用模拟下游实测：推荐服务需要 5 秒时，800 毫秒后被取消，接口约 0.8 秒返回正文、收藏状态和空推荐，<code>warnings</code> 为 <code>[&#x27;recommendations&#x27;]</code>。</p>
<p>设计要点：</p>
<ul>
<li>可选分支被 <code>optional</code> 包住，失败不会让 <code>Promise.all</code> 拒绝；只有核心的 <code>loadQuestion</code> 失败会让整个请求失败。</li>
<li>可选分支的截止时间比整体预算短，否则一个慢服务会拖住整个页面。</li>
<li>取消信号要一直传到 <code>fetch</code>、数据库查询等下游调用，客户端断开后服务端才会停止工作。取消只能停止等待，已经发出的写请求不会被撤销。</li>
</ul>
<h2>错误响应</h2>
<table><thead><tr><th>情况</th><th>BFF 的响应</th></tr></thead><tbody><tr><td>题目不存在</td><td>404，稳定的 <code>code</code>，例如 <code>QUESTION_NOT_FOUND</code></td></tr><tr><td>未登录</td><td>正文正常返回，<code>bookmarked</code> 为 <code>false</code>，前端显示登录入口</td></tr><tr><td>推荐服务失败</td><td>正文正常返回，推荐为空，<code>warnings</code> 中标记</td></tr><tr><td>核心服务超时</td><td>504 或 503，带 <code>code</code> 和请求 ID，前端可以提示重试</td></tr></tbody></table>
<p>返回给前端的错误包含 <code>code</code>、可显示的 <code>message</code> 和请求 ID。日志里记录下游名称、耗时和状态，不记录 Cookie、令牌和用户内容。</p>
<h2>权限与安全</h2>
<p>BFF 根据会话决定返回哪些字段，下游服务仍要做自己的授权检查，因为调用方可能绕过 BFF。传给下游的用户身份由 BFF 根据会话生成，不能取自前端提交的 <code>userId</code>。输入校验、SSRF 和请求头转发等问题见《前端工程师编写 Node 服务时需要守住哪些安全边界？》。</p>
<h2>缓存与版本</h2>
<ul>
<li>公共正文可以按内容版本或短 TTL 缓存；收藏状态是个性化数据，不能进入共享缓存。缓存键要包含语言等真正影响结果的维度。</li>
<li>BFF 的输出契约独立演进。下游字段改名时，在 BFF 里做适配，并用契约测试发现不兼容的改动。</li>
</ul>
<h2>观测与测试</h2>
<p>每个下游调用都要记录耗时和结果，并用 trace ID 串起前端、BFF 和下游的日志。测试至少覆盖：全部成功、可选服务超时、核心服务失败、下游返回格式错误、客户端提前断开。</p>
<h2>常见追问</h2>
<ul>
<li><strong>什么时候不该用 BFF？</strong> 只有一个后端、页面直接调用就够用时，BFF 只会多一层部署和延迟。多个客户端（Web、App）需求差异大、需要聚合多个服务时才值得引入。</li>
<li><strong>为什么不用 <code>Promise.allSettled</code>？</strong> 它会等所有分支结束，一个慢的可选服务仍会拖住响应；给每个可选分支加截止时间才能控制总耗时。</li>
</ul>`};export{e as default};