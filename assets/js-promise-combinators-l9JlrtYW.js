var e={answerHtml:`<p>选择 Promise 组合方法前，先问业务怎样才算完成：两个接口缺一不可，还是失败也要展示各自状态？多个镜像地址里最快失败是否应该结束等待，还是一定要等到某一个成功？</p>
<p>这四个方法把不同答案编码成 Promise 的完成规则。它们都接收可迭代输入，普通值与 thenable 也能按 Promise 解析规则参与，但不会自动把传入的函数当成任务调用。</p>
<table><thead><tr><th>方法</th><th>何时兑现</th><th>何时拒绝</th><th>典型用途</th></tr></thead><tbody><tr><td>all</td><td>所有输入兑现，得到值数组</td><td>某项拒绝后整体拒绝</td><td>多个必要结果必须齐全</td></tr><tr><td>allSettled</td><td>每项都敲定，得到状态数组</td><td>通常不因单项拒绝而拒绝，但输入迭代等仍可能出错</td><td>批量操作汇总各项成功与失败</td></tr><tr><td>race</td><td>第一个被观察到的敲定结果为兑现</td><td>第一个被观察到的敲定结果为拒绝</td><td>采用首个结果，或组合等待上限</td></tr><tr><td>any</td><td>某项首次兑现</td><td>全部拒绝时得到 AggregateError</td><td>多个替代来源中任意一个成功即可</td></tr></tbody></table>
<p>“敲定”包括兑现和拒绝。race 不关心第一名是成功还是失败，any 则会忽略早到的拒绝，继续等成功机会。</p>
<h3>用同一组结果对照四种策略</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">compare</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> tasks = [
    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;A失败&#x27;</span>)),
    <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;B成功&#x27;</span>),
  ];

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>(tasks);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`all:<span class="hljs-subst">\${error.message}</span>\`</span>); <span class="hljs-comment">// all:A失败</span>
  }

  <span class="hljs-keyword">const</span> settled = <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>(tasks);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settled.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span> item.<span class="hljs-property">status</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// rejected,fulfilled</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(settled.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span>
    item.<span class="hljs-property">status</span> === <span class="hljs-string">&#x27;fulfilled&#x27;</span> ? item.<span class="hljs-property">value</span> : item.<span class="hljs-property">reason</span>.<span class="hljs-property">message</span>,
  ).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;|&#x27;</span>)); <span class="hljs-comment">// A失败|B成功</span>

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">race</span>(tasks);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`race:<span class="hljs-subst">\${error.message}</span>\`</span>); <span class="hljs-comment">// race:A失败</span>
  }

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`any:<span class="hljs-subst">\${<span class="hljs-keyword">await</span> <span class="hljs-built_in">Promise</span>.any(tasks)}</span>\`</span>); <span class="hljs-comment">// any:B成功</span>
}

<span class="hljs-title function_">compare</span>();
</code></pre></div>
<p>本例为了对比，重复观察同一组已经敲定的结果，相关反应按连接顺序排队，所以 race 选择了输入中靠前的拒绝。真实异步请求的竞速则取决于结果何时被观察到，不能从这里推断 race 永远返回第一个数组元素。</p>
<p>allSettled 的成功项有 status 和 value，失败项有 status 和 reason。应先根据 status 区分，再读取对应字段；失败项没有一个会自动填成正常结果的 value。</p>
<h3>all 的结果顺序不会随完成速度重排</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">collect</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> finishFirst;
  <span class="hljs-keyword">const</span> first = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> { finishFirst = resolve; });
  <span class="hljs-keyword">const</span> second = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>(<span class="hljs-string">&#x27;第二项&#x27;</span>);
  <span class="hljs-keyword">const</span> pending = <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([first, second, <span class="hljs-number">3</span>]);

  <span class="hljs-title function_">finishFirst</span>(<span class="hljs-string">&#x27;第一项&#x27;</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>((<span class="hljs-keyword">await</span> pending).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// 第一项,第二项,3</span>
}

<span class="hljs-title function_">collect</span>();
</code></pre></div>
<p>第二项先具备结果，但仍然放在结果数组的第二个位置。all 和 allSettled 都保留输入遍历顺序，适合把结果重新对应到原始任务。它们不会按完成顺序 push 出一个难以映射的列表。</p>
<p>all 的“快速失败”表示不必等待所有任务都完成才拒绝，不表示它在当前同步栈中直接 throw，也不表示其他操作已经停止。如果你需要在全部任务结束后统一释放某组资源，单独等待 all 的拒绝未必足够。</p>
<h3>any 全失败时，原因保存在 errors 中</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">failEverywhere</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">any</span>([
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;主站不可用&#x27;</span>)),
      <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;备站不可用&#x27;</span>)),
    ]);
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">name</span>); <span class="hljs-comment">// AggregateError</span>
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(error.<span class="hljs-property">errors</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">item</span> =&gt;</span> item.<span class="hljs-property">message</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>));
    <span class="hljs-comment">// 主站不可用,备站不可用</span>
  }
}

<span class="hljs-title function_">failEverywhere</span>();
</code></pre></div>
<p>errors 按输入顺序保存拒绝原因，不按失败时间重新排序。原因本身不一定总是 Error 对象，真实代码应根据任务契约或安全格式化方式处理；示例明确让所有任务拒绝为 Error，所以能读取 message。</p>
<p>any 兑现时只返回获胜值，不会附送是哪一个输入。需要来源信息时，可以让每个任务兑现为 <code>{ source, value }</code> 这样的结构，前提是不要把本应拒绝的失败包装成“成功返回一个错误对象”，否则 any 会把它误判为成功。</p>
<h3>空输入与微任务行为</h3>
<p>空输入下，all 和 allSettled 返回已兑现、值为 [] 的 Promise；any 返回以空 errors 列表的 AggregateError 拒绝的 Promise；race 则保持待定。</p>
<p>即便得到的是已经兑现的 Promise，then 回调仍然不会同步插入当前代码。非空输入即使都是普通值或已敲定 Promise，组合结果的观察也仍涉及异步反应过程。</p>
<p>race 为空会一直待定，可能让一次没有候选项的“竞速”流程永远等下去。输入可能为空的业务，应明确是立即返回默认值、报错，还是确实需要保持等待。</p>
<h3>这些方法都不是并发池，也不是取消器</h3>
<p>写 <code>urls.map(url =&gt; fetch(url))</code> 时，请求已经随着 map 的执行启动。再把数组传给 all、race 或 any，并不会重新安排启动时间。需要限制最多几个请求在途，应把尚未启动的任务函数交给调度逻辑，而不是只改变组合方法。</p>
<p>同样，race 得到一个超时拒绝，也不会自动停止原请求；any 已经选出成功镜像，也不会自动终止其他来源。要取消需要让操作支持 AbortSignal 等机制，并决定哪些操作允许取消。</p>
<p>如果自己创建超时计时器，任务提前结束时还要清除计时器，避免无用工作。超时也只是调用方停止等待的一种策略，不能据此确认服务端写入没有完成。</p>
<p>最后，allSettled 不是“永远不可能拒绝”的保障。传入不可迭代值、迭代过程抛错或其他协议边界错误，仍可能让组合操作拒绝。区别在于它把正常输入项的单项拒绝当成要收集的结果，而不是把所有 JavaScript 错误都吞掉。</p>`};export{e as default};