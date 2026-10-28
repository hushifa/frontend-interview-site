var e={answerHtml:`<h2>简答</h2>
<p>Astro 默认把页面渲染为纯 HTML，不发送 JavaScript；只有带 client:* 指令的组件会成为“岛屿”，在客户端单独激活。client:load 立即激活，client:idle 在浏览器空闲时激活，client:visible 在进入视口时激活。岛屿之间相互独立，可以使用不同框架。它适合内容为主的站点，交互密集的应用收益有限。</p>
<h2>页面不需要整棵客户端应用</h2>
<p>文章标题、正文、图片和目录通常只需要 HTML；搜索框、收藏按钮、图表和编辑器才需要状态、事件和浏览器 API。如果整页交给 React 或 Vue 接管，用户为了阅读正文也要下载、解析和执行整套客户端运行时。</p>
<p>Astro Islands 的思路是先交付 HTML，再把交互区域作为独立岛加载和 hydration。减少 JavaScript 的关键是交互边界明确，而不是简单给大型 SPA 的每个区域改一个名字。</p>
<h2>没有客户端指令的组件只负责输出</h2>
<div class="not-prose code-block"><div class="code-language">astro</div><pre><code class="hljs language-astro">---
import SearchBox from &#x27;../components/SearchBox.jsx&#x27;;
import Chart from &#x27;../components/Chart.jsx&#x27;;
---

&lt;main&gt;
  &lt;h1&gt;前端学习资料&lt;/h1&gt;
  &lt;p&gt;正文直接输出为 HTML，不需要客户端状态。&lt;/p&gt;
  &lt;SearchBox client:load /&gt;
  &lt;Chart client:visible /&gt;
&lt;/main&gt;
</code></pre></div>
<p><code>client:load</code> 让 SearchBox 在页面加载阶段准备交互；<code>client:visible</code> 让图表接近可见区域时再加载。正文不需要等 React 重建才能显示。项目仍需配置对应框架集成，<code>.astro</code> 的前置脚本也不是浏览器里会随点击执行的组件状态代码。</p>
<h2>激活时机决定首次操作体验</h2>
<p><code>client:load</code> 适合页面一打开就要操作的控件；<code>client:idle</code> 适合低优先级交互；<code>client:visible</code> 适合下方图表或评论；<code>client:media</code> 适合只在某类屏幕出现的功能。它们通常可以先显示服务端 HTML，再等待客户端代码接管。</p>
<p>用户可能在 hydration 前点击一个按钮。可通过原生链接、禁用态、预取或轻量脚本保证行为可理解，不能把“看得见”误认为“已经可交互”。关键搜索、提交和首屏控制延后太久，会把节省的初始脚本变成第一次点击等待。</p>
<p><code>client:only</code> 跳过该组件的服务端 HTML，适合确实依赖浏览器 API 或无法 SSR 的组件，但首屏内容、SEO 和等待体验会不同，必要时提供 fallback。</p>
<h2>岛之间不会自动共享 Context</h2>
<p>两个独立的 React 岛不能直接共享同一个 Context Provider。购物车、筛选条件和登录状态需要通过明确的外部状态、事件、URL、存储或服务端数据协调，并处理订阅、销毁和竞态。</p>
<p>交互高度耦合的区域合并成一个岛可能更容易维护；只有一个小按钮需要状态时，把整页包成大岛又会失去架构收益。跨岛 props 必须符合序列化边界，服务端函数、复杂实例和秘密不能直接传给浏览器。</p>
<h2>多框架和大组件仍有运行时成本</h2>
<p>Astro 可以集成 React、Vue、Svelte 等框架，但每种运行时、图表库、编辑器和状态库都可能增加下载与执行。构建器可能共享部分依赖，不能假设混用完全免费。应查看真实 chunk 和请求瀑布，确认多个岛是否重复引入大型依赖。</p>
<p>一个大编辑器作为独立岛仍然可能很重，只是它的成本不再阻塞文章正文。必要时还要在岛内部继续懒加载、虚拟化和分片。</p>
<h2>客户端岛和服务端动态区域是两件事</h2>
<p>客户端岛解决“哪些区域需要浏览器交互、何时激活”；服务端动态岛或延后服务端渲染解决的是另一类数据交付问题，需要服务端运行时。纯静态托管只能使用预渲染内容或外部 API，不能因为页面大部分是静态 HTML 就获得任意服务端能力。</p>
<p>验收时要同时看首屏 HTML、关键交互可用时间、岛的激活等待、多个框架的总脚本和深链接刷新。内容占多数、交互局部化的站点最容易获得收益；整页都是连续共享状态的编辑器，应比较完整客户端应用的管理成本。</p>`};export{e as default};