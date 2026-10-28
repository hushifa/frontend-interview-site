var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>vi.useFakeTimers()</code> 替换 <code>setTimeout</code>、<code>setInterval</code>、<code>setImmediate</code>、<code>Date</code> 等，默认不替换 <code>process.nextTick</code> 和 <code>queueMicrotask</code>。</li>
<li>同步的 <code>vi.advanceTimersByTime()</code> 只触发到期的定时器；定时器回调里有 <code>await</code> 时，后续代码排在微任务里，要用 <code>advanceTimersByTimeAsync()</code> 才能一起推进。</li>
<li><code>vi.runAllTimersAsync()</code> 一直执行直到没有定时器，无限轮询会在循环上限（默认 10000 次）后抛错，所以轮询测试应按时间推进。</li>
<li><code>vi.setSystemTime()</code> 只修改当前时间，不触发定时器，适合测试“过期”“今天”这类逻辑。</li>
<li>每个测试结束后调用 <code>vi.useRealTimers()</code>，否则后续测试会继承假时钟。</li>
</ul>
<h2>测试重试</h2>
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
<p>如果把 <code>advanceTimersByTimeAsync</code> 换成同步的 <code>advanceTimersByTime</code>，<code>load</code> 被拒绝后的 <code>catch</code> 和新的 <code>setTimeout</code> 还没来得及执行，时间就已经推进完了，调用次数对不上。</p>
<h2>测试全部失败</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-title function_">test</span>(<span class="hljs-string">&#x27;重试用尽后抛出最后一次错误&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">const</span> load = vi.<span class="hljs-title function_">fn</span>().<span class="hljs-title function_">mockRejectedValue</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;down&#x27;</span>));
  <span class="hljs-keyword">const</span> result = <span class="hljs-title function_">fetchWithRetry</span>(load);
  <span class="hljs-keyword">const</span> assertion = <span class="hljs-title function_">expect</span>(result).<span class="hljs-property">rejects</span>.<span class="hljs-title function_">toThrow</span>(<span class="hljs-string">&#x27;down&#x27;</span>);

  <span class="hljs-keyword">await</span> vi.<span class="hljs-title function_">advanceTimersByTimeAsync</span>(<span class="hljs-number">3000</span>);
  <span class="hljs-keyword">await</span> assertion;
});
</code></pre></div>
<p>先创建断言再推进时间。否则 Promise 在推进过程中被拒绝，而此时还没有任何处理器，会报出未处理的拒绝。</p>
<h2>假时钟的边界</h2>
<ul>
<li>真实的网络请求、文件读写不受假时钟控制，测试里还在等真实 I/O 时，推进时间没有意义。</li>
<li>浏览器的 <code>requestAnimationFrame</code>、动画时间线在 jsdom 中通常需要单独模拟。</li>
<li>Playwright 端到端测试用 <code>page.clock</code> 控制页面里的时间，原理类似。</li>
<li>假时钟证明的是“时间逻辑正确”，不能证明真实环境下的超时配置合理，后者需要集成测试或监控。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>什么时候不用假时钟？等待时间只有几十毫秒、逻辑依赖真实事件循环（例如流式读取）时，用真实时间加 <code>vi.waitFor</code> 更简单。</li>
</ul>`};export{e as default};