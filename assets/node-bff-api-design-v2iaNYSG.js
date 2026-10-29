var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>题目详情页要显示正文、收藏状态和推荐列表，这三样来自三个后端服务。BFF 就是专门给这个页面准备的一层接口：它去调三个服务，再拼成页面要的样子返回。页面只认 BFF 定的字段，下游改了字段名，在 BFF 里适配就行，前端不用跟着改。</p>
<p>三个下游互不依赖，所以并行调用。整次请求有一个总超时；推荐这类可有可无的数据，再给一个更短的截止时间，超时就返回默认值，并在 <code>warnings</code> 里标出来。</p>
<p>正文这种核心数据失败了，返回明确的错误码；可选数据失败了，页面主体照常显示。</p>
<p>另外要注意，公共数据和个性化数据分开缓存；每个下游的耗时和状态都要记下来，否则页面慢了不知道是谁拖的。</p>
</blockquote>
<h2>页面拿到的应该是什么样的数据</h2>
<p>如果浏览器直接调用三个服务，就要处理三套认证、三种错误格式，还容易形成请求瀑布。BFF 只给页面一个接口，返回页面需要的模型：</p>
<div class="not-prose code-block"><div class="code-language">json</div><pre><code class="hljs language-json">{
  &quot;question&quot;: { &quot;id&quot;: &quot;js-event-loop&quot;, &quot;title&quot;: &quot;事件循环&quot; },
  &quot;bookmarked&quot;: true,
  &quot;recommendations&quot;: [],
  &quot;warnings&quot;: [&quot;recommendations&quot;]
}
</code></pre></div>
<p>字段名、空值怎么表示、分页和错误格式，都由 BFF 这份约定决定，这份约定叫契约。内部 ID、下游令牌和调试堆栈不应该发给浏览器。</p>
<h2>怎样并行调用，又不让慢服务拖住页面</h2>
<p>下面的代码里，核心的 <code>loadQuestion</code> 直接参与 <code>Promise.all</code>，两个可选分支被 <code>optional</code> 包了一层：</p>
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
<p>你可能会问，<code>Promise.all</code> 不是有一个失败就整体失败吗？没错，所以可选分支被 <code>optional</code> 包住了，出错时它返回默认值而不是抛错。只有核心的 <code>loadQuestion</code> 失败，才会让整个请求失败。</p>
<p>可选分支的截止时间是 800 毫秒，比整体的 2500 毫秒短。如果只有整体超时，一个慢的推荐服务就能把整个页面拖到 2.5 秒。</p>
<p>取消信号要一路传到 <code>fetch</code>、数据库查询这些下游调用里，客户端断开以后服务端才会真的停下来。不过取消只能停止等待，已经发出去的写请求不会被撤销。</p>
<h2>出错时前端拿到什么</h2>
<table><thead><tr><th>情况</th><th>BFF 的响应</th></tr></thead><tbody><tr><td>题目不存在</td><td>404，稳定的 <code>code</code>，例如 <code>QUESTION_NOT_FOUND</code></td></tr><tr><td>未登录</td><td>正文正常返回，<code>bookmarked</code> 为 <code>false</code>，前端显示登录入口</td></tr><tr><td>推荐服务失败</td><td>正文正常返回，推荐为空，<code>warnings</code> 中标记</td></tr><tr><td>核心服务超时</td><td>504 或 503，带 <code>code</code> 和请求 ID，前端可以提示重试</td></tr></tbody></table>
<p>返回给前端的错误包含 <code>code</code>、可以直接显示的 <code>message</code> 和请求 ID。日志里记下游名称、耗时和状态，不记 Cookie、令牌和用户内容。</p>
<h2>权限由谁来管</h2>
<p>BFF 根据会话决定返回哪些字段，可下游服务仍然要做自己的授权检查，因为调用方可能绕过 BFF 直接访问下游。传给下游的用户身份，由 BFF 根据会话生成，不能取前端提交的 <code>userId</code>。输入校验、SSRF 和请求头转发等问题见<a href="/questions/node-bff/">《前端工程师编写 Node 服务时需要守住哪些安全边界？》</a>。</p>
<h2>缓存和版本怎么处理</h2>
<p>公共正文可以按内容版本或短 TTL 缓存；收藏状态是个性化数据，不能放进共享缓存。缓存键要包含语言这类真正影响结果的维度。</p>
<p>BFF 的输出契约独立演进。下游字段改名时，在 BFF 里做适配，并用契约测试提前发现不兼容的改动。</p>
<h2>怎样观测和测试</h2>
<p>每个下游调用都要记录耗时和结果，并用 trace ID 把前端、BFF 和下游的日志串起来。测试至少覆盖这几种情况：全部成功、可选服务超时、核心服务失败、下游返回格式错误、客户端提前断开。</p>
<h2>常见追问</h2>
<p><strong>什么时候不该用 BFF？</strong></p>
<blockquote>
<p>只有一个后端、页面直接调用就够用的时候，BFF 只会多一层部署和延迟。多个客户端（Web、App）需求差异大、需要聚合多个服务时，才值得引入。</p>
</blockquote>
<p><strong>为什么不用 <code>Promise.allSettled</code>？</strong></p>
<blockquote>
<p>它会等所有分支都结束，一个慢的可选服务照样能拖住响应。给每个可选分支加截止时间，才能控制总耗时。</p>
</blockquote>`};export{e as default};