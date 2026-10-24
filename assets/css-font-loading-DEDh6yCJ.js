var e={answerHtml:`<p>font-display 是 @font-face 的描述符，控制字体尚未就绪时的显示策略。block 有较短的阻塞期和无限交换期；swap 的阻塞期极短，之后允许交换；fallback 只有较短交换期；optional 没有交换期。具体时长不应写成跨浏览器固定的毫秒数。</p>
<p>swap 能尽早显示回退字体，但自定义字体替换后，字宽和行高差异可能造成布局偏移。optional 更倾向于避免迟来的替换，代价是本次展示可能一直使用回退字体。应根据正文可读性、品牌要求和实际网络条件选择。</p>
<p>需要协调绘制或测量时，可以使用 CSS Font Loading API 观察字体加载；它不代替字体子集、合适的回退字体及性能测量。不要为所有字体无差别 preload，否则可能挤占关键资源。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/CSS_Font_Loading_API">CSS Font Loading API</a>。</p>`};export{e as default};