var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户切到别的标签页，你的页面还在每 5 秒轮询一次接口，这既浪费流量也浪费电。Page Visibility API 能告诉你页面现在是不是在前台：<code>document.visibilityState</code> 是 <code>visible</code> 或 <code>hidden</code>，变化时触发 <code>visibilitychange</code> 事件。</p>
<p>切换标签页、最小化窗口、锁屏、手机切到后台，都会变成 <code>hidden</code>。</p>
<p>它适合在隐藏时暂停轮询、动画、视频和计时，恢复可见时立刻刷新一次。变成 <code>hidden</code> 时也是保存草稿的好时机。</p>
<p>要注意它说的是整个文档在不在前台，不管页面里某个元素有没有在视口里。判断元素可见用 IntersectionObserver。</p>
</blockquote>
<h2>先看一个只在可见时走动的时钟</h2>
<p>下面的时钟在页面隐藏时停下，回来时马上显示当前时间：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startVisibleClock</span>(<span class="hljs-params">element</span>) {
  <span class="hljs-keyword">let</span> timer;

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">render</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-keyword">const</span> now = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>();
    element.<span class="hljs-property">dateTime</span> = now.<span class="hljs-title function_">toISOString</span>();
    element.<span class="hljs-property">textContent</span> = now.<span class="hljs-title function_">toLocaleTimeString</span>(<span class="hljs-string">&#x27;zh-CN&#x27;</span>, { <span class="hljs-attr">hour12</span>: <span class="hljs-literal">false</span> });
  };

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">sync</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-built_in">clearInterval</span>(timer);
    timer = <span class="hljs-literal">undefined</span>;
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">visibilityState</span> !== <span class="hljs-string">&#x27;visible&#x27;</span>) <span class="hljs-keyword">return</span>;

    <span class="hljs-title function_">render</span>();
    timer = <span class="hljs-built_in">setInterval</span>(render, <span class="hljs-number">1000</span>);
  };

  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, sync);
  <span class="hljs-title function_">sync</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;visibilitychange&#x27;</span>, sync);
    <span class="hljs-built_in">clearInterval</span>(timer);
  };
}
</code></pre></div>
<p>所有逻辑都在 <code>sync</code> 里。页面变成 <code>hidden</code>，它清掉定时器就返回；变回 <code>visible</code>，它先渲染一次，再开新的定时器。</p>
<p>为什么每次都要先 <code>clearInterval</code>？因为 <code>visible</code> 可能连续收到好几次。如果不先清，每次都新开一个定时器，最后会有好几个定时器同时在跑。先清再开，就保证只有一个。</p>
<p>为什么恢复时要立刻 <code>render()</code>？如果只开定时器，要等一秒才更新，这一秒里显示的还是隐藏前那一刻的时间。</p>
<p>最后返回的函数同时移除监听器和定时器，组件卸载时调用它，什么都不会留下。</p>
<h2>实际开发中用在哪里</h2>
<p>最常见的是轮询接口：隐藏时停止，可见时立即请求一次，再恢复轮询。视频和轮播图也一样，隐藏时暂停。</p>
<p>统计停留时长时，只累计可见的那段时间，否则用户开着标签页去吃饭，停留时长就虚高了。</p>
<p>保存草稿放在变成 <code>hidden</code> 的时候。在移动端，这是最后一个可靠的时机，用户可能接着就把应用从后台杀掉了。</p>
<h2>常见追问</h2>
<p><strong><code>document.hidden</code> 和 <code>visibilityState</code> 有什么区别？</strong></p>
<blockquote>
<p><code>document.hidden</code> 是个布尔值，等价于 <code>visibilityState === &#x27;hidden&#x27;</code>。两者说的是同一件事，<code>visibilityState</code> 是字符串，读起来更直观。</p>
</blockquote>
<p><strong>页面在后台时，定时器和动画会怎样？</strong></p>
<blockquote>
<p>会被浏览器限制，<code>requestAnimationFrame</code> 暂停，定时器被节流。详见<a href="/questions/browser-page-lifecycle/">《页面进入后台后，计时器和动画还会按原速度运行吗？》</a>。</p>
</blockquote>`};export{e as default};