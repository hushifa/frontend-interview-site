var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>可以把 Web Audio 想成接音响线。<code>AudioContext</code> 是整套设备的环境，所有节点都由它创建。声音从音源节点出发，经过一个个处理节点，最后接到 <code>context.destination</code>，也就是扬声器。</p>
<p>音源节点有几种：<code>AudioBufferSourceNode</code> 播放解码好的音频，<code>MediaElementAudioSourceNode</code> 接 <code>&lt;audio&gt;</code> 元素，<code>MediaStreamAudioSourceNode</code> 接麦克风，<code>OscillatorNode</code> 是振荡器。处理节点常用的有：<code>GainNode</code> 调音量，<code>BiquadFilterNode</code> 滤波，<code>AnalyserNode</code> 拿频谱数据，<code>PannerNode</code> 做空间定位。</p>
<p>参数变化要用 <code>AudioParam</code> 的调度方法，比如 <code>linearRampToValueAtTime</code>，它在音频线程上按音频时钟精确执行，能避免爆音。</p>
<p>最常见的坑是自动播放策略。没有用户手势就创建的 context 处于 <code>suspended</code> 状态，不出声，要在用户点击后调用 <code>context.resume()</code>。</p>
</blockquote>
<h2>播放一个音效并淡出</h2>
<p>下面加载一个音效，点击按钮播放，0.5 秒内音量降到 0。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> context = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AudioContext</span>();
<span class="hljs-keyword">let</span> buffer;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">load</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/click.mp3&#x27;</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">r</span>) =&gt;</span> r.<span class="hljs-title function_">arrayBuffer</span>());
  buffer = <span class="hljs-keyword">await</span> context.<span class="hljs-title function_">decodeAudioData</span>(data);
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">play</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (context.<span class="hljs-property">state</span> === <span class="hljs-string">&#x27;suspended&#x27;</span>) <span class="hljs-keyword">await</span> context.<span class="hljs-title function_">resume</span>();

  <span class="hljs-keyword">const</span> source = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AudioBufferSourceNode</span>(context, { buffer });
  <span class="hljs-keyword">const</span> gain = <span class="hljs-keyword">new</span> <span class="hljs-title class_">GainNode</span>(context, { <span class="hljs-attr">gain</span>: <span class="hljs-number">1</span> });
  source.<span class="hljs-title function_">connect</span>(gain).<span class="hljs-title function_">connect</span>(context.<span class="hljs-property">destination</span>);

  <span class="hljs-keyword">const</span> now = context.<span class="hljs-property">currentTime</span>;
  gain.<span class="hljs-property">gain</span>.<span class="hljs-title function_">setValueAtTime</span>(<span class="hljs-number">1</span>, now);
  gain.<span class="hljs-property">gain</span>.<span class="hljs-title function_">linearRampToValueAtTime</span>(<span class="hljs-number">0</span>, now + <span class="hljs-number">0.5</span>);
  source.<span class="hljs-title function_">start</span>(now);
  source.<span class="hljs-title function_">stop</span>(now + <span class="hljs-number">0.5</span>);
}

button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, play);
</code></pre></div>
<p>连接关系是“音源 → 增益 → 扬声器”。<code>connect</code> 返回目标节点，所以可以链式写下去。</p>
<p>为什么每次播放都新建一个 <code>AudioBufferSourceNode</code>？因为它只能 <code>start()</code> 一次，播完就不能再用了。不过它很轻量，真正占内存的解码数据 <code>buffer</code> 可以复用。</p>
<p>为什么用 <code>context.currentTime</code> 而不用 <code>setTimeout</code>？<code>currentTime</code> 是音频时钟，淡出和停止都按它调度，在音频线程上精确执行。<code>setTimeout</code> 跑在主线程，时间不准，主线程一卡音频就跟着出问题。</p>
<h2>做一个频谱可视化</h2>
<p>在节点图里接一个 <code>AnalyserNode</code>，就能每帧读出频谱数据画柱状图。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// source 是任意音频节点，例如上面 play() 里创建的 AudioBufferSourceNode</span>
<span class="hljs-keyword">function</span> <span class="hljs-title function_">visualize</span>(<span class="hljs-params">source</span>) {
  <span class="hljs-keyword">const</span> analyser = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AnalyserNode</span>(context, { <span class="hljs-attr">fftSize</span>: <span class="hljs-number">256</span> });
  source.<span class="hljs-title function_">connect</span>(analyser);
  <span class="hljs-keyword">const</span> bins = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Uint8Array</span>(analyser.<span class="hljs-property">frequencyBinCount</span>);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">draw</span>(<span class="hljs-params"></span>) {
    analyser.<span class="hljs-title function_">getByteFrequencyData</span>(bins);
    <span class="hljs-title function_">renderBars</span>(bins);
    <span class="hljs-title function_">requestAnimationFrame</span>(draw);
  }
  <span class="hljs-title function_">draw</span>();
}
</code></pre></div>
<p><code>AnalyserNode</code> 不改变声音，只是旁听。一个节点可以同时连到多个目标，所以音源既接扬声器又接分析器，互不影响。</p>
<h2>使用时要注意的地方</h2>
<p>一个页面通常只创建一个 <code>AudioContext</code>。不用的时候调用 <code>suspend()</code> 或 <code>close()</code>，把音频硬件释放掉。</p>
<p>需要自己逐个采样处理声音时，用 <code>AudioWorklet</code>，代码运行在音频线程。旧的 <code>ScriptProcessorNode</code> 已经废弃。</p>
<p>播放跨源的音频，服务端要返回 CORS 头，否则 <code>MediaElementAudioSourceNode</code> 只会输出静音。</p>
<h2>常见追问</h2>
<p><strong>为什么页面一打开创建的 AudioContext 没有声音？</strong></p>
<blockquote>
<p>因为浏览器的自动播放策略。没有用户手势就创建的 context 是 <code>suspended</code> 状态。要在用户点击等操作里调用 <code>context.resume()</code>，它才开始出声。</p>
</blockquote>
<p><strong>淡入淡出为什么不用定时器一点点改音量？</strong></p>
<blockquote>
<p>定时器在主线程上，时间不精确，音量跳变会产生爆音。用 <code>linearRampToValueAtTime</code> 这类调度方法，变化在音频线程上按采样精确执行，声音是平滑的。</p>
</blockquote>`};export{e as default};