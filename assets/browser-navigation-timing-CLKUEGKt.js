var e={answerHtml:`<p><code>PerformanceNavigationTiming</code> 提供一次导航的时间戳，例如 <code>domainLookupStart/End</code>、<code>connectStart/End</code>、<code>requestStart</code>、<code>responseStart</code>、<code>responseEnd</code>、<code>domContentLoadedEventEnd</code> 和 <code>loadEventEnd</code>。它可以帮助判断时间主要消耗在 DNS、连接、服务端首字节、下载还是页面脚本执行。</p>
<p>这些时间点描述浏览器事件，不等价于用户已经能顺畅使用页面。<code>load</code> 只表示页面依赖资源达到相应加载状态；大型脚本、长任务、字体替换和异步数据仍可能影响交互。要分析真实体验，还要结合 LCP、INP、CLS、Long Tasks 和业务可用信号。</p>
<p>跨页面、刷新、bfcache 恢复和 SPA 路由切换的观测方式也不同。采集时要处理没有某些条目、时间戳为零和隐私限制，不要把单个用户的一次测量当成整体结论。</p>
<p>浏览器问题通常同时涉及页面生命周期、事件循环、渲染调度和资源状态。排查时先记录触发顺序和页面可见性，再用 Performance、Network 或对应的 Application 面板确认事实，不要只根据某一次 console 输出推断机制。</p>
<p>跨浏览器或跨页面场景要考虑特性检测、恢复路径和清理时机。只在首次加载事件里写逻辑，往往会漏掉回退、前进、恢复和后台切换等状态。</p>
<p>实际项目里，页面不只有首次打开这一种生命周期。回退恢复、标签页切换、网络变化和窗口失焦都可能让旧状态重新出现；相关逻辑要能重复执行，也要能在页面销毁或状态过期时清理。</p>`};export{e as default};