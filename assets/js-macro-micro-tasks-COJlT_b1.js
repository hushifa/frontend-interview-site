var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一段脚本里同时写了 <code>setTimeout(fn, 0)</code>、<code>Promise.resolve().then(fn)</code> 和 <code>requestAnimationFrame(fn)</code>，Promise 的回调一定最先执行，另外两个谁先谁后不固定。</p>
<p>面试里说的“宏任务”，在 HTML 规范里就叫任务（task），规范里并没有“宏任务”这个词。整段脚本的执行、<code>setTimeout</code> 和 <code>setInterval</code> 到点后的回调、点击这类事件的派发、<code>postMessage</code> 的消息都是任务。微任务（microtask）主要有 Promise 的回调、<code>await</code> 之后的代码、<code>queueMicrotask</code> 和 <code>MutationObserver</code> 的回调。每个任务跑完，浏览器都会把微任务队列清空，所以同步代码之后最先轮到微任务。</p>
<p><code>requestAnimationFrame</code> 的回调两种都不算。它被存进文档的动画帧回调表里，等浏览器决定更新渲染时，在样式计算和布局之前统一调用。下一次渲染时机由屏幕刷新率等因素决定，可能在定时器之前，也可能在之后。</p>
<p>要注意，背“宏任务列表”时别把不同来源的任务排出固定先后。规范允许浏览器在不同的任务队列之间自行挑选，能保证的只有同一个任务源里先进先出。</p>
</blockquote>
<h2>规范里有哪些队列</h2>
<p>先把名词理清楚。HTML 规范的事件循环里有两类队列：若干个任务队列，和一个微任务队列。规范明确写了“微任务队列不是任务队列”。所以平时说的“宏任务队列”，对应的是规范里的任务队列，而且不止一个。</p>
<p>任务按来源分成不同的任务源（task source）。规范列出的通用任务源有 DOM 操作、用户交互（键盘、鼠标输入，比如 click 事件）、网络、导航与历史、渲染；<code>setTimeout</code> 用的是定时器任务源，<code>postMessage</code> 用的是 posted message 任务源。MDN 对任务的定义也一样：脚本开始执行、异步派发事件、定时器到点，都会往任务队列里加任务。</p>
<p>微任务这边，ECMAScript 把 Promise 相关的工作交给宿主通过 <code>HostEnqueuePromiseJob</code> 安排，HTML 规范写明“把这些操作放进微任务队列”。MDN 也写了 Promise 和 Mutation Observer API 都用微任务队列执行回调，<code>queueMicrotask()</code> 则让开发者自己往里加。</p>
<h2>一轮循环里谁先谁后</h2>
<p>规范的处理模型，简化一下是这样的：</p>
<ol>
<li>如果有可运行的任务，从某个任务队列里取出最早的一个执行。挑哪个队列由浏览器决定。</li>
<li>执行微任务检查点：一直执行微任务，直到队列为空，中途新加的也算。</li>
<li>如果到了渲染时机，就更新渲染：处理 resize、scroll 等事件，执行 <code>requestAnimationFrame</code> 回调，然后计算样式、布局，画到屏幕上。</li>
</ol>
<p>在 Node.js 里先看任务和微任务的顺序。下面的数字就是实际打印顺序：</p>
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