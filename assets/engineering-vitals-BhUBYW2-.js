var e={answerHtml:`<ul>
<li><strong>LCP</strong>：最大内容绘制，衡量主要内容的加载体验，良好阈值为不超过 2.5 秒。</li>
<li><strong>INP</strong>：交互到下一次绘制，衡量交互响应性，良好阈值为不超过 200 毫秒。</li>
<li><strong>CLS</strong>：累积布局偏移，衡量视觉稳定性，良好阈值为不超过 0.1。</li>
</ul>
<p>在“LCP、INP、CLS 分别衡量什么？”这个问题中，先比较开发、构建、产物和部署四个阶段，再用锁文件、CI 和实际产物验证工具行为；启动快不代表线上资源成本低。这里的 Core Web Vitals、性能指标 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>工程工具要分别评估开发启动、增量更新、生产构建和部署产物，不能用一个指标代表全部体验。锁文件、Node 版本、构建目标、环境变量和缓存策略应能在 CI 中复现。</p>
<p>评估通常关注真实用户数据的第 75 百分位，并区分移动端与桌面端。实验室测量适合定位问题，不能替代真实访问条件下的数据。</p>
<p>优化示例：优先加载首屏关键图像、拆分主线程长任务、为图片和异步内容预留空间。</p>
<h2>指标实现参考</h2>
<p>本次对照 GoogleChrome 官方 web-vitals 实现中的阈值常量：</p>
<ul>
<li><a href="https://raw.githubusercontent.com/GoogleChrome/web-vitals/main/src/onLCP.ts">LCP 阈值定义</a></li>
<li><a href="https://raw.githubusercontent.com/GoogleChrome/web-vitals/main/src/onINP.ts">INP 阈值定义</a></li>
<li><a href="https://raw.githubusercontent.com/GoogleChrome/web-vitals/main/src/onCLS.ts">CLS 阈值定义</a></li>
</ul>
<p>升级工具时先看迁移说明和产物差异，再在真实项目中验证插件、Source Map、代码分割和失败日志。把配置写进仓库，才能让本地和发布环境得到同一套结果。</p>
<p>实际工程问题最好从产物和日志开始验证：看依赖是否锁定、构建是否可复现、代码是否被正确分包、失败是否能定位到具体步骤。开发服务器的速度不能代表最终页面的下载和执行成本。</p>`};export{e as default};