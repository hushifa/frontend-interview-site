var e={answerHtml:`<p>Transition 将某些状态更新标记为可被更紧急更新打断的工作；useDeferredValue 为一个值提供可滞后的版本，适合输入框立即响应而大型结果区稍后更新。它们改变的是更新优先级，不会自动减少网络请求或计算总量。</p>
<p>在“useTransition 和 useDeferredValue 能优化哪些卡顿？”这个问题中，先区分渲染、提交、事件和副作用，再确定状态的唯一来源；订阅、请求和定时器都要在生命周期结束时清理。这里的 并发渲染、Transition、延迟值 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>React 题目需要分清渲染阶段、提交阶段、事件处理和副作用。状态更新可能合并或排队，组件也可能重新渲染多次；不要把“函数执行了一次”直接等同于“页面只更新了一次”。</p>
<p>输入框直接绑定的值通常应保持紧急更新，耗时结果可以使用延迟值。配合 Suspense 时还要设计正在更新的提示，避免用户误以为旧结果是最新结果。</p>
<p>它们不等于 debounce，也不能把任意长同步 JavaScript 循环变成可抢占线程。昂贵的纯计算仍可能需要拆分、缓存或 Worker。异步边界后的 Transition 行为应按当前 React 文档明确标记和处理。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://react.dev/reference/react/useDeferredValue">useDeferredValue – React</a></li>
</ul>
<p>实际设计时先确定状态的唯一来源，再决定是局部状态、Context、外部 store 还是服务端数据。清理订阅、请求和定时器，并用目标 React 版本的文档核对新 API 的约束。</p>
<p>实际组件中，最难排查的通常不是某个 Hook 的语法，而是状态来源重复和副作用没有清理。把服务端数据、用户输入和派生显示值分开，组件会更容易测试，也不容易在重新渲染后产生重复请求。</p>`};export{e as default};