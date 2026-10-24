var e={answerHtml:`<p>KeepAlive 缓存组件实例，使切换后能保留状态；可通过 include、exclude 和 max 控制范围与数量。缓存不是免费性能优化，保留的大量实例也会占用内存。</p>
<p>在“KeepAlive 与 Teleport 有哪些使用边界？”这个问题中，先画出响应式数据的来源、修改位置和派生关系，再检查更新调度和组件生命周期；不要用多个 watch 互相同步同一事实。这里的 KeepAlive、Teleport、缓存 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>Vue 题目可以沿着依赖收集、更新调度、组件渲染和副作用生命周期来理解。响应式引用记录的是读取关系，不代表所有嵌套对象都会以同样方式被追踪；具体行为还取决于使用的 API 和 Vue 版本。</p>
<p>Teleport 改变内容实际挂载到的 DOM 位置，同时保留逻辑组件关系，常用于对话框和提示层。目标容器的存在、SSR 输出位置和样式继承都需要考虑。</p>
<p>被缓存组件要处理 activated 与 deactivated，避免停用后持续轮询。Teleport 不会自动完成对话框的焦点锁定、Escape 关闭或无障碍标注，也不自动消除所有层叠与滚动问题。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://vuejs.org/guide/built-ins/teleport.html">Teleport | Vue.js</a></li>
</ul>
<p>落地时把派生状态、用户输入和副作用分开，避免用一个 watch 或可写变量反复同步同一事实。组件卸载、异步竞态、SSR 和第三方 DOM 操作都需要单独验证。</p>
<p>实际组件中，先画出数据从哪里来、在哪里被修改、哪些值只是派生结果。这样可以避免把同一份数据同时交给 props、ref、store 和 watch，减少更新顺序变化后出现的互相覆盖。</p>`};export{e as default};