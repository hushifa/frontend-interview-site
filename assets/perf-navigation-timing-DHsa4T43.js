var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Navigation Timing 记录文档导航各阶段的时间点，不能单独证明页面可用。</li>
<li>时间值相对于 timeOrigin，要相减得到阶段耗时。</li>
<li>loadEventEnd 要等 load 回调结束后再读。</li>
<li>DOMContentLoaded 和 load 都不等于业务就绪；SPA 路由切换不会产生新的导航条目。</li>
</ul>
<p>Navigation Timing 记录一次文档导航的网络与生命周期时间点，能帮助回答“时间花在哪个阶段”，但不能单独证明页面已经可用。</p>
<p>例如 HTML 很快加载完成，前端却在 load 之后才请求业务数据；或者内容已显示，但主线程仍被大任务占用，按钮点了没有反应。导航完成、内容出现和交互顺畅是不同维度。</p>
<h2>时间点要相减，不能当绝对日期</h2>
<p>PerformanceNavigationTiming 的时间值通常相对于当前文档的 timeOrigin，单位是毫秒，并不是 Unix 时间戳。普通导航条目的 startTime 为 0；需要与日志绝对时间关联时，应明确使用 timeOrigin 和相对值，而不是直接把字段传给 new Date。</p>
<p>常用差值可以这样理解：</p>
<table><thead><tr><th>差值</th><th>可观察的阶段</th><th>不能直接推出的结论</th></tr></thead><tbody><tr><td>responseStart - startTime</td><td>从导航开始到响应首字节</td><td>全部时间都由后端计算造成</td></tr><tr><td>responseStart - requestStart</td><td>请求发出到响应开始的等待</td><td>精确的服务端业务执行时间</td></tr><tr><td>responseEnd - responseStart</td><td>响应主体接收阶段</td><td>一定只有网络传输成本</td></tr><tr><td>domContentLoadedEventEnd - startTime</td><td>到 DOMContentLoaded 处理完成</td><td>页面所有图片、数据和组件都就绪</td></tr><tr><td>loadEventEnd - startTime</td><td>到 load 处理完成</td><td>页面之后不会再加载或卡顿</td></tr></tbody></table>
<p>请求等待可能包含网络往返、代理、缓存或服务端处理；DNS 与连接时间为零或重合，也可能与连接复用有关。应结合环境解释，不能看到一个数字就归因。</p>
<h2>等 load 回调结束后再读 loadEventEnd</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">readNavigationSummary</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> entry = performance.<span class="hljs-title function_">getEntriesByType</span>(<span class="hljs-string">&#x27;navigation&#x27;</span>)[<span class="hljs-number">0</span>];
  <span class="hljs-keyword">if</span> (!entry || entry.<span class="hljs-property">loadEventEnd</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;

  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">type</span>: entry.<span class="hljs-property">type</span>,
    <span class="hljs-attr">firstByteMs</span>: entry.<span class="hljs-property">responseStart</span> - entry.<span class="hljs-property">startTime</span>,
    <span class="hljs-attr">responseBodyMs</span>: entry.<span class="hljs-property">responseEnd</span> - entry.<span class="hljs-property">responseStart</span>,
    <span class="hljs-attr">domReadyMs</span>: entry.<span class="hljs-property">domContentLoadedEventEnd</span> - entry.<span class="hljs-property">startTime</span>,
    <span class="hljs-attr">loadMs</span>: entry.<span class="hljs-property">loadEventEnd</span> - entry.<span class="hljs-property">startTime</span>,
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">scheduleNavigationReport</span>(<span class="hljs-params"></span>) {
  <span class="hljs-comment">// 新任务执行时，当前 load 事件处理才有机会结束。</span>
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">const</span> summary = <span class="hljs-title function_">readNavigationSummary</span>();
    <span class="hljs-keyword">if</span> (summary) <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">table</span>(summary);
  }, <span class="hljs-number">0</span>);
}

<span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">readyState</span> === <span class="hljs-string">&#x27;complete&#x27;</span>) {
  <span class="hljs-title function_">scheduleNavigationReport</span>();
} <span class="hljs-keyword">else</span> {
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;load&#x27;</span>, scheduleNavigationReport, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
}
</code></pre></div>
<p>在 load 监听器自身执行过程中，loadEventEnd 还可能为 0，因为事件处理尚未完成。示例通过后续任务读取，并再次检查完成状态。零值不是“瞬间完成”的通用含义，也可能表示时间点还未发生或信息不可用。</p>
<p>这段代码只输出当前文档的一次摘要，没有实现完整监控上报、重试或所有导航类型统计。</p>
<h2>DOMContentLoaded 与 load 都不等于业务 ready</h2>
<p>DOMContentLoaded 关注 DOM 解析与相关脚本执行条件，不要求所有图片都加载；load 等待相应依赖资源，但不包含页面此后主动发起的全部异步工作，懒加载资源也不能简单按普通阻塞资源理解。</p>
<p>业务可用应有自己的定义。例如订单列表的数据已经显示且筛选可操作，可以记录对应业务 mark/measure；再结合 LCP、INP 和错误率看用户体验。不要用一个笼统的 ready 标记同时表示网络完成、首屏绘制和全部功能可用。</p>
<h2>SPA 与页面恢复要另行处理</h2>
<p>普通 SPA 路由切换不会自动创建一条新的文档 navigation entry。反复读取第一条记录，只是在重复报告最初那次加载。路由切换应建立自己的起止标记，并处理并发导航、取消和缓存命中。</p>
<p>从往返缓存恢复页面，也不等于重新经历一次完整文档加载。可以结合 pageshow 的 persisted 等信息识别恢复；预渲染激活还涉及 activationStart。不要把普通导航、恢复和预渲染数据混成同一组再比较平均值。</p>
<p>排查时先确认采集时机和导航类型，再看阶段差值，最后与资源瀑布、主线程轨迹和真实业务指标交叉验证。Navigation Timing 是定位入口，不是页面体验的单一评分。</p>`};export{e as default};