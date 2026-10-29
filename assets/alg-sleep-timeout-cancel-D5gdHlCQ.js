var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>轮询接口时想每次间隔一秒再请求，可以写 <code>await sleep(1000)</code>。<code>sleep</code> 就是返回一个 Promise，在 <code>setTimeout</code> 到点时 resolve 它。</p>
<p>给请求加超时，最简单的写法是 <code>Promise.race([request, timeout])</code>：<code>timeout</code> 是一个到点就 reject 的 Promise，谁先有结果就用谁的。但 <code>race</code> 只是让调用方不再等，请求本身还在跑，结果来了也没人用。</p>
<p>想真正停下工作，要用 <code>AbortController</code>：把 <code>controller.signal</code> 传给 <code>fetch</code> 或自己写的异步函数，调用 <code>controller.abort()</code> 后，它们监听到 <code>abort</code> 事件，自己清掉定时器或中断请求，并以 <code>signal.reason</code> 拒绝。<code>AbortSignal.timeout(ms)</code> 直接给出一个到点自动取消的 signal，拒绝原因是 <code>TimeoutError</code>。</p>
<p>Promise 本身没有“取消”这个状态，所谓可取消，是让产生结果的那段代码配合 signal 停下来，再把 Promise 拒绝掉。</p>
</blockquote>
<h2>sleep 和 Promise.race 超时</h2>
<p>先看最基础的两个工具：<code>sleep</code> 支持传入 <code>signal</code>，<code>withTimeout</code> 用 <code>race</code> 给任意 Promise 加时限。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">sleep</span>(<span class="hljs-params">ms, { signal } = {}</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">if</span> (signal?.<span class="hljs-property">aborted</span>) <span class="hljs-keyword">return</span> <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      <span class="hljs-title function_">resolve</span>();
    }, ms);
    <span class="hljs-keyword">function</span> <span class="hljs-title function_">onAbort</span>(<span class="hljs-params"></span>) {
      <span class="hljs-built_in">clearTimeout</span>(timer);
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
    }
    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  });
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">withTimeout</span>(<span class="hljs-params">promise, ms</span>) {
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">const</span> timeout = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">_, reject</span>) =&gt;</span> {
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`超时 <span class="hljs-subst">\${ms}</span>ms\`</span>)), ms);
  });
  <span class="hljs-keyword">return</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>([promise, timeout]).<span class="hljs-title function_">finally</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-built_in">clearTimeout</span>(timer));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">main</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> t0 = <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>();
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">sleep</span>(<span class="hljs-number">50</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() - t0 &gt;= <span class="hljs-number">45</span>); <span class="hljs-comment">// true</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-keyword">await</span> <span class="hljs-title function_">withTimeout</span>(<span class="hljs-title function_">sleep</span>(<span class="hljs-number">10</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-string">&#x27;ok&#x27;</span>), <span class="hljs-number">100</span>)); <span class="hljs-comment">// ok</span>
  <span class="hljs-keyword">try</span> { <span class="hljs-keyword">await</span> <span class="hljs-title function_">withTimeout</span>(<span class="hljs-title function_">sleep</span>(<span class="hljs-number">200</span>), <span class="hljs-number">30</span>); } <span class="hljs-keyword">catch</span> (e) { <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e.<span class="hljs-property">message</span>); } <span class="hljs-comment">// 超时 30ms</span>

  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">const</span> p = <span class="hljs-title function_">sleep</span>(<span class="hljs-number">1000</span>, { <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span> });
  controller.<span class="hljs-title function_">abort</span>();
  <span class="hljs-keyword">try</span> { <span class="hljs-keyword">await</span> p; } <span class="hljs-keyword">catch</span> (e) { <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e.<span class="hljs-property">name</span>); } <span class="hljs-comment">// AbortError</span>

  <span class="hljs-keyword">try</span> { <span class="hljs-keyword">await</span> <span class="hljs-title function_">sleep</span>(<span class="hljs-number">1000</span>, { <span class="hljs-attr">signal</span>: <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">20</span>) }); } <span class="hljs-keyword">catch</span> (e) { <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(e.<span class="hljs-property">name</span>); } <span class="hljs-comment">// TimeoutError</span>
}
<span class="hljs-title function_">main</span>();
</code></pre></div>
<p>第一行比较的是 <code>&gt;= 45</code> 而不是 <code>&gt;= 50</code>，因为定时器只保证“不早于大约这个时间”触发，不同环境的计时精度不同，留一点余量让示例稳定。</p>
<p>为什么 <code>withTimeout</code> 里要 <code>finally</code> 清掉定时器？请求先完成时，那个超时定时器还挂着，不清的话它到点仍会 reject 一个已经没人关心的 Promise，在 Node 里还会让进程多等一会儿才退出。</p>
<p><code>withTimeout(sleep(200), 30)</code> 在 30 毫秒时报了超时，可是 <code>sleep(200)</code> 的定时器并没有被清掉，它照样会在 200 毫秒时 resolve。换成真实请求就是：页面已经提示超时了，请求还在占着网络，服务端也照常处理。这就是 <code>race</code> 的局限，它只决定“用谁的结果”，管不了另一方。MDN 对 <code>race</code> 的描述也是：返回的 Promise 跟随第一个敲定的 Promise 的状态。</p>
<h2>用 AbortController 让工作真正停下</h2>
<p><code>sleep</code> 里接收 <code>signal</code>，在 <code>abort</code> 事件里 <code>clearTimeout</code>，这才是真正把工作停了。MDN 写明，<code>abort()</code> 不传原因时，<code>reason</code> 是一个名为 <code>AbortError</code> 的 <code>DOMException</code>；<code>AbortSignal.timeout()</code> 到点时 <code>reason</code> 是名为 <code>TimeoutError</code> 的 <code>DOMException</code>。示例最后两行打印的就是这两个名字。</p>
<p>函数开头先检查 <code>signal.aborted</code>，因为 signal 可能在传进来之前就已经取消了，这时 <code>abort</code> 事件不会再触发，不检查就会白等。resolve 时顺手 <code>removeEventListener</code>，避免同一个 signal 被多次复用时监听器越积越多。</p>
<p><code>fetch</code> 已经内置了这套逻辑，所以浏览器里给请求加超时，直接写 <code>fetch(url, { signal: AbortSignal.timeout(5000) })</code> 即可，到点请求会被中止，Promise 以 <code>TimeoutError</code> 拒绝。既要支持超时、又要支持用户手动取消时，用 <code>AbortSignal.any([controller.signal, AbortSignal.timeout(5000)])</code> 把两个 signal 合成一个，MDN 写明任意一个输入取消，合成的 signal 就取消。</p>
<p>MDN 还提到，<code>AbortSignal.timeout()</code> 计的是“活跃时间”，页面进入 bfcache 或所在的 worker 被挂起时会暂停计时。需要按墙上时间严格计时的场景要注意这点。</p>
<h2>常见追问</h2>
<p><strong>为什么不能直接给 Promise 加一个 cancel 方法？</strong></p>
<blockquote>
<p>可以在外面包一层，暴露 <code>cancel</code> 去 reject，但这和 <code>race</code> 一样，只是让等待的人提前收到拒绝，产生结果的代码不知道要停。真正有用的取消，要让执行工作的函数拿到一个能监听的信号，<code>AbortSignal</code> 就是浏览器和 Node 都支持的标准做法。</p>
</blockquote>
<p><strong>怎样区分是超时还是用户主动取消？</strong></p>
<blockquote>
<p>看拒绝原因的 <code>name</code>：<code>AbortSignal.timeout</code> 给出的是 <code>TimeoutError</code>，<code>controller.abort()</code> 不传参数时是 <code>AbortError</code>。也可以在 <code>abort(reason)</code> 里传自定义原因，<code>signal.reason</code> 会原样带出来。更多取消细节见<a href="/questions/api-abort/">《AbortController 能取消什么，不能取消什么？》</a>。</p>
</blockquote>`};export{e as default};