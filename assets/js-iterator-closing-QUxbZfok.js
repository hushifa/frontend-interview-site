var e={answerHtml:`<p>迭代器除了 <code>next()</code>，还可能提供 <code>return()</code>。当 <code>for...of</code> 因 <code>break</code>、异常或其他提前结束路径退出时，语言可以调用这个方法，让生成器或自定义迭代器清理资源。生成器的 <code>finally</code> 通常依赖这种关闭行为执行清理。</p>
<p>如果手动调用 <code>next()</code>，就不能假设循环会替你关闭迭代器；需要根据协议在适当时机调用 <code>return()</code>。自定义迭代器中的清理应保持幂等，并处理 <code>return()</code> 自身抛错的边界。</p>
<p>异步迭代器对应 <code>return()</code> 的异步清理语义，<code>for await...of</code> 还涉及 Promise 和异步异常。迭代器关闭不是取消底层网络请求的通用机制，必要时仍要显式连接 <code>AbortSignal</code>。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。可以把“迭代器、Generator、资源清理”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};