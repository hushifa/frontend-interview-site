var e={answerHtml:`<p>OffscreenCanvas 允许画布在 Worker 中绘制，适合计算量大、帧率要求高且不需要频繁读取 DOM 的图形任务。页面可以把已有 canvas 的控制权转移给 Worker，或在 Worker 中创建独立画布。</p>
<p>移到 Worker 不会自动提速：像素上传、消息序列化和主线程合成仍有成本。要控制消息频率、资源生命周期和帧调度，避免每个鼠标事件都发送大量对象。</p>
<p>浏览器支持、上下文类型和图像资源能力存在差异。需要保留普通 Canvas 路径，并测试 Worker 关闭、上下文丢失和页面后台节流。</p>`};export{e as default};