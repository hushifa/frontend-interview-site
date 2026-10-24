var e={answerHtml:`<p><code>getUserMedia()</code> 只能在满足安全上下文和权限条件时请求媒体设备。约束可以表达分辨率、朝向或设备偏好，但浏览器可能无法满足，调用应处理 <code>NotAllowedError</code>、<code>NotFoundError</code>、<code>OverconstrainedError</code> 等失败。</p>
<p>拿到 <code>MediaStream</code> 后，要把 track 连接到视频、音频或 WebRTC；不再使用时调用每条 track 的 <code>stop()</code> 释放摄像头和麦克风指示灯。组件卸载、切换设备和页面进入后台都要有清理策略。</p>
<p>权限提示不是业务授权的替代。界面应说明用途、允许用户拒绝，并避免把原始音视频无意上传；服务端仍需单独处理上传、鉴权和隐私保留。</p>
<h3>复习提示</h3>
<p>回答时说明 API 的输入、生命周期、取消或错误路径，并给出资源清理方式。涉及权限、设备或用户手势时，要把安全上下文、授权结果和降级方案一起说明。建议用一个最小示例验证“MediaDevices、摄像头、麦克风”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};