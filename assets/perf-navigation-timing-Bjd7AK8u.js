var e={answerHtml:`<p>PerformanceNavigationTiming 记录一次文档导航的网络和生命周期时间点，例如 responseStart、domContentLoadedEventEnd、loadEventEnd。通过相应差值可以分析阶段耗时，但要先确认字段何时完成、是否受到跨源和其他环境限制。</p>
<p>DOMContentLoaded 不是“所有内容已显示”，load 也不是“所有业务请求都完成且交互流畅”。客户端渲染、延后加载和后续长任务都可能发生在这些事件之外。读取太早时，某些尚未发生的时间点还可能是零。</p>
<p>应结合内容绘制、交互指标和具体业务埋点判断体验。普通 SPA 路由切换不会自动成为新的文档导航记录，不能把首个 navigation entry 反复当成每次路由的加载耗时。</p>
<h3>复习提示</h3>
<p>回答时先定义用户感知指标和测量场景，再定位网络、脚本、布局、绘制或内存中的瓶颈。优化前后要使用同一条件对比，避免把单次开发机结果当成真实用户结论。建议用一个最小示例验证“Navigation Timing、DOMContentLoaded、load”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};