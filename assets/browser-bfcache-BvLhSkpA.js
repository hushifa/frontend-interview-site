var e={answerHtml:`<p>bfcache 保存页面在内存中的快照，包括 DOM 和 JavaScript 堆等状态，用于快速恢复前进、后退导航。HTTP 缓存保存请求响应，重新加载页面时仍可能需要解析和执行，因此两者不是同一种缓存。</p>
<p>页面恢复可能继续使用离开前的内存状态。可在 pageshow 中结合 event.persisted 判断是否从这类页面缓存恢复，再按业务需要刷新过期数据或恢复资源；不要只依赖首次加载事件处理这些事情。</p>
<p>是否进入缓存由浏览器、资源和页面行为共同决定，不能保证每次后退都命中。避免依赖 unload 保存关键数据，并使用对应浏览器的诊断工具查找未恢复原因。登录退出等敏感状态也应在恢复后重新核对。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event">pageshow 事件</a>。</p>`};export{e as default};