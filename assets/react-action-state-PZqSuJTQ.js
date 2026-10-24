var e={answerHtml:`<p>useActionState 返回当前状态、触发 Action 的函数和 pending 标记。传入的处理函数先接收上一次状态，再接收本次载荷，返回值成为新的状态；它可以执行异步操作，不同于必须保持纯计算的 useReducer reducer。</p>
<p>触发函数应在 Action 上下文中调用，例如传给表单的 action 属性或放在 startTransition 中。当前官方文档说明，同一 Hook 的多次触发会排队执行，后一次接收前一次的结果，不能把它想成任意并发请求的聚合器。</p>
<p>可预期的校验失败可以作为状态返回并显示；抛出的异常需要考虑 Error Boundary 的处理。该 Hook 不自动提供服务端，也不要求所有 Action 都是 Server Function。涉及渐进增强的 permalink 用法则有额外的框架和表单一致性条件，应按所用 React 版本文档核对。</p>
<h3>组件层面的落地</h3>
<p>React 题目需要分清渲染阶段、提交阶段、事件处理和副作用。状态更新可能合并或排队，组件也可能重新渲染多次；不要把“函数执行了一次”直接等同于“页面只更新了一次”。</p>
<p>实际设计时先确定状态的唯一来源，再决定是局部状态、Context、外部 store 还是服务端数据。清理订阅、请求和定时器，并用目标 React 版本的文档核对新 API 的约束。</p>`};export{e as default};