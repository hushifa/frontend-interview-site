var e={answerHtml:`<p>Observable 适合表达可能多次产生值的异步流、取消和组合；Signal 更适合组件模板读取的同步响应式状态。把 Observable 转成 Signal 可以让模板直接读取，但要明确订阅何时建立、何时销毁以及错误如何传播。</p>
<p><code>toSignal</code> 等互操作工具不能消除流和状态之间的语义差异。高频流、共享订阅、初始值、同步发射和完成状态都要按业务决定，不能把所有异步数据都转换成全局 Signal。</p>
<p>Angular 的注入上下文和组件生命周期会影响互操作 API 的使用。订阅、effect 和资源清理要保持在明确的生命周期中，避免在服务端渲染或测试环境中产生意外副作用。</p>`};export{e as default};