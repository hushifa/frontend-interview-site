var e={answerHtml:`<p>transition 适合状态间的过渡，animation 适合关键帧序列，requestAnimationFrame 适合需要 JavaScript 持续计算的逐帧动画。rAF 与浏览器绘制调度协作，但不保证固定 60 次每秒，也不应使用帧数代替真实时间。</p>
<p>transform 和 opacity 常能避免部分布局工作，但是否在合成阶段处理取决于页面与浏览器，不能保证零成本。过多合成层和过大纹理也会消耗内存。will-change 只应在确有需要时有限使用。</p>
<p>尊重减少动画偏好，动画结束与取消都要清理状态。交互反馈应优先快速可理解，而不是为了视觉效果增加长时间不可操作的过渡。</p>`};export{e as default};