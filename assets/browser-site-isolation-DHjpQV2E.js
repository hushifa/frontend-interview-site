var e={answerHtml:`<p>后台页面嵌入一个第三方报表，打开浏览器任务管理器后，发现一个标签页对应多个渲染进程。这并不一定是内存泄漏，也不意味着页面创建了多个 Web Worker。浏览器可以把跨站 iframe 放进不同的渲染进程，再把各个进程产生的画面合成到同一标签页。</p>
<p>以下以 Chromium 的 Site Isolation 设计为例。它是浏览器实现层的安全机制，不是网页能统一配置的跨浏览器进程规范；具体进程分配受到版本、平台、企业策略和资源条件影响。</p>
<h2>为什么有同源策略，还要隔离进程</h2>
<p>同源策略限制脚本读取其他来源的 DOM、响应和存储。例如主页面不能直接读取第三方 iframe 的 document。正常执行的 JavaScript 必须遵守这一限制，即使两个文档恰好运行在同一个进程中。</p>
<p>但如果渲染器本身出现漏洞，攻击者可能不再遵守渲染器内的软件检查；Spectre 一类侧信道还可能暴露同一进程内的内存。Site Isolation 进一步让不同站点的敏感数据尽量不进入同一个渲染进程，并让浏览器进程执行额外的权限与资源检查。这样，即使一个渲染器被攻破，也不应因此获得其他站点的数据。</p>
<p>它不是同源策略的替代品。它也不修复本站 XSS：如果攻击者已经能在当前站点执行脚本，依然可能使用该站点允许的能力。CSRF、接口越权和点击劫持仍需要应用自己的防护。</p>
<h2>site、origin 和标签页不是同一个边界</h2>
<p>origin 通常由协议、主机和端口构成；site 的判断围绕协议和可注册域，并涉及公共后缀规则，不能简单取域名最后两段。两个子域可以不同源但同站，因此“跨源 iframe”不能无条件等同于“跨站 iframe”。</p>
<p>一个标签页可以包含多个站点，一次导航也可以改变站点。反过来，同站文档可能复用进程，也可能因为其他隔离约束分开。不要画成“一标签页一进程”或“一域名永久对应一个进程”。应用不能用进程数量推断 Cookie、存储权限或文档访问权限。</p>
<h2>OOPIF 如何还能显示在原来的位置</h2>
<p>OOPIF 是 out-of-process iframe，即在宿主之外的渲染进程运行的子框架。宿主仍负责它在页面布局中的位置，子框架负责自身内容，浏览器协调输入与跨进程交互，并合成最终画面。它不会变成另一个用户可见的窗口。</p>
<p>允许的跨窗口操作仍可通过浏览器协调，例如 postMessage。消息传递并没有解除同源限制，也不是直接共享两个页面的 JavaScript 对象。</p>
<p>下面演示宿主如何接收报表加载完成通知。两个页面分别部署到示例中对应的 HTTPS 来源；实际使用时换成自己控制的地址，并确认子页面允许被宿主嵌入。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- https://app.example.test/ 页面 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>报表加载中<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">iframe</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;report&quot;</span> <span class="hljs-attr">title</span>=<span class="hljs-string">&quot;业务报表&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">iframe</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">script</span>&gt;</span><span class="javascript">
  <span class="hljs-keyword">const</span> frame = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#report&#x27;</span>);
  <span class="hljs-keyword">const</span> reportOrigin = <span class="hljs-string">&#x27;https://reports.example.org&#x27;</span>;
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;message&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (event.<span class="hljs-property">origin</span> !== reportOrigin || event.<span class="hljs-property">source</span> !== frame.<span class="hljs-property">contentWindow</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">if</span> (!event.<span class="hljs-property">data</span> || event.<span class="hljs-property">data</span>.<span class="hljs-property">type</span> !== <span class="hljs-string">&#x27;report-ready&#x27;</span> || event.<span class="hljs-property">data</span>.<span class="hljs-property">version</span> !== <span class="hljs-number">1</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#status&#x27;</span>).<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;报表已就绪&#x27;</span>;
  });
  <span class="hljs-comment">// 先注册监听，再发起加载，避免错过早期消息。</span>
  frame.<span class="hljs-property">src</span> = reportOrigin + <span class="hljs-string">&#x27;/report.html&#x27;</span>;
</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- https://reports.example.org/report.html 页面 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">h1</span>&gt;</span>业务报表<span class="hljs-tag">&lt;/<span class="hljs-name">h1</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">script</span>&gt;</span><span class="javascript">
  parent.<span class="hljs-title function_">postMessage</span>(
    { <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;report-ready&#x27;</span>, <span class="hljs-attr">version</span>: <span class="hljs-number">1</span> },
    <span class="hljs-string">&#x27;https://app.example.test&#x27;</span>,
  );
</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>检查 origin 限定来源，检查 source 限定具体窗口，检查消息结构限定业务协议。三个检查不能互相替代。示例不涉及登录和业务数据授权；允许显示 iframe 不等于允许它读主页面数据。这个通信例子即使没有跨进程也能工作，不能根据收到消息证明 OOPIF 已启用。</p>
<h2>COOP、COEP 与 sandbox 不是进程开关</h2>
<p>COOP 影响顶层页面的跨源 opener 关系和浏览上下文分组；COEP 对嵌入跨源资源提出要求。满足相应条件后，页面可能获得 crossOriginIsolated 状态，并使用需要隔离的能力。但不能从设置了响应头推导出具体 PID，也不能从 iframe 独立进程推导出 crossOriginIsolated 为 true。</p>
<p>iframe sandbox 限制脚本、导航等文档能力；CSP frame-ancestors 决定谁能嵌入页面。Site Isolation 不会自动替页面补上这些策略。应用应先按信任边界设计允许的能力，再验证具体浏览器行为。</p>
<h2>性能诊断要看成本在哪里</h2>
<p>独立进程可能让子框架的工作与宿主并行，但增加进程、堆和通信成本。第三方报表依然会使用 CPU、内存和网络；子框架触发宿主改尺寸时，宿主也可能重新布局。因此“分进程就不会拖慢主页面”不成立。</p>
<p>在目标浏览器版本上，可以结合浏览器任务管理器中的进程 ID、开发者工具的框架树与性能录制观察。比较嵌入前后、报表更新时和关闭后各个进程的 CPU 与内存，而不是把操作系统看到的所有进程都归因于当前页面。自动化测试验证消息协议和错误降级，进程部署与故障隔离则需要真实浏览器证据。</p>
<h2>实际选型</h2>
<p>不可信的第三方报表适合放在独立来源的 iframe 中，配合最小能力、嵌入策略和经过校验的消息协议；不要为了性能期待而把同源页面拆成很多 iframe。需要后台纯计算时评估 Worker，需要可复用 UI 时评估组件边界。三者解决的问题不同，浏览器进程分配应作为实现事实观察，而不是业务协议依赖。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://www.chromium.org/developers/design-documents/site-isolation/">Chromium · Site Isolation Design Document</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy">MDN · Same-origin policy</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage">MDN · Window.postMessage</a></li>
</ul>`};export{e as default};