var e={answerHtml:`<p>Solid signal 通常通过 getter 和 setter 表达响应式状态；读取 signal 的计算或副作用会建立依赖，写入时只触发依赖它的细粒度节点。它与 React 组件函数重新执行、再由协调过程决定更新的模型不同。</p>
<p>细粒度并不意味着所有代码自动高效。依赖图、派生计算、异步状态、列表 key 和副作用清理仍需要清晰设计。把 signal 读写放在不受追踪的普通函数中，也可能导致依赖没有建立。</p>
<p>跨框架迁移时要重新理解状态生命周期和批处理规则，不能把 React Hook、Vue ref 或 Solid signal 的 API 形状当成相同语义。</p>`};export{e as default};