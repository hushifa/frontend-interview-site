var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>防抖就是“等用户停下来再执行”。比如搜索框，用户一直在打字就先不搜，停下来 300 毫秒没再输入，才发请求。</p>
<p>实现的关键是每次调用都先 <code>clearTimeout</code> 掉旧的定时器，再重新设一个。这样只有最后一次调用的定时器能走完，执行时用的也是这次的参数和 <code>this</code>。包装函数要用普通函数写，才能拿到调用方的 <code>this</code>，再用 <code>fn.apply(this, args)</code> 转给原函数。</p>
<p>有两个细节。定时器回调里要先把 <code>timer</code> 清空再调用 <code>fn</code>，这样 <code>fn</code> 内部如果又调用了包装函数，新设的定时器不会被误清掉。另外，包装函数在 <code>fn</code> 执行之前就已经返回了，所以它的返回值是 <code>undefined</code>，<code>fn</code> 抛的错也传不回调用的地方。</p>
<p>防抖只能减少还没开始的工作。已经发出去的请求，旧的可能比新的回来得还晚，要用 <code>AbortController</code> 取消，或者比较请求序号把过期结果丢掉。</p>
</blockquote>
<h2>先看时间线</h2>
<p>假设等待时间是 100 毫秒，调用分别发生在 0、60、120 毫秒：</p>
<table><thead><tr><th>调用时刻</th><th>参数</th><th>结果</th></tr></thead><tbody><tr><td>0 毫秒</td><td>A</td><td>计划在 100 毫秒执行</td></tr><tr><td>60 毫秒</td><td>B</td><td>取消 A，改为 160 毫秒执行</td></tr><tr><td>120 毫秒</td><td>C</td><td>取消 B，改为 220 毫秒执行</td></tr></tbody></table>
<p>每次新调用都把执行时间往后推。之后没有新调用了，大约在 220 毫秒执行 C。</p>
<p>这也意味着，如果调用一直不停，这个版本就永远不会执行。如果需要“最多等这么久，也要执行一次”，就要加一个 <code>maxWait</code> 选项，或者改用节流。</p>
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
<p><code>timer</code> 保存在闭包里，所以每次调用 <code>wrapped</code> 操作的都是同一个定时器，这才能做到“清掉上一个”。</p>
<p>定时器回调用的是箭头函数，它没有自己的 <code>this</code>，用的是外层 <code>wrapped</code> 的 <code>this</code>。所以 <code>fn.apply(this, args)</code> 里的 <code>this</code>，就是调用 <code>wrapped</code> 时的那个对象。</p>
<p>为什么要校验等待时间不超过 2147483647？因为超过这个数，浏览器和 Node 会把定时器当成 1 毫秒处理，等于马上执行，完全违背了本意，所以直接拒绝。</p>
<h2>验证 this 和参数</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> receiver = {
  <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;最终输入&#x27;</span>,
  <span class="hljs-attr">print</span>: <span class="hljs-title function_">debounce</span>(<span class="hljs-keyword">function</span> (<span class="hljs-params">text</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">\`<span class="hljs-subst">\${<span class="hljs-variable language_">this</span>.name}</span>：<span class="hljs-subst">\${text}</span>\`</span>);
  }, <span class="hljs-number">100</span>),
};

receiver.<span class="hljs-title function_">print</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
receiver.<span class="hljs-title function_">print</span>(<span class="hljs-string">&#x27;B&#x27;</span>);
</code></pre></div>
<p>等待结束后只输出一次 <code>最终输入：B</code>。A 那次被取消了，<code>this</code> 也正确地指向了 <code>receiver</code>。</p>
<p>要注意，同一个包装函数被多个对象共用时，它们也共用一个定时器，调用会互相合并。所以每个输入框要各自创建一个防抖实例。</p>
<h2>搜索框里的完整写法</h2>
<p>防抖只是少发请求，可是发出去的请求返回顺序不确定。用户先搜“a”再搜“ab”，“a”的结果可能后回来，把“ab”的结果盖掉。下面的写法把这个问题也处理了：</p>
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
<p>每次发新请求前，先取消上一次的请求，旧的响应就不会覆盖新的结果。</p>
<p>为什么传给 <code>search</code> 的是 <code>event.target.value</code>，而不是整个 <code>event</code>？因为执行是延迟的，等到真正执行时，<code>event.currentTarget</code> 已经变成 <code>null</code> 了。所以要在触发的那一刻就把需要的字符串取出来。</p>
<p>异步函数里的错误要自己捕获。被取消的请求会抛 <code>AbortError</code>，这是正常的，不用提示；其他错误才显示出来。不捕获的话，会产生未处理的 Promise 拒绝。</p>
<p>在 React、Vue 组件里用时，防抖实例要在组件的整个生命周期里保持不变，比如放进 <code>useRef</code>，或者在 <code>setup</code> 里只创建一次。不然每次渲染都创建一个新的，定时器就不是同一个了。组件卸载时记得调用 <code>cancel</code>。</p>
<h2>常见追问</h2>
<p><strong>防抖和节流怎么选？</strong></p>
<blockquote>
<p>只关心最后的结果，就用防抖，比如搜索、窗口大小变了以后重新算布局。需要过程中持续有反馈，就用节流，比如滚动加载、拖拽。两者的对比见<a href="/questions/alg-throttle/">《怎样实现首沿节流？它与尾沿节流、防抖有什么区别？》</a>。</p>
</blockquote>
<p><strong>能让防抖函数返回 Promise 吗？</strong></p>
<blockquote>
<p>可以，但要先想清楚被合并掉的那些调用怎么办：是一起等最后一次的结果，还是直接拒绝。这已经是另一种接口设计了。</p>
</blockquote>
<p><strong>首沿防抖是什么？</strong></p>
<blockquote>
<p>第一次调用马上执行，之后在安静期结束前的调用都被忽略。适合防止按钮被重复点击提交。</p>
</blockquote>`};export{e as default};