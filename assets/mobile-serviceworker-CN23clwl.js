var e={answerHtml:`<p>Service Worker 有独立生命周期，注册后经历安装、等待和激活等过程，并不保证注册成功后立即控制当前页面。新版本等待旧页面释放控制是正常机制，不能把它误判为没有更新。</p>
<p>在 install 中准备资源、在 activate 中清理过期缓存时，应使用事件提供的等待机制保证必要工作完成。fetch 处理要区分导航、静态资源和接口数据，不能把所有响应永远缓存。</p>
<p>skipWaiting 和 clients.claim 会改变接管时机，可能让旧页面与新 worker 混用，应结合版本兼容和用户提示设计。Service Worker 无法直接访问页面 DOM，缓存也不是可信数据或权限校验的替代品。</p>`};export{e as default};