var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器的主线程要同时负责跑 JavaScript、处理输入事件、算样式、布局和绘制。一个任务连续占着主线程 50 毫秒以上，就叫长任务。</p>
<p>长任务的问题是，它执行期间用户点了什么都只能排队，页面也没法渲染。所以用户会觉得点了没反应，这段等待会计入 INP 的输入延迟。</p>
<p>观测可以用 <code>PerformanceObserver</code> 观察 <code>longtask</code>。在 Chromium 里更推荐 Long Animation Frames，也就是 <code>long-animation-frame</code>，它以帧为单位，还能归因到具体脚本。</p>
<p>优化的顺序是：先减少不必要的工作；再把任务切成小片，每片之间让出主线程，优先用 <code>scheduler.yield()</code>，不支持就退回 <code>setTimeout</code>；纯计算挪到 Worker。要注意，<code>await Promise.resolve()</code> 只是进了微任务队列，浏览器在中间既不会处理输入，也不会渲染。</p>
</blockquote>
<h2>为什么一个任务太长，点击就没反应</h2>
<p>事件循环里，浏览器一次只执行一个任务，执行完才能去处理下一个，比如用户的点击，或者渲染下一帧。所以一个任务跑了 200ms，这 200ms 里用户的点击只能干等。</p>
<p>50ms 这个数字来自 RAIL 模型：要在 100ms 内响应用户输入，留一半时间给浏览器做其他工作。它只是观测阈值，不代表低于 50ms 就一定流畅。</p>
<h2>怎样观测长任务</h2>
<p>下面的代码观察所有长任务，记下时长和它来自哪个容器：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
    <span class="hljs-comment">// containerSrc 可能带查询参数等敏感信息，上报前只保留来源</span>
    <span class="hljs-keyword">const</span> src = entry.<span class="hljs-property">attribution</span>[<span class="hljs-number">0</span>]?.<span class="hljs-property">containerSrc</span>;
    <span class="hljs-keyword">const</span> origin = src ? <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(src, location.<span class="hljs-property">href</span>).<span class="hljs-property">origin</span> : <span class="hljs-string">&#x27;self&#x27;</span>;
    <span class="hljs-title function_">report</span>({ <span class="hljs-attr">duration</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(entry.<span class="hljs-property">duration</span>), <span class="hljs-attr">startTime</span>: entry.<span class="hljs-property">startTime</span>, origin });
  }
}).<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;longtask&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>看完会发现，Long Tasks API 能告诉你的其实很少，它只说“这里有一段时间被占用了”。<code>attribution</code> 只能指到容器，也就是哪个 iframe 或窗口，不是调用栈。<code>buffered: true</code> 也只能拿到时间线缓冲区里还保留着的条目，不是完整历史。</p>
<p>那怎么判断某个长任务有没有影响到用户？可以在用户操作的地方打 <code>performance.mark()</code>，再拿长任务的 <code>startTime</code> 去对齐比较。</p>
<p>如果要知道是哪个脚本、有没有发生强制布局，就要用 LoAF，见<a href="/questions/perf-long-animation-frames/">《如何用 Long Animation Frames API 定位卡顿来源？》</a>。LoAF 目前不是 Baseline，所以两种条目都要先用 <code>PerformanceObserver.supportedEntryTypes.includes(&#x27;longtask&#x27;)</code> 或 <code>&#x27;long-animation-frame&#x27;</code> 检测，再去观察。</p>
<h2>怎样把长任务切开</h2>
<h3>await 一个已完成的 Promise 为什么没用</h3>
<p>很多人想到的第一个办法是在循环里 <code>await</code> 一下。先看这样做会发生什么：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;定时器（代表输入和渲染的机会）&#x27;</span>), <span class="hljs-number">0</span>);

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">work</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; <span class="hljs-number">3</span>; i += <span class="hljs-number">1</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;处理第&#x27;</span>, i, <span class="hljs-string">&#x27;片&#x27;</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>();
  }
}
<span class="hljs-title function_">work</span>();
<span class="hljs-comment">// 处理第 0 片</span>
<span class="hljs-comment">// 处理第 1 片</span>
<span class="hljs-comment">// 处理第 2 片</span>
<span class="hljs-comment">// 定时器（代表输入和渲染的机会）</span>
</code></pre></div>
<p>代码确实停了三次，可是定时器回调一直等到所有片都处理完才执行。原因是 <code>await</code> 后面的代码进的是微任务队列，而浏览器要把微任务全部清空，才会去处理下一个任务。所以这几片在浏览器看来还是同一个长任务，用户的点击和渲染照样插不进来。</p>
<p>改法是让出到任务层面，也就是真正把控制权还给浏览器。</p>
<h3>真正让出主线程</h3>
<p>下面的写法每处理约 8ms 就让出一次：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">yieldToBrowser</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">if</span> (globalThis.<span class="hljs-property">scheduler</span>?.<span class="hljs-property">yield</span>) <span class="hljs-keyword">return</span> globalThis.<span class="hljs-property">scheduler</span>.<span class="hljs-title function_">yield</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve</span>) =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">0</span>));
}

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">processInChunks</span>(<span class="hljs-params">items, visit, signal</span>) {
  <span class="hljs-keyword">let</span> sliceStart = performance.<span class="hljs-title function_">now</span>();
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">let</span> i = <span class="hljs-number">0</span>; i &lt; items.<span class="hljs-property">length</span>; i += <span class="hljs-number">1</span>) {
    signal?.<span class="hljs-title function_">throwIfAborted</span>();
    <span class="hljs-title function_">visit</span>(items[i]);
    <span class="hljs-keyword">if</span> (performance.<span class="hljs-title function_">now</span>() - sliceStart &gt; <span class="hljs-number">8</span>) {
      <span class="hljs-keyword">await</span> <span class="hljs-title function_">yieldToBrowser</span>();
      sliceStart = performance.<span class="hljs-title function_">now</span>();
    }
  }
}
</code></pre></div>
<p>8ms 是给输入和渲染留出机会的一个经验值，可以按设备调整。</p>
<p>为什么优先用 <code>scheduler.yield()</code>？因为它返回以后，剩下的工作会排在同优先级普通任务的前面，不容易被别的任务插队。如果是在 <code>scheduler.postTask()</code> 的回调里调用，还会继承那个任务的优先级。MDN 标注它为有限可用，所以要特性检测。</p>
<p>退回到 <code>setTimeout</code> 也能让出，但浏览器可能对它节流，后台标签页里延迟会更大。</p>
<p>代码里的 <code>signal</code> 是做什么的？用户发起了新操作时，用 <code>AbortSignal</code> 取消旧任务，避免旧结果覆盖新状态。</p>
<h2>除了切片还有哪些办法</h2>
<p>最根本的是减少工作。不要每次输入都全量重新算，能缓存就缓存，输入可以防抖。</p>
<p>纯计算，比如排序、解析、压缩，可以放到 Worker 里，它跑在另一个线程上，不占主线程。不过数据传过去要复制一份，大数据可以用 Transferable 直接转移所有权。</p>
<p>渲染成本也要控制。大量 DOM 用虚拟列表；不要读写布局交替进行，否则会触发强制同步布局。</p>
<p>页面加载阶段的长任务，主要靠拆分打包产物、推迟非关键脚本来解决。</p>
<h2>长任务、TBT、INP 有什么区别</h2>
<p>长任务是原始的观测数据，指单个超过 50ms 的任务。</p>
<p>TBT，总阻塞时间，是实验室指标，把加载期间每个长任务超过 50ms 的部分加起来。</p>
<p>INP 是现场指标，统计真实交互从输入到下一帧绘制的耗时。长任务是 INP 变差的常见原因，可是如果长任务期间用户没有操作，它就不会影响 INP。</p>
<h2>常见追问</h2>
<p><strong>50ms 是怎么来的？</strong></p>
<blockquote>
<p>来自 RAIL 模型，目标是在 100ms 内响应输入，留一半时间给浏览器的其他工作。它是一个观测阈值，不代表低于 50ms 就一定流畅。</p>
</blockquote>
<p><strong>多个 30ms 的任务连在一起会怎样？</strong></p>
<blockquote>
<p>单个都不算长任务，Long Tasks API 也不会报。但它们可能一起让一帧超过 50ms，这种情况 LoAF 能发现。</p>
</blockquote>`};export{e as default};