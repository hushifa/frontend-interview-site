var e={answerHtml:`<p>用户输入“闭包”的过程中，输入框会不断产生变化。如果每次变化都立即搜索，可能发送许多中间查询。尾沿防抖的想法是：先等一小段时间，期间又有新调用就重新计时，等用户暂时停下来，再使用最后一次输入执行。</p>
<p>所以防抖控制的是“多久没有新的调用”，不是“从第一次调用起每隔多久执行一次”。持续不断地调用时，这个版本可能一直不执行，这是它的行为约定，不是计时器坏了。</p>
<h2>先沿时间线看一次合并</h2>
<p>假设等待时间为 100ms，调用分别发生在 0ms、60ms 和 120ms：</p>
<table><thead><tr><th>调用时刻</th><th>传入内容</th><th>本次处理</th></tr></thead><tbody><tr><td>0ms</td><td>A</td><td>准备在约 100ms 后执行</td></tr><tr><td>60ms</td><td>B</td><td>取消 A 的等待，重新等到约 160ms</td></tr><tr><td>120ms</td><td>C</td><td>取消 B 的等待，重新等到约 220ms</td></tr></tbody></table>
<p>之后没有新调用，最终执行 C。这里的时间只是说明调度关系：真正执行还受主线程、后台节流和系统调度影响，不保证精确发生在 220ms。</p>
<p>如果要求持续输入期间也至少每隔一段时间执行一次，还需要最大等待时间等额外策略，不能把这个简单尾沿版本直接说成已经覆盖了需求。</p>
<h2>一个明确限定行为的实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">debounce</span>(<span class="hljs-params">fn, wait</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> fn !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;需要传入函数&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(wait) || wait &lt; <span class="hljs-number">0</span> || wait &gt; <span class="hljs-number">2_147_483_647</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;等待时间必须是计时器范围内的非负整数毫秒&#x27;</span>);
  }

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
<p>这里显式验证等待时间，避免负数、NaN、字符串或超大数被宿主计时器隐式转换后产生与调用者预期不同的行为。它提供的是函数调用层面的防抖，不包含首沿执行、flush、maxWait 或 Promise 聚合结果。</p>
<h2>为什么能记住最后一次参数与 this</h2>
<p>每次 wrapped 调用都有自己这次的 args 和 this。计时器里的箭头函数捕获这次调用的环境，最终通过 <code>fn.apply(this, args)</code> 调用原函数。</p>
<p>下一次调用会清除旧计时器，旧的那次参数就不会再触发执行。留下来的计时器来自最后一次调用，因此执行的也是最后一次参数和接收者。</p>
<p>外层 wrapped 使用普通函数，是为了保留调用时的 this；若把它直接写成箭头函数，调用方通过对象方法或 call 提供的 this 就不会按同样方式进入包装器。原函数本身如果是箭头函数，它自己的词法 this 也不会被 apply 改写。</p>
<p>在定义 debounce 后，可以观察下面的例子：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> receiver = {
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;最终输入&#x27;</span>,
  <span class="hljs-attr">print</span>: <span class="hljs-title function_">debounce</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params">text</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.name}</span>：<span class="hljs-subst">\${text}</span>\`</span>);
  }, <span class="hljs-number">100</span>),
};

receiver.<span class="hljs-title function_">print</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
receiver.<span class="hljs-title function_">print</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
</code></pre></div>
<p>等待结束后只输出 <code>最终输入：B</code>。如果多个对象共享同一个包装函数，它们也共享同一个 timer，调用会彼此合并；需要独立防抖的输入框，应各自维护独立实例。</p>
<h2>为什么先把 timer 清空，再调用原函数</h2>
<p>执行计时器时，旧的等待已经结束，因此先把 timer 设为 undefined，再调用 fn。这个顺序也照顾了重入：如果 fn 内部又调用 wrapped，新调用会建立新的计时器，不会在 fn 返回后被旧回调错误地清掉句柄。</p>
<p>取消方法用于阻止尚未执行的那次调用，并允许之后重新开始使用同一个包装器。它不是永久销毁标记，cancel 后再次调用仍会正常重新计时。</p>
<p>当 wait 为 0，回调也只是安排到后续计时器任务，同一段同步代码中的多次调用仍可能合并，不是同步立即执行。</p>
<h2>返回值与错误不能按普通同步函数理解</h2>
<p>wrapped 返回时，fn 通常还没运行，所以本实现返回 undefined。不能写 <code>await wrapped()</code>，就期待拿到之后搜索接口的结果；它不会自动返回覆盖那次延迟任务的 Promise。</p>
<p>计时器回调里的同步异常，也不处于原先调用 wrapped 的同步调用栈里，不能靠外面立即套一个 try/catch 接住。若 fn 是异步函数，应在该异步工作内部处理错误或明确连接拒绝处理，不能把被忽略的 Promise 留成未处理拒绝。</p>
<p>需要“每次调用都返回 Promise”时，还要先定义被合并调用的 Promise 是共同等待最后一次结果、被取消还是分别处理。那是另一个接口契约，不是随便加上 async 就完成。</p>
<h2>搜索中还需要处理已经开始的请求</h2>
<p>防抖只能减少尚未开始的工作。一轮搜索已经发出后，用户又输入新内容，cancel 不会自动取消旧请求。旧响应也可能比新响应更晚回来，覆盖正确结果。</p>
<p>因此搜索通常还要结合 AbortController、请求序号或查询版本检查。传给防抖函数的最好是当时需要的字符串值，而不是稍后再读取状态已变化的事件对象，尤其不要依赖原生 event.currentTarget 在延迟回调中仍有原值。</p>
<p>在组件框架中，也要保证包装函数的生命周期合适。每次渲染都创建一个新防抖器，会留下多份互不相识的计时器；组件卸载或功能切换时，应清理旧实例的待执行调用，并单独管理在途请求。</p>
<p>这段实现减少的是执行次数，不会让一次昂贵计算本身变快。输入的实时显示通常仍应立即更新，把允许延后的搜索或校验放进防抖，避免为了省请求让输入框本身显得迟钝。</p>`};export{e as default};