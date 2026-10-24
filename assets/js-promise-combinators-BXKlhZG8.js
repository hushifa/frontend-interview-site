var e={answerHtml:`<table><thead><tr><th>方法</th><th>完成条件</th></tr></thead><tbody><tr><td><code>all</code></td><td>全部成功时成功，任意失败就拒绝</td></tr><tr><td><code>allSettled</code></td><td>等全部结束，返回每项的状态和值或原因</td></tr><tr><td><code>race</code></td><td>跟随第一个敲定的 Promise，成功或失败都可以</td></tr><tr><td><code>any</code></td><td>第一个成功即成功，全部失败才以 AggregateError 拒绝</td></tr></tbody></table>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p><code>all</code> 和 <code>allSettled</code> 的结果顺序与输入顺序一致，不是完成顺序。这些方法不会自动取消其他请求；可使用支持 <code>AbortSignal</code> 的 API 主动取消。</p>
<p><strong>边界情况</strong>：空数组传给 <code>all</code>、<code>allSettled</code> 会得到已兑现的 Promise；<code>any</code> 会拒绝；<code>race</code> 会一直待定。兑现后的 <code>.then</code> 仍以微任务执行。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};