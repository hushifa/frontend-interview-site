var e={answerHtml:`<h2>简答</h2>
<ul>
<li>第三方脚本既是网络依赖，也以页面源身份执行代码。</li>
<li>先按用户价值和隐私同意决定是否加载、何时加载；async、defer 只解决部分调度问题。</li>
<li>主线程成本要在 Performance 面板实测。</li>
<li>数据用白名单上报，并准备超时、降级和回滚方案。</li>
</ul>
<p>页面加入一个统计 SDK 后，首屏变慢、主线程长任务增加，甚至因为供应商响应异常导致页面报错。第三方脚本既是网络依赖，也是能执行页面代码的供应链依赖；仅给 <code>&lt;script&gt;</code> 加 <code>async</code> 并不能解决它的下载、解析、执行、隐私和故障影响。</p>
<h2>先定义脚本是否真的需要执行</h2>
<p>把第三方能力按用户价值和时机分类：首屏必需、用户操作后才需要、首屏后可延迟、仅在特定地区或同意隐私后加载。未同意分析或广告用途时，不能先加载脚本再“停止上报”；脚本已经获得执行能力，可能已经读取页面信息或写入存储。</p>
<p>加载入口应由应用控制，使用明确的供应商白名单、版本和开关。配置失败时页面仍应可用，不能把统计脚本的异常传播到核心业务。</p>
<h2><code>async</code> 和 <code>defer</code> 只解决部分调度问题</h2>
<ul>
<li><code>async</code> 脚本下载完成后尽快执行，多个脚本的执行顺序不保证，可能打断解析和主线程。</li>
<li><code>defer</code> 脚本在文档解析完成后按文档顺序执行，适合依赖 DOM 且不需要阻塞解析的脚本。</li>
<li>动态插入脚本的执行顺序、模块加载和供应商自身的内部任务还要单独验证。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">defer</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/vendor/analytics-loader.v3.js&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>即使脚本使用 <code>defer</code>，执行本身仍会占用主线程，也可能在交互前运行大量初始化。真正延迟可以在用户同意、首次交互或浏览器空闲时加载，但要评估会不会丢失关键首屏事件。不要为了追求指标把必需功能延迟到用户已经无法理解页面之后。</p>
<h2>主线程成本需要实测</h2>
<p>第三方脚本的成本包括 DNS、连接、下载、解压、解析、编译、执行和后续定时器、事件监听器。Network 面板只能看到网络阶段，Performance 录制才能看到执行和长任务。应按低端设备、慢网络和真实页面路径测量，而不是只在开发机看脚本文件大小。</p>
<p>可以通过 <code>PerformanceObserver</code> 观察长任务和资源计时，按脚本 URL 聚合耗时；上报时应脱敏并限制维度。脚本可能动态加载更多资源，不能只审查最初的一个 URL。</p>
<h2>权限和隔离边界</h2>
<p>直接以 <code>&lt;script&gt;</code> 加载到页面中的第三方脚本，以页面源的身份执行，与应用代码拥有相近的 DOM、Cookie（受 HttpOnly 等限制）、网络和存储能力。CSP 可以限制来源，但允许执行的脚本仍然是高权限代码。对无法完全信任的内容，应优先使用跨源 iframe 和 <code>postMessage</code>，并校验消息来源和结构；iframe 还需设计最小权限和 <code>sandbox</code>。</p>
<p><code>Subresource Integrity</code> 可以校验固定静态文件的哈希，但动态版本、个性化响应和供应商自行加载的子资源会限制它的适用范围。不能因为主脚本带了 integrity 就认为整个供应商链路都被验证。</p>
<h2>数据和同意管理</h2>
<p>事件参数应使用白名单，不要把完整 URL 查询参数、表单内容、Token、内部 ID 或用户输入直接交给第三方。跨地区部署还要遵守适用的隐私和数据传输规则。用户撤回同意后，应停止后续采集、清理可清理的标识，并避免在已加载脚本中继续发送事件；具体能力取决于供应商 SDK，不能只删一个本地开关。</p>
<h2>故障隔离和回滚</h2>
<p>第三方 DNS、证书、脚本异常或接口慢时，核心页面应有超时、错误边界和本地降级。不要让第三方 Promise 拒绝触发全局未捕获错误，也不要让核心提交依赖一个非关键统计请求。脚本开关应能在不重新发布主应用的情况下关闭，配置服务自身也要有安全默认值和缓存版本。</p>
<p>供应商升级应先在灰度环境和部分流量启用，记录版本、执行耗时、错误率和关键业务指标。出现异常时关闭开关或回滚版本；不要只依赖供应商承诺的“向后兼容”。</p>
<h2>测试清单</h2>
<ul>
<li>无同意、已同意和撤回同意时的加载与数据发送；</li>
<li>脚本超时、404、CSP 拒绝和运行时异常；</li>
<li>慢 CPU、慢网络和页面隐藏/恢复；</li>
<li>第三方脚本是否改变焦点、布局、全局事件和错误处理；</li>
<li>构建产物、动态子资源和域名变更；</li>
<li>禁用供应商后的核心功能和回滚路径。</li>
</ul>
<h2>常见误区</h2>
<ul>
<li>只加 <code>async</code>：执行成本、顺序竞态和供应链风险仍在。</li>
<li>只看脚本体积：运行时任务和动态加载可能更贵。</li>
<li>依赖 CORS 保护脚本：CORS 控制读取，不会限制同源脚本执行权限。</li>
<li>只给主脚本加 SRI：供应商动态加载的资源仍未覆盖。</li>
<li>把统计失败当业务失败：非关键观测应与核心流程隔离。</li>
</ul>
<p>第三方脚本治理应纳入依赖清单、隐私评审、性能预算和发布回滚流程。只有明确知道它何时加载、能访问什么、失败怎么办、如何撤回，才适合进入生产页面。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript">web.dev · Optimize third-party resources</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script">MDN · <code>&lt;script&gt;</code></a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity">MDN · Subresource Integrity</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP">MDN · Content Security Policy</a></li>
</ul>`};export{e as default};