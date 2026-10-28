var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>AudioContext</code> 是音频处理的环境，所有节点都由它创建，最后连到 <code>context.destination</code>（扬声器）。</li>
<li>音源节点：<code>AudioBufferSourceNode</code>（解码后的音频）、<code>MediaElementAudioSourceNode</code>（<code>&lt;audio&gt;</code> 元素）、<code>MediaStreamAudioSourceNode</code>（麦克风）、<code>OscillatorNode</code>（振荡器）。</li>
<li>处理节点：<code>GainNode</code> 调音量、<code>BiquadFilterNode</code> 滤波、<code>AnalyserNode</code> 获取频谱、<code>PannerNode</code> 空间定位。</li>
<li>浏览器的自动播放策略会让未经用户手势创建的 context 处于 <code>suspended</code> 状态，要在点击后调用 <code>context.resume()</code>。</li>
<li>参数变化用 <code>AudioParam</code> 的调度方法（如 <code>linearRampToValueAtTime</code>），在音频线程上精确执行，避免爆音。</li>
</ul>
<h2>示例：播放音效并淡出</h2>
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
<ul>
<li><code>AudioBufferSourceNode</code> 只能 <code>start()</code> 一次，每次播放都新建一个；节点很轻量，<code>buffer</code> 可以复用。</li>
<li><code>context.currentTime</code> 是音频时钟，按它调度比用 <code>setTimeout</code> 精确。</li>
</ul>
<h2>音频可视化</h2>
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
<h2>注意事项</h2>
<ul>
<li>一个页面通常只创建一个 <code>AudioContext</code>，不用时调用 <code>suspend()</code> 或 <code>close()</code> 释放音频硬件。</li>
<li>自定义的采样级处理用 <code>AudioWorklet</code>，代码运行在音频线程，旧的 <code>ScriptProcessorNode</code> 已废弃。</li>
<li>跨源音频要服务端返回 CORS 头，否则 <code>MediaElementAudioSourceNode</code> 只输出静音。</li>
</ul>`};export{e as default};