var e={answerHtml:`<p>Vue Suspense 可以在异步组件或异步 <code>setup()</code> 准备期间显示 fallback，并在依赖完成后渲染默认内容。它更适合表达组件树级别的等待边界，不会自动把任意事件回调里的请求变成 Suspense 状态。</p>
<p>异步组件失败、超时、重试和局部错误仍需错误处理策略；fallback 也不能把用户正在编辑的内容重置。嵌套 Suspense 和路由切换要明确哪个边界负责显示加载状态。</p>
<p>该能力与 Vue 版本和框架集成有关。实际使用要核对 SSR、hydration、异步依赖和当前版本的实验性说明。</p>`};export{e as default};