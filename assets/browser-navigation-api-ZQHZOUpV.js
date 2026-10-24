var e={answerHtml:`<p>Navigation API 为浏览器导航提供更统一的事件和 entry 模型，可以观察、拦截和处理同文档导航，并减少手动拼接 <code>pushState</code>、<code>popstate</code> 和滚动恢复逻辑。</p>
<p>拦截导航时要区分同文档和跨文档行为，处理异步加载、取消、错误和用户后退。导航 API 不会自动解决数据缓存、权限、焦点、滚动位置和页面离开确认。</p>
<p>它的浏览器支持和框架集成仍需按目标环境核对。生产项目应保留 History API 或框架路由的降级路径，不能只因为 API 更现代就替换现有导航系统。</p>`};export{e as default};