var e={answerHtml:`<h2>简答</h2>
<ul>
<li>普通播放用 <code>&lt;video&gt;</code>，自适应流媒体用 MSE，实时通话用 WebRTC。需要逐帧处理、浏览器内剪辑或转码时才用 WebCodecs。</li>
<li>数据分三层：容器（MP4、WebM）、编码块（<code>EncodedVideoChunk</code>）、原始帧（<code>VideoFrame</code>）。WebCodecs 只处理后两层，解析和封装容器要用其他库。</li>
<li><code>decode()</code> 是异步提交，输入太快会让队列和内存暴涨，要根据 <code>decodeQueueSize</code> 做背压。</li>
<li><code>VideoFrame</code> 占用大块内存甚至 GPU 资源，用完必须调用 <code>close()</code>。</li>
<li>支持的编解码器因浏览器和设备而异，用 <code>VideoDecoder.isConfigSupported()</code> 按具体配置检测。</li>
</ul>
<h2>解码管道</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> decoder = <span class="hljs-keyword">new</span> <span class="hljs-title class_">VideoDecoder</span>({
  <span class="hljs-title function_">output</span>(<span class="hljs-params">frame</span>) {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-title function_">drawFrame</span>(frame);
    } <span class="hljs-keyword">finally</span> {
      frame.<span class="hljs-title function_">close</span>(); <span class="hljs-comment">// 不关闭会很快耗尽内存</span>
    }
  },
  <span class="hljs-attr">error</span>: reportDecodeError,
});

<span class="hljs-keyword">const</span> config = { <span class="hljs-attr">codec</span>: <span class="hljs-string">&#x27;vp09.00.10.08&#x27;</span>, <span class="hljs-attr">codedWidth</span>: <span class="hljs-number">1280</span>, <span class="hljs-attr">codedHeight</span>: <span class="hljs-number">720</span> };
<span class="hljs-keyword">const</span> { supported } = <span class="hljs-keyword">await</span> <span class="hljs-title class_">VideoDecoder</span>.<span class="hljs-title function_">isConfigSupported</span>(config);
<span class="hljs-keyword">if</span> (!supported) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;当前设备不支持该配置&#x27;</span>);
decoder.<span class="hljs-title function_">configure</span>(config);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">waitForDequeue</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> decoder.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;dequeue&#x27;</span>, resolve, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> }));
}

<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> chunk <span class="hljs-keyword">of</span> chunks) {
  <span class="hljs-keyword">while</span> (decoder.<span class="hljs-property">decodeQueueSize</span> &gt; <span class="hljs-number">8</span>) <span class="hljs-keyword">await</span> <span class="hljs-title function_">waitForDequeue</span>(); <span class="hljs-comment">// 背压</span>
  decoder.<span class="hljs-title function_">decode</span>(chunk);
}
<span class="hljs-keyword">await</span> decoder.<span class="hljs-title function_">flush</span>(); <span class="hljs-comment">// 一批数据结束时调用，不要每帧调用</span>
</code></pre></div>
<p><code>chunks</code> 来自容器解析库（例如 mp4box.js），WebCodecs 不能直接吃一个完整的 MP4 文件。</p>
<h2>时间戳</h2>
<p>编码块和帧的 <code>timestamp</code> 以微秒为单位，误传毫秒会导致播放速度错误。含 B 帧的视频，解码顺序和显示顺序不同，要按时间戳排序显示。</p>
<p>实时预览跟不上时丢弃过期帧；离线导出则要处理全部帧并显示进度。</p>
<h2>Worker 与取消</h2>
<ul>
<li>解码器和编码器可以在专用 Worker 中使用，配合 OffscreenCanvas 绘制，避免占用主线程。</li>
<li>把每一帧都传回主线程会抵消 Worker 的收益，只传进度或缩略图。</li>
<li>取消导出时：停止读取上游数据、不再提交新块、关闭未消费的帧、调用 <code>decoder.close()</code> 和 <code>encoder.close()</code>。</li>
</ul>
<h2>兼容与降级</h2>
<p>AV1 解码支持较广，硬件编码支持仍然有限；H.265 在苹果平台之外支持缺口明显。<code>isConfigSupported()</code> 通过不代表一定能稳定实时处理，要用真实素材测试性能和耗电。不支持时降级到服务端转码，或让用户选择其他格式。</p>
<h2>常见追问</h2>
<ul>
<li><strong>WebCodecs 和 MediaRecorder 有什么区别？</strong> MediaRecorder 直接把媒体流录制成文件，简单但控制少；WebCodecs 给出每一帧和每个编码块，可以自己决定码率、关键帧和处理流程。</li>
<li><strong>怎样防止恶意视频拖垮页面？</strong> 限制文件大小、时长、分辨率和处理时间，超出就中止。</li>
</ul>`};export{e as default};