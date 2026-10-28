var e={answerHtml:`<h2>简答</h2>
<ul>
<li>sendBeacon 返回 true 只表示浏览器接受排队，不代表服务端已收到。</li>
<li>适合在页面隐藏时发送一小批统计事件。</li>
<li>visibilitychange 到 hidden 是可用的发送时机，但不是确定的关闭事件。</li>
<li>Beacon 只发 POST 且有载荷限制；需要自定义请求头或方法时使用 fetch keepalive。</li>
</ul>
<p>用户点击链接离开页面，应用想发送最后一批性能统计。普通异步请求可能随文档结束被取消，而同步 XHR 或忙循环会拖慢导航。sendBeacon 为少量分析和诊断数据提供异步发送入口，不需要为了等待上报阻塞用户。</p>
<h2>true 只表示浏览器接受排队</h2>
<p>sendBeacon 返回布尔值，不返回 Promise 或 Response。true 表示浏览器成功将数据加入发送队列，不表示 DNS 成功、服务器返回 200，更不表示数据已经写入数据库。false 表示未能入队，例如载荷超过可用队列预算。</p>
<p>它没有给脚本读取 HTTP 状态和响应正文的接口。因此支付、订单、保存唯一草稿等必须确认成功的操作，应在用户仍停留页面时使用正常请求协议并展示确认结果。不能在页面关闭时调用 Beacon，然后把本地状态标成“保存成功”。</p>
<h2>示例：页面隐藏时发送一小批事件</h2>
<p>下面约定服务端同源 <code>/metrics</code> 接收 application/x-www-form-urlencoded，其中 events 字段是 JSON 数组。调用方只传经过白名单筛选的统计字段，不传用户输入、令牌或完整页面 URL。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">queueMetrics</span>(<span class="hljs-params">events</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> navigator.<span class="hljs-property">sendBeacon</span> !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">const</span> body = <span class="hljs-keyword">new</span> <span class="hljs-title class_">URLSearchParams</span>({ <span class="hljs-attr">events</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>(events) });
  <span class="hljs-comment">// 这是应用自定的保守批次上限，不是浏览器队列剩余容量。</span>
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">new</span> <span class="hljs-title class_">TextEncoder</span>().<span class="hljs-title function_">encode</span>(body.<span class="hljs-title function_">toString</span>()).<span class="hljs-property">byteLength</span> &gt; <span class="hljs-number">16</span> * <span class="hljs-number">1024</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">false</span>;
  }
  <span class="hljs-keyword">return</span> navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;/metrics&#x27;</span>, body);
}

<span class="hljs-keyword">let</span> pending = [];
<span class="hljs-keyword">function</span> <span class="hljs-title function_">recordMetric</span>(<span class="hljs-params">name, value</span>) {
  <span class="hljs-keyword">if</span> (![<span class="hljs-string">&#x27;menu-open&#x27;</span>, <span class="hljs-string">&#x27;filter-change&#x27;</span>].<span class="hljs-title function_">includes</span>(name) || !<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(value)) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">if</span> (pending.<span class="hljs-property">length</span> &gt;= <span class="hljs-number">20</span>) <span class="hljs-keyword">return</span>;
  pending.<span class="hljs-title function_">push</span>({ name, value });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">flushMetrics</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (pending.<span class="hljs-property">length</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> batch = pending;
  <span class="hljs-keyword">if</span> (<span class="hljs-title function_">queueMetrics</span>(batch)) pending = [];
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">onVisibilityChange</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) <span class="hljs-title function_">flushMetrics</span>();
}
<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, onVisibilityChange);

<span class="hljs-comment">// 组件或模块销毁时解除监听；不能依赖清理函数保证页面退出上报。</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">cleanupMetrics</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, onVisibilityChange);
}
</code></pre></div>
<p>这里在成功入队后清空内存队列，是明确接受少量丢失的统计策略。入队失败则暂时保留，页面再次可用时可主动重试；刷新或进程终止仍会丢失内存队列。需要更可靠的统计时，应定义事件 ID、持久化、服务端去重和确认协议，而不只是把 false 分支写成无限重试。</p>
<p>示例中的长度按编码后的字节计算，不能用字符串 length 代替 UTF-8 载荷大小。MDN 说明排队数据有 64 KiB 限制，但不能据此保证每个 64 KiB 的请求都能入队：同一环境还可能已有待发送数据。保持批次小，正常浏览期间定期发送，避免把全部数据积攒到离开时。</p>
<h2>hidden 是可用机会，不是确定的关闭事件</h2>
<p>切换标签页、最小化或切到其他应用都可能使文档隐藏，用户也可能很快回来。因此每次上报只取尚未处理的事件，不能把 hidden 一律解释成会话永久结束。</p>
<p>移动端系统直接终止浏览器进程时，页面不一定收到 unload、beforeunload，甚至不一定有最后一次可运行的回调。优先观察 visibilitychange，并在正常使用中持续提交必要数据，不要试图用离开提示框阻止用户来保证统计完整。</p>
<h2>请求方式和跨域限制</h2>
<p>Beacon 使用 POST，不能像 fetch 那样任意选择方法或自定义 Authorization 等请求头，也无法读取响应。URLSearchParams 会带相应表单内容类型，Blob 则可以指定 MIME 类型；不要为绕过预检而给 JSON 故意标错 Content-Type。</p>
<p>跨源发送仍受 CORS、Cookie 属性、第三方存储限制和 CSP connect-src 等策略影响。application/json Blob 可能引入预检要求，跨源凭据也不是浏览器必定发送的保证。优先使用同源收集端点，在服务端按协议校验输入、限制大小和频率；统计端点也不能成为任意数据写入或反射入口。</p>
<h2>什么时候选择 fetch keepalive</h2>
<p>若需要指定方法、请求头或在页面仍活跃时读取响应，可以评估 fetch 的 keepalive 选项。它同样有载荷与生命周期限制，也不让已经销毁的页面继续运行 JavaScript 回调。把 sendBeacon 的 false 分支改成一个大型 keepalive 请求，不是绕过队列限制的可靠方案。</p>
<p>统计通常应做到少量、采样、失败不阻断业务。隐私同意和字段筛选必须在进入队列前完成；改用 Beacon 不会让本来不允许发送的数据变得合规，也不能因为看不到响应就忽略服务器错误监控。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon">MDN · Navigator.sendBeacon</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Request/keepalive">MDN · Request.keepalive</a></li>
</ul>`};export{e as default};