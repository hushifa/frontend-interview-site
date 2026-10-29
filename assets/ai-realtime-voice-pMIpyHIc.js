var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一次语音对话要经过很多步：麦克风采集、网络传输、服务端判断你说完没有并转成文字、模型生成回答、合成语音、浏览器播放。所以连接建立了，不代表模型已经收到了你的声音。</p>
<p>状态至少要分五类分开记：麦克风（权限、是否在采集）、连接、当前是第几轮、生成、播放，再用轮次 ID 把它们关联起来。</p>
<p>传输方式上，WebRTC 自带媒体传输和弱网适应；如果用 WebSocket 传音频，编码、缓冲、播放时间都得自己处理。</p>
<p>最容易做错的是打断。用户插话时，要停止播放、清空待播的音频，同时通知服务端取消生成。只是把扬声器静音的话，模型其实还在后台算。另外，浏览器直连语音服务时，要用服务端签发的短期令牌，不能把长期密钥放进前端。</p>
</blockquote>
<h2>状态要怎么分</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">VoiceSession</span> = {
  <span class="hljs-attr">mic</span>: <span class="hljs-string">&#x27;idle&#x27;</span> | <span class="hljs-string">&#x27;requesting&#x27;</span> | <span class="hljs-string">&#x27;denied&#x27;</span> | <span class="hljs-string">&#x27;capturing&#x27;</span>;
  <span class="hljs-attr">connection</span>: <span class="hljs-string">&#x27;connecting&#x27;</span> | <span class="hljs-string">&#x27;open&#x27;</span> | <span class="hljs-string">&#x27;reconnecting&#x27;</span> | <span class="hljs-string">&#x27;closed&#x27;</span>;
  <span class="hljs-attr">turnId</span>: <span class="hljs-built_in">string</span> | <span class="hljs-literal">null</span>;
  <span class="hljs-attr">generation</span>: <span class="hljs-string">&#x27;idle&#x27;</span> | <span class="hljs-string">&#x27;thinking&#x27;</span> | <span class="hljs-string">&#x27;speaking&#x27;</span> | <span class="hljs-string">&#x27;cancelled&#x27;</span>;
  <span class="hljs-attr">playback</span>: { <span class="hljs-attr">queued</span>: <span class="hljs-built_in">number</span>; <span class="hljs-attr">playing</span>: <span class="hljs-built_in">boolean</span> };
};
</code></pre></div>
<p>为什么拆这么细？因为它们会各自变化。比如连接正在重连，麦克风还在采集；模型已经生成完了，播放队列里还有好几段没播。合成一个状态就表达不了。</p>
<p>麦克风指示灯要反映 track 的真实状态，不能只看用户有没有点过按钮。track 是浏览器给你的那一路音频流。权限被拒、设备被别的程序占用、耳机被拔出，都要有文字提示，并且提供文字输入作为替代。</p>
<p>还有一个容易漏的情况：<code>getUserMedia()</code> 是异步的，等它返回时，组件可能已经关掉了。这时要马上把返回的 track 停掉，不然用户已经离开页面，麦克风还在偷偷采集。</p>
<h2>转写和轮次怎么处理</h2>
<p>语音转文字通常会先给一个临时结果，过一会儿再给修正后的最终结果。所以收到同一轮的新结果时，要按片段 ID 替换掉临时内容，而不是接在后面，不然屏幕上的文字会重复。</p>
<p>判断用户说完没有，一般靠语音活动检测，就是根据声音有没有停下来自动判断。它会被噪声和说话时的停顿干扰，所以可以再提供“按住说话”或者手动结束作为补充。</p>
<p>断线重连以后，可能还会收到上一轮的片段，按轮次 ID 丢掉就行。</p>
<h2>用户打断时要做哪些事</h2>
<p>第一步，停止当前播放，清空本地缓冲的音频队列。第二步，通知服务端取消当前生成。第三步，如果协议支持，告诉服务端用户实际听到了哪里，这样下一轮的上下文才准确，模型不会以为用户听完了整段回答。</p>
<p>还要知道，打断撤销不了已经执行的工具操作。</p>
<h2>播放为什么不能用 setTimeout 衔接</h2>
<p>音频是一段一段到达的，要无缝接起来播。<code>setTimeout</code> 的时间不精确，段与段之间会有空隙或重叠。要用 <code>AudioContext</code> 的时间线，按精确的时间点安排每一段的开始。</p>
<p>缓冲区大小要权衡：太小，网络一抖就断断续续；太大，用户打断后要等好一会儿声音才停。</p>
<p>外放时，扬声器的声音可能又被麦克风录进去，模型听到自己的话。所以要开启回声消除，并且在外放、耳机、弱网几种环境下实际测一遍。</p>
<h2>关闭会话要释放什么</h2>
<p>停止自己创建的 MediaStreamTrack，关闭 RTCPeerConnection 或 WebSocket，停止音频源，清理监听器和定时器。<code>AudioContext</code> 如果还被其他功能共用，就不要直接关掉它。</p>
<h2>常见追问</h2>
<p><strong>要监控哪些指标？</strong></p>
<blockquote>
<p>用户说完到听到第一段回复的延迟、打断后到声音停下来的延迟、播放断续的比例。</p>
</blockquote>
<p><strong>音频数据要保存吗？</strong></p>
<blockquote>
<p>音频是敏感数据。采集、传输、保存、删除都要有明确的用途，并且告诉用户。</p>
</blockquote>`};export{e as default};