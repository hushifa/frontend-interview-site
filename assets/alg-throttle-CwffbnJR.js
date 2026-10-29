var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>节流是限制函数的执行频率：每 <code>wait</code> 毫秒最多执行一次。按在什么时候执行，分成首沿和尾沿两种。</p>
<p>首沿节流是第一次调用马上执行，同时开一个 <code>wait</code> 毫秒的窗口，窗口里的调用全部丢掉，窗口结束后，下一次调用又马上执行。尾沿节流是第一次调用只开窗口、不执行，窗口里一直记下最新的参数，窗口结束时执行一次，而且结束时间不会因为新调用往后推。</p>
<p>和防抖的区别在于：防抖每次调用都重新计时，一直有调用就一直不执行；节流就算调用不停，也会按固定节奏执行。</p>
<p>实现首沿节流有个细节：要在调用 <code>fn</code> 之前就把 <code>blocked</code> 设上，这样 <code>fn</code> 内部又调了自己，或者同步抛了错，窗口照样生效。还要知道，节流只控制多久开始一次，<code>fn</code> 返回的 Promise 还没完成，下一个窗口照样会再调它。要限制同时进行的数量，得用并发控制。</p>
</blockquote>
<h2>三种策略放在一起比</h2>
<p>等待时间 100 毫秒，在 0、30、60 毫秒依次调用 A、B、C，之后不再调用：</p>
<table><thead><tr><th>策略</th><th>执行</th><th>典型场景</th></tr></thead><tbody><tr><td>首沿节流</td><td>0 毫秒执行 A，B、C 被丢弃</td><td>按钮防连点、立即响应的快捷键</td></tr><tr><td>尾沿节流</td><td>100 毫秒执行 C</td><td>滚动时更新位置，需要拿到最新值</td></tr><tr><td>尾沿防抖</td><td>160 毫秒执行 C</td><td>搜索框输入停止后再请求</td></tr></tbody></table>
<p>尾沿节流和防抖最后执行的都是 C，区别在时间。尾沿节流的窗口从 A 开始算，100 毫秒准时结束；防抖每次调用都往后推，从最后一次 C 的 60 毫秒再等 100 毫秒，到 160 毫秒才执行。</p>
<p>用现成的库之前，要看清它的默认选项。比如 Lodash 的 <code>throttle</code>，默认首沿和尾沿都开，只调用一次的话，只在首沿执行。</p>
<h2>首沿节流的实现</h2>
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
<p>窗口开没开，看的是 <code>blocked</code>。<code>timer</code> 只是为了 <code>cancel</code> 时能把定时器清掉。</p>
<p>为什么 <code>blocked = true</code> 要写在 <code>fn.apply</code> 前面？假设反过来写，先执行 <code>fn</code>，<code>fn</code> 里面又调了一次 <code>wrapped</code>，这时 <code>blocked</code> 还是 <code>false</code>，就会再执行一次，窗口等于没开。<code>fn</code> 同步抛错也一样，抛错后就走不到设 <code>blocked</code> 那一行了。先设好，这两种情况都不怕。</p>
<p>被丢掉的调用返回 <code>undefined</code>，只有真正执行的那次返回 <code>fn</code> 的结果。<code>cancel</code> 会马上结束当前窗口，之后的调用立刻就能执行。</p>
<h2>尾沿节流的实现</h2>
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
<p>和防抖比，关键区别就在 <code>if (timer !== undefined) return</code> 这一行。窗口已经开了，就只更新参数，不碰定时器。</p>
<p>实际跑一下：每 25 毫秒调用一次，一共 10 次，等待时间 100 毫秒，结果执行了 3 次，拿到的分别是第 4、8、10 次调用的参数。每个窗口从它的第一次调用开始计时，结束时用的是窗口里最新的参数。</p>
<p>如果把那一行换成“每次都 <code>clearTimeout</code> 再重新计时”，就变成了防抖，调用不停的那段时间里一次都不会执行。</p>
<h2>和 requestAnimationFrame 的关系</h2>
<p>滚动、拖拽这类跟画面更新有关的事件，还可以用 <code>requestAnimationFrame</code> 来合并：同一帧里只处理最后一次事件，执行频率自动跟屏幕刷新率一致，页面切到后台时还会暂停。这比写死一个毫秒数的节流，更贴合渲染的节奏。</p>
<h2>常见追问</h2>
<p><strong>节流函数里的 <code>this</code> 怎么保持？</strong></p>
<blockquote>
<p><code>wrapped</code> 要用普通函数定义，调用时用 <code>fn.apply(this, args)</code> 转过去。箭头函数没有自己的 <code>this</code>，不能用来定义 <code>wrapped</code>。</p>
</blockquote>
<p><strong>为什么要校验等待时间的范围？</strong></p>
<blockquote>
<p>浏览器和 Node.js 的定时器，碰到超过 2147483647 毫秒的延迟，会当成 1 毫秒处理。小数和负数也会有不直观的行为。所以在创建定时器之前，就把这些值拒绝掉。</p>
</blockquote>
<p><strong>防抖怎么实现？</strong></p>
<blockquote>
<p>见<a href="/questions/alg-debounce/">《怎样实现只在停止调用后执行的防抖函数？》</a>。</p>
</blockquote>`};export{e as default};