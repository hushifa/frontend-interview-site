var e={answerHtml:`<p>Dedicated Worker 通常只服务创建它的页面；SharedWorker 可以被同源的多个窗口或标签页连接，Worker 通过 <code>MessagePort</code> 区分不同连接。它适合多个页面共享一个轮询、缓存协调或长任务调度器。</p>
<p>共享连接意味着必须设计端口加入、退出、异常和页面全部关闭时的清理。不能假设某个页面一直存在，也不能把 Worker 里的内存当成永久存储；需要持久化的数据仍要写入合适的存储。</p>
<p>不同浏览器对 SharedWorker 的支持和调试体验存在差异。若目标环境不稳定，应准备 BroadcastChannel、Service Worker 或服务端同步的降级方案。</p>`};export{e as default};