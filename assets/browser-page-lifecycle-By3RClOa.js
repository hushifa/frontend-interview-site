var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>不会。用户切到别的标签页以后，浏览器为了省电，会让后台页面少干活。<code>requestAnimationFrame</code> 的回调直接停掉，CSS 动画也不再推进到屏幕上。</p>
<p><code>setTimeout</code>、<code>setInterval</code> 会被节流。Chrome 里通常最多每秒执行一次，隐藏久了还可能合并到每分钟一次。</p>
<p>浏览器还可以把后台页面冻结，也就是暂停它的任务执行。内存紧张时甚至会直接丢弃页面，用户切回来时重新加载。</p>
<p>所以依赖时间的逻辑，比如倒计时，要按真实时间戳计算，页面恢复可见时重新同步，不能假设回调按固定间隔执行。要保存的状态，在页面变成隐藏时就保存。</p>
</blockquote>
<h2>先看一个会出错的倒计时</h2>
<p>很多人这样写倒计时：<code>setInterval</code> 每秒执行一次，每次把剩余秒数减 1。页面在前台时没问题。可是切到后台，定时器被节流成每分钟一次，回来一看，剩余时间比实际多了一大截。</p>
<p>原因是这种写法假设“回调执行了几次，就过去了几秒”，而后台节流打破了这个假设。</p>
<p>改法是不数回调次数，每次都用当前时间减开始时间：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> startedAt = performance.<span class="hljs-title function_">now</span>();

<span class="hljs-keyword">function</span> <span class="hljs-title function_">elapsedSeconds</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">floor</span>((performance.<span class="hljs-title function_">now</span>() - startedAt) / <span class="hljs-number">1000</span>);
}

<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> === <span class="hljs-string">&#x27;hidden&#x27;</span>) {
    <span class="hljs-title function_">saveDraft</span>();
  } <span class="hljs-keyword">else</span> {
    <span class="hljs-title function_">render</span>(<span class="hljs-title function_">elapsedSeconds</span>());
  }
});
</code></pre></div>
<p>不管回调被延迟多久，<code>performance.now()</code> 的差值都是真实经过的时间。用 <code>Date.now()</code> 算差值也可以。页面重新可见时立刻 <code>render</code> 一次，显示就对上了。</p>
<h2>为什么在 hidden 时保存状态</h2>
<p>例子里变成 <code>hidden</code> 时调用了 <code>saveDraft()</code>。在移动端，这是最后一个可靠的时机，因为用户可能在后台直接把进程杀掉，之后什么事件都不会再来。</p>
<p>页面重新可见时，也顺手刷新一下可能已经过期的数据。</p>
<h2>页面会经历哪些状态</h2>
<p>Chrome 文档把页面分成这几个状态：</p>
<table><thead><tr><th>状态</th><th>含义</th></tr></thead><tbody><tr><td>active</td><td>可见且有输入焦点</td></tr><tr><td>passive</td><td>可见但没有焦点</td></tr><tr><td>hidden</td><td>不可见，仍可执行任务</td></tr><tr><td>frozen</td><td>冻结，任务暂停执行</td></tr><tr><td>terminated</td><td>已卸载</td></tr><tr><td>discarded</td><td>被浏览器丢弃以释放资源</td></tr></tbody></table>
<p>对应的事件有：<code>visibilitychange</code> 表示进出 hidden，<code>freeze</code> 和 <code>resume</code> 表示冻结与恢复，<code>pagehide</code> 和 <code>pageshow</code> 表示离开与返回。其中 <code>freeze</code>、<code>resume</code> 和 <code>document.wasDiscarded</code> 目前只有 Chromium 支持。</p>
<h2>常见追问</h2>
<p><strong>为什么不在 <code>unload</code> 里保存数据？</strong></p>
<blockquote>
<p>因为 <code>unload</code> 在移动端经常不触发，而且注册了它还会让页面进不了 bfcache。应该改用 <code>visibilitychange</code> 和 <code>pagehide</code>。</p>
</blockquote>
<p><strong>页面在后台还要实时收消息怎么办？</strong></p>
<blockquote>
<p>WebSocket 连接在后台一般还保持着，但处理消息的回调同样可能被延迟。如果需要在后台提醒用户，用 Push API。只需要监听可见性变化的写法，见<a href="/questions/browser-page-visibility/">《Page Visibility API 适合处理哪些页面生命周期场景？》</a>。</p>
</blockquote>`};export{e as default};