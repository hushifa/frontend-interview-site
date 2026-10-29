var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>测重试、超时这类逻辑时，不可能真的等几秒钟，所以要用假时钟。<code>vi.useFakeTimers()</code> 会把 <code>setTimeout</code>、<code>setInterval</code>、<code>setImmediate</code>、<code>Date</code> 等换成假的，时间由测试手动往前拨；默认不替换 <code>process.nextTick</code> 和 <code>queueMicrotask</code>。</p>
<p>最容易踩的坑是同步推进。<code>vi.advanceTimersByTime()</code> 只会触发到期的定时器，可是定时器回调里如果有 <code>await</code>，后面的代码排在微任务里，还没来得及跑时间就推完了。所以要用 <code>advanceTimersByTimeAsync()</code>，让 Promise 回调跟着一起执行。</p>
<p>还有两个相关的 API。<code>vi.runAllTimersAsync()</code> 会一直执行到没有定时器为止，遇到无限轮询会在循环上限（默认 10000 次）后抛错，所以轮询逻辑应该按时间推进。<code>vi.setSystemTime()</code> 只改当前时间，不触发定时器，适合测“过期”“今天”这类逻辑。</p>
<p>最后，每个测试结束后要调用 <code>vi.useRealTimers()</code>，不然后面的测试会继承这个假时钟。</p>
</blockquote>
<h2>怎样测一个带退避的重试函数</h2>
<p>下面的函数失败后会等一段时间再试，每次等待时间翻倍，第一次等 1000ms，第二次等 2000ms：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">fetchWithRetry</span>(<span class="hljs-params"><span class="hljs-attr">load</span>: () =&gt; <span class="hljs-title class_">Promise</span>&lt;<span class="hljs-built_in">string</span>&gt;, retries = <span class="hljs-number">2</span>, delay = <span class="hljs-number">1000</span></span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> attempt = <span class="hljs-number">0</span>; ; attempt++) {
    <span class="hljs-keyword">try</span> {
      <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> <span class="hljs-title function_">load</span>();
    } <span class="hljs-keyword">catch</span> (error) {
      <span class="hljs-keyword">if</span> (attempt &gt;= retries) <span class="hljs-keyword">throw</span> error;
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, delay * <span class="hljs-number">2</span> ** attempt));
    }
  }
}
</code></pre></div>
<p>测试让 <code>load</code> 前两次失败、第三次成功，然后一点点拨时间，检查每个时刻调用了几次：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { afterEach, beforeEach, expect, test, vi } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;vitest&#x27;</span>;

<span class="hljs-title function_">beforeEach</span>(<span class="hljs-function">() =&gt;</span> vi.<span class="hljs-title function_">useFakeTimers</span>());
<span class="hljs-title function_">afterEach</span>(<span class="hljs-function">() =&gt;</span> vi.<span class="hljs-title function_">useRealTimers</span>());

<span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;失败两次后在第三次成功&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> load = vi.<span class="hljs-title function_">fn</span>()
    .<span class="hljs-title function_">mockRejectedValueOnce</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;a&#x27;</span>))
    .<span class="hljs-title function_">mockRejectedValueOnce</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;b&#x27;</span>))
    .<span class="hljs-title function_">mockResolvedValue</span>(<span class="hljs-string">&#x27;ok&#x27;</span>);

  <span class="hljs-keyword">const</span> result = <span class="hljs-title function_">fetchWithRetry</span>(load);

  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">999</span>);
  <span class="hljs-title function_">expect</span>(load).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">1</span>);

  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">1</span>);
  <span class="hljs-title function_">expect</span>(load).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">2</span>);

  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">2000</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">expect</span>(result).<span class="hljs-property">resolves</span>.<span class="hljs-title function_">toBe</span>(<span class="hljs-string">&#x27;ok&#x27;</span>);
  <span class="hljs-title function_">expect</span>(load).<span class="hljs-title function_">toHaveBeenCalledTimes</span>(<span class="hljs-number">3</span>);
});
</code></pre></div>
<p>拨到 999ms 时还只调用了 1 次，再拨 1ms 正好到 1000ms，第二次调用发生。这样连等待时间是不是刚好 1000ms 都验证到了。</p>
<p>如果把 <code>advanceTimersByTimeAsync</code> 换成同步的 <code>advanceTimersByTime</code>，调用次数就会对不上。原因是 <code>load</code> 被拒绝以后，进入 <code>catch</code>、再创建新的 <code>setTimeout</code>，这些都要等微任务执行；同步推进不会让出执行权，时间已经推完了，新的定时器才刚刚创建。</p>
<h2>测试重试全部失败时要注意什么</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;重试用尽后抛出最后一次错误&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> load = vi.<span class="hljs-title function_">fn</span>().<span class="hljs-title function_">mockRejectedValue</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;down&#x27;</span>));
  <span class="hljs-keyword">const</span> result = <span class="hljs-title function_">fetchWithRetry</span>(load);
  <span class="hljs-keyword">const</span> assertion = <span class="hljs-title function_">expect</span>(result).<span class="hljs-property">rejects</span>.<span class="hljs-title function_">toThrow</span>(<span class="hljs-string">&#x27;down&#x27;</span>);

  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">3000</span>);
  <span class="hljs-keyword">await</span> assertion;
});
</code></pre></div>
<p>这里先创建断言，再推进时间。顺序反过来会怎样？Promise 会在推进时间的过程中被拒绝，而那时还没有任何地方处理这个拒绝，就会报出未处理的拒绝。先写好断言，相当于提前挂上了处理器。</p>
<h2>假时钟管不到什么</h2>
<p>真实的网络请求、文件读写不受假时钟控制。如果测试还在等真实的 I/O，推进时间没有意义。浏览器的 <code>requestAnimationFrame</code>、动画时间线，在 jsdom 里通常要另外模拟。Playwright 的端到端测试里用 <code>page.clock</code> 控制页面时间，原理类似。</p>
<p>还要分清它证明了什么。假时钟证明的是“时间相关的逻辑写对了”，不能证明真实环境下超时设得合不合理，那要靠集成测试或线上监控。</p>
<h2>常见追问</h2>
<p><strong>什么时候不用假时钟？</strong></p>
<blockquote>
<p>等待时间只有几十毫秒，或者逻辑依赖真实的事件循环，比如流式读取，这时直接用真实时间加 <code>vi.waitFor</code> 更简单。</p>
</blockquote>`};export{e as default};