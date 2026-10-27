var e={answerHtml:`<h2>先判断自己是否真的需要帧级控制</h2>
<p>如果需求只是播放 MP4、暂停、拖动进度和调音量，<code>&lt;video&gt;</code> 已经提供成熟的缓冲、播放和用户控制。实时通话还需要 WebRTC 的连接、协商和传输；向媒体元素提供分段数据通常使用 MSE。</p>
<p>WebCodecs 适合浏览器视频剪辑、逐帧滤镜、转码、帧分析和自定义低延迟管道。它把编码器和解码器暴露出来，但不会替你搭完整播放器。</p>
<h2>容器、编码块和原始帧是三层东西</h2>
<p>MP4、WebM 是容器，里面有轨道、时间戳和编码数据；H.264、VP9、AV1 是编码格式；<code>VideoFrame</code> 是解码后的原始帧。典型管道是：容器解析 → <code>EncodedVideoChunk</code> → <code>VideoDecoder</code> → <code>VideoFrame</code> → 图像处理 → <code>VideoEncoder</code> → 重新封装。</p>
<p>不能把 MP4 的整个 ArrayBuffer 直接塞给解码器，也不能把编码器输出的 chunk 直接拼起来就得到有效 MP4。容器初始化描述、关键帧、显示顺序和时间戳都必须由对应的封装逻辑处理。</p>
<h2>解码管道要管理队列和帧生命周期</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">VideoDecoder</span>({
  <span class="hljs-title function_">output</span>(<span class="hljs-params">frame</span>) {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-title function_">drawFrame</span>(frame);
    } <span class="hljs-keyword">finally</span> {
      frame.<span class="hljs-title function_">close</span>();
    }
  },
  <span class="hljs-attr">error</span>: reportDecodeError,
});

decoder.<span class="hljs-title function_">configure</span>({
  <span class="hljs-attr">codec</span>: <span class="hljs-string">&#x27;vp09.00.10.08&#x27;</span>,
  <span class="hljs-attr">codedWidth</span>: <span class="hljs-number">1280</span>,
  <span class="hljs-attr">codedHeight</span>: <span class="hljs-number">720</span>,
});

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> chunks) {
  <span class="hljs-keyword">if</span> (decoder.<span class="hljs-property">decodeQueueSize</span> &gt; <span class="hljs-number">8</span>) <span class="hljs-keyword">await</span> <span class="hljs-title function_">waitForDrain</span>(decoder);
  decoder.<span class="hljs-title function_">decode</span>(chunk);
}
<span class="hljs-keyword">await</span> decoder.<span class="hljs-title function_">flush</span>();
</code></pre></div>
<p><code>decode()</code> 是异步提交，不是立即返回帧。输入过快会让队列和内存增长，因此需要根据队列大小施加背压。输出回调拿到的帧使用完要 <code>close()</code>；如果交给另一个异步消费者，要明确由谁拥有和释放它。<code>flush()</code> 用于等待一批工作完成，连续流式处理时每帧 flush 会破坏吞吐。</p>
<h2>时间戳决定同步和剪辑结果</h2>
<p>编码块与帧的时间戳通常以微秒表示，把毫秒直接写进去会让播放速度错误。可变帧率视频不能只根据帧编号猜时间；B 帧或其他重排序还可能让提交顺序、解码顺序和显示顺序不同。</p>
<p>实时预览如果解码速度跟不上播放时钟，通常要丢弃过期帧、降低处理分辨率或只保留最新帧；离线导出则可能需要等待所有帧并报告进度。两种场景不能共用无限排队策略。</p>
<h2>Worker 只能解决一部分主线程问题</h2>
<p>把解码、滤镜和编码放到 Worker 能减少主线程长任务，但完整帧在主线程和 Worker 之间复制或转移也有成本。频繁把每一帧传回主线程，可能抵消收益。可以使用 OffscreenCanvas、传递缩略图或只传输进度和时间点。</p>
<p>能力检测不能只判断 <code>VideoDecoder</code> 存在。<code>isConfigSupported()</code> 说明配置可接受，不保证目标设备能稳定解码某个 profile、分辨率或色彩空间。还要用真实媒体样本测试硬件路径、耗电、内存峰值和损坏块。</p>
<h2>取消和降级必须覆盖整个管道</h2>
<p>用户取消导出时，要停止上游读取、阻止继续提交 chunk、清理未消费的帧、关闭编码器和处理未完成 Promise。只关闭解码器而继续从摄像头生产帧，不能算取消成功。</p>
<p>浏览器或设备不支持目标 codec 时，可以降级到 <code>&lt;video&gt;</code>、服务端转码或提示用户选择兼容格式。用户上传媒体时还要限制文件大小、时长、帧数和解析时间，避免恶意输入长期占用 CPU 和内存。</p>`};export{e as default};