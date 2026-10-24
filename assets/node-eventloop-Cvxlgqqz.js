var e={answerHtml:`<p>不能。Node.js 有由 libuv 等机制支持的事件循环阶段，例如 timers、poll 和 check；浏览器还要协调页面渲染及自己的任务来源。两者都使用 JavaScript，但宿主调度机制并不相同。</p>
<p>process.nextTick 队列不是一个普通事件循环阶段。持续递归排入任务可能阻碍 I/O 获得执行机会。setImmediate 与 setTimeout 的相对时序依赖调用上下文，不能只用一个顶层示例推广到所有情况。</p>
<p>Node 版本变化也可能调整部分阶段时机。讨论输出顺序时，应明确 Node 版本、CommonJS 或 ESM 环境，以及代码是否从 I/O 回调中执行。CPU 密集型同步计算仍会阻塞主事件循环。</p>`};export{e as default};