var e={answerHtml:`<p>dialog 用于对话框，showModal 打开模态对话框并进入顶层；Popover API 适合浮层等轻量展示，通过 Popover API 创建的浮层本身是非模态的。二者需要根据交互语义选择。</p>
<p>模态对话框应具有可访问名称、明确关闭方式和合理的初始焦点。关闭后通常恢复触发位置的焦点。顶层可以避免部分层叠上下文问题，但不会替代内容结构、表单校验和键盘体验设计。</p>
<p>需要处理 Escape、背景交互、嵌套浮层与滚动行为，并核对目标浏览器支持情况。不要给任意 div 添加极大 z-index 就认为具备了模态交互，也不要无条件阻断键盘退出。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Popover_API">Popover API - Web APIs | MDN</a></li>
</ul>`};export{e as default};