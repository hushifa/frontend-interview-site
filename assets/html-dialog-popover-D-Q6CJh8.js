var e={answerHtml:`<p>dialog 用于对话框，showModal 打开模态对话框并进入顶层；Popover API 适合浮层等轻量展示，通过 Popover API 创建的浮层本身是非模态的。二者需要根据交互语义选择。</p>
<p>模态对话框应具有可访问名称、明确关闭方式和合理的初始焦点。关闭后通常恢复触发位置的焦点。顶层可以避免部分层叠上下文问题，但不会替代内容结构、表单校验和键盘体验设计。</p>
<p>需要处理 Escape、背景交互、嵌套浮层与滚动行为，并核对目标浏览器支持情况。不要给任意 div 添加极大 z-index 就认为具备了模态交互，也不要无条件阻断键盘退出。</p>
<h2>补充参考</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Popover_API">Popover API - Web APIs | MDN</a></li>
</ul>
<h3>复习提示</h3>
<p>回答时先区分 HTML 语义、CSS 规则和浏览器默认行为，再说明结构、样式与交互之间的影响。涉及兼容性时给出目标浏览器范围，不把某个浏览器的现象当成规范结论。建议用一个最小示例验证“dialog、popover、顶层元素”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};