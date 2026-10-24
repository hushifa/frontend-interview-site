var e={answerHtml:`<p><code>ref</code> 可以包装原始值或对象，JavaScript 中通过 <code>.value</code> 读写；对象值通常会转换为深层响应式对象。<code>reactive</code> 返回对象的响应式 Proxy，不能直接用于数字、字符串等原始值。</p>
<p>从 <code>reactive</code> 对象解构原始值，会得到当时的普通值，失去与原属性的响应式连接；需要保持连接时可以使用 <code>toRef</code> 或 <code>toRefs</code>。</p>
<p>替换整个对象时，<code>ref.value = newObject</code> 更直接。模板中 ref 的自动解包有适用条件，数组、集合和嵌套位置不能一概而论。</p>
<h3>组件层面的落地</h3>
<p>Vue 题目可以沿着依赖收集、更新调度、组件渲染和副作用生命周期来理解。响应式引用记录的是读取关系，不代表所有嵌套对象都会以同样方式被追踪；具体行为还取决于使用的 API 和 Vue 版本。</p>
<p>落地时把派生状态、用户输入和副作用分开，避免用一个 watch 或可写变量反复同步同一事实。组件卸载、异步竞态、SSR 和第三方 DOM 操作都需要单独验证。</p>`};export{e as default};