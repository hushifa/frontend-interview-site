var e={answerHtml:`<p>font-display 是 @font-face 的描述符，控制字体尚未就绪时的显示策略。block 有较短的阻塞期和无限交换期；swap 的阻塞期极短，之后允许交换；fallback 只有较短交换期；optional 没有交换期。具体时长不应写成跨浏览器固定的毫秒数。</p>
<p>swap 能尽早显示回退字体，但自定义字体替换后，字宽和行高差异可能造成布局偏移。optional 更倾向于避免迟来的替换，代价是本次展示可能一直使用回退字体。应根据正文可读性、品牌要求和实际网络条件选择。</p>
<p>需要协调绘制或测量时，可以使用 CSS Font Loading API 观察字体加载；它不代替字体子集、合适的回退字体及性能测量。不要为所有字体无差别 preload，否则可能挤占关键资源。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API">CSS Font Loading API</a>。</p>
<h3>复习提示</h3>
<p>回答时先区分 HTML 语义、CSS 规则和浏览器默认行为，再说明结构、样式与交互之间的影响。涉及兼容性时给出目标浏览器范围，不把某个浏览器的现象当成规范结论。建议用一个最小示例验证“字体、font-display、布局偏移”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};