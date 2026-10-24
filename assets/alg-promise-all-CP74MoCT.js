var e={answerHtml:`<p>核心是把每个结果写回输入索引，用计数判断是否全部完成。普通值与 thenable 通过 Promise.resolve 统一处理；某项拒绝时整体拒绝，但不会取消其他已启动操作。</p>
<p>下面是本项目编写的教学版本，返回原生 Promise，支持常规可迭代输入；不模拟原生方法对子类构造器、被改写的内建方法等全部规范细节。生产代码优先使用原生 Promise.all。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">promiseAll</span>(<span class="hljs-params">iterable</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> results = [];
    <span class="hljs-keyword">let</span> remaining = <span class="hljs-number">1</span>; <span class="hljs-comment">// 保留一个计数，避免遍历结束前提前完成</span>
    <span class="hljs-keyword">let</span> index = <span class="hljs-number">0</span>;
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> iterable) {
      <span class="hljs-keyword">const</span> position = index++;
      remaining++;
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(item).<span class="hljs-title function_">then</span>(<span class="hljs-function"><span class="hljs-params">value</span> =&gt;</span> {
        results[position] = value;
        <span class="hljs-keyword">if</span> (--remaining === <span class="hljs-number">0</span>) <span class="hljs-title function_">resolve</span>(results);
      }, reject);
    }
    <span class="hljs-keyword">if</span> (--remaining === <span class="hljs-number">0</span>) <span class="hljs-title function_">resolve</span>(results);
  });
}
</code></pre></div>
<p>空输入得到空数组；完成顺序不同也不改变结果顺序。不可迭代输入或迭代过程抛错，会通过 Promise 构造器转成拒绝。这里的聚合不是并发数限制器：传入已经执行的异步任务，无法让它们回到尚未启动的状态。</p>
<p>手写题先明确输入约束、输出契约、重复值、空输入和异常行为，再选择数据结构。实现之后用边界样例验证，不要只运行一个正常输入；异步题还要验证顺序、取消和并发上限。</p>
<p>复杂度应同时说明时间、空间和额外资源。教学实现适合解释原理，生产代码还需要考虑可读性、监控、错误处理和已有标准库能力。</p>
<p>实际使用手写实现前，先确认数据量、调用频率和取消要求。小数据的清晰实现可能比复杂优化更合适；数据规模上来后，再根据测量结果决定是否使用标准库、缓存或专门的数据结构。</p>`};export{e as default};