var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做输出顺序题，先给每行代码归类，再按事件循环的规则排。规则本身见<a href="/questions/js-event-loop/">《事件循环中，任务和微任务按什么顺序执行？》</a>，这里只讲怎么推。</p>
<p>第一类是同步代码，按书写顺序立刻执行。容易看错的是：<code>new Promise</code> 的执行器函数是同步执行的；<code>async</code> 函数在第一个 <code>await</code> 之前的部分也是同步执行的，<code>await</code> 右边的表达式同样会立刻求值。</p>
<p>第二类是微任务：Promise 的 <code>then</code>、<code>catch</code>、<code>finally</code> 回调，<code>await</code> 之后的代码，<code>queueMicrotask</code> 和 <code>MutationObserver</code> 的回调。同步代码跑完后，它们按进队顺序全部执行完，执行中新加的微任务也在这一轮执行。第三类是任务，常说的宏任务，比如 <code>setTimeout</code> 回调，要等微任务清空才轮到下一个。</p>
<p><code>requestAnimationFrame</code> 单独算。它的回调既不是任务也不是微任务，而是在浏览器更新渲染时调用，所以只能确定它晚于同步代码和已排队的微任务，和 <code>setTimeout(fn, 0)</code> 谁先没有固定答案。</p>
</blockquote>
<h2>推导的步骤</h2>
<p>拿到一道题，按下面的顺序走一遍：</p>
<ol>
<li>从上往下只看同步代码，把打印依次写下来。遇到 <code>setTimeout</code> 记进“任务”列，遇到 <code>then</code> 或 <code>await</code> 之后的代码记进“微任务”列。</li>
<li>同步代码结束后，从微任务列的头开始逐个执行。执行时又产生的微任务追加到这一列末尾，产生的定时器追加到任务列末尾。</li>
<li>微任务列空了，取任务列的第一个执行，执行完再回到第 2 步。</li>
</ol>
<p>需要说明的是，规范里没有“宏任务”这个词，对应的是任务（task）。不同来源的任务（比如定时器和点击事件）谁先执行，规范允许浏览器自己选，只有同一个任务源里先进先出。所以题目一般只用定时器来考任务顺序。</p>
<h2>经典的 async/await 题</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> log = [];
<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">async1</span>(<span class="hljs-params"></span>) {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;2 async1 开始&#x27;</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-title function_">async2</span>();
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;6 async1 结束&#x27;</span>);
}
<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">async2</span>(<span class="hljs-params"></span>) {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;3 async2&#x27;</span>);
}
log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;1 script 开始&#x27;</span>);
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;8 setTimeout&#x27;</span>);
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; → &#x27;</span>)); <span class="hljs-comment">// 1 script 开始 → 2 async1 开始 → 3 async2 → 4 Promise 执行器 → 5 script 结束 → 6 async1 结束 → 7 then → 8 setTimeout</span>
}, <span class="hljs-number">0</span>);
<span class="hljs-title function_">async1</span>();
<span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;4 Promise 执行器&#x27;</span>);
  <span class="hljs-title function_">resolve</span>();
}).<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;7 then&#x27;</span>));
log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;5 script 结束&#x27;</span>);
</code></pre></div>
<p>按步骤推。同步阶段：先打印 1，<code>setTimeout</code> 记进任务列。调用 <code>async1()</code>，打印 2；<code>await async2()</code> 先同步调用 <code>async2</code>，打印 3；然后 <code>async1</code> 暂停，“6”记进微任务列。<code>new Promise</code> 的执行器同步执行，打印 4，<code>resolve()</code> 后“7”记进微任务列。最后打印 5。</p>
<p>微任务阶段按进队顺序执行，先 6 后 7。最后取任务列的定时器，打印 8。</p>
<p>这里“6”排在“7”前面，是因为 <code>await</code> 一个原生 Promise 时，后续代码在该 Promise 兑现后作为一个微任务恢复，而 <code>async2()</code> 返回的 Promise 已经兑现，所以“6”比“7”先进队。</p>
<h2>嵌套的微任务和定时器</h2>
<p>再看一道嵌套题：微任务里又安排了微任务和定时器。在 Node.js 里运行，下面的数字就是实际打印顺序：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> log = [];
log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;1 同步&#x27;</span>);
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;5 setTimeout&#x27;</span>);
}, <span class="hljs-number">0</span>);
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;3 then&#x27;</span>);
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> {
    log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;6 then 里的 setTimeout&#x27;</span>);
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(log.<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27; → &#x27;</span>)); <span class="hljs-comment">// 1 同步 → 2 同步 → 3 then → 4 then 里的微任务 → 5 setTimeout → 6 then 里的 setTimeout</span>
  }, <span class="hljs-number">0</span>);
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;4 then 里的微任务&#x27;</span>));
});
log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;2 同步&#x27;</span>);
</code></pre></div>
<p>为什么“4”能插到“5”前面？“4”是在微任务执行时才加进去的，但微任务检查点会一直跑到队列空为止，所以它还在这一轮里。“6”是微任务里新安排的定时器，只能排到已有的“5”后面。</p>
<h2>requestAnimationFrame 排在哪里</h2>
<p><code>requestAnimationFrame(callback)</code> 做的事情很简单：按规范的步骤，它只是把回调存进当前文档的动画帧回调表，返回一个编号。它不往任何任务队列或微任务队列里放东西。MDN 的描述是“在下一次重绘之前调用指定的回调”。</p>
<p>真正调用回调的地方是“更新渲染”。规范的做法是，事件循环发现有文档到了渲染时机，就在渲染任务源上排一个“更新渲染”的任务，这个任务里依次处理 resize、scroll 等步骤，然后对每个文档“运行动画帧回调”，再去算样式和布局。渲染时机多久来一次，规范没有规定固定模型，只举例说 60Hz 时最多约 16.7 毫秒一次，页面不可见时可能更少。浏览器判断渲染不会有可见变化时，还可以跳过这一步。</p>
<p>所以 <code>setTimeout(fn, 0)</code> 和 <code>requestAnimationFrame</code> 谁先，取决于定时器到点和渲染时机哪个先来。用 Chrome 156 的无头模式跑下面这段，三次都得到 <code>sync, micro, qm, timeout, raf, raf-micro</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> log = [];
log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;sync&#x27;</span>);
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;timeout&#x27;</span>), <span class="hljs-number">0</span>);
<span class="hljs-title function_">requestAnimationFrame</span>(<span class="hljs-function">() =&gt;</span> {
  log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;raf&#x27;</span>);
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;raf-micro&#x27;</span>));
});
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;micro&#x27;</span>));
<span class="hljs-title function_">queueMicrotask</span>(<span class="hljs-function">() =&gt;</span> log.<span class="hljs-title function_">push</span>(<span class="hljs-string">&#x27;qm&#x27;</span>));
</code></pre></div>
<p>这只能说明这次环境里定时器先到。无头模式没有真实屏幕，渲染不按真实的帧节奏走，换成有界面的浏览器、换一个页面状态，<code>raf</code> 跑到 <code>timeout</code> 前面也是规范允许的。面试时能确定的说法只有：微任务先于两者；两者之间没有固定顺序。</p>
<p>另一个结果可以确定：<code>raf-micro</code> 紧跟在 <code>raf</code> 后面。在同一次渲染里注册两个 rAF 回调，第一个回调里加一个微任务，Chrome 156 的结果是 <code>raf1, raf1-micro, raf2</code>。原因是每个回调都由“调用回调”的算法执行，回调结束、执行栈为空时会做一次微任务检查点，所以回调之间会清空微任务。</p>
<h2>常见追问</h2>
<p><strong>为什么 setTimeout(fn, 0) 不是马上执行？</strong></p>
<blockquote>
<p>它只是让定时器到点后往任务队列里加一个任务，要等当前任务和所有微任务执行完才可能轮到。另外 HTML 规范规定，定时器嵌套超过 5 层且延时小于 4 毫秒时，延时会被提到 4 毫秒。</p>
</blockquote>
<p><strong>动画为什么推荐用 requestAnimationFrame 而不是 setTimeout？</strong></p>
<blockquote>
<p>rAF 回调在浏览器下一次重绘之前执行，频率跟着渲染时机走，回调里改的样式正好赶上这一帧；定时器的到点时间和屏幕刷新没有关系。另外 MDN 提到，大多数浏览器会在后台标签页和隐藏的 iframe 里暂停 rAF 调用，以节省性能和电量。</p>
</blockquote>
<p><strong>Node.js 里也有宏任务和微任务吗？</strong></p>
<blockquote>
<p>Node.js 没有渲染步骤，也没有 <code>requestAnimationFrame</code>，它的事件循环分阶段执行，还多了 <code>process.nextTick</code>。细节见<a href="/questions/node-eventloop/">《Node.js 事件循环和浏览器有什么不同？nextTick 一定先于 Promise 吗？》</a>。</p>
</blockquote>`};export{e as default};