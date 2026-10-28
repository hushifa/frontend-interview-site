var e={answerHtml:`<h2>简答</h2>
<ul>
<li>主线程同时负责 JavaScript、输入事件、样式、布局和绘制，一个任务连续占用 50ms 以上就是长任务。</li>
<li>用户在长任务期间的点击要等它结束才能处理，这段等待计入 INP 的输入延迟。</li>
<li>观测：<code>PerformanceObserver</code> 观察 <code>longtask</code>；Chromium 中优先用 Long Animation Frames（<code>long-animation-frame</code>），它以帧为单位，并能归因到具体脚本。</li>
<li>优化顺序：先减少不必要的工作，再分片并在片之间让出主线程（<code>scheduler.yield()</code>，不支持时退回 <code>setTimeout</code>），纯计算移到 Worker。</li>
<li><code>await Promise.resolve()</code> 只进入微任务队列，不会让浏览器处理输入或渲染。</li>
</ul>
<h2>观测</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
    <span class="hljs-comment">// containerSrc 可能带查询参数等敏感信息，上报前只保留来源</span>
    <span class="hljs-keyword">const</span> src = entry.<span class="hljs-property">attribution</span>[<span class="hljs-number">0</span>]?.<span class="hljs-property">containerSrc</span>;
    <span class="hljs-keyword">const</span> origin = src ? <span class="hljs-keyword">new</span> <span class="hljs-title function_">URL</span>(src, location.<span class="hljs-property">href</span>).<span class="hljs-property">origin</span> : <span class="hljs-string">&#x27;self&#x27;</span>;
    <span class="hljs-title function_">report</span>({ <span class="hljs-attr">duration</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(entry.<span class="hljs-property">duration</span>), <span class="hljs-attr">startTime</span>: entry.<span class="hljs-property">startTime</span>, origin });
  }
}).<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;longtask&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>Long Tasks API 只告诉你&quot;有一段长时间占用&quot;。<code>attribution</code> 只到容器（哪个 iframe 或窗口），不是调用栈。<code>buffered: true</code> 只能拿到时间线缓冲区里仍保留的条目，不是完整历史。要判断长任务是否影响了用户，把条目的 <code>startTime</code> 和用户操作处的 <code>performance.mark()</code> 对齐比较。需要知道是哪个脚本、是否发生强制布局时，用 LoAF，见<a href="/questions/perf-long-animation-frames/">《如何用 Long Animation Frames API 定位卡顿来源？》</a>。LoAF 目前不是 Baseline。两种条目都先用 <code>PerformanceObserver.supportedEntryTypes.includes(&#x27;longtask&#x27;)</code> 或 <code>&#x27;long-animation-frame&#x27;</code> 检测再观察。</p>
<h2>分片让出主线程</h2>
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
<ul>
<li>每处理约 8ms 让出一次，给输入和渲染机会，数值按设备调整。</li>
<li><code>scheduler.yield()</code> 返回后的续作排在同优先级普通任务之前，不容易被其他任务插队；在 <code>scheduler.postTask()</code> 回调中调用时会继承该任务的优先级。MDN 标注其为有限可用，需要特性检测。</li>
<li><code>setTimeout</code> 降级可能被浏览器节流，后台标签页里延迟更大。</li>
<li>用户发起了新操作时，用 <code>AbortSignal</code> 取消旧任务，避免旧结果覆盖新状态。</li>
</ul>
<h2>其他手段</h2>
<ul>
<li>减少工作：避免每次输入都全量重新计算，缓存结果，对输入防抖。</li>
<li>Worker：排序、解析、压缩这类纯计算放到 Worker，注意数据传输的克隆成本，大数据用 Transferable 转移。</li>
<li>渲染成本：大量 DOM 用虚拟列表，避免读写布局交替导致强制同步布局。</li>
<li>页面加载阶段：拆分打包产物，推迟非关键脚本。</li>
</ul>
<h2>和 TBT、INP 的区别</h2>
<ul>
<li>Long Task：单个超过 50ms 的任务，是原始观测数据。</li>
<li>TBT（Total Blocking Time）：实验室指标，加载期间每个长任务超过 50ms 的部分累加。</li>
<li>INP：现场指标，统计真实交互从输入到下一帧绘制的耗时。长任务是 INP 变差的常见原因，但没有交互时长任务不影响 INP。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>50ms 是怎么来的？来自 RAIL 模型：在 100ms 内响应输入，留一半给浏览器的其他工作。它是观测阈值，不代表低于 50ms 就一定流畅。</li>
<li>多个 30ms 的任务连在一起会怎样？单个都不算长任务，但可能共同让一帧超过 50ms，LoAF 能发现这种情况。</li>
</ul>`};export{e as default};