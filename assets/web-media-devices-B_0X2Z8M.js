var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>navigator.mediaDevices.getUserMedia({ video, audio })</code> 只在安全上下文中可用，首次调用会弹出授权框。</li>
<li>常见错误：<code>NotAllowedError</code> 用户或策略拒绝，<code>NotFoundError</code> 没有对应设备，<code>NotReadableError</code> 设备被其他程序占用，<code>OverconstrainedError</code> 约束无法满足。</li>
<li>停止使用时调用 <code>stream.getTracks().forEach((t) =&gt; t.stop())</code>，只把 <code>video.srcObject</code> 置空不会释放摄像头。</li>
<li><code>enumerateDevices()</code> 列出设备，授权前设备的 <code>label</code> 是空字符串。</li>
<li>设备插拔时触发 <code>devicechange</code> 事件。</li>
</ul>
<h2>示例</h2>
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
<ul>
<li><code>ideal</code> 是期望值，满足不了时浏览器选最接近的；<code>exact</code> 必须满足，否则抛 <code>OverconstrainedError</code>。</li>
<li><code>&lt;video&gt;</code> 要加 <code>playsinline</code> 和 <code>muted</code>（播放本地预览时），iOS 才不会强制全屏，并允许自动播放。</li>
</ul>
<h2>生命周期</h2>
<ul>
<li>页面切到后台时，移动端系统可能暂停摄像头，轨道触发 <code>mute</code> 事件；回到前台后触发 <code>unmute</code>。</li>
<li>轨道被系统或用户停止时触发 <code>ended</code> 事件，界面应更新状态并允许重新开启。</li>
<li>SPA 中切换路由时一定要调用停止函数，否则摄像头指示灯一直亮着。</li>
</ul>
<h2>屏幕共享</h2>
<p><code>navigator.mediaDevices.getDisplayMedia()</code> 获取屏幕或窗口画面，必须由用户手势触发，每次都会显示选择界面，不能记住授权。</p>`};export{e as default};