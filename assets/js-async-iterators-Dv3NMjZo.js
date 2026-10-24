var e={answerHtml:`<p>异步迭代器让数据源按需提供 Promise 结果，<code>for await...of</code> 可以顺序消费异步生成器、ReadableStream 包装器或分页数据。它适合把“下一块数据”建模成可等待的迭代过程。</p>
<p>顺序消费不等于并发消费；如果每项处理可以并行，需要显式设置并发上限。循环提前退出或抛错时，应确认底层迭代器是否执行 <code>return()</code> 并释放连接、定时器或读取器。</p>
<p>取消通常需要额外的 <code>AbortSignal</code> 或数据源协议。异步迭代器不会自动停止服务器任务，也不能保证网络流已经被服务端取消。</p>`};export{e as default};