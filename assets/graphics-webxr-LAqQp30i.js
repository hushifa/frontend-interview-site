var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>WebXR 让网页能进入 VR 或 AR。进入的那一段体验叫会话，模式有 <code>inline</code>、<code>immersive-vr</code>、<code>immersive-ar</code> 三种。要先用 <code>navigator.xr.isSessionSupported()</code> 检测，再在用户点击时调用 <code>requestSession()</code>。</p>
<p>进入以后先要定坐标原点，这叫参考空间：<code>viewer</code> 跟着头部走，<code>local</code> 是起始位置附近的一个固定点，<code>local-floor</code> 把原点放在地面上。单位都是米。</p>
<p>渲染要用会话自己的 <code>session.requestAnimationFrame()</code>。在回调里用 <code>frame.getViewerPose()</code> 拿到头部姿态，再遍历 <code>pose.views</code> 一个个画，不要假设永远是左右两只眼。跟踪丢了时 <code>getViewerPose()</code> 会返回 <code>null</code>，这一帧跳过就行。</p>
<p>还要注意，手柄、手这些输入源会在会话中途增减，要监听 <code>inputsourceschange</code>；会话也可能结束，要监听 <code>end</code>，把页面恢复过来。</p>
</blockquote>
<h2>怎样启动一个会话</h2>
<p>下面的代码先检测支不支持，支持才显示按钮，用户点了才进入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> button = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#enter-vr&#x27;</span>);

<span class="hljs-keyword">if</span> (navigator.<span class="hljs-property">xr</span> &amp;&amp; (<span class="hljs-keyword">await</span> navigator.<span class="hljs-property">xr</span>.<span class="hljs-title function_">isSessionSupported</span>(<span class="hljs-string">&#x27;immersive-vr&#x27;</span>))) {
  button.<span class="hljs-property">hidden</span> = <span class="hljs-literal">false</span>;
  button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
    <span class="hljs-keyword">const</span> session = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">xr</span>.<span class="hljs-title function_">requestSession</span>(<span class="hljs-string">&#x27;immersive-vr&#x27;</span>, {
      <span class="hljs-attr">optionalFeatures</span>: [<span class="hljs-string">&#x27;local-floor&#x27;</span>],
    });
    <span class="hljs-keyword">const</span> space = <span class="hljs-keyword">await</span> session
      .<span class="hljs-title function_">requestReferenceSpace</span>(<span class="hljs-string">&#x27;local-floor&#x27;</span>)
      .<span class="hljs-title function_">catch</span>(<span class="hljs-function">() =&gt;</span> session.<span class="hljs-title function_">requestReferenceSpace</span>(<span class="hljs-string">&#x27;local&#x27;</span>));
    <span class="hljs-title function_">startRendering</span>(session, space);
  });
}
</code></pre></div>
<p>WebXR 需要安全上下文。还要注意，<code>isSessionSupported()</code> 返回 <code>true</code>，请求也可能因为权限或者设备被占用而失败。失败时提示用户就好，不要循环重试。</p>
<p><code>local-floor</code> 申请成可选功能，拿不到就退回 <code>local</code>。这时原点不在地面上了，要自己调整场景的高度。</p>
<h2>每一帧怎么画</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startRendering</span>(<span class="hljs-params">session, space</span>) {
  session.<span class="hljs-title function_">requestAnimationFrame</span>(<span class="hljs-keyword">function</span> <span class="hljs-title function_">onFrame</span>(<span class="hljs-params">time, frame</span>) {
    session.<span class="hljs-title function_">requestAnimationFrame</span>(onFrame);
    <span class="hljs-keyword">const</span> pose = frame.<span class="hljs-title function_">getViewerPose</span>(space);
    <span class="hljs-keyword">if</span> (!pose) <span class="hljs-keyword">return</span>; <span class="hljs-comment">// 跟踪暂时丢失</span>

    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> view <span class="hljs-keyword">of</span> pose.<span class="hljs-property">views</span>) {
      <span class="hljs-keyword">const</span> viewport = session.<span class="hljs-property">renderState</span>.<span class="hljs-property">baseLayer</span>.<span class="hljs-title function_">getViewport</span>(view);
      <span class="hljs-title function_">drawScene</span>(view.<span class="hljs-property">projectionMatrix</span>, view.<span class="hljs-property">transform</span>.<span class="hljs-property">inverse</span>.<span class="hljs-property">matrix</span>, viewport);
    }
  });
}
</code></pre></div>
<p>为什么要遍历 <code>pose.views</code>，不直接画左右眼？因为视图有几个由设备决定。VR 头显通常是两个，手机 AR 可能只有一个，所以按设备给的来画。每个视图有自己的投影矩阵和视口。</p>
<p><code>XRFrame</code> 只在当前这次回调里有效，不能存起来留到异步代码里用。普通窗口的 <code>requestAnimationFrame</code> 也不能代替会话的帧调度，因为头显的刷新节奏由会话控制。</p>
<h2>输入要怎么处理</h2>
<p>每个输入源是一个 <code>XRInputSource</code>，它的 <code>targetRayMode</code> 说明是哪种：<code>tracked-pointer</code> 是手柄或手，<code>gaze</code> 是凝视，<code>screen</code> 是屏幕触摸。</p>
<p>交互要用 <code>select</code>、<code>squeeze</code> 这些事件来处理，再自己做射线命中，算出指向了哪个物体。不要写死“第一个手柄的第二个按钮”，因为设备千差万别，输入源还会变。</p>
<p>另外要在二维页面上保留替代操作，空间手势不是所有用户都能做。</p>
<h2>会话结束或者看不见了怎么办</h2>
<p>监听 <code>end</code>：恢复页面状态，清掉监听器，释放只属于 XR 的资源。</p>
<p>还要监听会话的 <code>visibilitychange</code>，它有两种不可见的状态。<code>visible-blurred</code> 时场景可能还看得见，但不处理输入，帧回调也可能降频，所以要暂停交互。<code>hidden</code> 时帧回调完全停止。这两种状态都不代表会话结束了。</p>
<h2>常见追问</h2>
<p><strong>命中测试、手部追踪这些能力怎么用？</strong></p>
<blockquote>
<p>在请求会话时，把它们放进 <code>requiredFeatures</code> 或 <code>optionalFeatures</code> 申请。只把必需的放进 <code>requiredFeatures</code>，不然不支持的设备会直接启动不了。</p>
</blockquote>
<p><strong>用模拟器测试够吗？</strong></p>
<blockquote>
<p>只能验证逻辑。帧率、跟踪丢失、会不会晕，这些要在真机上测。</p>
</blockquote>`};export{e as default};