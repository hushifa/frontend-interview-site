var e={answerHtml:`<ul>
<li><strong>LCP</strong>：最大内容绘制，衡量主要内容的加载体验，良好阈值为不超过 2.5 秒。</li>
<li><strong>INP</strong>：交互到下一次绘制，衡量交互响应性，良好阈值为不超过 200 毫秒。</li>
<li><strong>CLS</strong>：累积布局偏移，衡量视觉稳定性，良好阈值为不超过 0.1。</li>
</ul>
<p>评估通常关注真实用户数据的第 75 百分位，并区分移动端与桌面端。实验室测量适合定位问题，不能替代真实访问条件下的数据。</p>
<p>优化示例：优先加载首屏关键图像、拆分主线程长任务、为图片和异步内容预留空间。</p>
<h2>指标实现参考</h2>
<p>本次对照 GoogleChrome 官方 web-vitals 实现中的阈值常量：</p>
<ul>
<li><a href="https://raw.githubusercontent.com/GoogleChrome/web-vitals/main/src/onLCP.ts">LCP 阈值定义</a></li>
<li><a href="https://raw.githubusercontent.com/GoogleChrome/web-vitals/main/src/onINP.ts">INP 阈值定义</a></li>
<li><a href="https://raw.githubusercontent.com/GoogleChrome/web-vitals/main/src/onCLS.ts">CLS 阈值定义</a></li>
</ul>
<h3>复习提示</h3>
<p>回答时把开发体验、构建产物和生产运行时分开衡量。工具选型要说明版本、配置、缓存和回滚方式，并用构建结果或日志验证，而不是只依据启动速度判断。建议用一个最小示例验证“Core Web Vitals、性能指标”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};