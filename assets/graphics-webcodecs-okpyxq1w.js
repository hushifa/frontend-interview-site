var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器本来就能解码视频，<code>&lt;video&gt;</code> 用的就是它。WebCodecs 是把这些编码器、解码器直接交给页面，让你一帧一帧地处理。所以普通播放用 <code>&lt;video&gt;</code>，自适应流媒体用 MSE，实时通话用 WebRTC，只有要逐帧处理、在浏览器里剪辑或转码时才用 WebCodecs。</p>
<p>视频数据可以分三层：最外面是容器，比如 MP4、WebM；里面是编码块 <code>EncodedVideoChunk</code>；解码出来是原始帧 <code>VideoFrame</code>。WebCodecs 只管后两层，解析和封装容器要靠别的库。</p>
<p>用的时候有两个坑。<code>decode()</code> 是异步提交的，喂得太快队列和内存会暴涨，要根据 <code>decodeQueueSize</code> 控制速度。<code>VideoFrame</code> 占很大一块内存甚至 GPU 资源，用完必须调用 <code>close()</code>。</p>
<p>还要注意，支持哪些编解码器因浏览器和设备而异，要用 <code>VideoDecoder.isConfigSupported()</code> 按具体配置检测。</p>
</blockquote>
<h2>一条解码管道怎么写</h2>
<p>下面的代码先检测配置，再一块块喂数据给解码器，每解出一帧就画出来并立刻关闭。</p>
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
<p><code>frame.close()</code> 放在 <code>finally</code> 里，是为了画的时候就算出错，这一帧也能被关掉。</p>
<p>循环里的 <code>while</code> 是在做背压。意思是下游处理不过来时，让上游先停一停。<code>decodeQueueSize</code> 是还在排队等解码的块数，超过 8 就等一个 <code>dequeue</code> 事件，有空位了再继续喂。</p>
<p><code>flush()</code> 会等队列里的数据全部解完，所以只在一批数据结束时调一次，每帧都调会把流水线卡住。</p>
<p>这里的 <code>chunks</code> 来自容器解析库，比如 mp4box.js。WebCodecs 不能直接吃一个完整的 MP4 文件。</p>
<h2>时间戳要注意什么</h2>
<p>编码块和帧的 <code>timestamp</code> 单位是微秒。误传成毫秒，播放速度就全错了。</p>
<p>含 B 帧的视频，解码顺序和显示顺序不一样，所以显示时要按时间戳排序。</p>
<p>实时预览跟不上时，可以丢掉过期的帧；离线导出就不能丢，要处理完全部帧，并显示进度。</p>
<h2>怎样放到 Worker 里，又怎样取消</h2>
<p>解码器和编码器都能在专用 Worker 里用，配合 OffscreenCanvas 绘制，就不会占主线程。</p>
<p>可是如果把每一帧都传回主线程，Worker 的好处就被抵消了。所以只传进度或者缩略图。</p>
<p>取消导出时，要停止读取上游数据，不再提交新块，关闭还没处理的帧，最后调用 <code>decoder.close()</code> 和 <code>encoder.close()</code>。</p>
<h2>兼容性和降级</h2>
<p>AV1 解码支持得比较广，硬件编码的支持还比较有限；H.265 在苹果平台之外支持缺口明显。</p>
<p>还要注意，<code>isConfigSupported()</code> 返回支持，不代表一定能稳定实时处理，要用真实素材测性能和耗电。不支持时，可以降级到服务端转码，或者让用户换个格式。</p>
<h2>常见追问</h2>
<p><strong>WebCodecs 和 MediaRecorder 有什么区别？</strong></p>
<blockquote>
<p>MediaRecorder 直接把媒体流录成文件，简单，但能控制的东西少。WebCodecs 给你每一帧和每个编码块，码率、关键帧、处理流程都能自己决定。</p>
</blockquote>
<p><strong>怎样防止恶意视频把页面拖垮？</strong></p>
<blockquote>
<p>限制文件大小、时长、分辨率和处理时间，超出就中止。</p>
</blockquote>`};export{e as default};