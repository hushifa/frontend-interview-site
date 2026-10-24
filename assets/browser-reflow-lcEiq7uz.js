var e={answerHtml:`<p>修改样式或 DOM 后，如果立即读取依赖最新布局的属性，浏览器可能被迫同步计算布局。循环中反复“写样式 → 读尺寸”容易产生布局抖动。</p>
<p>优化方向是把读取集中起来，再批量写入；缓存一轮中可以复用的测量值；减少需要测量的元素范围。</p>
<p><code>requestAnimationFrame</code> 有助于协调帧时序，但不会自动消除回调内部的读写交错。应在 Performance 面板观察 Layout 耗时与调用栈，再验证改动。</p>
<p>会触发布局的读取包括 <code>offsetWidth</code>、<code>getBoundingClientRect()</code> 和部分计算样式读取；具体成本取决于浏览器当前是否已有有效布局。写入 class 或 style 后连续读取，容易让浏览器立刻完成布局。常见做法是先收集所有尺寸，再在下一阶段批量更新样式。</p>
<p>减少 DOM 层级、限制影响范围、使用 transform 做合成动画也有帮助，但 transform 不能替代真正需要布局的尺寸变化。最终要用实际设备和真实交互验证，而不是只比较脚本执行时间。</p>`};export{e as default};