var e={answerHtml:`<p><code>z-index</code> 的比较受层叠上下文约束。子元素的巨大 z-index 不能越过父级所在上下文与外部兄弟上下文的排序关系。</p>
<p>定位元素配合非 auto 的 z-index、transform、opacity 小于 1、isolation 等都可能创建层叠上下文，具体条件应查阅规范。</p>
<p>排查时从被遮挡元素向上检查祖先上下文。弹层可以考虑移至合适的 DOM 层级，或使用 dialog、Popover 等支持 top layer 的原生机制；同时处理焦点、遮罩与关闭交互。</p>`};export{e as default};