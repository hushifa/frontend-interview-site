var e={answerHtml:`<p><code>getUserMedia()</code> 只能在满足安全上下文和权限条件时请求媒体设备。约束可以表达分辨率、朝向或设备偏好，但浏览器可能无法满足，调用应处理 <code>NotAllowedError</code>、<code>NotFoundError</code>、<code>OverconstrainedError</code> 等失败。</p>
<p>拿到 <code>MediaStream</code> 后，要把 track 连接到视频、音频或 WebRTC；不再使用时调用每条 track 的 <code>stop()</code> 释放摄像头和麦克风指示灯。组件卸载、切换设备和页面进入后台都要有清理策略。</p>
<p>权限提示不是业务授权的替代。界面应说明用途、允许用户拒绝，并避免把原始音视频无意上传；服务端仍需单独处理上传、鉴权和隐私保留。</p>
<h3>使用边界</h3>
<p>使用 Web API 前要确认安全上下文、权限、用户手势、浏览器支持和可用的降级路径。请求、监听器、流、对象 URL 或设备句柄都应有明确的结束和清理逻辑，不能把“调用成功”当成整个任务已经完成。</p>
<p>接口返回的异常、取消和用户拒绝应分别处理。浏览器端的取消只代表客户端停止等待，涉及写入、上传或设备操作时还要查询实际状态。</p>`};export{e as default};