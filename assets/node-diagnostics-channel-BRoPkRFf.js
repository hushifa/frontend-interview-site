var e={answerHtml:`<h2>简答</h2>
<ul>
<li>diagnostics_channel 提供命名的发布订阅通道，库可以在这里发布诊断事件。</li>
<li>没有订阅者时发布的开销很低，可以先用 hasSubscribers 判断是否需要构造消息。</li>
<li>APM 和日志工具订阅这些通道，不需要对库的代码打补丁。</li>
<li>tracingChannel 为一次调用统一提供 start、end、asyncStart、asyncEnd 和 error 事件。</li>
</ul>
<p>团队希望知道每个 HTTP 请求在下游服务上花了多久，但又不想在业务代码里到处插入计时、改动第三方模块或在没有观测需求时承担大量序列化成本。Node.js 的 <code>diagnostics_channel</code> 提供命名诊断通道，让库和应用发布结构化事件，只有明确订阅的进程才处理这些事件。</p>
<h2>通道是进程内的发布订阅边界</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> diagnosticsChannel <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;node:diagnostics_channel&#x27;</span>;

<span class="hljs-keyword">const</span> channel = diagnosticsChannel.<span class="hljs-title function_">channel</span>(<span class="hljs-string">&#x27;app.http.request&#x27;</span>);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">publishRequestStart</span>(<span class="hljs-params">requestId, method, route</span>) {
  <span class="hljs-keyword">if</span> (!channel.<span class="hljs-property">hasSubscribers</span>) <span class="hljs-keyword">return</span>;
  channel.<span class="hljs-title function_">publish</span>({
    <span class="hljs-attr">phase</span>: <span class="hljs-string">&#x27;start&#x27;</span>,
    requestId,
    method,
    <span class="hljs-comment">// route 是路由器给出的模板，如 /orders/:id，不是原始请求 URL。</span>
    <span class="hljs-attr">route</span>: [<span class="hljs-string">&#x27;/orders/:id&#x27;</span>, <span class="hljs-string">&#x27;/health&#x27;</span>].<span class="hljs-title function_">includes</span>(route) ? route : <span class="hljs-string">&#x27;其他路由&#x27;</span>,
    <span class="hljs-attr">startedAt</span>: process.<span class="hljs-property">hrtime</span>.<span class="hljs-title function_">bigint</span>(),
  });
}

channel.<span class="hljs-title function_">subscribe</span>(<span class="hljs-function">(<span class="hljs-params">message</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (message.<span class="hljs-property">phase</span> !== <span class="hljs-string">&#x27;start&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">debug</span>(<span class="hljs-string">&#x27;收到请求诊断事件&#x27;</span>, {
    <span class="hljs-attr">requestId</span>: message.<span class="hljs-property">requestId</span>,
    <span class="hljs-attr">method</span>: message.<span class="hljs-property">method</span>,
  });
});
</code></pre></div>
<p>通道名称是进程内约定，不能跨进程、跨机器或跨服务传输。<code>channel.publish()</code> 不会自动把事件发送到日志平台，也不提供持久化、重试或权限系统。要跨服务关联，应把经过脱敏的 trace/span 上下文传递给真正的观测系统。</p>
<h2><code>hasSubscribers</code> 可以避免不必要工作，但不是安全边界</h2>
<p>发布者可以在构造昂贵消息前检查 <code>hasSubscribers</code>，例如避免生成完整堆栈或复制大型对象。检查只反映当前进程的订阅状态，不能用于决定业务权限，也不能让敏感数据在“有订阅”时随意暴露。即使没有订阅，代码仍不应把密码、Cookie、令牌或完整用户输入放进事件对象。</p>
<p>事件对象应尽量小、稳定并包含版本或类型字段。订阅者是同步执行的，回调中做大量计算、网络请求或抛出未处理异常，都可能影响发布者的请求路径。订阅者应快速提取摘要，把后续处理放入有界队列或异步批处理，并处理队列满、退出和失败。</p>
<h2>订阅时机决定能否看到早期事件</h2>
<p>如果库在应用启动前就发布事件，晚订阅的观测模块不会自动获得历史。需要捕获启动阶段的事件时，应在加载目标模块前完成订阅，或使用库提供的诊断开关。动态加载和测试环境还要注意模块缓存，避免重复订阅造成每个事件被处理多次。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> counts = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Map</span>();
<span class="hljs-keyword">const</span> allowedRoutes = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Set</span>([<span class="hljs-string">&#x27;/orders/:id&#x27;</span>, <span class="hljs-string">&#x27;/health&#x27;</span>]);
<span class="hljs-keyword">const</span> <span class="hljs-title function_">handler</span> = (<span class="hljs-params">message</span>) =&gt; {
  <span class="hljs-keyword">if</span> (message?.<span class="hljs-property">phase</span> !== <span class="hljs-string">&#x27;start&#x27;</span>) <span class="hljs-keyword">return</span>;
  <span class="hljs-keyword">const</span> route = allowedRoutes.<span class="hljs-title function_">has</span>(message.<span class="hljs-property">route</span>) ? message.<span class="hljs-property">route</span> : <span class="hljs-string">&#x27;其他路由&#x27;</span>;
  <span class="hljs-comment">// 固定标签集合，既不保存查询参数，也不以用户 ID 生成无限增长的指标。</span>
  counts.<span class="hljs-title function_">set</span>(route, (counts.<span class="hljs-title function_">get</span>(route) ?? <span class="hljs-number">0</span>) + <span class="hljs-number">1</span>);
};

<span class="hljs-keyword">const</span> channel = diagnosticsChannel.<span class="hljs-title function_">channel</span>(<span class="hljs-string">&#x27;app.http.request&#x27;</span>);
channel.<span class="hljs-title function_">subscribe</span>(handler);

<span class="hljs-comment">// 测试或热重载结束时取消订阅</span>
channel.<span class="hljs-title function_">unsubscribe</span>(handler);
</code></pre></div>
<p>在单元测试中要清理订阅，否则后续测试可能重复收到事件或持有已销毁的状态。订阅者还要避免把测试数据写入真实监控系统，最好注入测试用的发送器。</p>
<p>截断 URL 只限制长度，不会脱敏：前 200 个字符仍可能包含 token、邮箱或订单 ID。因此例子改用路由模板白名单，未知值归入固定标签。这里统计的是请求开始次数，不是延迟；延迟需要另行约定结束事件、起止时刻和单位，不能读取开始消息中并不存在的 duration。</p>
<p>Node.js 官方文档明确说明，订阅回调抛错会触发 uncaughtException。不要假设在 publish 外层加 try/catch 就能隔离观测故障；有可能失败的适配器应在订阅者内部处理异常。若启动异步发送，也必须处理 Promise 拒绝，并限制队列容量；发布 API 不会等待它完成。</p>
<h2>如何关联一次请求而不依赖全局变量</h2>
<p>诊断消息可以带请求 ID，但不要使用可猜测的用户身份或把整个请求对象挂进事件。Node.js 的 <code>AsyncLocalStorage</code> 适合在异步调用链中保存经过设计的 trace 上下文，诊断订阅者读取上下文后再给事件打标签；它仍然不是跨进程传播协议，也不能保证第三方原生扩展的所有异步边界都被正确关联。</p>
<p>请求 ID、租户标识和 URL 需要脱敏和采样。多租户系统不能把一个租户的名称、查询内容或模型提示词直接发到共享日志；日志平台还要有访问控制和保留期限。</p>
<h2>与日志、指标和追踪怎么分工</h2>
<ul>
<li><strong>日志</strong>记录需要人工阅读的离散事实和错误上下文；</li>
<li><strong>指标</strong>聚合计数、延迟和错误率，适合告警；</li>
<li><strong>追踪</strong>关联跨服务的一次请求；</li>
<li><strong>diagnostics_channel</strong>提供进程内的低耦合诊断事件入口。</li>
</ul>
<p>不要把每个诊断事件都当作日志打印，也不要用它代替业务审计。关键支付、权限和数据修改仍应使用可靠的审计记录，不能因为诊断订阅关闭就丢失合规事实。</p>
<h2>性能、版本和兼容性</h2>
<p>通道机制只能减少发布者与观测实现的耦合，订阅回调本身仍消耗 CPU 和内存。应通过采样、字段裁剪和批量发送控制开销。不同 Node.js 版本和核心模块提供的内置通道名称、消息结构可能变化，使用前要锁定版本并查阅对应文档；自定义通道名称和消息契约也应版本化。</p>
<p>运行在旧 Node.js、浏览器或其他 JavaScript 运行时的代码不能假设存在这个模块。共享库可以做能力检测或把诊断适配作为可选依赖，业务功能不能因为观测模块不存在而失败。</p>
<h2>常见误区</h2>
<ul>
<li>认为发布事件会自动持久化：通道没有历史和重试保证。</li>
<li>在订阅回调里做网络请求：会把观测开销带回业务关键路径。</li>
<li>把敏感请求对象原样发布：日志和订阅者可能扩大泄露面。</li>
<li>不清理订阅：测试、热更新或多次初始化会重复处理事件。</li>
<li>用诊断通道代替审计：关闭订阅后关键业务事实会消失。</li>
</ul>
<h2>参考资料</h2>
<ul>
<li><a href="https://nodejs.org/api/diagnostics_channel.html">Node.js · diagnostics_channel</a></li>
<li><a href="https://nodejs.org/api/async_context.html#class-asynclocalstorage">Node.js · AsyncLocalStorage</a></li>
<li><a href="https://opentelemetry.io/docs/languages/js/">OpenTelemetry · JavaScript</a></li>
</ul>
<h2>tracingChannel 统一描述一次调用的生命周期</h2>
<p><code>diagnostics_channel.tracingChannel(name)</code> 自 Node.js 19.9.0 与 18.19.0 提供，按官方文档在 26.8.0 标为稳定。它为一次操作创建 <code>tracing:\${name}:start</code>、<code>end</code>、<code>asyncStart</code>、<code>asyncEnd</code>、<code>error</code> 五个通道，库作者用 <code>traceSync</code>、<code>tracePromise</code> 或 <code>traceCallback</code> 包装调用，APM 订阅者就能拿到一致的开始、结束和错误事件，不用各库自定义事件名。</p>`};export{e as default};