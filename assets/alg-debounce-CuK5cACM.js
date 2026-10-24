var e={answerHtml:`<p>防抖将短时间内密集发生的调用合并。下面实现的是尾沿执行版本：距离最后一次调用经过 wait 后才执行，保留最后的参数与 this，并支持取消。它不包含首沿执行、最大等待时间或返回 Promise 等扩展语义。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">debounce</span>(<span class="hljs-params">fn, wait</span>) {
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">wrapped</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      timer = <span class="hljs-literal">undefined</span>;
      fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
    }, wait);
  }
  wrapped.<span class="hljs-property">cancel</span> = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    timer = <span class="hljs-literal">undefined</span>;
  };
  <span class="hljs-keyword">return</span> wrapped;
}
</code></pre></div>
<p>适合搜索建议等允许等待输入停顿的场景。持续输入可能一直不触发；组件卸载时应取消未执行任务。计时器延迟是调度条件，不是精确执行时刻。异步请求本身的取消和返回顺序还需要另外处理。</p>`};export{e as default};