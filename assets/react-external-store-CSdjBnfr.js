var e={answerHtml:`<p>useSyncExternalStore 用于订阅 React 外部的数据源。subscribe 接收变化通知回调并返回清理函数；getSnapshot 返回组件要读取的当前快照。数据没变时，多次读取应返回同一个值，而不是每次都新建对象。</p>
<p>React 使用 Object.is 判断快照变化。对于可变外部数据，应在真正变化时生成不可变快照，否则返回缓存结果。subscribe 身份不断变化还会导致重新订阅，可将稳定实现放在组件外，或按必要依赖维护。</p>
<p>服务端渲染时还需要 getServerSnapshot，并确保客户端 hydration 使用与服务端一致的初始快照。它解决外部订阅与 React 渲染的一致性问题，不意味着外部 store 的任意更新都能成为非阻塞 Transition，也不替代 store 自身的数据正确性设计。</p>
<h3>复习提示</h3>
<p>回答时先说明渲染、状态和副作用分别由谁负责，再谈 Hook 或并发机制。具体行为要锁定 React 版本，并说明组件卸载、重复渲染和错误处理等边界。建议用一个最小示例验证“外部状态、订阅、快照一致性”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};