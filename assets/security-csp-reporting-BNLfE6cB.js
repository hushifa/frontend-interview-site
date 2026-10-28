var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Report-Only 策略不拦截任何资源，只在违规时报告，可以在不影响业务的情况下验证严格策略。</li>
<li>用 <code>Reporting-Endpoints</code> 定义端点，策略里用 <code>report-to</code> 引用；旧的 <code>report-uri</code> 已废弃，过渡期可同时写，支持 <code>report-to</code> 的浏览器会忽略 <code>report-uri</code>。</li>
<li>报告按页面版本、<code>effectiveDirective</code>、被阻止的资源聚合，扩展和旧缓存会产生大量噪声。</li>
<li>没有报告不代表策略安全：低频页面可能没人访问，报告链路本身也可能没工作。</li>
<li>Report-Only 只能通过响应头下发，<code>&lt;meta&gt;</code> 中无效。</li>
</ul>
<h2>配置</h2>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Reporting-Endpoints: csp=&quot;https://reports.example.com/csp&quot;
Content-Security-Policy-Report-Only: script-src &#x27;nonce-R4nd0m&#x27; &#x27;strict-dynamic&#x27;; object-src &#x27;none&#x27;; base-uri &#x27;none&#x27;; report-to csp
</code></pre></div>
<p>正式策略和观察中的下一版可以并存：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Content-Security-Policy: script-src &#x27;self&#x27;; report-to csp
Content-Security-Policy-Report-Only: script-src &#x27;nonce-R4nd0m&#x27; &#x27;strict-dynamic&#x27;; report-to csp
</code></pre></div>
<h2>读报告</h2>
<p>Reporting API 发送的报告体包含：</p>
<ul>
<li><code>documentURL</code>：发生违规的页面。</li>
<li><code>effectiveDirective</code>：被违反的指令，例如 <code>script-src-elem</code>、<code>connect-src</code>。</li>
<li><code>blockedURL</code>：被阻止的资源；内联脚本为 <code>inline</code>，<code>eval</code> 为 <code>eval</code>。</li>
<li><code>sourceFile</code>、<code>lineNumber</code>：触发位置。</li>
<li><code>disposition</code>：<code>report</code> 表示来自 Report-Only，<code>enforce</code> 表示已实际拦截。</li>
</ul>
<p>旧 <code>report-uri</code> 的格式不同（<code>csp-report</code> 对象，字段名如 <code>violated-directive</code>），接收端要分别解析。</p>
<h2>处理流程</h2>
<ol>
<li>部署 Report-Only，收集一到两周。</li>
<li>按指令和资源聚合，区分业务资源、第三方脚本、浏览器扩展（常见 <code>chrome-extension:</code> 来源）。</li>
<li>修正代码：内联脚本加 nonce，内联事件改 <code>addEventListener</code>，补上缺失的合法来源。</li>
<li>主动走一遍登录、支付、错误页等关键路径，并制造一个受控违规确认报告能到达。</li>
<li>切换为强制执行，保留报告继续监控。</li>
</ol>
<h2>接收端的安全</h2>
<p>报告由客户端发送，可以伪造。接收端要限制请求体大小和频率，展示时编码报告内容。<code>documentURL</code> 可能包含查询参数里的个人信息，存储前脱敏。</p>
<h2>常见追问</h2>
<ul>
<li>违规太多怎么办？不要为了清零报告放开 <code>*</code> 或 <code>&#x27;unsafe-inline&#x27;</code>，先按影响面排序处理。</li>
<li>报告是实时的吗？浏览器可能批量、延迟发送，也可能因网络失败丢失。</li>
</ul>`};export{e as default};