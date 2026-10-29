var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器每执行完一个任务，就会把微任务队列一口气清空，这一步叫微任务检查点。</p>
<p>关键在于，清空过程中新加进来的微任务也在这一轮执行，不会留到下一轮。所以如果一个微任务又产生新的微任务，新的再产生新的，这一轮就永远结束不了。</p>
<p>事件循环卡在这一步，没法去渲染页面，也没法处理下一个任务，比如用户的点击。页面看起来就卡死了，效果和写了个死循环一样。</p>
<p>要真正让出主线程，得用任务级的调度，比如 <code>setTimeout</code>、<code>MessageChannel</code> 或者 <code>scheduler.yield()</code>。</p>
</blockquote>
<h2>先看现象</h2>
<p>下面这段会让页面卡死：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loop</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(loop);
}
<span class="hljs-title function_">loop</span>();
</code></pre></div>
<p>把 <code>Promise</code> 换成 <code>setTimeout</code>，页面就不会卡死，只是会一直占着 CPU：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loop</span>(<span class="hljs-params"></span>) {
  <span class="hljs-built_in">setTimeout</span>(loop, <span class="hljs-number">0</span>);
}
<span class="hljs-title function_">loop</span>();
</code></pre></div>
<p>两段代码都是“无限循环”，为什么一个卡死、一个不卡？</p>
<h2>原因：微任务要清空才算完</h2>
<p>第一段里，每个 <code>then</code> 回调都是微任务，它在执行时又加了一个新微任务。按规则，新加的也要在这一轮清掉，于是这一轮永远清不完，浏览器一直到不了渲染那一步。</p>
<p>第二段里，每个回调都是一个新任务。任务和任务之间，浏览器有机会去处理输入、渲染页面，所以页面还能响应。</p>
<p>可以在 Node 里验证这一点。下面让微任务链跑 10 万次，再看定时器什么时候执行：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;定时器执行时，微任务已跑了&#x27;</span>, count, <span class="hljs-string">&#x27;次&#x27;</span>), <span class="hljs-number">0</span>);
<span class="hljs-keyword">function</span> <span class="hljs-title function_">loop</span>(<span class="hljs-params"></span>) {
  count += <span class="hljs-number">1</span>;
  <span class="hljs-keyword">if</span> (count &lt; <span class="hljs-number">100000</span>) <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(loop);
}
<span class="hljs-title function_">loop</span>();
<span class="hljs-comment">// 定时器执行时，微任务已跑了 100000 次</span>
</code></pre></div>
<p>定时器明明是 0 毫秒，可它要等 10 万个微任务全部跑完才轮到。换成浏览器，渲染和点击处理也是在后面等着的。</p>
<h2>实际开发中哪些写法会踩到</h2>
<p>最隐蔽的是用 <code>await</code> 循环处理大数组。每一步都 <code>await</code> 一个已经完成的 Promise，看起来“异步”了，其实整个循环还是在同一次微任务检查点里跑完的，没有让出主线程。</p>
<p>另外两种情况是没有终止条件的递归 Promise 链，以及在 <code>MutationObserver</code> 回调里修改被观察的 DOM，又触发新的回调。</p>
<h2>改法：用任务把工作切开</h2>
<p>大量数据要分片处理时，每处理一批就用 <code>setTimeout</code> 让出一次：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">processInChunks</span>(<span class="hljs-params">items, handle</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; items.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-title function_">handle</span>(items[i]);
    <span class="hljs-keyword">if</span> (i % <span class="hljs-number">500</span> === <span class="hljs-number">499</span>) {
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">0</span>));
    }
  }
}
</code></pre></div>
<p>每 500 项 <code>await</code> 一个定时器。后面的代码要等定时器这个任务来恢复，中间浏览器就能渲染、响应点击。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>await Promise.resolve()</code> 不能让出主线程？</strong></p>
<blockquote>
<p>因为 <code>await</code> 后面的代码是在微任务里恢复的，还在同一个微任务检查点里，不会经过渲染。要让出，得等一个任务，比如 <code>setTimeout</code>。</p>
</blockquote>
<p><strong>那微任务适合做什么？</strong></p>
<blockquote>
<p>适合在当前任务结束前、渲染前做的收尾工作，比如把几次状态更新合并成一次。它的特点是“马上做、不让出”，所以不适合做大量计算。</p>
</blockquote>`};export{e as default};