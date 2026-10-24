var e={answerHtml:`<p>capture 决定是否在捕获阶段接收事件；once 表示监听器最多执行一次后移除；passive 声明监听器不会取消默认行为，在此监听器中调用 preventDefault 不会达到预期的取消效果。</p>
<p>signal 可关联 AbortController，调用 abort 时移除监听器，适合统一清理一组生命周期一致的监听。手动 removeEventListener 时，函数引用以及 capture 设置必须匹配，重新创建的匿名函数不是同一个引用。</p>
<p>阻止默认行为和阻止传播是两件事。不要为了修复滚动问题随意调用 stopPropagation，也不要对需要取消滚动的手势监听盲目设置 passive:true。先明确交互意图，再选择事件选项。</p>
<h3>复习提示</h3>
<p>回答时沿着页面生命周期、事件循环、渲染和存储边界说明过程。浏览器 API 的支持情况要结合特性检测和目标版本验证，不能只凭开发机现象下结论。建议用一个最小示例验证“事件、passive、AbortSignal”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};