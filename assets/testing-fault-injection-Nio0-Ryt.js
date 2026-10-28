var e={answerHtml:`<h2>简答</h2>
<ul>
<li>故障注入是主动制造可重复的异常，确认产品有明确的恢复路径，而不是让测试随机失败。</li>
<li>超时、503、CORS 读取失败、JSON 解析失败是不同路径，要标明注入层和预期状态。</li>
<li>每次只注入一个主要故障，才能判断恢复逻辑是否处理了目标问题。</li>
<li>用可控释放的延迟代替固定等待来验证 loading 和取消。</li>
</ul>
<p>正常接口返回 200 时，页面往往看起来没有问题；真正让用户卡住的可能是请求永远不返回、响应格式错误、图片加载失败、存储配额不足或一个第三方脚本阻塞了初始化。故障注入不是为了让测试随机失败，而是主动制造可重复的异常，确认产品有明确的恢复路径。</p>
<h2>先定义故障发生在哪一层</h2>
<p>网络请求超时、HTTP 503、CORS 读取失败和 JSON 解析失败，对前端来说是不同路径。浏览器拒绝读取响应，不等于服务器没有执行；客户端取消写操作，也不等于服务端已经回滚。测试要标记注入点和预期状态，不能把所有异常都归类为“网络错误”。</p>
<p>常见注入层包括：</p>
<ul>
<li>浏览器请求：延迟、abort、断网、特定状态码和响应体；</li>
<li>静态资源：脚本、样式、字体、图片和动态 chunk 失败；</li>
<li>浏览器能力：权限拒绝、API 不存在、用户未激活；</li>
<li>本地存储：读写失败、配额异常、版本升级阻塞；</li>
<li>服务端依赖：上游超时、错误结构、部分成功和重复响应。</li>
</ul>
<p>每次只注入一个主要故障，才能知道页面恢复逻辑是否真的处理了目标问题。多个故障同时发生可以作为后续压力场景，不能作为基础用例的默认设置。</p>
<h2>用受控延迟验证 loading 和取消</h2>
<p>固定等待几秒不如可控释放请求。测试可以在 route 处理器中保存一个 resolver，先确认页面显示加载状态，再决定响应或取消。这样能避免测试依赖机器当前速度。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">let</span> <span class="hljs-attr">release</span>: (<span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">void</span>) | <span class="hljs-literal">undefined</span>;

<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">route</span>(<span class="hljs-string">&#x27;**/api/questions&#x27;</span>, <span class="hljs-title function_">async</span> (route) =&gt; {
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">void</span>&gt;(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> { release = resolve; });
  <span class="hljs-keyword">await</span> route.<span class="hljs-title function_">fulfill</span>({
    <span class="hljs-attr">status</span>: <span class="hljs-number">200</span>,
    <span class="hljs-attr">json</span>: { <span class="hljs-attr">items</span>: [{ <span class="hljs-attr">id</span>: <span class="hljs-string">&#x27;js-event-loop&#x27;</span>, <span class="hljs-attr">title</span>: <span class="hljs-string">&#x27;事件循环&#x27;</span> }] },
  });
});

<span class="hljs-keyword">await</span> page.<span class="hljs-title function_">goto</span>(<span class="hljs-string">&#x27;/questions&#x27;</span>);
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByRole</span>(<span class="hljs-string">&#x27;status&#x27;</span>)).<span class="hljs-title function_">toHaveText</span>(<span class="hljs-string">&#x27;加载中&#x27;</span>);
release?.();
<span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(page.<span class="hljs-title function_">getByText</span>(<span class="hljs-string">&#x27;事件循环&#x27;</span>)).<span class="hljs-title function_">toBeVisible</span>();
</code></pre></div>
<p>真实用例还要在测试失败和清理阶段释放挂起请求，避免后续用例或上下文关闭时留下未完成的处理器。注入网络延迟不等于证明服务器真的慢；服务器性能要用合适的集成或负载测试验证。</p>
<h2>HTTP 错误、网络错误和错误正文要分开</h2>
<p>HTTP 503 与 <code>route.abort()</code> 网络失败的区别见“Playwright 接口模拟怎样覆盖稳定的成功和失败场景？”。故障注入关注的是两类失败下界面是否显示重试、是否保留旧数据、是否读取 <code>Retry-After</code>。</p>
<p>不要让 Mock 返回一个现实中不会出现的响应，例如状态 200 却缺少真实接口要求的 <code>Content-Type</code> 和字段；这种测试可能验证了错误实现。契约测试和少量真实集成测试应确认 Mock 仍然符合服务端协议。</p>
<p>如果注入的是写操作超时，要验证界面不会简单重复创建订单或提交表单。服务器可能已经执行成功，客户端需要幂等键、状态查询或明确的“结果未知”状态，而不是只把按钮恢复为可点击。</p>
<h2>资源失败要覆盖应用启动和运行中两类</h2>
<p>阻止入口 JS、CSS 或字体，能够检查首屏失败时是否有可理解的错误；阻止动态 import，则能验证用户打开低频功能时的 chunk 失败和安全刷新路径。图片失败要检查替代文本、尺寸占位和是否还有不断重试。</p>
<p>不要在测试专用 CSS 中把生产布局完全改掉，也不要为让脚本失败变得可捕获而修改生产错误边界。故障注入的目标是观察真实降级路径；若需要测试入口失败，应准备专门的部署或浏览器拦截场景。</p>
<h2>浏览器权限和存储故障要用能力边界测试</h2>
<p>地理位置、摄像头、剪贴板和通知可以注入拒绝、取消和 API 不存在。测试应检查用户能否选择手动路径，而不是只验证页面打印“权限错误”。权限状态由浏览器和系统共同决定，自动化替身不能证明真实授权弹窗体验。</p>
<p>IndexedDB、Cache Storage 和 File System Access 的失败可以通过测试替身或受控上下文模拟，但要保持错误类型和生命周期语义足够接近真实 API。配额不足、升级 blocked、句柄失效和用户清理数据分别需要不同恢复方案。</p>
<h2>故障注入的范围和安全边界</h2>
<p>默认只在测试环境注入，且通过显式配置或测试专用 header 开启。不要让任意用户参数决定生产环境是否让支付接口失败，也不要把真实密钥、个人数据和线上第三方请求带进可回放的故障样本。</p>
<p>第三方服务可以用隔离的 Stub 或代理模拟，但测试仍要保留至少一条真实集成路径。把所有外部依赖永久替换成“永远成功”的 Mock，会让证书、CORS、限流、认证和真实数据变化失去验证机会。</p>
<h2>通过故障后还要观察恢复质量</h2>
<p>测试不应只断言出现了一个错误文字，还要检查重试次数是否有上限、计时器和订阅是否清理、过期结果是否被丢弃、焦点和读屏提示是否合理、用户输入是否保留，以及恢复后是否真的回到可操作状态。</p>
<p>故障注入也不能替代混沌工程、服务端负载测试或真实设备测试。它的价值在于把前端错误路径变成可重复的契约：在一个明确的故障条件下，用户知道发生了什么，系统不会无限重试或静默丢数据，并且能通过安全路径恢复。</p>`};export{e as default};