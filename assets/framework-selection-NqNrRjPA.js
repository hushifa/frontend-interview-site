var e={answerHtml:`<h2>简答</h2>
<ul>
<li>产品形态：内容站点重视首屏 HTML 和 SEO，后台系统重视表单、权限和长时间运行的稳定性，嵌入式组件重视体积和样式隔离。</li>
<li>渲染与部署：需要 SSR 就要有 Node 或边缘运行时；只能静态托管时，要确认框架的静态导出能覆盖所需功能。</li>
<li>关键依赖：组件库、富文本编辑器、图表、国际化、监控 SDK 是否支持目标框架版本。</li>
<li>团队：现有经验、招聘难度、能否独立排查问题。</li>
<li>比较完整方案（UI 库 + 路由 + 数据层 + 构建 + 部署），而不是只比较核心库。</li>
</ul>
<h2>先列出硬约束</h2>
<table><thead><tr><th>约束</th><th>例子</th></tr></thead><tbody><tr><td>部署</td><td>只能用静态托管 / 有 Node 服务 / 边缘函数</td></tr><tr><td>SEO</td><td>是否需要搜索引擎收录、社交分享卡片</td></tr><tr><td>浏览器</td><td>是否要支持旧版 WebView</td></tr><tr><td>集成</td><td>是否要嵌入现有页面或微前端</td></tr><tr><td>合规</td><td>无障碍、数据驻留</td></tr></tbody></table>
<p>不满足硬约束的方案直接排除，避免项目中途才发现部署环境不支持。</p>
<h2>常见组合</h2>
<ul>
<li>内容为主、少量交互：Astro、Next.js / Nuxt 静态导出。</li>
<li>交互密集的后台：React + React Router / TanStack Router，或 Vue + Vue Router，配合组件库。</li>
<li>需要 SSR 和 SEO 的应用：Next.js、Nuxt、SvelteKit、React Router 框架模式。</li>
<li>对包体积敏感：Svelte、Solid、Preact。</li>
</ul>
<p>这些只是起点，最终要用原型验证。</p>
<h2>原型验证什么</h2>
<p>选一条最复杂的真实流程，例如&quot;登录 → 列表筛选 → 编辑表单 → 提交失败重试&quot;，检查：</p>
<ul>
<li>直接打开深层 URL、刷新页面是否正常。</li>
<li>表单失败后输入是否保留，重复提交如何防止。</li>
<li>权限变化后缓存是否失效。</li>
<li>生产构建能否在目标环境部署运行。</li>
<li>在低端设备上的 LCP、INP 和脚本体积。</li>
</ul>
<p>记录测量时的设备、网络和数据量，避免把一次热缓存的结果当成结论。</p>
<h2>渲染方式和框架是两回事</h2>
<p>CSR、SSR、SSG 是交付策略，同一个框架往往支持多种。先决定每类页面需要哪种策略，再看框架能否支持，详见<a href="/questions/render-ssr-ssg/">《CSR、SSR、SSG 和混合渲染如何选择？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>团队熟悉的框架不够好怎么办？比较迁移成本和继续使用的风险，量化后再决定，而不是因为&quot;新&quot;就迁移。</li>
<li>结论怎么写？写成&quot;在当前约束下方案 A 综合成本更低&quot;，并注明哪些条件变化后需要重新评估。</li>
</ul>`};export{e as default};