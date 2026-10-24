var e={answerHtml:`<p>React 的 <code>use</code> 可以在组件中读取 Promise 或 Context。读取未完成的 Promise 会让组件配合 Suspense 等待，读取被拒绝的 Promise 则需要由错误边界或调用链处理。</p>
<p>它与普通 Hook 的调用限制不同，官方文档允许在条件和循环中使用 <code>use</code>，但仍必须在组件或 Hook 的执行上下文中调用，不能放进普通事件处理函数。读取逻辑应保持可预测，避免每次渲染创建永远不同的 Promise。</p>
<p><code>use</code> 不会自动缓存数据，也不会替代框架的数据获取和失效策略。服务端、客户端和不同 React 版本的支持范围要按项目文档核对，不能仅凭名称推断行为。</p>`};export{e as default};