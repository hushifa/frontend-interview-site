var e={answerHtml:`<p><code>scheduler.postTask()</code> 可以把回调放入浏览器任务队列，并提示 <code>user-blocking</code>、<code>user-visible</code> 或 <code>background</code> 等优先级；还可以通过 <code>AbortSignal</code> 取消尚未执行的任务。</p>
<p>优先级只是浏览器调度提示，不会把一个同步长任务拆开。耗时计算仍需拆分、延迟、Worker 或算法优化；大量高优先级任务会挤压渲染和输入响应。</p>
<p>该 API 支持情况和调度细节需要按目标浏览器验证。没有支持时应降级到 <code>setTimeout</code> 或其他调度方式，并保持任务可取消、幂等和生命周期明确。</p>
<h3>复习提示</h3>
<p>回答时沿着页面生命周期、事件循环、渲染和存储边界说明过程。浏览器 API 的支持情况要结合特性检测和目标版本验证，不能只凭开发机现象下结论。可以把“Scheduler API、主线程、性能”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};