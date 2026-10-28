var e={answerHtml:`<h2>简答</h2>
<ul>
<li>每次调用先 <code>clearTimeout</code> 旧计时器再重新设置，只有最后一次调用的计时器能走完，执行时使用这次的参数和 <code>this</code>。</li>
<li>包装函数用普通函数定义，才能拿到调用方传入的 <code>this</code> 并用 <code>fn.apply(this, args)</code> 转发。</li>
<li>计时器回调里先把 <code>timer</code> 置空再调用 <code>fn</code>，<code>fn</code> 内部再次调用包装函数时，新计时器不会被误清。</li>
<li>包装函数在 <code>fn</code> 执行前就已返回，所以返回 <code>undefined</code>；<code>fn</code> 抛出的错误也不会传回调用处。</li>
<li>搜索框适合防抖；旧请求可能比新请求更晚返回，需要用 <code>AbortController</code> 取消，或比较请求序号丢弃过期结果。</li>
</ul>
<h2>时间线</h2>
<p>等待 100 毫秒，调用发生在 0、60、120 毫秒：</p>
<table><thead><tr><th>调用时刻</th><th>参数</th><th>结果</th></tr></thead><tbody><tr><td>0 毫秒</td><td>A</td><td>计划在 100 毫秒执行</td></tr><tr><td>60 毫秒</td><td>B</td><td>取消 A，改为 160 毫秒执行</td></tr><tr><td>120 毫秒</td><td>C</td><td>取消 B，改为 220 毫秒执行</td></tr></tbody></table>
<p>之后没有新调用，大约 220 毫秒执行 C。持续不断地调用时，这个版本会一直不执行；需要&quot;最长等待一段时间也要执行一次&quot;时，要加 <code>maxWait</code> 选项，或改用节流。</p>
<h2>实现</h2>
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
<p>参数校验在创建计时器之前完成：等待时间超过 2147483647 毫秒时，计时器会被当作 1 毫秒处理，所以直接拒绝。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> receiver = {
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;最终输入&#x27;</span>,
  <span class="hljs-attr">print</span>: <span class="hljs-title function_">debounce</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params">text</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.name}</span>：<span class="hljs-subst">\${text}</span>\`</span>);
  }, <span class="hljs-number">100</span>),
};

receiver.<span class="hljs-title function_">print</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
receiver.<span class="hljs-title function_">print</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
</code></pre></div>
<p>等待结束后只输出 <code>最终输入：B</code>。同一个包装函数被多个对象共享时，它们共用一个计时器，调用会相互合并；每个输入框应该各自创建实例。</p>
<h2>搜索框中的完整处理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> controller;

<span class="hljs-keyword">const</span> search = <span class="hljs-title function_">debounce</span>(<span class="hljs-title function_">async</span> (keyword) =&gt; {
  controller?.<span class="hljs-title function_">abort</span>();
  controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/search?q=<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(keyword)}</span>\`</span>, {
      <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
    });
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`HTTP <span class="hljs-subst">\${response.status}</span>\`</span>);
    <span class="hljs-title function_">render</span>(<span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>());
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> !== <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-title function_">showError</span>(error);
  }
}, <span class="hljs-number">300</span>);

input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> <span class="hljs-title function_">search</span>(event.<span class="hljs-property">target</span>.<span class="hljs-property">value</span>));
</code></pre></div>
<ul>
<li>传给防抖函数的是当时的字符串，不是事件对象。延迟执行时 <code>event.currentTarget</code> 已经变成 <code>null</code>。</li>
<li>新请求开始前取消上一次请求，旧响应不会覆盖新结果。</li>
<li>异步函数里自己捕获错误，否则会产生未处理的 Promise 拒绝。</li>
</ul>
<p>在 React、Vue 组件里使用时，防抖实例要在组件生命周期内保持不变（例如放进 <code>useRef</code> 或 <code>setup</code> 中只创建一次），组件卸载时调用 <code>cancel</code>。</p>
<h2>常见追问</h2>
<ul>
<li><strong>防抖和节流怎么选？</strong> 只关心最终结果用防抖，例如搜索、窗口大小变化后重新计算布局；需要持续反馈用节流，例如滚动加载、拖拽。两者对比见《怎样实现首沿节流？它与尾沿节流、防抖有什么区别？》。</li>
<li><strong>能让防抖函数返回 Promise 吗？</strong> 可以，但要先定义被合并掉的那些调用怎么办：一起等待最后一次的结果，还是直接拒绝。这已经是另一种接口设计。</li>
<li><strong>首沿防抖是什么？</strong> 第一次调用立即执行，之后在安静期结束前的调用都被忽略，适合防止按钮重复提交。</li>
</ul>`};export{e as default};