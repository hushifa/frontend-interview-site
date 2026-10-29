var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>直接上线一条严格的 CSP，很可能把某个页面的脚本拦掉，业务就挂了。所以先用 <code>Content-Security-Policy-Report-Only</code> 下发，它不拦截任何资源，只在违规时报告，可以在不影响业务的情况下验证策略。</p>
<p>报告发到哪里，用 <code>Reporting-Endpoints</code> 响应头定义端点，策略里用 <code>report-to</code> 引用。旧的 <code>report-uri</code> 已经废弃，过渡期可以两个都写，支持 <code>report-to</code> 的浏览器会忽略 <code>report-uri</code>。</p>
<p>收到报告后，按页面版本、<code>effectiveDirective</code> 和被阻止的资源归类。浏览器扩展和旧缓存会产生大量噪声，要筛掉。一个一个修完，再切换为强制执行。</p>
<p>要注意，没收到报告不代表策略没问题，可能是低频页面没人访问，也可能是报告链路本身没工作。另外 Report-Only 只能通过响应头下发，写在 <code>&lt;meta&gt;</code> 里无效。</p>
</blockquote>
<h2>怎么配置</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Reporting-Endpoints: csp=&quot;https://reports.example.com/csp&quot;
Content-Security-Policy-Report-Only: script-src &#x27;nonce-R4nd0m&#x27; &#x27;strict-dynamic&#x27;; object-src &#x27;none&#x27;; base-uri &#x27;none&#x27;; report-to csp
</code></pre></div>
<p>第一行给端点起名叫 <code>csp</code>，第二行的 <code>report-to csp</code> 就是引用这个名字。</p>
<p>已经有正式策略的网站，可以让正式策略和观察中的下一版同时存在：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: script-src &#x27;self&#x27;; report-to csp
Content-Security-Policy-Report-Only: script-src &#x27;nonce-R4nd0m&#x27; &#x27;strict-dynamic&#x27;; report-to csp
</code></pre></div>
<p>浏览器按第一行实际拦截，同时按第二行检查并报告。这样新策略可以在线上观察，不会影响现有的保护。</p>
<h2>报告里有什么</h2>
<p>Reporting API 发来的报告体里，有几个字段最常用。<code>documentURL</code> 是发生违规的页面。<code>effectiveDirective</code> 是被违反的指令，比如 <code>script-src-elem</code>、<code>connect-src</code>。<code>blockedURL</code> 是被阻止的资源，内联脚本显示为 <code>inline</code>，<code>eval</code> 显示为 <code>eval</code>。<code>sourceFile</code> 和 <code>lineNumber</code> 是触发的位置。<code>disposition</code> 区分来源，<code>report</code> 表示来自 Report-Only，<code>enforce</code> 表示已经实际拦截了。</p>
<p>旧的 <code>report-uri</code> 发来的格式不一样，是一个 <code>csp-report</code> 对象，字段名也不同，比如 <code>violated-directive</code>。所以过渡期接收端要两种都能解析。</p>
<h2>从观察到强制执行的流程</h2>
<ol>
<li>部署 Report-Only，收集一到两周。</li>
<li>按指令和资源归类，区分业务资源、第三方脚本和浏览器扩展（常见 <code>chrome-extension:</code> 来源）。</li>
<li>修改代码：内联脚本加 nonce，内联事件改成 <code>addEventListener</code>，补上缺失的合法来源。</li>
<li>主动走一遍登录、支付、错误页等关键路径，并制造一个受控的违规，确认报告能到达。</li>
<li>切换为强制执行，保留报告继续监控。</li>
</ol>
<p>第 4 步为什么要故意制造违规？因为前面说过，没有报告可能是链路坏了。自己触发一次、确认收到，才能相信“没报告”真的是没问题。</p>
<h2>接收端本身也要防</h2>
<p>报告是客户端发来的，任何人都可以伪造。所以接收端要限制请求体大小和频率，在后台展示时要对报告内容编码，否则报告系统自己就可能被 XSS。<code>documentURL</code> 可能带着查询参数里的个人信息，存储前要脱敏。</p>
<h2>常见追问</h2>
<p><strong>违规报告太多怎么办？</strong></p>
<blockquote>
<p>不要为了让报告清零就放开 <code>*</code> 或 <code>&#x27;unsafe-inline&#x27;</code>，那样策略就没意义了。先按影响面排序，从影响最大的开始处理。</p>
</blockquote>
<p><strong>报告是实时发送的吗？</strong></p>
<blockquote>
<p>不是。浏览器可能攒一批再发，也可能延迟发，网络失败时还可能丢失。所以报告适合看趋势，不能当成完整的记录。</p>
</blockquote>`};export{e as default};