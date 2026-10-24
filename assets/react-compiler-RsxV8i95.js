var e={answerHtml:`<p>React Compiler 试图根据组件代码自动进行部分记忆化，减少不必要的重新计算和渲染。它依赖对组件和 Hook 规则的正确遵守，不能把有副作用的任意函数当成纯计算处理。</p>
<p>编译器不是“开启后所有页面都变快”。不稳定的 key、错误的 Effect、过大的渲染范围、网络请求和 DOM 布局问题仍要单独诊断。使用时要查看编译器日志、处理不兼容代码，并按项目版本核对配置。</p>
<p>手写 <code>useMemo</code>、<code>useCallback</code> 也不应为了“配合编译器”到处添加。先根据用户可见性能和 Profiler/指标决定优化，再确认编译器是否已经覆盖该场景。</p>`};export{e as default};