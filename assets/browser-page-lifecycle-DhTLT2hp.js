var e={answerHtml:`<h2>简答</h2>
<ul>
<li>页面在后台时，<code>requestAnimationFrame</code> 回调停止执行，CSS 动画也不再推进到屏幕。</li>
<li>后台的 <code>setTimeout</code>、<code>setInterval</code> 会被节流，Chrome 中通常最多每秒执行一次，长时间隐藏后可能进一步合并到每分钟一次。</li>
<li>浏览器可以冻结后台页面（暂停任务执行），内存紧张时还会丢弃页面，用户切回时重新加载。</li>
<li>依赖时间的逻辑应按真实时间戳计算，在页面恢复可见时重新同步，而不是假设回调按固定间隔执行。</li>
</ul>
<h2>页面生命周期状态</h2>
<p>Chrome 文档中定义的状态：</p>
<table><thead><tr><th>状态</th><th>含义</th></tr></thead><tbody><tr><td>active</td><td>可见且有输入焦点</td></tr><tr><td>passive</td><td>可见但没有焦点</td></tr><tr><td>hidden</td><td>不可见，仍可执行任务</td></tr><tr><td>frozen</td><td>冻结，任务暂停执行</td></tr><tr><td>terminated</td><td>已卸载</td></tr><tr><td>discarded</td><td>被浏览器丢弃以释放资源</td></tr></tbody></table>
<p>对应事件：<code>visibilitychange</code>（hidden 进出）、<code>freeze</code> 和 <code>resume</code>（冻结与恢复）、<code>pagehide</code> 和 <code>pageshow</code>（离开与返回）。<code>freeze</code>、<code>resume</code> 和 <code>document.wasDiscarded</code> 目前只有 Chromium 支持。</p>
<h2>应对写法</h2>
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
<ul>
<li>倒计时按 <code>Date.now()</code> 或 <code>performance.now()</code> 的差值计算剩余时间，不按回调次数累加。</li>
<li>在 <code>visibilitychange</code> 变为 hidden 时保存状态。这是移动端最后一个可靠的时机，用户可能直接从后台杀掉进程。</li>
<li>页面重新可见时刷新可能过期的数据。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>后台还要保持实时消息怎么办：WebSocket 连接在后台一般保持，但处理消息的回调同样可能被延迟；需要通知时用 Push API。</li>
<li>为什么不在 <code>unload</code> 里保存数据：<code>unload</code> 在移动端经常不触发，还会阻止页面进入 bfcache，应改用 <code>visibilitychange</code> 和 <code>pagehide</code>。</li>
<li>只需要监听可见性变化的写法，见<a href="/questions/browser-page-visibility/">《Page Visibility API 适合处理哪些页面生命周期场景？》</a>。</li>
</ul>`};export{e as default};