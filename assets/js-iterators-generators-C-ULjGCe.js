var e={answerHtml:`<p>迭代器通过 next() 返回包含 value 与 done 的对象。可迭代对象提供 Symbol.iterator 方法，其返回值是迭代器，因此可以用于 for...of、展开语法等。两种协议相关但不相同，普通对象默认不一定可迭代。</p>
<p>Generator 函数调用后返回生成器对象，执行到 yield 暂停，后续 next 恢复，方便表达惰性序列和可暂停流程。异步迭代使用 Symbol.asyncIterator，可通过 for await...of 消费异步产生的数据。</p>
<p>处理大数据或流时，惰性迭代可以减少一次性分配，但消费者仍可能把全部结果收集进数组。提前退出时要考虑迭代器 return() 清理资源，不应把 Generator 自动等同于线程或并行执行。</p>`};export{e as default};