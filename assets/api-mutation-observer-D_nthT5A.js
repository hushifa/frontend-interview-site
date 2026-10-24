var e={answerHtml:`<p>MutationObserver 观察 DOM 结构、属性或文本等变化，ResizeObserver 关注元素尺寸变化。样式或窗口变化可能改变尺寸却不直接改变被观察的 DOM 属性，因此两者不能互相替代。</p>
<p>注册时应限制 childList、attributes、characterData、subtree 等范围，避免为了一个局部需求观察整个页面并在回调中进行大量处理。收到的是变更记录，需要根据业务筛选。</p>
<p>回调再修改相同 DOM 可能引起新一轮通知，应明确去重和更新边界。断开观察前若有必须处理的待处理记录，可研究 takeRecords 的使用；但不要把观察器当成框架正常状态流的替代品。</p>`};export{e as default};