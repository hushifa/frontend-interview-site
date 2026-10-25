var e={answerHtml:`<p>不会。浏览器可以为了省电、节省 CPU 和内存，降低后台计时器的执行频率，暂停或减少 requestAnimationFrame 回调，甚至冻结或丢弃整个页面。</p>
<p>具体策略与浏览器、设备、后台时长、媒体等活动状态有关。不能把某个浏览器的一条节流阈值，当成所有设备承诺的后台执行周期。即使在前台，setInterval 也不是精确时钟，主线程忙时照样会延迟。</p>
<h2>隐藏、冻结和丢弃不是同一件事</h2>
<p>页面隐藏时，文档通常还存在，但用户当前不一定能看到它；脚本和网络是否继续工作，要看具体能力和策略。</p>
<p>冻结意味着相应页面任务的执行受到更强限制，定时更新可能暂停。丢弃则可能连原来的页面内存都被释放，用户回来时需要重新加载，而不是从某个函数的下一行继续。</p>
<p>某些浏览器提供 freeze、resume 事件或 <code>document.wasDiscarded</code> 等辅助信息，但并非所有环境都支持相同接口，也不能期待在页面被丢弃之前一定收到可靠通知。</p>
<p>因此后台页面不适合承担“每隔十秒必须执行一次”的关键业务任务。Web Worker 也不等于脱离浏览器生命周期的永久服务；真正要求可靠执行的定时业务应有服务端或其他合适机制。</p>
<h2>为什么每秒减一的倒计时会出错</h2>
<p>假设还有六十秒，应用每次 interval 回调就把变量减一。如果页面后台二十秒只执行了几次回调，回到前台还会显示剩下很多时间，虽然现实中的截止时间已经更近了。</p>
<p>正确思路是记录截止时间，每次更新时根据当前时间重新计算剩余值。回调只决定“什么时候刷新显示”，不承担“时间到底过去了多少”的权威职责。</p>
<p>下面的函数接收一个显示元素和毫秒级截止时间，隐藏时停止刷新，恢复时立即重算：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startDeadlineCountdown</span>(<span class="hljs-params">element, expiresAt</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(expiresAt)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;截止时间必须是有效的毫秒时间戳&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> listeners = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">let</span> disposed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">stopTimer</span>(<span class="hljs-params"></span>) {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    timer = <span class="hljs-literal">undefined</span>;
  }

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">render</span>(<span class="hljs-params"></span>) {
    <span class="hljs-title function_">stopTimer</span>();
    <span class="hljs-keyword">if</span> (disposed || <span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> !== <span class="hljs-string">&#x27;visible&#x27;</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-keyword">const</span> remaining = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, expiresAt - <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>());
    element.<span class="hljs-property">textContent</span> = <span class="hljs-title class_">String</span>(<span class="hljs-title class_">Math</span>.<span class="hljs-title function_">ceil</span>(remaining / <span class="hljs-number">1000</span>));
    <span class="hljs-keyword">if</span> (remaining &gt; <span class="hljs-number">0</span>) {
      timer = <span class="hljs-built_in">setTimeout</span>(render, <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(<span class="hljs-number">1000</span>, remaining));
    }
  }

  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, render, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pagehide&#x27;</span>, stopTimer, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });
  <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pageshow&#x27;</span>, render, { <span class="hljs-attr">signal</span>: listeners.<span class="hljs-property">signal</span> });
  <span class="hljs-title function_">render</span>();

  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    disposed = <span class="hljs-literal">true</span>;
    listeners.<span class="hljs-title function_">abort</span>();
    <span class="hljs-title function_">stopTimer</span>();
  };
}
</code></pre></div>
<p>在 DOM 就绪后传入真实元素，例如剩余秒数的 span。组件销毁时调用返回函数，避免页面恢复后又启动旧组件的计时器。</p>
<p>这个例子不补跑后台错过的每一次 tick，而是直接显示现在还剩多久。到期后不再继续安排定时更新；隐藏期间也不重复写 DOM。</p>
<p>Date.now 受系统时钟变化影响，因此支付、验证码、考试等权威过期判断应由服务端或相应可信规则决定，前端倒计时只提供显示。测量短时间间隔时常用单调时间基准，但设备休眠和跨会话恢复又有自己的需求，不能把一种时钟无条件用于所有场景。</p>
<h2>轮询、在途请求和服务端任务要分别处理</h2>
<p>取消下一次 setTimeout，不会取消已经发出的 fetch；取消 fetch，也不一定撤销服务器已经开始的处理。暂停轮询需要管理下一次调度、当前请求和过期结果，而不是只清掉一个 timer 就算完成。</p>
<p>恢复时通常重新查询当前状态，再恢复正常频率。不要把后台错过的几十轮请求全部补发，否则刚回到页面就可能造成流量和主线程高峰。</p>
<p>如果有长连接，恢复时也要检查连接是否仍有效，并处理离开期间的状态缺口。页面进入 visible 不意味着网络一定恢复，更不意味着登录会话仍有效。</p>
<h2>动画恢复不应该跳着补画所有旧帧</h2>
<p>rAF 常在后台暂停，因此不能依靠“回调执行了多少次”计算长期动画进度。基于时间的动画应根据当前时间和业务状态决定恢复位置，必要时限制恢复后一帧的时间步长。</p>
<p>例如物理模拟与普通轮播的需求不同：模拟可以暂停时间轴或分步追赶，轮播可能直接切到当前状态。应用需要决定恢复语义，浏览器不会自动替业务选择。</p>
<p>后台音乐可能是用户想要的功能，不应一律在隐藏时暂停全部媒体。若确实暂停视频，还要区分用户原本就暂停了，还是应用因隐藏而暂停，避免恢复时擅自播放。</p>
<h2>保存重要数据不能只等离开事件</h2>
<p>visibilitychange 进入 hidden 往往是一个值得尽早保存状态的时机，但也可能只是用户切换标签页，并不证明会话结束。</p>
<p>移动设备可能直接结束浏览器进程，所以重要编辑内容应在使用过程中持续或适度防抖保存，并在恢复时读取持久状态。最后一刻才启动一个大型异步保存，无法保证完成。</p>
<p>小规模统计可以按需求考虑 sendBeacon 等机制，但成功入队不代表服务器已经收到，不能用它替代关键业务事务。更不能靠后台 setInterval 每隔几秒“续命”，来保证页面永远不被浏览器回收。</p>
<p>验证时应覆盖真实切后台、设备休眠、历史恢复和重新加载，并检查取消、过期结果与未保存状态。人工触发 visibilitychange 只能测试监听器逻辑，不能证明真实设备一定按相同频率节流或恢复。</p>`};export{e as default};