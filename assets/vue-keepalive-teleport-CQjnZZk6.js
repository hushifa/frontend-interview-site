var e={answerHtml:`<p>KeepAlive 缓存组件实例，使切换后能保留状态；可通过 include、exclude 和 max 控制范围与数量。缓存不是免费性能优化，保留的大量实例也会占用内存。</p>
<p>Teleport 改变内容实际挂载到的 DOM 位置，同时保留逻辑组件关系，常用于对话框和提示层。目标容器的存在、SSR 输出位置和样式继承都需要考虑。</p>
<p>被缓存组件要处理 activated 与 deactivated，避免停用后持续轮询。Teleport 不会自动完成对话框的焦点锁定、Escape 关闭或无障碍标注，也不自动消除所有层叠与滚动问题。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://vuejs.org/guide/built-ins/teleport.html">Teleport | Vue.js</a></li>
</ul>
<h3>复习提示</h3>
<p>回答时区分响应式依赖、组件更新和副作用，说明状态的来源与生命周期。涉及编译优化或组合式 API 时要标明 Vue 版本，避免把运行时实现细节当成稳定契约。建议用一个最小示例验证“KeepAlive、Teleport、缓存”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};