var e={answerHtml:`<p>async 函数始终返回 Promise。await 暂停的是当前异步函数后续逻辑，不会阻塞整个线程；等待的 Promise 拒绝时，会在 await 位置抛出异常，可由 try/catch 处理。</p>
<p>彼此独立的任务若逐个 await，会意外串行化。可以先创建多个任务，再使用 Promise.all 等组合；但有速率或资源限制时需要并发池。异常处理要区分可恢复业务错误、取消、网络失败与程序缺陷，避免一律吞掉。</p>
<p>在 try 中需要捕获被返回 Promise 的拒绝时，return await 与直接 return Promise 的错误传播位置不同。finally 中的 return 或 throw 会覆盖先前结果，应尽量避免。对无法取消的 Promise，仅停止等待不代表任务已经停止。</p>
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。建议用一个最小示例验证“async、await、异常”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};