var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>项目里几十个页面都要请求接口，如果每个地方都自己写加 token、判断状态码、弹错误提示，改一次规则就要改几十处。请求层就是把这些重复的事集中到一个 <code>request</code> 函数里，业务代码只管传参数、拿数据。</p>
<p>封装一般分几层：请求前的拦截，统一加 token、公共参数；发送时处理超时和取消；响应后统一检查状态码，把失败变成一个带状态码的错误抛出去。<code>fetch</code> 遇到 404、500 不会 reject，所以“状态码不对就抛错”这一步必须自己写。</p>
<p>在这个统一入口上，还能顺手做两件事。相同的 GET 请求正在进行时，后来的调用直接复用同一个 Promise；收到 401 时只刷新一次 token，其他同时 401 的请求等这次刷新结束，再用新 token 重放。</p>
<p>要注意，请求层只做所有接口都通用的事。弹什么提示、要不要重试这类和业务有关的决定，应该留给调用方或者通过配置开关控制；写操作的去重也不能只靠前端，最终要靠服务端幂等。</p>
</blockquote>
<h2>请求层要解决什么问题</h2>
<p>一个请求从发出到拿到数据，中间有很多步骤和具体业务无关：带上登录凭证、拼接公共前缀、设置超时、检查状态码、把后端的错误格式统一成前端能用的结构。这些步骤如果散在每个调用点，既容易漏，也很难统一修改。</p>
<p>所以请求层的目标是：业务代码写 <code>const user = await request({ method: &#x27;GET&#x27;, url: &#x27;/user&#x27; })</code>，成功就拿到数据，失败就进 <code>catch</code>，至于 token 从哪里来、401 怎么处理，业务代码不需要知道。</p>
<h2>先看一个最小的完整实现</h2>
<p>下面的 <code>createClient</code> 把几件事放在一起：请求钩子改写配置、相同 GET 复用、401 时只刷新一次 token 再重放、状态码大于等于 400 时抛错。<code>adapter</code> 是真正发请求的函数，示例里用一个假的 adapter 模拟服务端：token 不是 <code>new</code> 就返回 401，<code>/api/missing</code> 返回 404。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createClient</span>(<span class="hljs-params">adapter</span>) {
  <span class="hljs-keyword">const</span> requestHooks = [];
  <span class="hljs-keyword">const</span> pending = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
  <span class="hljs-keyword">let</span> refreshing = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> token = <span class="hljs-string">&#x27;old&#x27;</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">refreshToken</span>(<span class="hljs-params"></span>) {
    <span class="hljs-comment">// 多个请求同时 401 时只刷新一次，其余请求等同一个 Promise。</span>
    <span class="hljs-keyword">if</span> (!refreshing) {
      refreshing = <span class="hljs-title function_">adapter</span>({ <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/refresh&#x27;</span> })
        .<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">res</span>) =&gt;</span> { token = res.<span class="hljs-property">data</span>; })
        .<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> { refreshing = <span class="hljs-literal">null</span>; });
    }
    <span class="hljs-keyword">return</span> refreshing;
  }

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">send</span>(<span class="hljs-params">config, retried</span>) {
    <span class="hljs-keyword">let</span> finalConfig = { ...config, <span class="hljs-attr">headers</span>: { <span class="hljs-title class_">Authorization</span>: token } };
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> hook <span class="hljs-keyword">of</span> requestHooks) finalConfig = <span class="hljs-title function_">hook</span>(finalConfig);
    <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">adapter</span>(finalConfig);
    <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> === <span class="hljs-number">401</span> &amp;&amp; !retried) {
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">refreshToken</span>();
      <span class="hljs-keyword">return</span> <span class="hljs-title function_">send</span>(config, <span class="hljs-literal">true</span>);
    }
    <span class="hljs-keyword">if</span> (res.<span class="hljs-property">status</span> &gt;= <span class="hljs-number">400</span>) {
      <span class="hljs-keyword">const</span> error = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;HTTP &#x27;</span> + res.<span class="hljs-property">status</span>);
      error.<span class="hljs-property">status</span> = res.<span class="hljs-property">status</span>;
      <span class="hljs-keyword">throw</span> error;
    }
    <span class="hljs-keyword">return</span> res.<span class="hljs-property">data</span>;
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">request</span>(<span class="hljs-params">config</span>) {
    <span class="hljs-comment">// 相同的 GET 请求在进行中时直接复用，不再发第二次。</span>
    <span class="hljs-keyword">const</span> key = config.<span class="hljs-property">method</span> === <span class="hljs-string">&#x27;GET&#x27;</span> ? config.<span class="hljs-property">url</span> : <span class="hljs-literal">null</span>;
    <span class="hljs-keyword">if</span> (key &amp;&amp; pending.<span class="hljs-title function_">has</span>(key)) <span class="hljs-keyword">return</span> pending.<span class="hljs-title function_">get</span>(key);
    <span class="hljs-keyword">const</span> promise = <span class="hljs-title function_">send</span>(config, <span class="hljs-literal">false</span>).<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">if</span> (key) pending.<span class="hljs-title function_">delete</span>(key);
    });
    <span class="hljs-keyword">if</span> (key) pending.<span class="hljs-title function_">set</span>(key, promise);
    <span class="hljs-keyword">return</span> promise;
  }

  <span class="hljs-keyword">return</span> { request, <span class="hljs-attr">useRequest</span>: <span class="hljs-function">(<span class="hljs-params">hook</span>) =&gt;</span> requestHooks.<span class="hljs-title function_">push</span>(hook) };
}

<span class="hljs-keyword">const</span> log = [];
<span class="hljs-keyword">const</span> client = <span class="hljs-title function_">createClient</span>(<span class="hljs-title function_">async</span> (config) =&gt; {
  log.<span class="hljs-title function_">push</span>(config.<span class="hljs-property">url</span>);
  <span class="hljs-keyword">if</span> (config.<span class="hljs-property">url</span> === <span class="hljs-string">&#x27;/refresh&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>, <span class="hljs-attr">data</span>: <span class="hljs-string">&#x27;new&#x27;</span> };
  <span class="hljs-keyword">if</span> (config.<span class="hljs-property">url</span> === <span class="hljs-string">&#x27;/api/missing&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">404</span> };
  <span class="hljs-keyword">if</span> (config.<span class="hljs-property">headers</span>.<span class="hljs-property">Authorization</span> !== <span class="hljs-string">&#x27;new&#x27;</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">401</span> };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>, <span class="hljs-attr">data</span>: config.<span class="hljs-property">url</span> + <span class="hljs-string">&#x27; ok&#x27;</span> };
});
client.<span class="hljs-title function_">useRequest</span>(<span class="hljs-function">(<span class="hljs-params">config</span>) =&gt;</span> ({ ...config, <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/api&#x27;</span> + config.<span class="hljs-property">url</span> }));

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([
  client.<span class="hljs-title function_">request</span>({ <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span>, <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/user&#x27;</span> }),
  client.<span class="hljs-title function_">request</span>({ <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span>, <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/user&#x27;</span> }),
  client.<span class="hljs-title function_">request</span>({ <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span>, <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/orders&#x27;</span> }),
]).<span class="hljs-title function_">then</span>(<span class="hljs-title function_">async</span> (results) =&gt; {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(results.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; | &#x27;</span>)); <span class="hljs-comment">// /api/user ok | /api/user ok | /api/orders ok</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// /api/user,/api/orders,/refresh,/api/user,/api/orders</span>
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> client.<span class="hljs-title function_">request</span>({ <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;GET&#x27;</span>, <span class="hljs-attr">url</span>: <span class="hljs-string">&#x27;/missing&#x27;</span> });
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">message</span> + <span class="hljs-string">&#x27; &#x27;</span> + error.<span class="hljs-property">status</span>); <span class="hljs-comment">// HTTP 404 404</span>
  }
});
</code></pre></div>
<p>第一行打印出三个结果，第二个 <code>/user</code> 和第一个拿到的是同一份数据。第二行的调用记录能说明背后发生了什么。</p>
<p>调用记录里 <code>/api/user</code> 一开始只出现了一次，说明第二个 <code>/user</code> 没有真的发出去，它从 <code>pending</code> 里拿到了第一个请求的 Promise。之后两个请求都因为旧 token 收到 401，可是 <code>/refresh</code> 只出现了一次，因为第二个 401 发现 <code>refreshing</code> 已经有值，就直接等这个 Promise。刷新完成后，两个请求各自用新 token 重放了一次。</p>
<p>第三行是 404 的情况。adapter 正常返回了响应，<code>send</code> 看到状态码大于等于 400，主动抛出一个带 <code>status</code> 的错误，所以业务代码能在 <code>catch</code> 里拿到它。</p>
<h2>为什么要自己判断状态码</h2>
<p>MDN 写明，<code>fetch()</code> 只在网络错误、地址格式不对这类情况下 reject；服务端返回 404 这样的错误状态时，<code>fetch()</code> 照样 fulfill，拿到一个 <code>Response</code>。所以如果不检查 <code>response.ok</code> 或状态码，业务代码会把错误页面当成正常数据去解析，详见<a href="/questions/http-fetch-errors/">《为什么 fetch 收到 404 不一定进入 catch？》</a>。</p>
<p>请求层统一做这一步以后，所有失败都走同一条路：抛出一个带状态码和后端错误信息的错误对象。调用方需要区分时看 <code>error.status</code>，不需要区分时直接用统一的提示。</p>
<p>很多后端还会在 HTTP 200 里用业务码表示失败，比如 <code>{ code: 1001, message: &#x27;余额不足&#x27; }</code>。这种约定也应该在请求层里统一转成错误，否则每个调用点都要再判断一遍 <code>code</code>。</p>
<h2>拦截器是怎样串起来的</h2>
<p>上面的 <code>requestHooks</code> 就是最简单的请求拦截器：每个钩子拿到配置、返回新的配置，按注册顺序依次执行。axios 的拦截器也是这个思路，分成 <code>interceptors.request</code> 和 <code>interceptors.response</code> 两组。要注意 axios 文档写明两组的执行顺序相反：请求拦截器后注册的先执行，响应拦截器按注册顺序执行。这种“一个处理完交给下一个”的结构就是职责链，见<a href="/questions/pattern-chain-of-responsibility/">《职责链模式是什么？中间件和请求拦截器是怎样用它的？》</a>。</p>
<p>拦截器适合放和业务无关、每个请求都要做的事，比如加 token、加请求 ID、记录耗时。和某个页面有关的逻辑不要塞进全局拦截器，否则拦截器会越来越难懂，也很难单独测试。</p>
<h2>超时和取消放在哪里</h2>
<p><code>fetch</code> 本身没有超时参数，超时靠 <code>AbortSignal</code>。MDN 介绍，<code>AbortSignal.timeout(ms)</code> 返回的信号会在超时后以 <code>TimeoutError</code> 中止；如果调用方自己也传了一个用于取消的信号，可以用 <code>AbortSignal.any([userSignal, AbortSignal.timeout(ms)])</code> 合并，任何一个中止，合并后的信号就中止。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fetchWithTimeout</span>(<span class="hljs-params">url, { signal, timeout = <span class="hljs-number">10000</span> } = {}</span>) {
  <span class="hljs-keyword">const</span> signals = [<span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(timeout)];
  <span class="hljs-keyword">if</span> (signal) signals.<span class="hljs-title function_">push</span>(signal);
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(url, { <span class="hljs-attr">signal</span>: <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>(signals) });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;HTTP &#x27;</span> + response.<span class="hljs-property">status</span>);
  <span class="hljs-keyword">return</span> response.<span class="hljs-title function_">json</span>();
}
</code></pre></div>
<p>这样请求层可以区分两种失败：<code>TimeoutError</code> 是超时，可以提示“网络较慢”；<code>AbortError</code> 通常是调用方主动取消，比如组件卸载或者搜索框换了关键词，这时不应该弹错误提示。取消具体能停掉什么，见<a href="/questions/api-abort/">《AbortController 能取消什么，不能取消什么？》</a>。</p>
<h2>去重和 token 刷新为什么只放一份</h2>
<p>示例里的去重只针对 GET。读请求重复发出只是浪费，复用同一个 Promise 没有副作用；写请求要不要合并取决于业务，防连点、幂等键这些做法见<a href="/questions/design-prevent-duplicate/">《前端怎样防止重复提交和接口重复请求？》</a>。</p>
<p>token 刷新的关键是“同一时间只刷新一次”。如果每个 401 都各自去刷新，并发的几个请求就会发出几次刷新，既浪费，又可能互相覆盖拿到的新 token。示例用 <code>refreshing</code> 保存进行中的刷新 Promise，其他请求等它就行。还有一点是 <code>retried</code> 标志：重放后如果还是 401，说明刷新也解决不了，应该抛错去登录页，而不是无限循环。刷新的时机和轮换细节见<a href="/questions/security-token-refresh/">《Access Token 过期后，前端怎样做无感刷新？》</a>。</p>
<h2>统一错误处理要留出口</h2>
<p>请求层可以统一把错误转成提示，比如 500 弹“服务繁忙”。可是有些页面要自己处理，比如表单提交返回 422 时要把错误显示在对应输入框下面，这时全局弹窗就多余了。</p>
<p>常见做法是在请求配置里加开关，比如 <code>silent: true</code> 表示不弹全局提示，请求层仍然把错误抛给调用方。这样默认情况下所有页面行为一致，特殊页面也有办法自己接管。</p>
<h2>常见追问</h2>
<p><strong>拦截器里刷新 token 时，正在刷新期间新发出的请求怎么办？</strong></p>
<blockquote>
<p>可以在请求拦截器里先检查是否有进行中的刷新，有就等它结束再带上新 token 发出去。这样新请求不会先用旧 token 撞一次 401。本质上和示例一样，所有人都等同一个刷新 Promise。</p>
</blockquote>
<p><strong>请求失败要不要自动重试？</strong></p>
<blockquote>
<p>只对安全的情况重试，比如网络错误或者 GET 请求超时，而且要限制次数、拉长间隔。写请求自动重试可能造成重复写入，除非服务端支持幂等键，否则交给用户决定。</p>
</blockquote>
<p><strong>请求层要不要做缓存？</strong></p>
<blockquote>
<p>示例里的去重只在请求进行中有效，请求结束就从 <code>pending</code> 里删掉。如果想在一段时间内直接用缓存数据，还要考虑过期时间、什么时候重新获取、数据改了以后怎样失效，这些通常交给专门的数据请求库，请求层只负责把请求发对、把错误抛对。</p>
</blockquote>`};export{e as default};