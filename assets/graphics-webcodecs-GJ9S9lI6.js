var e={answerHtml:`<p>WebCodecs 提供对音频和视频编码器、解码器及帧的较底层控制，适合需要自定义帧处理、实时转码、视频编辑或与 WebAssembly、Canvas、WebGPU 配合的场景。它不负责完整的容器解析、播放控制、网络传输或音视频同步。</p>
<p>与 <code>HTMLMediaElement</code> 相比，WebCodecs 暴露更多编解码细节；与 MSE 相比，它不会自动把任意帧组织成可播放的媒体缓冲；与 WebRTC 相比，它也不提供完整的实时通信协议栈。方案选择取决于是否需要底层帧级控制。</p>
<p>编码器和解码器需要及时 <code>configure</code>、<code>decode/encode</code>、<code>flush</code>、<code>reset</code> 或 <code>close</code>，并处理队列压力和帧资源释放。浏览器支持的编码格式、硬件加速和安全上下文存在差异，发布前要按目标浏览器验证。</p>
<h3>复习提示</h3>
<p>回答时先确定坐标系、渲染上下文和数据规模，再说明交互、清晰度与性能取舍。大量对象、设备像素比和资源释放都要用实际测量验证，不能只看静态截图。可以把“WebCodecs、音视频、编解码”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};