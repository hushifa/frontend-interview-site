var e={answerHtml:`<h2>简答</h2>
<ul>
<li>模式有 <code>inline</code>、<code>immersive-vr</code>、<code>immersive-ar</code>。先用 <code>navigator.xr.isSessionSupported()</code> 检测，再在用户点击时调用 <code>requestSession()</code>。</li>
<li>参考空间决定坐标相对于谁：<code>viewer</code> 跟随头部，<code>local</code> 是起始位置附近的固定原点，<code>local-floor</code> 把原点放在地面。单位是米。</li>
<li>渲染用 <code>session.requestAnimationFrame()</code>，在回调里用 <code>frame.getViewerPose()</code> 拿姿态，再遍历 <code>pose.views</code> 逐个绘制，不要假设固定两个视口。</li>
<li>跟踪丢失时 <code>getViewerPose()</code> 返回 <code>null</code>，这一帧跳过即可。</li>
<li>输入源（手柄、手、凝视）会在会话中增减，监听 <code>inputsourceschange</code>；会话结束时监听 <code>end</code> 并恢复页面。</li>
</ul>
<h2>启动会话</h2>
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
<p>需要安全上下文。<code>isSessionSupported()</code> 返回 <code>true</code> 也可能因为权限或设备占用而请求失败，失败时提示用户，不要循环重试。</p>
<p><code>local-floor</code> 不可用时退回 <code>local</code>，并调整场景高度。</p>
<h2>帧循环</h2>
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
<p><code>XRFrame</code> 只在当前回调内有效，不能保存起来在异步代码里使用。普通窗口的 <code>requestAnimationFrame</code> 不能代替会话的帧调度。</p>
<h2>输入</h2>
<ul>
<li><code>XRInputSource</code> 的 <code>targetRayMode</code> 区分 <code>tracked-pointer</code>（手柄或手）、<code>gaze</code>、<code>screen</code>。</li>
<li>用 <code>select</code>、<code>squeeze</code> 事件处理交互，再自己做射线命中。不要写死&quot;第一个手柄的第二个按钮&quot;。</li>
<li>保留二维页面上的替代操作，空间手势不适合所有用户。</li>
</ul>
<h2>会话结束与可见性</h2>
<ul>
<li>监听 <code>end</code>：恢复页面状态，清理监听器，释放只属于 XR 的资源。</li>
<li><code>visibilitychange</code> 中 <code>visibilityState</code> 变为 <code>hidden</code> 时（例如系统菜单弹出），减少渲染工作，但会话没有结束。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><strong>命中测试、手部追踪这些能力怎么用？</strong> 作为 <code>requiredFeatures</code> 或 <code>optionalFeatures</code> 申请。只把必需的放进 <code>requiredFeatures</code>，否则不支持的设备会直接无法启动。</li>
<li><strong>模拟器测试够吗？</strong> 只能验证逻辑。帧率、跟踪丢失、舒适性要在真机上测试。</li>
</ul>`};export{e as default};