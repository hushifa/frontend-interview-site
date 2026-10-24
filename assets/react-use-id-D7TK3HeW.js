var e={answerHtml:`<p><code>useId</code> 用于生成组件内部需要关联的 ID，例如 label 与 input、描述文本与控件的 <code>htmlFor</code>/<code>aria-describedby</code>。它能在服务端渲染和客户端 hydration 中保持匹配。</p>
<p>它不是数据库 ID、业务实体 ID，也不适合作为列表 <code>key</code>；列表 key 应来自数据本身。不要把生成的 ID 暴露为跨请求或持久化协议的一部分。</p>
<p>重复使用组件时可以基于一个 ID 拼接多个相关元素，但要保持组件实例之间的隔离。服务端和客户端的组件树结构变化仍可能导致 hydration 问题。</p>
<h3>复习提示</h3>
<p>回答时先说明渲染、状态和副作用分别由谁负责，再谈 Hook 或并发机制。具体行为要锁定 React 版本，并说明组件卸载、重复渲染和错误处理等边界。建议用一个最小示例验证“React、useId、无障碍”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};