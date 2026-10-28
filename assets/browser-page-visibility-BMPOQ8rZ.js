var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>document.visibilityState</code> 的值是 <code>visible</code> 或 <code>hidden</code>，变化时触发 <code>visibilitychange</code>。</li>
<li>切换标签页、最小化窗口、锁屏、移动端切到后台都会变成 <code>hidden</code>。</li>
<li>适合在隐藏时暂停轮询、动画、视频和计时，在恢复可见时立刻刷新一次。</li>
<li>它描述的是整个文档；判断某个元素是否在视口内用 IntersectionObserver。</li>
</ul>
<h2>示例：只在可见时更新的时钟</h2>
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
<ul>
<li><code>sync</code> 每次先清除旧定时器，重复收到 <code>visible</code> 也只会保留一个定时器。</li>
<li>恢复可见时立即调用 <code>render()</code>，显示的时间不会停在隐藏前那一刻。</li>
<li>返回的函数同时移除监听器和定时器。</li>
</ul>
<h2>典型场景</h2>
<ul>
<li>轮询接口：隐藏时停止，可见时立即请求一次再恢复轮询。</li>
<li>视频或轮播：隐藏时暂停。</li>
<li>统计停留时长：只累计可见时间。</li>
<li>保存草稿：变成 <code>hidden</code> 时保存，这是移动端最后一个可靠时机。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>document.hidden</code> 和 <code>visibilityState</code>：<code>hidden</code> 是布尔值，等价于 <code>visibilityState === &#x27;hidden&#x27;</code>。</li>
<li>页面在后台时定时器和动画会怎样，见<a href="/questions/browser-page-lifecycle/">《页面进入后台后，计时器和动画还会按原速度运行吗？》</a>。</li>
</ul>`};export{e as default};