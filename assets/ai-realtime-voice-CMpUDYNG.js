var e={answerHtml:`<h2>简答</h2>
<ul>
<li>一次对话经过麦克风采集、网络传输、服务端语音检测与转写、模型生成、语音合成、浏览器播放。连接建立了，不代表模型收到了音频。</li>
<li>至少分开维护输入（权限、采集中）、连接、当前轮次、生成、播放五类状态，并用轮次 ID 关联。</li>
<li>WebRTC 自带媒体传输和网络自适应；用 WebSocket 传音频，编码、缓冲、播放时钟都要自己处理。</li>
<li>打断时要停止播放、清空待播队列，并通知服务端取消生成。只静音扬声器，模型仍在计算。</li>
<li>浏览器直连语音服务时，用服务端签发的短期令牌，不要把长期密钥放进前端。</li>
</ul>
<h2>状态模型</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">VoiceSession</span> = {
  <span class="hljs-attr">mic</span>: <span class="hljs-string">&#x27;idle&#x27;</span> | <span class="hljs-string">&#x27;requesting&#x27;</span> | <span class="hljs-string">&#x27;denied&#x27;</span> | <span class="hljs-string">&#x27;capturing&#x27;</span>;
  <span class="hljs-attr">connection</span>: <span class="hljs-string">&#x27;connecting&#x27;</span> | <span class="hljs-string">&#x27;open&#x27;</span> | <span class="hljs-string">&#x27;reconnecting&#x27;</span> | <span class="hljs-string">&#x27;closed&#x27;</span>;
  <span class="hljs-attr">turnId</span>: <span class="hljs-built_in">string</span> | <span class="hljs-literal">null</span>;
  <span class="hljs-attr">generation</span>: <span class="hljs-string">&#x27;idle&#x27;</span> | <span class="hljs-string">&#x27;thinking&#x27;</span> | <span class="hljs-string">&#x27;speaking&#x27;</span> | <span class="hljs-string">&#x27;cancelled&#x27;</span>;
  <span class="hljs-attr">playback</span>: { <span class="hljs-attr">queued</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">playing</span>: <span class="hljs-built_in">boolean</span> };
};
</code></pre></div>
<p>麦克风指示灯反映 track 的真实状态，而不是按钮点击过与否。权限被拒、设备被占用、耳机拔出都要有文字提示，并提供文字输入替代。</p>
<p><code>getUserMedia()</code> 返回时组件可能已经关闭。这时要立即停止返回的 track，不要让离开的页面继续采集。</p>
<h2>转写与轮次</h2>
<ul>
<li>转写通常先给出临时文本，再给出修正后的最终文本。按片段 ID 替换同一轮的临时内容，不要追加，否则文字会重复。</li>
<li>自动判断用户说完（语音活动检测）会受噪声和停顿影响，可以提供&quot;按住说话&quot;或手动结束作为补充。</li>
<li>重连后收到旧轮次的片段，按轮次 ID 丢弃。</li>
</ul>
<h2>打断</h2>
<ol>
<li>停止当前播放，清空本地缓冲的音频队列。</li>
<li>通知服务端取消当前生成。</li>
<li>如果协议支持，告诉服务端用户实际听到了哪里，让下一轮上下文准确。</li>
</ol>
<p>打断不会撤销已经执行的工具操作。</p>
<h2>播放</h2>
<p>用 <code>AudioContext</code> 的时间线按顺序衔接音频片段，<code>setTimeout</code> 无法精确衔接。缓冲太小会断续，太大会让打断反应变慢。外放时声音可能被麦克风采集回来，开启回声消除并在外放、耳机、弱网环境下实测。</p>
<h2>关闭会话</h2>
<p>停止自己创建的 MediaStreamTrack，关闭 RTCPeerConnection 或 WebSocket，停止音频源，清理监听器和计时器。<code>AudioContext</code> 如果和其他功能共用，就不要直接关闭。</p>
<h2>常见追问</h2>
<ul>
<li><strong>要监控哪些指标？</strong> 用户说完到听到第一段回复的延迟、打断后停止播放的延迟、播放断续率。</li>
<li><strong>音频数据要保存吗？</strong> 音频属于敏感数据，采集、传输、保存和删除都要有明确用途并告知用户。</li>
</ul>`};export{e as default};