var e={answerHtml:`<p>capture 决定是否在捕获阶段接收事件；once 表示监听器最多执行一次后移除；passive 声明监听器不会取消默认行为，在此监听器中调用 preventDefault 不会达到预期的取消效果。</p>
<p>在“addEventListener 的 capture、once、passive 和 signal 有什么作用？”这个问题中，先记录页面生命周期和事件顺序，再用浏览器面板确认资源、渲染和存储状态；回退、恢复和后台切换也要纳入测试。这里的 事件、passive、AbortSignal 不是孤立的 API 名称，而是会共同影响输入、过程和最终结果。</p>
<p>浏览器问题通常同时涉及页面生命周期、事件循环、渲染调度和资源状态。排查时先记录触发顺序和页面可见性，再用 Performance、Network 或对应的 Application 面板确认事实，不要只根据某一次 console 输出推断机制。</p>
<p>signal 可关联 AbortController，调用 abort 时移除监听器，适合统一清理一组生命周期一致的监听。手动 removeEventListener 时，函数引用以及 capture 设置必须匹配，重新创建的匿名函数不是同一个引用。</p>
<p>阻止默认行为和阻止传播是两件事。不要为了修复滚动问题随意调用 stopPropagation，也不要对需要取消滚动的手势监听盲目设置 passive:true。先明确交互意图，再选择事件选项。</p>
<p>跨浏览器或跨页面场景要考虑特性检测、恢复路径和清理时机。只在首次加载事件里写逻辑，往往会漏掉回退、前进、恢复和后台切换等状态。</p>
<p>实际项目里，页面不只有首次打开这一种生命周期。回退恢复、标签页切换、网络变化和窗口失焦都可能让旧状态重新出现；相关逻辑要能重复执行，也要能在页面销毁或状态过期时清理。</p>`};export{e as default};