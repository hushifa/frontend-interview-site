var e={answerHtml:`<p><code>scheduler.postTask()</code> 可以把回调放入浏览器任务队列，并提示 <code>user-blocking</code>、<code>user-visible</code> 或 <code>background</code> 等优先级；还可以通过 <code>AbortSignal</code> 取消尚未执行的任务。</p>
<p>优先级只是浏览器调度提示，不会把一个同步长任务拆开。耗时计算仍需拆分、延迟、Worker 或算法优化；大量高优先级任务会挤压渲染和输入响应。</p>
<p>该 API 支持情况和调度细节需要按目标浏览器验证。没有支持时应降级到 <code>setTimeout</code> 或其他调度方式，并保持任务可取消、幂等和生命周期明确。</p>
<h3>排查路径</h3>
<p>浏览器问题通常同时涉及页面生命周期、事件循环、渲染调度和资源状态。排查时先记录触发顺序和页面可见性，再用 Performance、Network 或对应的 Application 面板确认事实，不要只根据某一次 console 输出推断机制。</p>
<p>跨浏览器或跨页面场景要考虑特性检测、恢复路径和清理时机。只在首次加载事件里写逻辑，往往会漏掉回退、前进、恢复和后台切换等状态。</p>`};export{e as default};