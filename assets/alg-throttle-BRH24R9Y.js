var e={answerHtml:`<h2>简答</h2>
<ul>
<li>首沿节流：第一次调用立即执行并开启一个 <code>wait</code> 毫秒的窗口，窗口内的调用直接丢弃，窗口结束后下一次调用再次立即执行。</li>
<li>尾沿节流：第一次调用开启窗口但不执行，窗口内持续记录最新的参数，窗口结束时执行一次，结束时间不会因新调用而推后。</li>
<li>防抖每次调用都重新计时，持续调用期间一直不执行；节流在持续调用期间也会按固定节奏执行。</li>
<li>首沿节流要在调用 <code>fn</code> 之前设置 <code>blocked</code>，这样 <code>fn</code> 内部再次调用或同步抛错时，窗口仍然生效。</li>
<li>节流只控制开始执行的频率。<code>fn</code> 返回的 Promise 还没完成时，下一个窗口照样会再次调用它；需要限制同时进行的数量，要用并发控制。</li>
</ul>
<h2>三种策略的对比</h2>
<p>等待时间 100 毫秒，在 0、30、60 毫秒依次调用 A、B、C，之后停止：</p>
<table><thead><tr><th>策略</th><th>执行</th><th>典型场景</th></tr></thead><tbody><tr><td>首沿节流</td><td>0 毫秒执行 A，B、C 被丢弃</td><td>按钮防连点、立即响应的快捷键</td></tr><tr><td>尾沿节流</td><td>100 毫秒执行 C</td><td>滚动时更新位置，需要拿到最新值</td></tr><tr><td>尾沿防抖</td><td>160 毫秒执行 C</td><td>搜索框输入停止后再请求</td></tr></tbody></table>
<p>Lodash 的 <code>throttle</code> 默认同时启用首沿和尾沿，只调用一次时只在首沿执行。用库之前要看清它的选项。</p>
<h2>首沿节流实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">throttle</span>(<span class="hljs-params">fn, wait</span>) {
  <span class="hljs-keyword">if</span> (<span class="hljs-keyword">typeof</span> fn !== <span class="hljs-string">&#x27;function&#x27;</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">TypeError</span>(<span class="hljs-string">&#x27;需要传入函数&#x27;</span>);
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-title function_">isInteger</span>(wait) || wait &lt; <span class="hljs-number">0</span> || wait &gt; <span class="hljs-number">2_147_483_647</span>) {
    <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">RangeError</span>(<span class="hljs-string">&#x27;等待时间必须是计时器范围内的非负整数毫秒&#x27;</span>);
  }

  <span class="hljs-keyword">let</span> blocked = <span class="hljs-literal">false</span>;
  <span class="hljs-keyword">let</span> timer;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">wrapped</span>(<span class="hljs-params">...args</span>) {
    <span class="hljs-keyword">if</span> (blocked) <span class="hljs-keyword">return</span>;

    blocked = <span class="hljs-literal">true</span>;
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      blocked = <span class="hljs-literal">false</span>;
      timer = <span class="hljs-literal">undefined</span>;
    }, wait);

    <span class="hljs-keyword">return</span> fn.<span class="hljs-title function_">apply</span>(<span class="hljs-variable language_">this</span>, args);
  }

  wrapped.<span class="hljs-property">cancel</span> = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    blocked = <span class="hljs-literal">false</span>;
    timer = <span class="hljs-literal">undefined</span>;
  };

  <span class="hljs-keyword">return</span> wrapped;
}
</code></pre></div>
<ul>
<li><code>timer</code> 只用于 <code>cancel</code> 时清除窗口；窗口期间的状态由 <code>blocked</code> 判断。</li>
<li>窗口内被丢弃的调用返回 <code>undefined</code>，只有真正执行的那次返回 <code>fn</code> 的结果。</li>
<li><code>cancel</code> 立即结束当前窗口，之后的调用会马上执行。</li>
</ul>
<h2>尾沿节流实现</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">throttleTrailing</span>(<span class="hljs-params">fn, wait</span>) {
  <span class="hljs-keyword">let</span> timer;
  <span class="hljs-keyword">let</span> lastArgs;
  <span class="hljs-keyword">let</span> lastThis;

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">wrapped</span>(<span class="hljs-params">...args</span>) {
    lastArgs = args;
    lastThis = <span class="hljs-variable language_">this</span>;
    <span class="hljs-comment">// 窗口已经开启时只更新参数，不推迟结束时间。</span>
    <span class="hljs-keyword">if</span> (timer !== <span class="hljs-literal">undefined</span>) <span class="hljs-keyword">return</span>;
    timer = <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
      <span class="hljs-keyword">const</span> callThis = lastThis;
      <span class="hljs-keyword">const</span> callArgs = lastArgs;
      timer = lastArgs = lastThis = <span class="hljs-literal">undefined</span>;
      fn.<span class="hljs-title function_">apply</span>(callThis, callArgs);
    }, wait);
  }

  wrapped.<span class="hljs-property">cancel</span> = <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-built_in">clearTimeout</span>(timer);
    timer = lastArgs = lastThis = <span class="hljs-literal">undefined</span>;
  };

  <span class="hljs-keyword">return</span> wrapped;
}
</code></pre></div>
<p>每 25 毫秒调用一次、共调用 10 次，等待 100 毫秒，本机实测执行了 3 次，分别拿到第 4、8、10 次调用的参数：每个窗口从它的第一次调用开始计时，结束时使用窗口内最新的参数。如果每次调用都 <code>clearTimeout</code> 再重新计时，就变成了防抖，持续调用期间一次都不会执行。</p>
<h2>和 requestAnimationFrame 的关系</h2>
<p>滚动、拖拽这类和画面更新相关的事件，可以用 <code>requestAnimationFrame</code> 合并：同一帧内只处理最后一次事件，执行频率自动和屏幕刷新率一致，页面在后台时还会暂停。这比固定毫秒数的节流更贴合渲染节奏。</p>
<h2>常见追问</h2>
<ul>
<li><strong>节流函数里的 <code>this</code> 怎样保持？</strong> <code>wrapped</code> 用普通函数定义，调用时用 <code>fn.apply(this, args)</code> 转发；箭头函数没有自己的 <code>this</code>，不能用来定义 <code>wrapped</code>。</li>
<li><strong>为什么等待时间要校验范围？</strong> 浏览器和 Node.js 的计时器把超过 2147483647 毫秒的延迟当作 1 毫秒处理，非整数或负数也会产生不直观的行为，所以实现在创建计时器之前拒绝这些值。</li>
<li><strong>防抖怎样实现？</strong> 见《怎样实现只在停止调用后执行的防抖函数？》。</li>
</ul>`};export{e as default};