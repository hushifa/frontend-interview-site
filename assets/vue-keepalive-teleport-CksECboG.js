var e={answerHtml:`<p>KeepAlive 缓存组件实例，使切换后能保留状态；可通过 include、exclude 和 max 控制范围与数量。缓存不是免费性能优化，保留的大量实例也会占用内存。</p>
<p>Teleport 改变内容实际挂载到的 DOM 位置，同时保留逻辑组件关系，常用于对话框和提示层。目标容器的存在、SSR 输出位置和样式继承都需要考虑。</p>
<p>被缓存组件要处理 activated 与 deactivated，避免停用后持续轮询。Teleport 不会自动完成对话框的焦点锁定、Escape 关闭或无障碍标注，也不自动消除所有层叠与滚动问题。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://vuejs.org/guide/built-ins/teleport.html">Teleport | Vue.js</a></li>
</ul>`};export{e as default};