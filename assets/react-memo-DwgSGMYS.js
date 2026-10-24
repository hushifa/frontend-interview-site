var e={answerHtml:`<ul>
<li><code>memo</code> 尝试在 props 未变化时跳过父组件引起的重复渲染；组件自己的状态和所订阅的 context 仍可触发更新。</li>
<li><code>useMemo</code> 缓存计算结果。</li>
<li><code>useCallback</code> 缓存函数引用，常用于配合 memo 子组件或稳定依赖。</li>
</ul>
<p>它们属于性能优化，不能成为业务正确性的前提。每次新建的对象或函数会破坏基于引用相等的比较。先通过 React DevTools Profiler 定位瓶颈，再判断缓存是否值得。</p>
<p>启用 React Compiler 的项目可能由编译器自动处理许多记忆化场景，但仍应按项目实际配置和测量结果判断。</p>
<h3>组件层面的落地</h3>
<p>React 题目需要分清渲染阶段、提交阶段、事件处理和副作用。状态更新可能合并或排队，组件也可能重新渲染多次；不要把“函数执行了一次”直接等同于“页面只更新了一次”。</p>
<p>实际设计时先确定状态的唯一来源，再决定是局部状态、Context、外部 store 还是服务端数据。清理订阅、请求和定时器，并用目标 React 版本的文档核对新 API 的约束。</p>`};export{e as default};