var e={answerHtml:`<p>Context 让组件读取祖先提供的值，适合主题、语言和有明确共享范围的状态。useReducer 用 reducer 描述动作到下一状态的转换，适合更新规则较复杂、需要集中表达业务动作的场景。</p>
<p>Context 值改变会影响读取该 Context 的消费者，memo 不会阻止消费者接收新的 Context。把所有状态放在一个巨大对象中，可能让无关消费者频繁更新；可以按变化频率与职责拆分提供者。</p>
<p>reducer 应保持纯函数，不在里面发请求或修改外部状态。服务端请求缓存、跨标签页同步和高频外部数据等需求，可能更适合专门的状态工具。先明确状态所有权，再决定是否需要全局存储。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://react.dev/reference/react/useContext">useContext – React</a></li>
</ul>
<h3>复习提示</h3>
<p>回答时先说明渲染、状态和副作用分别由谁负责，再谈 Hook 或并发机制。具体行为要锁定 React 版本，并说明组件卸载、重复渲染和错误处理等边界。建议用一个最小示例验证“Context、useReducer、状态管理”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};