var e={answerHtml:`<p>限制并发需要接收尚未执行的任务函数，而不是已经开始的 Promise。下面的教学实现接收函数数组，最多同时等待 limit 个任务，结果按输入顺序排列。这里限制的是异步在途任务，不会让 JavaScript 计算自动多线程并行。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">runPool</span>(<span class="hljs-params">tasks, limit</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(tasks)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;任务必须是数组&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(limit) || limit &lt; <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;并发数必须为正整数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> queue = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(tasks);
  <span class="hljs-keyword">if</span> (queue.<span class="hljs-title function_">some</span>(<span class="hljs-function"><span class="hljs-params">task</span> =&gt;</span> <span class="hljs-keyword">typeof</span> task !== <span class="hljs-string">&#x27;function&#x27;</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;每个任务都必须是函数&#x27;</span>);
  }
  <span class="hljs-keyword">const</span> results = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(queue.<span class="hljs-property">length</span>);
  <span class="hljs-keyword">let</span> next = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> failed = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">worker</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">while</span> (!failed &amp;&amp; next &lt; queue.<span class="hljs-property">length</span>) {
      <span class="hljs-keyword">const</span> index = next++;
      <span class="hljs-keyword">try</span> {
        results[index] = <span class="hljs-keyword">await</span> queue[index]();
      } <span class="hljs-keyword">catch</span> (error) {
        failed = <span class="hljs-literal">true</span>; <span class="hljs-comment">// 得知失败后停止领取新任务</span>
        <span class="hljs-keyword">throw</span> error;
      }
    }
  }
  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(
    { <span class="hljs-attr">length</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(limit, queue.<span class="hljs-property">length</span>) },
    <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">worker</span>(),
  ));
  <span class="hljs-keyword">return</span> results;
}
</code></pre></div>
<p>同步抛错或异步拒绝都会使整体拒绝。得知失败前已经启动的任务仍会继续，整体拒绝不表示它们已经停止；需要取消时，应另行设计 AbortSignal 协作。示例不包含重试、超时、动态加任务或每秒限流，生产需求要分别定义这些策略。</p>
<p>代码为本项目教学实现，参考文档用于核对 Promise 语义，不是官方提供的并发池。</p>
<h3>复习提示</h3>
<p>回答时先说明输入约束、输出契约和复杂度，再处理空值、重复、取消和异常。手写实现应配最小测试，说明哪些部分是教学实现，哪些能力需要生产级库补足。可以把“并发控制、任务工厂、手写”拆成机制、实现取舍和失败恢复三个追问，并用可运行示例验证关键结论。</p>`};export{e as default};