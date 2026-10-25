var e={answerHtml:`<p>Web Audio 用音频节点图表达声音从哪里来、经过什么处理、最后输出到哪里。AudioContext 管理处理环境和音频时间线，节点之间通过 connect 连接，而不是靠页面不断手动计算每个扬声器采样值。</p>
<p>例如背景音可以经过 GainNode 调音量，再连接到 destination；麦克风也可以接入分析或效果节点，但取得麦克风权限仍是独立的媒体采集步骤。</p>
<h3>音源、处理节点和输出各有职责</h3>
<p>OscillatorNode 生成波形，AudioBufferSourceNode 播放已经解码的缓冲，媒体元素或 MediaStream 也可通过相应节点接入。GainNode 调整增益，滤波和分析节点完成其他处理，destination 通常连接当前音频输出。</p>
<p>节点图可以分支或混合，不是一条只能串行通过的链。创建了节点却没连接到输出，不代表一定能听到声音；节点没有输入、上下文暂停或增益为零也会影响结果。</p>
<h3>用音频时间线调度，不靠 setTimeout 卡节拍</h3>
<p>下面函数接收由应用管理的、正在运行的 AudioContext，调度一段短提示音：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">scheduleTone</span>(<span class="hljs-params">context</span>) {
  <span class="hljs-keyword">const</span> source = context.<span class="hljs-title function_">createOscillator</span>();
  <span class="hljs-keyword">const</span> gain = context.<span class="hljs-title function_">createGain</span>();
  <span class="hljs-keyword">const</span> start = context.<span class="hljs-property">currentTime</span> + <span class="hljs-number">0.02</span>;
  source.<span class="hljs-property">frequency</span>.<span class="hljs-property">value</span> = <span class="hljs-number">440</span>;
  gain.<span class="hljs-property">gain</span>.<span class="hljs-title function_">setValueAtTime</span>(<span class="hljs-number">0</span>, start);
  gain.<span class="hljs-property">gain</span>.<span class="hljs-title function_">linearRampToValueAtTime</span>(<span class="hljs-number">0.08</span>, start + <span class="hljs-number">0.01</span>);
  gain.<span class="hljs-property">gain</span>.<span class="hljs-title function_">linearRampToValueAtTime</span>(<span class="hljs-number">0</span>, start + <span class="hljs-number">0.18</span>);
  source.<span class="hljs-title function_">connect</span>(gain);
  gain.<span class="hljs-title function_">connect</span>(context.<span class="hljs-property">destination</span>);
  source.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;ended&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
    source.<span class="hljs-title function_">disconnect</span>();
    gain.<span class="hljs-title function_">disconnect</span>();
  }, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  source.<span class="hljs-title function_">start</span>(start);
  source.<span class="hljs-title function_">stop</span>(start + <span class="hljs-number">0.2</span>);
  <span class="hljs-keyword">return</span> source;
}
</code></pre></div>
<p>currentTime 以秒为单位，属于音频上下文的时钟。start/stop 和 AudioParam 自动化安排在这条时间线上，减少主线程计时器抖动对声音的影响。短淡入淡出也避免增益突然跳变造成明显咔哒声。</p>
<p>这不是精确外部设备同步方案；输出延迟、设备和上下文状态仍需考虑。应用应先确保用户允许播放，再调用，不应加载页面就自动发声。</p>
<h3>自动播放限制可能让上下文暂停</h3>
<p>浏览器可能把未经用户交互的 AudioContext 保持为 suspended。通常在明确点击后创建或 resume，并检查结果与 state，而不是不断重建上下文碰运气。</p>
<p>应用可复用一个合适的上下文管理多个声音，不需要每次点击都创建新 AudioContext。用户暂停时可以停止特定音源或按需求 suspend；完全结束不再使用时调用 close 释放相关系统资源。</p>
<p>suspend 是暂停时间线推进，close 是结束上下文，不能混用。关闭上下文也不等于 JavaScript 中所有节点和缓冲引用立刻消失，应用仍应释放不再使用的引用。</p>
<h3>音源节点往往是一次性的</h3>
<p>OscillatorNode、AudioBufferSourceNode 等源节点 start 后不能拿同一个实例反复重新 start。重复播放通常新建 source，但可以复用已经解码的 AudioBuffer 和合适的处理链。</p>
<p>stop 结束音源，disconnect 断开图连接，二者职责不同。把麦克风节点 disconnect 也不等于停止 MediaStreamTrack；若不再采集，仍需停止自己持有的轨道。</p>
<p>若用户在音源尚未开始或仍播放时取消，可以对返回的 source 调用合适的 stop，并处理结束清理；复杂播放器应集中管理所有活动源，避免漏掉后台仍在运行的节点。</p>
<h3>分析数据与音频处理线程也要区分</h3>
<p>AnalyserNode 可以提供频域或时域数据供可视化，Canvas 绘制可跟随页面动画帧，但音频节拍不应反过来依赖绘图帧率。</p>
<p>需要自定义低延迟处理时可评估 AudioWorklet。处理代码不在普通页面 DOM 环境中，应避免阻塞、分配大量临时对象或做网络等待，并使用明确的消息或参数接口与主线程协作。</p>
<p>音频验证应覆盖暂停恢复、设备切换、页面离开和多次播放，避免自动发声与过大音量。离线渲染可以验证信号处理逻辑，不能证明真实设备延迟和听感完全正确。</p>`};export{e as default};