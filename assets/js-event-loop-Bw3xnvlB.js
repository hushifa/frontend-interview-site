var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>JavaScript 是单线程的，一次只能做一件事。异步回调不会马上执行，而是先排队，等当前的代码跑完再按顺序取出来执行。</p>
<p>排队的地方分两种：一种叫任务，也叫宏任务，比如 <code>setTimeout</code>、点击事件；另一种叫微任务，比如 Promise 的 <code>then</code>、<code>await</code> 后面的代码。</p>
<p>执行顺序是：先把当前的同步代码跑完，然后把微任务队列全部清空，清空的过程中新加进来的微任务也一起执行完，接着才去取下一个任务。所以同一段同步代码里安排的 Promise 回调，会比 <code>setTimeout</code> 的回调先执行。浏览器会在两个任务之间找时机渲染页面，但不保证每个任务后面都渲染一次。</p>
<p>要注意的是，如果微任务里不停地产生新的微任务，后面的任务和页面渲染就会一直等着，页面看起来就卡住了。</p>
</blockquote>
<h2>先看一道经典输出题</h2>
<p>下面四行代码，有同步打印，有 <code>setTimeout</code>，有 Promise。先猜一下输出顺序。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;A&#x27;</span>);
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;B&#x27;</span>), <span class="hljs-number">0</span>);
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;C&#x27;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;D&#x27;</span>);
<span class="hljs-comment">// 输出顺序：A → D → C → B</span>
</code></pre></div>
<p>很多人第一反应是 <code>setTimeout</code> 写的是 0 毫秒，应该马上执行。可实际上 <code>B</code> 最后才打印，比后面写的 Promise 回调还晚。</p>
<p>原因是这样的。<code>A</code> 和 <code>D</code> 是同步代码，按顺序直接执行。<code>setTimeout</code> 的回调不会马上跑，它被放进了定时器对应的任务队列。<code>then</code> 的回调也不会马上跑，它被放进了微任务队列。等这段脚本整个执行完，引擎先清空微任务队列，打印 <code>C</code>。微任务清空以后，事件循环才去取下一个任务，这时才轮到定时器回调，打印 <code>B</code>。</p>
<h2>一轮事件循环在做什么</h2>
<p>事件循环说白了就是浏览器一直在重复的一套流程：取一件事做完，再取下一件。每一圈大致是这样：</p>
<ol>
<li>从某个任务队列里取出一个任务执行，比如整段脚本、一个定时器回调、一个点击事件回调。</li>
<li>这个任务跑完、调用栈空了以后，把微任务队列全部执行完。这一步叫微任务检查点。</li>
<li>如果到了该渲染的时候，就依次处理 resize、scroll 这类事件，执行 <code>requestAnimationFrame</code> 回调，计算样式和布局，再把页面画出来。</li>
<li>回到第 1 步，取下一个任务。</li>
</ol>
<p>这里有两点容易误解。第一，渲染不是每个任务后面都有，浏览器会根据屏幕刷新等情况自己找时机，所以只能说“在任务之间可能渲染”。第二，任务队列不止一个，定时器、用户交互、网络回调可能来自不同的任务源。HTML 规范允许浏览器在不同任务源之间按优先级挑选，所以“不同来源的任务谁先执行”没有固定顺序，能保证的只是同一个任务源里按放进去的顺序执行。</p>
<h2>微任务里加的微任务，也排在定时器前面</h2>
<p>既然第 2 步要把微任务“全部”清空，那微任务里再加一个微任务会怎样？</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;timeout&#x27;</span>), <span class="hljs-number">0</span>);

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;then 1&#x27;</span>);
  <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;then 2&#x27;</span>));
});
<span class="hljs-comment">// then 1 → then 2 → timeout</span>
</code></pre></div>
<p><code>then 2</code> 是在 <code>then 1</code> 执行时才加进去的，看起来已经“晚了”，可它还是排在 <code>timeout</code> 前面。因为微任务检查点会一直执行到队列为空，中途新加进来的也算在这一轮里。只有微任务彻底没了，定时器任务才有机会执行。</p>
<h2>await 后面的代码什么时候执行</h2>
<p><code>await</code> 看起来像是停在原地等，其实它把函数拆成了前后两半。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">run</span>(<span class="hljs-params"></span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">1</span>);
  <span class="hljs-keyword">await</span> <span class="hljs-literal">null</span>;
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">3</span>);
}
<span class="hljs-title function_">run</span>();
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-number">2</span>);
<span class="hljs-comment">// 1 → 2 → 3</span>
</code></pre></div>
<p>调用 <code>run()</code> 时，<code>await</code> 之前的代码是同步执行的，所以先打印 1。遇到 <code>await</code>，函数先暂停，把控制权交回外面，于是外面的 <code>console.log(2)</code> 先执行。<code>await</code> 后面的部分作为微任务恢复，等当前同步代码跑完才打印 3。所以常说“<code>await</code> 后面的代码相当于写在了 <code>then</code> 里”，就是这个意思。</p>
<h2>微任务一直不停会发生什么</h2>
<p>如果微任务一直在产生新的微任务，会怎样？</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">loop</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title function_">queueMicrotask</span>(loop); <span class="hljs-comment">// 永远不会让出给定时器和渲染</span>
}
</code></pre></div>
<p>现象是页面直接卡死，点击没反应，定时器也不触发。原因是每执行一次 <code>loop</code>，它又往微任务队列里放了一个自己，队列永远清不空，事件循环就一直停在第 2 步，到不了渲染，也取不到下一个任务。这种情况叫微任务饥饿。</p>
<p>改法是把耗时的工作切成小块，每块放进<strong>任务</strong>里，而不是放进微任务里。比如用 <code>setTimeout</code>、<code>MessageChannel</code> 或 <code>scheduler.postTask</code> 安排下一块；也可以在每块之间 <code>await scheduler.yield()</code> 主动让出。这样两块之间，浏览器就有机会渲染页面、响应用户操作。</p>
<h2>常见追问</h2>
<p><strong>Node.js 里的顺序也一样吗？</strong></p>
<blockquote>
<p>大体模型一样，同步代码、微任务、任务的先后关系不变。但 Node 多了一个 <code>process.nextTick</code> 队列，还有 libuv 划分的几个阶段，细节上有区别，详见<a href="/questions/node-eventloop/">《Node.js 事件循环和浏览器有什么不同？nextTick 一定先于 Promise 吗？》</a>。</p>
</blockquote>
<p><strong><code>setTimeout(fn, 0)</code> 会立刻执行吗？</strong></p>
<blockquote>
<p>不会。它的回调是一个任务，至少要等当前任务和所有微任务都执行完才轮得到。而且定时器嵌套层级比较深时，浏览器还会把延迟强制拉到至少 4 毫秒。</p>
</blockquote>`};export{e as default};