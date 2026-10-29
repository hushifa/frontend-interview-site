var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做视频通话或扫码时，用 <code>navigator.mediaDevices.getUserMedia({ video, audio })</code> 打开摄像头和麦克风。它只在安全上下文里可用，第一次调用会弹出授权框，成功后返回一个 <code>MediaStream</code>。</p>
<p>失败时要看错误名区分原因：<code>NotAllowedError</code> 是用户或策略拒绝了，<code>NotFoundError</code> 是没有对应的设备，<code>NotReadableError</code> 是设备被别的程序占着，<code>OverconstrainedError</code> 是要求的参数满足不了。</p>
<p>最常被忽略的是释放。不用时要调用 <code>stream.getTracks().forEach((t) =&gt; t.stop())</code>，只把 <code>video.srcObject</code> 设成 <code>null</code> 是不会释放摄像头的，指示灯会一直亮。</p>
<p>另外，<code>enumerateDevices()</code> 能列出设备，但授权之前设备的 <code>label</code> 是空字符串；设备插拔时会触发 <code>devicechange</code> 事件。</p>
</blockquote>
<h2>打开摄像头并返回关闭函数</h2>
<p>下面打开摄像头显示在 <code>&lt;video&gt;</code> 里，返回一个关闭函数，同时把错误翻译成提示文字。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">startCamera</span>(<span class="hljs-params">video, deviceId</span>) {
  <span class="hljs-keyword">const</span> stream = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">mediaDevices</span>.<span class="hljs-title function_">getUserMedia</span>({
    <span class="hljs-attr">video</span>: deviceId ? { <span class="hljs-attr">deviceId</span>: { <span class="hljs-attr">exact</span>: deviceId } } : { <span class="hljs-attr">width</span>: { <span class="hljs-attr">ideal</span>: <span class="hljs-number">1280</span> }, <span class="hljs-attr">facingMode</span>: <span class="hljs-string">&#x27;user&#x27;</span> },
    <span class="hljs-attr">audio</span>: <span class="hljs-literal">false</span>,
  });
  video.<span class="hljs-property">srcObject</span> = stream;
  <span class="hljs-keyword">await</span> video.<span class="hljs-title function_">play</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    stream.<span class="hljs-title function_">getTracks</span>().<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">track</span>) =&gt;</span> track.<span class="hljs-title function_">stop</span>());
    video.<span class="hljs-property">srcObject</span> = <span class="hljs-literal">null</span>;
  };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">describeError</span>(<span class="hljs-params">error</span>) {
  <span class="hljs-keyword">switch</span> (error.<span class="hljs-property">name</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;NotAllowedError&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;摄像头权限被拒绝，请在浏览器设置中允许&#x27;</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;NotFoundError&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;没有找到摄像头&#x27;</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;NotReadableError&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;摄像头正在被其他程序使用&#x27;</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;OverconstrainedError&#x27;</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">\`摄像头不支持要求的参数：<span class="hljs-subst">\${error.constraint}</span>\`</span>;
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-string">&#x27;无法打开摄像头&#x27;</span>;
  }
}
</code></pre></div>
<p>为什么关闭时要对每条轨道调用 <code>stop()</code>？因为真正占着设备的是轨道，不是 <code>&lt;video&gt;</code>。把 <code>srcObject</code> 设成 <code>null</code>，只是 <code>&lt;video&gt;</code> 不再显示了，轨道还开着，摄像头就一直被占用。</p>
<p>约束里的 <code>ideal</code> 和 <code>exact</code> 区别很大。<code>ideal</code> 是期望值，满足不了时浏览器会选最接近的；<code>exact</code> 是必须满足，满足不了就抛 <code>OverconstrainedError</code>。所以指定某个设备用 <code>exact</code>，分辨率这种“尽量就行”的用 <code>ideal</code>。</p>
<p>在 iOS 上，预览本地画面的 <code>&lt;video&gt;</code> 要加 <code>playsinline</code> 和 <code>muted</code>，才不会被强制全屏，也才允许自动播放。</p>
<h2>轨道在哪些时候会自己变化</h2>
<p>页面切到后台时，手机系统可能暂停摄像头，轨道会触发 <code>mute</code> 事件，回到前台后触发 <code>unmute</code>。</p>
<p>轨道被系统或用户停掉时，会触发 <code>ended</code> 事件。界面应该更新状态，并允许用户重新打开。</p>
<p>在单页应用里切换路由时，一定要调用上面的关闭函数。否则页面换了，摄像头指示灯还亮着。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>enumerateDevices()</code> 拿到的设备名是空的？</strong></p>
<blockquote>
<p>出于隐私，用户授权之前，设备的 <code>label</code> 是空字符串。一般先调用一次 <code>getUserMedia</code> 拿到授权，再列设备，就能看到名字了。</p>
</blockquote>
<p><strong>屏幕共享也用 getUserMedia 吗？</strong></p>
<blockquote>
<p>不是，用 <code>navigator.mediaDevices.getDisplayMedia()</code>。它必须由用户手势触发，每次都会显示选择界面，浏览器不会记住授权。</p>
</blockquote>`};export{e as default};