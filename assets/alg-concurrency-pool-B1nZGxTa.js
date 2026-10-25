var e={answerHtml:`<p>假设要请求 100 张图片的元数据。全部同时开始可能让服务端、网络和浏览器承受不必要的压力；一个完成后再请求下一个，又可能太慢。并发池选择折中方式，例如同时最多执行 4 个，一个结束就补一个，直到全部完成。</p>
<p>这里限制的是尚未完成的异步任务数量，不是 JavaScript 线程数，也不是“每秒最多请求 4 次”。如果每个请求只需 10 毫秒，即使并发数只有 4，每秒也可能发出很多请求。</p>
<h3>先把任务的启动权交给池子</h3>
<p>对于一个 URL 数组，<code>urls.map(url =&gt; fetch(url))</code> 会立即调用每个 <code>fetch</code>，得到的是已经启动的请求。改成 <code>urls.map(url =&gt; () =&gt; fetch(url))</code>，得到的才是尚未执行的任务函数。</p>
<p>Promise 本身并不等于“一个会自动启动的任务”。问题在于创建这些 Promise 时，相关操作通常已经启动了。池子必须拿到函数，才有机会控制启动时间。</p>
<p>下面的实现接收函数数组，每个函数可以返回普通值或 Promise；按原数组顺序返回结果。参数先整体验证，避免执行了一半才发现后面的条目不是函数。首次发现任务失败后，不再领取新任务，但不会中断已经开始的任务。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">runPool</span>(<span class="hljs-params">tasks, limit</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Array</span>.<span class="hljs-title function_">isArray</span>(tasks)) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;任务必须是数组&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(limit) || limit &lt; <span class="hljs-number">1</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;并发数必须为正整数&#x27;</span>);
  }

  <span class="hljs-comment">// 固定本次任务列表，并把稀疏数组中的空位显式变成 undefined。</span>
  <span class="hljs-keyword">const</span> queue = <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>(tasks);
  <span class="hljs-keyword">if</span> (queue.<span class="hljs-title function_">some</span>(<span class="hljs-function"><span class="hljs-params">task</span> =&gt;</span> <span class="hljs-keyword">typeof</span> task !== <span class="hljs-string">&#x27;function&#x27;</span>)) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;每个任务都必须是函数&#x27;</span>);
  }

  <span class="hljs-keyword">const</span> results = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Array</span>(queue.<span class="hljs-property">length</span>);
  <span class="hljs-keyword">let</span> next = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">let</span> failed = <span class="hljs-literal">false</span>;

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">worker</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">while</span> (!failed) {
      <span class="hljs-keyword">const</span> index = next++;
      <span class="hljs-keyword">if</span> (index &gt;= queue.<span class="hljs-property">length</span>) <span class="hljs-keyword">return</span>;

      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> task = queue[index];
        results[index] = <span class="hljs-keyword">await</span> <span class="hljs-title function_">task</span>();
      } <span class="hljs-keyword">catch</span> (error) {
        failed = <span class="hljs-literal">true</span>;
        <span class="hljs-keyword">throw</span> error;
      }
    }
  }

  <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(
    <span class="hljs-title class_">Array</span>.<span class="hljs-title function_">from</span>({ <span class="hljs-attr">length</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">min</span>(limit, queue.<span class="hljs-property">length</span>) }, worker),
  );
  <span class="hljs-keyword">return</span> results;
}
</code></pre></div>
<h3>为什么这样就能限制并发</h3>
<p><code>worker</code> 是一个执行循环，不是 Web Worker。创建 4 个循环时，每个循环最多等待一个 <code>task()</code>。一个任务完成后，该循环才继续取下一个，所以未完成的任务数量不会超过 4。</p>
<p>领取任务的 <code>next++</code> 出现在 <code>await</code> 之前，是同步执行的。在同一 JavaScript 执行环境中，这几行不会被另一个执行循环从中间打断，因此不同循环会领取不同索引。真正的异步交错发生在等待任务结果的地方。</p>
<p><code>results[index]</code> 保留了输入顺序。如果第二个任务先结束，它会写入第二个位置，不会挤到结果数组开头。空数组会创建零个执行循环，最后返回空结果；任务数量小于 <code>limit</code> 时也只启动必要数量的循环。</p>
<p>可以在定义函数后运行下面的例子，观察并发上限和结果顺序：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> active = <span class="hljs-number">0</span>;
<span class="hljs-keyword">let</span> maximum = <span class="hljs-number">0</span>;

<span class="hljs-keyword">const</span> jobs = [<span class="hljs-number">40</span>, <span class="hljs-number">10</span>, <span class="hljs-number">5</span>, <span class="hljs-number">20</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">delay, index</span>) =&gt;</span> <span class="hljs-title function_">async</span> () =&gt; {
  active++;
  maximum = <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(maximum, active);
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, delay));
    <span class="hljs-keyword">return</span> index;
  } <span class="hljs-keyword">finally</span> {
    active--;
  }
});

<span class="hljs-title function_">runPool</span>(jobs, <span class="hljs-number">2</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function"><span class="hljs-params">result</span> =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(result);  <span class="hljs-comment">// [0, 1, 2, 3]</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(maximum); <span class="hljs-comment">// 2</span>
});
</code></pre></div>
<p>测试重点是“最多几个任务未结束”和“结果位置是否正确”，而不是拿真实计时器要求毫秒级精确的完成时间。计时器到期只是允许调度，主线程忙时仍可能延后。</p>
<h3>失败后还有请求，算不算实现错误</h3>
<p>假设 A、B 已经开始，A 失败时 B 仍在请求。池子设置 <code>failed = true</code> 并拒绝整体 Promise，B 不会因此自动停止；等 B 完成后，它所在的循环看到失败标记，就不再领取 C。</p>
<p>“发现失败”也有时间边界：如果某个失败尚未通过 Promise 回调被观察到，另一个执行循环可能已经领取了新任务。这里承诺的是观察到失败后停止继续领取，不是预测远端什么时候失败。</p>
<p>同步抛错与异步拒绝都在 <code>try/catch</code> 中处理。<code>Promise.all</code> 负责汇总执行循环的结果，并给它们连接拒绝处理；它不负责取消底层请求。整体已经拒绝时，也不能认为所有副作用都已结束或已经回滚。</p>
<p>如果业务需要取消，可让任务捕获同一个 <code>AbortSignal</code>，在失败后调用对应控制器的 <code>abort()</code>，并在任务内配合处理。若业务需要每项结果，则可以在任务层把成功、失败转成带状态的结果，让循环继续执行。两种策略都可以，但必须先说明接口承诺，不能把它们混在同一个“遇错即停”的描述里。</p>
<p>最后，并发池只能等待任务函数返回的东西。一个任务如果启动了三个后台请求却立即返回，池子无法知道那三个请求仍在运行。任务函数应返回覆盖完整工作生命周期的 Promise；使用 <code>fetch</code> 时，HTTP 404/500 默认不会令 Promise 拒绝，需要在任务里检查 <code>response.ok</code> 并按业务规则抛错。</p>`};export{e as default};