var e={answerHtml:`<ul>
<li><code>memo</code> 尝试在 props 未变化时跳过父组件引起的重复渲染；组件自己的状态和所订阅的 context 仍可触发更新。</li>
<li><code>useMemo</code> 缓存计算结果。</li>
<li><code>useCallback</code> 缓存函数引用，常用于配合 memo 子组件或稳定依赖。</li>
</ul>
<p>它们属于性能优化，不能成为业务正确性的前提。每次新建的对象或函数会破坏基于引用相等的比较。先通过 React DevTools Profiler 定位瓶颈，再判断缓存是否值得。</p>
<p>启用 React Compiler 的项目可能由编译器自动处理许多记忆化场景，但仍应按项目实际配置和测量结果判断。</p>
<h3>复习提示</h3>
<p>回答时先说明渲染、状态和副作用分别由谁负责，再谈 Hook 或并发机制。具体行为要锁定 React 版本，并说明组件卸载、重复渲染和错误处理等边界。可以把“性能、缓存、React Compiler”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};