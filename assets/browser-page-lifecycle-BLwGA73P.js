var e={answerHtml:`<p>浏览器通常会对后台页面的计时器进行节流，并暂停或减少 requestAnimationFrame 回调，以节约资源。具体策略会受浏览器、设备和页面状态影响，不能依赖固定的后台执行频率。</p>
<p>Page Visibility API 通过 document.visibilityState 和 visibilitychange 通知页面是否隐藏，可用于暂停非必要轮询、动画或统计。页面重新显示后，应根据实际时间和最新数据恢复，而不是假设每个定时回调都执行过。</p>
<p>倒计时应根据目标时间戳计算剩余时间，而不是每次回调减一。隐藏也不等于彻底关闭；涉及未保存数据或会话恢复时，还需结合具体生命周期和持久化策略。</p>`};export{e as default};