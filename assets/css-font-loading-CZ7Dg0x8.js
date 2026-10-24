var e={answerHtml:`<p>font-display 是 @font-face 的描述符，控制字体尚未就绪时的显示策略。block 有较短的阻塞期和无限交换期；swap 的阻塞期极短，之后允许交换；fallback 只有较短交换期；optional 没有交换期。具体时长不应写成跨浏览器固定的毫秒数。</p>
<p>swap 能尽早显示回退字体，但自定义字体替换后，字宽和行高差异可能造成布局偏移。optional 更倾向于避免迟来的替换，代价是本次展示可能一直使用回退字体。应根据正文可读性、品牌要求和实际网络条件选择。</p>
<p>需要协调绘制或测量时，可以使用 CSS Font Loading API 观察字体加载；它不代替字体子集、合适的回退字体及性能测量。不要为所有字体无差别 preload，否则可能挤占关键资源。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API">CSS Font Loading API</a>。</p>
<h3>实现检查</h3>
<p>实际排查时先看语义结构和布局上下文，再查看计算后的样式、盒模型、层叠来源和绘制结果。把视觉问题拆成结构、尺寸、定位和绘制几步，通常比反复修改一个 CSS 属性更容易定位原因。</p>
<p>交付前还要检查键盘操作、响应式断点、文本放大、打印和减少动画偏好。兼容性结论应以目标浏览器和特性检测为前提，不要把某个浏览器的偶发现象当成通用规则。</p>`};export{e as default};