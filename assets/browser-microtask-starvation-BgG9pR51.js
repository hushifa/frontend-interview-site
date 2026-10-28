var e={answerHtml:`<h2>简答</h2>
<ul>
<li>一个任务执行完后，浏览器会执行微任务检查点，一直执行到微任务队列为空。</li>
<li>清空过程中新加入的微任务也在这一轮执行，不会留到下一轮。</li>
<li>微任务持续产生新微任务时，事件循环无法进入渲染和下一个任务，页面卡死，效果和死循环一样。</li>
<li>要让出主线程，应使用 <code>setTimeout</code>、<code>MessageChannel</code> 或 <code>scheduler.yield()</code> 这类任务级调度。</li>
</ul>
<h2>示例</h2>
<p>会卡死页面：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loop</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(loop);
}
<span class="hljs-title function_">loop</span>();
</code></pre></div>
<p>不会卡死，但会持续占用 CPU：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loop</span>(<span class="hljs-params"></span>) {
  <span class="hljs-built_in">setTimeout</span>(loop, <span class="hljs-number">0</span>);
}
<span class="hljs-title function_">loop</span>();
</code></pre></div>
<p>第二种写法每次回调都是新任务，任务之间浏览器可以处理输入和渲染。</p>
<h2>实际场景</h2>
<ul>
<li>用 <code>await</code> 循环处理大数组，每一步都 <code>await</code> 一个已完成的 Promise，整个循环仍然在一次微任务检查点内跑完，没有让出主线程。</li>
<li>递归的 Promise 链没有终止条件。</li>
<li><code>MutationObserver</code> 回调里修改被观察的 DOM，触发新的回调。</li>
</ul>
<p>分片处理大量数据的写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">processInChunks</span>(<span class="hljs-params">items, handle</span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; items.<span class="hljs-property">length</span>; i++) {
    <span class="hljs-title function_">handle</span>(items[i]);
    <span class="hljs-keyword">if</span> (i % <span class="hljs-number">500</span> === <span class="hljs-number">499</span>) {
      <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">0</span>));
    }
  }
}
</code></pre></div>
<h2>常见追问</h2>
<ul>
<li>为什么 <code>await Promise.resolve()</code> 不能让出：它恢复执行的位置在微任务里，不会经过渲染。</li>
<li>微任务适合什么：在当前任务结束前、渲染前完成的收尾工作，例如批量合并状态更新。</li>
</ul>`};export{e as default};