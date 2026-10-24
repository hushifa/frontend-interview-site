var e={answerHtml:`<p>Web Audio 使用音频节点图表达音源、处理与输出之间的连接。AudioContext 管理相关音频处理环境，音源可以经过增益、滤波等节点后连接到输出，不需要把全部处理写成 JavaScript 定时循环。</p>
<p>音频调度应理解音频时钟与页面计时器的差异，不能用 setTimeout 的触发精度保证音乐节拍。自动播放和设备策略可能使上下文处于暂停状态，通常应在用户明确交互后启用或恢复。</p>
<p>不再使用时应停止音源、断开不必要连接并按需要释放上下文资源。音量、听觉安全和可访问的播放控制同样重要。复杂低延迟处理可进一步研究 AudioWorklet，但它不等于可以在任意线程访问页面 DOM。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay">自动播放与 Web Audio</a>。</p>
<h3>复习提示</h3>
<p>回答时说明 API 的输入、生命周期、取消或错误路径，并给出资源清理方式。涉及权限、设备或用户手势时，要把安全上下文、授权结果和降级方案一起说明。建议用一个最小示例验证“Web Audio、AudioContext、音频节点”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};