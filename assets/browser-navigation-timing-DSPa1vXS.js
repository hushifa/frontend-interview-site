var e={answerHtml:`<p>用户说“打开页面很慢”，可能是 DNS 慢、连接慢、服务器迟迟不返回 HTML，也可能是 HTML 已到，但大量脚本和样式让页面迟迟不可用。Navigation Timing 为一次文档导航提供若干时间点，帮助先把等待发生的阶段找出来。</p>
<p>它记录的是浏览器观察到的导航过程，不是服务端内部调用链，也不是对“用户感觉有多快”的最终评分。</p>
<h2>时间点不是耗时，要明确相减的起点</h2>
<p>通过 <code>performance.getEntriesByType(&#x27;navigation&#x27;)[0]</code> 可以取得当前文档的导航条目。相关值使用高精度时间戳，单位为毫秒，通常相对于当前文档的性能时间基准；不是直接与 <code>Date.now()</code> 混算的 Unix 时间。</p>
<p>导航条目的 <code>startTime</code> 为 0。两个时间点相减才能表示特定区间，而单个里程碑值表示从该基准到那个时刻的时间。</p>
<table><thead><tr><th>字段或区间</th><th>可以帮助观察什么</th></tr></thead><tbody><tr><td><code>domainLookupEnd - domainLookupStart</code></td><td>本次记录的 DNS 阶段</td></tr><tr><td><code>connectEnd - connectStart</code></td><td>本次连接建立阶段，适用时可能包含安全握手</td></tr><tr><td><code>connectEnd - secureConnectionStart</code></td><td>有有效安全连接起点时，可辅助分析安全握手区间</td></tr><tr><td><code>responseStart - requestStart</code></td><td>发出请求到收到首字节之间的等待</td></tr><tr><td><code>responseEnd - responseStart</code></td><td>响应首字节到接收结束的区间</td></tr><tr><td><code>domInteractive</code></td><td>文档达到 interactive 状态的时刻</td></tr><tr><td><code>domContentLoadedEventEnd</code></td><td>DOMContentLoaded 事件处理完成的时刻</td></tr><tr><td><code>loadEventEnd</code></td><td>load 事件处理完成的时刻</td></tr></tbody></table>
<p>这些区间不应随意全部相加。安全握手可能已包含在 connect 区间里，再加一次就重复计算；HTML 解析又可能与响应接收并行，不是响应下载后才开始计时的一块独立工作。</p>
<h2>TTFB 不能直接等同于服务器执行时间</h2>
<p>在普通非预渲染导航的常见测量中，从导航起点到首字节的时间可按 <code>responseStart - startTime</code> 理解。它可能包含重定向、连接准备和请求等待等多个阶段。</p>
<p><code>responseStart - requestStart</code> 则把观察区间收窄到请求开始之后，不包含前面已经发生的全部准备时间。原来只测这个差值却统一叫“整页 TTFB”，会让不同采集口径混在一起。</p>
<p>即使这个收窄后的区间很长，也不能断定全是服务端 CPU 时间：请求发送、网络往返、排队、代理和缓存验证都可能参与。要区分数据库、模板和应用逻辑，应结合服务端日志、链路追踪或 <code>Server-Timing</code> 等信息。</p>
<p>103 Early Hints、预渲染激活等特殊流程还可能影响首字节指标的解释；某些浏览器提供额外的中间响应或最终响应头时间字段。做正式监控时，应确定采用的指标库、浏览器版本和时间口径，不能把所有特殊流程都压成同一个未经说明的减法。</p>
<h2>不要在 load 回调尚未结束时读取 loadEventEnd</h2>
<p><code>loadEventEnd</code> 记录 load 事件处理完成之后的时刻。直接在 load 监听器内部同步读取，可能仍是 0；页面已经能读到 navigation 条目，也不意味着所有里程碑都已经填好。</p>
<p>下面把采集安排到后续计时器任务，并处理脚本晚于 load 加载的情况。返回的函数可用于取消尚未执行的采集：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">collectNavigationTiming</span>(<span class="hljs-params">report</span>) {
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">scheduleCollection</span>(<span class="hljs-params"></span>) {
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">if</span> (disposed) <span class="hljs-keyword">return</span>;
      <span class="hljs-keyword">const</span> entry = performance.<span class="hljs-title function_">getEntriesByType</span>(<span class="hljs-string">&#x27;navigation&#x27;</span>)[<span class="hljs-number">0</span>];
      <span class="hljs-keyword">if</span> (!entry) <span class="hljs-keyword">return</span>;

      <span class="hljs-keyword">const</span> <span class="hljs-title function_">elapsed</span> = (<span class="hljs-params">start, end</span>) =&gt; (
        <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(start) &amp;&amp; <span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(end) &amp;&amp; end &gt;= start
          ? end - start
          : <span class="hljs-literal">null</span>
      );

      <span class="hljs-title function_">report</span>({
        <span class="hljs-attr">type</span>: entry.<span class="hljs-property">type</span>,
        <span class="hljs-attr">protocol</span>: entry.<span class="hljs-property">nextHopProtocol</span>,
        <span class="hljs-attr">dns</span>: <span class="hljs-title function_">elapsed</span>(entry.<span class="hljs-property">domainLookupStart</span>, entry.<span class="hljs-property">domainLookupEnd</span>),
        <span class="hljs-attr">connection</span>: <span class="hljs-title function_">elapsed</span>(entry.<span class="hljs-property">connectStart</span>, entry.<span class="hljs-property">connectEnd</span>),
        <span class="hljs-attr">tls</span>: entry.<span class="hljs-property">secureConnectionStart</span> &gt; <span class="hljs-number">0</span>
          ? <span class="hljs-title function_">elapsed</span>(entry.<span class="hljs-property">secureConnectionStart</span>, entry.<span class="hljs-property">connectEnd</span>)
          : <span class="hljs-literal">null</span>,
        <span class="hljs-attr">navigationToResponseStart</span>: <span class="hljs-title function_">elapsed</span>(entry.<span class="hljs-property">startTime</span>, entry.<span class="hljs-property">responseStart</span>),
        <span class="hljs-attr">requestToResponseStart</span>: <span class="hljs-title function_">elapsed</span>(entry.<span class="hljs-property">requestStart</span>, entry.<span class="hljs-property">responseStart</span>),
        <span class="hljs-attr">responseTransfer</span>: <span class="hljs-title function_">elapsed</span>(entry.<span class="hljs-property">responseStart</span>, entry.<span class="hljs-property">responseEnd</span>),
        <span class="hljs-attr">domInteractive</span>: entry.<span class="hljs-property">domInteractive</span> || <span class="hljs-literal">null</span>,
        <span class="hljs-attr">domContentLoadedEnd</span>: entry.<span class="hljs-property">domContentLoadedEventEnd</span> || <span class="hljs-literal">null</span>,
        <span class="hljs-attr">loadEnd</span>: entry.<span class="hljs-property">loadEventEnd</span> || <span class="hljs-literal">null</span>,
      });
    }, <span class="hljs-number">0</span>);
  }

  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">readyState</span> === <span class="hljs-string">&#x27;complete&#x27;</span>) {
    <span class="hljs-title function_">scheduleCollection</span>();
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;load&#x27;</span>, scheduleCollection, {
      <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span>,
      <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
    });
  }

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    disposed = <span class="hljs-literal">true</span>;
    controller.<span class="hljs-title function_">abort</span>();
    <span class="hljs-built_in">clearTimeout</span>(timer);
  };
}
</code></pre></div>
<p>例如调用 <code>collectNavigationTiming((data) =&gt; console.table(data))</code> 查看当前记录。它只是一次导航的诊断摘要，不会自动上传数据，也没有把未完成或不适用字段填成看似可信的业务结论。</p>
<p>也可以使用支持 navigation 条目的 PerformanceObserver，并通过 buffered 读取已产生的记录。采集器仍需管理生命周期、去重和异常环境，不能反复注册后把同一次导航上报多遍。</p>
<h2>DNS 或连接耗时是 0，不代表浏览器没有网络</h2>
<p>DNS 缓存、已有连接复用、缓存响应以及浏览器的时间暴露规则，都可能让某些时间点相同或为 0。HTTPS 请求复用连接时，也不能期待每条请求都有一份独立可观察的 TLS 握手耗时。</p>
<p><code>secureConnectionStart</code> 没有有效值时，示例返回 null，表示该区间在此记录中不适合直接计算。不能拿 0 当作握手起点，再算出一个巨大的“TLS 耗时”。</p>
<p>跨源重定向等信息还可能因隐私规则受到限制。子资源的 Resource Timing 又涉及自己的跨源时间暴露规则，不能因为图片条目缺字段就照搬文档导航的解释。</p>
<p>缓存诊断也不能只看一个 transferSize 是否为 0，应结合请求类型、暴露权限、Service Worker 和开发者工具记录。性能字段描述观察结果，不是直接给出唯一原因。</p>
<h2>DOMContentLoaded、load 与用户可用性并不等价</h2>
<p>DOMContentLoaded 关注 DOM 解析和相应脚本时序，不会自动等待所有图片；load 会等待规定范围内的依赖资源，但懒加载、后续异步请求和用户触发的模块仍可能在之后才开始。</p>
<p>页面可以在 load 前已经能用，也可能在 load 后仍被大任务卡住。字体替换、布局变化、首屏主图出现和输入处理，都需要其他证据。</p>
<p>因此应结合 LCP、INP、CLS，以及业务自己定义的“首屏数据可见”“主操作已可用”等信号。Navigation Timing 适合定位导航阶段，不能拿 load 一个数字代替全部体验指标。</p>
<h2>SPA、返回恢复和预渲染要单独识别</h2>
<p><code>history.pushState()</code> 这样的同文档路由切换通常不会新增完整的 navigation 条目。SPA 页面切换应使用明确的业务标记、路由生命周期和适合的测量方式，不要反复读取最初导航条目充当每一页耗时。</p>
<p>从 bfcache 恢复时，也不能把原文档的首次加载时间当成这次返回的等待时间；可以结合 pageshow 的 persisted 等信息区分恢复。若未命中 bfcache 而重新进行了文档导航，则是另一种过程。</p>
<p>预渲染文档可能在用户真正进入之前就开始工作，支持的环境可通过 activationStart 等信息理解激活时间。正式汇总时应把导航类型、设备、网络和缓存条件分组，否则把首次访问、重载、恢复和预渲染混在一起，很容易得出错误的优化结论。</p>`};export{e as default};