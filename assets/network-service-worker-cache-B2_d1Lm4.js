var e={answerHtml:`<p>Service Worker 的新脚本下载、安装和激活与已有页面生命周期分开。新 Worker 安装成功后可能等待旧 Worker 控制的页面关闭，缓存版本也需要主动清理，否则用户会继续拿到旧资源。</p>
<p><code>skipWaiting()</code> 和 <code>clientsClaim()</code> 可以加快接管，但会让同一页面的 HTML、脚本和缓存资源处于不同版本，必须设计兼容协议、刷新提示或原子化资源发布。资源文件使用内容哈希能减少旧文件覆盖，但入口 HTML 和缓存清单仍要同步更新。</p>
<p>缓存策略应区分 HTML、脚本、图片和 API。不要把用户私有响应、错误响应或无限增长的请求全部缓存；要处理配额、失效、离线失败和版本回滚。</p>`};export{e as default};