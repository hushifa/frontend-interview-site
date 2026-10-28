var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Report-Only 让严格 CSP 先观察违规，不影响业务运行。</li>
<li>要配置报告端点，按页面版本、指令和资源来源聚合违规记录。</li>
<li>扩展和旧缓存会产生噪声；没有报告不能证明策略安全。</li>
<li>转为强制执行后继续保留报告和业务错误监控。</li>
</ul>
<p>给已有站点突然加一份严格 CSP，可能同时拦住攻击脚本和正常业务：支付组件加载失败、内联样式失效、某个仅在结算时使用的接口被阻止。Report-Only 的用途是先观察“如果执行这份策略，会有哪些行为违规”，再逐步修正依赖和代码。</p>
<p>它不会执行这份观察策略的拦截。看到控制台出现违规提示但页面仍正常运行，可能正是 Report-Only 的预期结果，而不是浏览器忽略了配置。</p>
<h2>配置策略，也要配置报告去哪里</h2>
<p>下面是一份用于观察的示例片段，来源和端点应替换为实际配置：</p>
<div class="not-prose code-block"><div class="code-language">http</div><pre><code class="hljs language-http">Reporting-Endpoints: csp=&quot;https://reports.example.com/csp&quot;
Content-Security-Policy-Report-Only: default-src &#x27;self&#x27;; script-src &#x27;self&#x27;; object-src &#x27;none&#x27;; report-to csp; report-uri https://reports.example.com/csp-legacy
</code></pre></div>
<p>report-to 引用 Reporting-Endpoints 中定义的端点名称。report-uri 是较旧且已废弃的机制，但为覆盖尚未支持新机制的浏览器，可以在过渡期间同时声明；支持 report-to 的浏览器会忽略 report-uri，而不是保证两个端点都收到同一份报告。</p>
<p>两种机制的负载格式不同：Reporting API 通常发送报告对象数组，CSP 报告体字段使用诸如 effectiveDirective 的名称；旧 report-uri 常见的是包含 <code>csp-report</code> 的对象，字段如 <code>violated-directive</code>。接收服务应按真实格式解析，不能假设只是换了 URL。</p>
<p>Report-Only 必须通过响应头下发，不能写进 meta 标签。报告地址也必须确实能接收请求；纯静态文件目录不会因为多放一个 JSON 文件就成为报告服务。上述配置是知识示例，并不表示当前题库网站已部署收集服务。</p>
<h2>一条违规记录应该怎样读</h2>
<p>排查时先确定页面、策略版本、触发的指令和被阻止的资源，再看对应业务路径。例如用户打开结算弹窗后出现 connect-src 违规，通常应检查支付接口或 WebSocket 的地址，而不是去调整 script-src。</p>
<p>常用信息包括文档地址、effectiveDirective、blockedURL、sourceFile、行列位置和 disposition。disposition 可帮助区分观察策略的 report 与正式策略的 enforce。字段不保证都有值，跨源地址还可能因隐私规则被裁剪；不能依赖每条记录都包含完整资源 URL。</p>
<p>如果 effectiveDirective 指向脚本内联执行，应定位是哪段代码产生的，再决定改为外部脚本、nonce 或 hash。若是第三方组件，核对其真实依赖和推荐集成方式。不要为了让报告数归零，就添加 <code>*</code> 或把所有内联执行都放开。</p>
<h2>报告多，不一定都是业务攻击</h2>
<p>浏览器扩展、用户脚本、旧缓存页面和历史版本都可能制造噪声。同一个问题也可能被大量用户重复触发。适合按页面版本、指令、资源来源等维度聚合，再结合受影响用户比例与错误日志判断优先级。</p>
<p>报告内容来自客户端，也可以被伪造。接收端应限制请求体大小、速率和可接受字段，展示时进行安全编码，不要把报告中的 HTML 或 URL 直接当作可信页面内容。即使端点只用于日志，也可能遭遇流量和存储滥用。</p>
<p>文档 URL、查询参数、代码样本可能包含用户信息。开启 report-sample 等采样能力前应评估敏感数据暴露，必要时脱敏、缩短保留期，避免把完整令牌或私人内容写进告警系统。</p>
<h2>“没有报告”不能证明策略安全</h2>
<p>报告可能延迟、批量发送或未成功送达，浏览器支持也不同。某个低频入口还没有用户访问，就不会产生对应违规；未登录页面的成功运行，也不能证明后台全部正常。</p>
<p>应主动覆盖登录、支付、懒加载、错误页和第三方交互等关键路径，并通过开发者工具确认实际响应头已经生效。还要验证一个受控违规确实能到达报告服务，否则观察窗口里的“零问题”可能只是收集链路没工作。</p>
<h2>从观察转为执行时仍要保留反馈</h2>
<p>完成修正后，可以逐步将策略发布到 Content-Security-Policy，同时继续监控业务错误。正式策略与 Report-Only 可以并存：正式策略提供当前防护，Report-Only 观察下一版更严格的规则。</p>
<p>多个正式 CSP 通常共同约束页面，不是后面的宽松策略覆盖前面的严格策略。因此回滚错误配置时，应检查代理、CDN 和应用是否重复添加响应头，避免只修改其中一层。</p>
<p>上线标准不应只是报告数量少，而应包括关键流程正常、限制符合预期、报告链路可用和有明确回滚方式。Report-Only 是迁移与排查手段，本身不提供那份观察策略的阻断保护。</p>`};export{e as default};