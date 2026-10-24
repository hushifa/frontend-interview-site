var e={answerHtml:`<p>Effect Event 可以让 Effect 中的非响应式事件逻辑读取最新的 props 或 state，同时不因为这些值变化而重新触发外层 Effect。它适合“连接生命周期由 A 决定，但回调执行时需要读取最新 B”的场景。</p>
<p>它不是通用的 <code>useCallback</code>，也不能把真正影响外部系统连接的依赖藏起来。Effect Event 应在 Effect 内或相关事件逻辑中使用，遵循 React 对 Hook 的调用和使用限制。</p>
<p>如果一个 Effect 因依赖变化而重连是业务需要，就不应通过 Effect Event 抑制重连。先区分连接、订阅和事件处理三类逻辑，再决定依赖和清理边界。</p>
<h3>复习提示</h3>
<p>回答时先说明渲染、状态和副作用分别由谁负责，再谈 Hook 或并发机制。具体行为要锁定 React 版本，并说明组件卸载、重复渲染和错误处理等边界。可以把“React、useEffectEvent、Effect”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};