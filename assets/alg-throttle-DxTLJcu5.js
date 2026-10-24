var e={answerHtml:`<p>节流限制连续调用的执行频率。下面是首沿版本：第一次立即执行，然后在等待窗口内丢弃后续调用。它不会在窗口结束时补执行最后一次调用，因此不能直接替代需要尾沿结果的方案。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">throttle</span>(<span class="hljs-params">fn, wait</span>) {
  <span class="hljs-keyword">let</span> blocked = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">function</span> <span class="hljs-title function_">wrapped</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">if</span> (blocked) <span class="hljs-keyword">return</span>;
    blocked = <span class="hljs-literal">true</span>;
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> { blocked = <span class="hljs-literal">false</span>; }, wait);
    <span class="hljs-keyword">return</span> fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  }
  wrapped.<span class="hljs-property">cancel</span> = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    blocked = <span class="hljs-literal">false</span>;
  };
  <span class="hljs-keyword">return</span> wrapped;
}
</code></pre></div>
<p>选择前先说明首沿、尾沿、取消和异常语义。频率限制也无法保证单次回调很快；若回调本身耗时，仍需降低计算或布局成本。后台计时器会被节流，不应依赖毫秒级准确触发。</p>
<h3>实现与验证</h3>
<p>手写题先明确输入约束、输出契约、重复值、空输入和异常行为，再选择数据结构。实现之后用边界样例验证，不要只运行一个正常输入；异步题还要验证顺序、取消和并发上限。</p>
<p>复杂度应同时说明时间、空间和额外资源。教学实现适合解释原理，生产代码还需要考虑可读性、监控、错误处理和已有标准库能力。</p>`};export{e as default};