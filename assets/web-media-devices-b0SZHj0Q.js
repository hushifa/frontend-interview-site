var e={answerHtml:`<p>getUserMedia 请求摄像头或麦克风，并返回包含媒体轨道的 MediaStream。它负责取得采集源，不会自动把音视频上传，也不等于已经开始录制或建立通话。</p>
<p>应用要分别管理授权、采集、预览、录制或传输，以及结束时的轨道释放。只把 video 元素从 DOM 删除，并不能替代停止采集。</p>
<h3>约束包含偏好与硬要求</h3>
<p><code>{ video: true, audio: false }</code> 请求视频而不请求音频。更详细的约束可以指定分辨率、朝向或设备 ID，ideal 表达偏好，exact、min、max 等可能构成必须满足的条件。</p>
<p>如果硬性要求某个设备或分辨率，而当前环境没有满足条件的轨道，可能得到 OverconstrainedError。普通用户预览通常适合先表达偏好，再读取 track.getSettings 查看实际结果，而不是用一组过严约束排除大量设备。</p>
<p>浏览器需要安全上下文与相应权限；iframe 还可能受策略限制。NotAllowedError 不一定是用户刚刚拒绝，也可能来自上下文限制；NotFoundError、NotReadableError 等则帮助区分设备缺失与读取问题。</p>
<h3>权限请求可能一直没有结果</h3>
<p>用户可以不处理权限提示，因此 Promise 可能长期 pending。标准 getUserMedia 没有一个可通用依赖的 AbortSignal 取消参数。</p>
<p>如果用户已经关闭预览界面，之后才批准权限，应用仍可能拿到 stream。必须识别这个结果已经过期，并立即停止它，不能让隐藏页面继续采集。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createCameraSession</span>(<span class="hljs-params">onStream, onError</span>) {
  <span class="hljs-keyword">let</span> stopped = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> stream = <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">let</span> started = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">stop</span>(<span class="hljs-params"></span>) {
    stopped = <span class="hljs-literal">true</span>;
    stream?.<span class="hljs-title function_">getTracks</span>().<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">track</span>) =&gt;</span> track.<span class="hljs-title function_">stop</span>());
    stream = <span class="hljs-literal">null</span>;
  }

  <span class="hljs-keyword">return</span> {
    <span class="hljs-keyword">async</span> <span class="hljs-title function_">start</span>(<span class="hljs-params"></span>) {
      <span class="hljs-keyword">if</span> (started || stopped) <span class="hljs-keyword">return</span>;
      started = <span class="hljs-literal">true</span>;
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> acquired = <span class="hljs-keyword">await</span> navigator.<span class="hljs-property">mediaDevices</span>.<span class="hljs-title function_">getUserMedia</span>({
          <span class="hljs-attr">video</span>: { <span class="hljs-attr">facingMode</span>: { <span class="hljs-attr">ideal</span>: <span class="hljs-string">&#x27;user&#x27;</span> } },
          <span class="hljs-attr">audio</span>: <span class="hljs-literal">false</span>,
        });
        <span class="hljs-keyword">if</span> (stopped) {
          acquired.<span class="hljs-title function_">getTracks</span>().<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">track</span>) =&gt;</span> track.<span class="hljs-title function_">stop</span>());
          <span class="hljs-keyword">return</span>;
        }
        stream = acquired;
        <span class="hljs-title function_">onStream</span>(stream);
      } <span class="hljs-keyword">catch</span> (error) {
        <span class="hljs-keyword">if</span> (stopped) <span class="hljs-keyword">return</span>;
        <span class="hljs-title function_">stop</span>();
        <span class="hljs-title function_">onError</span>(error);
      }
    },
    stop,
  };
}
</code></pre></div>
<p>这是单次会话辅助函数；重试可创建新会话。调用前应检测相关能力，onError 应避免在组件已卸载时更新界面。stop 不能关闭浏览器仍显示的权限提示，它负责已有轨道和迟到结果的处理。</p>
<h3>预览与播放也可能单独失败</h3>
<p>取得 stream 后，常用 <code>video.srcObject = stream</code> 预览。移动端可根据需求设置 playsInline，本地预览通常静音以避免回声；video.play 返回的 Promise 仍可能因播放策略失败。</p>
<p>预览失败不能意味着忽略 stream：界面若放弃使用，应停止所有轨道并清空 srcObject。否则用户看不到画面，但设备仍可能保持采集。</p>
<h3>静音、停止与断开设备不同</h3>
<p>把 track.enabled 设为 false 常用于临时静音或关闭输出内容，并不等同于永久释放该轨道。track.stop 会结束当前轨道的使用，之后不能把它重新启用当成新采集。</p>
<p>同一个底层源可能被其他轨道或标签页使用，所以停止一条轨道不保证系统设备指示灯立刻全部熄灭。应用应停止自己拥有的所有不再需要轨道，但不能承诺控制其他使用者。</p>
<p>还应监听设备相关状态变化，例如轨道因外部原因结束，并在切换设备时释放旧轨道。自己调用 stop 时，不能依赖一定触发 ended 事件来执行全部清理。</p>
<h3>采集授权不等于上传同意或业务授权</h3>
<p>若要录制可使用对应录制方案，通话则涉及 WebRTC，帧处理可能接入 Canvas 或其他管道。每条后续链路都需要停止与清理，不能只关预览却保留上传任务。</p>
<p>界面应说明正在采集什么、是否发送给别人，并提供明确停止入口。真实验收覆盖拒绝、迟到批准、设备占用、拔出、切换以及前后台行为；测试替身可以验证生命周期逻辑，但不能证明相机、麦克风与系统权限体验正常。</p>`};export{e as default};