var e={answerHtml:`<p>修改样式或 DOM 后，如果立即读取依赖最新布局的属性，浏览器可能被迫同步计算布局。循环中反复“写样式 → 读尺寸”容易产生布局抖动。</p>
<p>优化方向是把读取集中起来，再批量写入；缓存一轮中可以复用的测量值；减少需要测量的元素范围。</p>
<p><code>requestAnimationFrame</code> 有助于协调帧时序，但不会自动消除回调内部的读写交错。应在 Performance 面板观察 Layout 耗时与调用栈，再验证改动。</p>`};export{e as default};