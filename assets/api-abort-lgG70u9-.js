var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>比如搜索框，用户连续输入，前一个请求还没回来就该作废了。这时候新建一个 <code>AbortController</code>，把它的 <code>signal</code> 传给 <code>fetch</code>，需要取消时调用 <code>controller.abort()</code>。</p>
<p>它的原理是发通知。<code>abort()</code> 让 <code>signal</code> 变成已取消，并触发 <code>abort</code> 事件。认识这个 signal 的 API 自己停下来：<code>fetch</code> 的 Promise 以 <code>AbortError</code> reject，<code>addEventListener</code> 传了 signal 的监听器会被移除。</p>
<p>另外有两个工具方法：<code>AbortSignal.timeout(ms)</code> 到时间自动取消，<code>AbortSignal.any([...])</code> 把多个 signal 合成一个，任意一个取消它就取消。</p>
<p>要注意它不是强制中断。正在跑的同步循环它打断不了，请求已经到了服务端，服务端的操作也不会撤销，浏览器只是不再等响应。而且一个 controller 取消后就作废了，下次要新建。</p>
</blockquote>
<h2>取消过期的搜索请求</h2>
<p>下面是最常见的用法：每次搜索前先取消上一次，同时加一个 5 秒超时。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> controller;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">search</span>(<span class="hljs-params">keyword</span>) {
  controller?.<span class="hljs-title function_">abort</span>();
  controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/search?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(keyword)}</span>\`</span>, {
      <span class="hljs-attr">signal</span>: <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">any</span>([controller.<span class="hljs-property">signal</span>, <span class="hljs-title class_">AbortSignal</span>.<span class="hljs-title function_">timeout</span>(<span class="hljs-number">5000</span>)]),
    });
    <span class="hljs-keyword">return</span> <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
    <span class="hljs-keyword">throw</span> error;
  }
}
</code></pre></div>
<p>为什么要取消旧请求？因为请求返回的顺序不一定等于发出的顺序。先搜“re”、再搜“react”，如果“re”的结果后回来，就会把正确结果覆盖掉，这叫竞态。取消旧请求以后，旧结果根本不会被处理。</p>
<p>两种取消的错误名不一样。超时触发时错误名是 <code>TimeoutError</code>，用户主动取消是 <code>AbortError</code>，所以可以分开处理，比如超时提示“网络慢”，主动取消就安静地忽略。</p>
<h2>为什么它打断不了同步代码</h2>
<p><code>abort()</code> 本质上是派发一个事件。事件要等当前正在执行的同步代码跑完才有机会处理，所以一段长循环在跑的时候，取消根本插不进来。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> controller.<span class="hljs-title function_">abort</span>(), <span class="hljs-number">0</span>);

<span class="hljs-keyword">const</span> start = <span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>();
<span class="hljs-keyword">while</span> (<span class="hljs-title class_">Date</span>.<span class="hljs-title function_">now</span>() - start &lt; <span class="hljs-number">50</span>) {}
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;循环结束时&#x27;</span>, controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>); <span class="hljs-comment">// 循环结束时 false</span>

<span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">0</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;之后&#x27;</span>, controller.<span class="hljs-property">signal</span>.<span class="hljs-property">aborted</span>); <span class="hljs-comment">// 之后 true</span>
</code></pre></div>
<p>定时器 0 毫秒后就该取消，可循环跑了 50 毫秒，结束时 <code>aborted</code> 还是 <code>false</code>。因为定时器回调要等同步代码让出线程才执行。改法是把长计算拆开，在循环里主动检查 <code>signal.aborted</code>，或者调用 <code>signal.throwIfAborted()</code>，并且中间要让出线程，取消才有机会发生。</p>
<h2>让自己的函数支持取消</h2>
<p>自己写的异步函数也可以接收 signal。下面是一个能被取消的 <code>wait</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">wait</span>(<span class="hljs-params">ms, { signal } = {}</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    signal?.<span class="hljs-title function_">throwIfAborted</span>();
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">onAbort</span> = (<span class="hljs-params"></span>) =&gt; {
      <span class="hljs-built_in">clearTimeout</span>(timer);
      <span class="hljs-title function_">reject</span>(signal.<span class="hljs-property">reason</span>);
    };
    <span class="hljs-comment">// 正常结束时移除监听，复用同一个 signal 时不会累积</span>
    <span class="hljs-keyword">const</span> timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      signal?.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort);
      <span class="hljs-title function_">resolve</span>();
    }, ms);
    signal?.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;abort&#x27;</span>, onAbort, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
  });
}
</code></pre></div>
<p>开头的 <code>throwIfAborted()</code> 处理“传进来时已经取消了”的情况，直接抛出。之后监听 <code>abort</code> 事件，取消时清掉定时器并用 <code>signal.reason</code> reject。正常结束时要把监听移除，否则同一个 signal 被多次使用，监听器会越积越多。</p>
<h2>哪些东西取消不了</h2>
<p>最容易误解的是请求已经到了服务端。取消只是浏览器不再等待响应，服务端照样把操作做完。所以下单、支付这类写操作，不能指望前端取消，要用幂等键，让服务端识别重复请求，防止重试导致执行两次。</p>
<p>另外，已经开始的同步代码取消不了，上一节讲过。不接受 signal 的第三方 API 也取消不了，因为它根本不会去听这个通知。</p>
<h2>常见追问</h2>
<p><strong>一个 controller 能重复使用吗？</strong></p>
<blockquote>
<p>不能。取消以后它的 signal 永远处于已取消状态，再传给新请求，请求会立刻失败。所以每次新操作都要新建一个 controller。</p>
</blockquote>
<p><strong>React 里怎么用？</strong></p>
<blockquote>
<p>在 <code>useEffect</code> 里创建 controller，把 signal 传给请求，清理函数里调用 <code>abort()</code>。这样组件卸载或依赖变化时，旧请求会被取消，不会把过期数据写进 state。</p>
</blockquote>`};export{e as default};