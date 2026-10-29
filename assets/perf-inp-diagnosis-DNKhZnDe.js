var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>INP 衡量的是用户点击、轻触或按键以后，要等多久页面才画出下一帧。200 毫秒以内算良好，200 到 500 毫秒需要改进，超过 500 毫秒算较差，按页面访问的 75 分位评估。滚动和缩放不算在内。</p>
<p>一次交互可以拆成三段。第一段是输入延迟，用户点了，但主线程正忙，事件要排队；第二段是处理时间，事件回调本身在执行；第三段是呈现延迟，回调跑完到浏览器把下一帧画出来。</p>
<p>定位时先找到最慢的那次交互，再看它慢在哪一段。输入延迟高就去找当时占着主线程的长任务；处理时间高就减少回调里的同步工作和更新范围；呈现延迟高就检查样式、布局和 DOM 规模。</p>
<p>线上用 web-vitals 库的 attribution 版本采集这三段，开发时用 DevTools 的 Performance 面板复现。</p>
</blockquote>
<h2>INP 取的是哪一次交互</h2>
<p>页面停留期间会有很多次交互，INP 取的是接近最慢的那一次。为什么说“接近”？因为交互很多的页面，偶尔一次异常慢的可能是噪声。规则是交互达到 50 次及以上的页面取 98 分位，相当于每 50 次交互剔除一个最差值。</p>
<p>所以 INP 变差，通常意味着某一类交互稳定地慢，而不是平均每次都慢一点。</p>
<h2>线上怎么采集这三段</h2>
<p><code>web-vitals</code> 库的 attribution 版本会直接给出最慢交互的目标元素、类型和三段耗时：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { onINP } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;web-vitals/attribution&#x27;</span>;

<span class="hljs-title function_">onINP</span>(<span class="hljs-function">(<span class="hljs-params">{ value, rating, attribution }</span>) =&gt;</span> {
  <span class="hljs-title function_">sendToAnalytics</span>({
    <span class="hljs-attr">value</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(value),
    rating,
    <span class="hljs-attr">target</span>: attribution.<span class="hljs-property">interactionTarget</span>,
    <span class="hljs-attr">type</span>: attribution.<span class="hljs-property">interactionType</span>,
    <span class="hljs-attr">inputDelay</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(attribution.<span class="hljs-property">inputDelay</span>),
    <span class="hljs-attr">processing</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(attribution.<span class="hljs-property">processingDuration</span>),
    <span class="hljs-attr">presentation</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(attribution.<span class="hljs-property">presentationDelay</span>),
  });
});
</code></pre></div>
<p><code>interactionTarget</code> 告诉你用户点的是哪个元素，三个耗时告诉你慢在哪一段。有了这两样，就知道该去看哪段代码了。</p>
<p>不用库的话，也可以直接观察浏览器提供的 Event Timing 条目：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
    <span class="hljs-keyword">if</span> (!entry.<span class="hljs-property">interactionId</span>) <span class="hljs-keyword">continue</span>;
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(entry.<span class="hljs-property">name</span>, {
      <span class="hljs-attr">inputDelay</span>: entry.<span class="hljs-property">processingStart</span> - entry.<span class="hljs-property">startTime</span>,
      <span class="hljs-attr">processing</span>: entry.<span class="hljs-property">processingEnd</span> - entry.<span class="hljs-property">processingStart</span>,
      <span class="hljs-attr">presentation</span>: entry.<span class="hljs-property">startTime</span> + entry.<span class="hljs-property">duration</span> - entry.<span class="hljs-property">processingEnd</span>,
    });
  }
}).<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;event&#x27;</span>, <span class="hljs-attr">durationThreshold</span>: <span class="hljs-number">16</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>这里的三段就是用时间点相减算出来的：<code>startTime</code> 是用户操作的时刻，<code>processingStart</code> 和 <code>processingEnd</code> 是回调开始和结束，<code>startTime + duration</code> 是下一帧画出来的时刻。</p>
<p>可是为什么生产环境还是推荐用库？因为一次点击会产生 <code>pointerdown</code>、<code>pointerup</code>、<code>click</code> 好几个事件条目，它们共用一个 <code>interactionId</code>，整页 INP 怎么从这些条目里算出来，规则比较复杂。另外 <code>duration</code> 的精度是 8ms，所以三段拆分只是估算。</p>
<h2>慢在哪一段，就改哪一段</h2>
<p>如果是输入延迟高，说明用户操作的时候主线程正被别的任务占着。要找出交互前后的长任务和长动画帧，见<a href="/questions/perf-long-animation-frames/">《如何用 Long Animation Frames API 定位卡顿来源？》</a>。然后把初始化逻辑和第三方脚本拆开，非关键的工作推迟到空闲时段。</p>
<p>如果是处理时间高，说明事件回调本身太慢。回调里先更新能立即给用户反馈的状态，其余工作用 <code>scheduler.yield()</code> 或 <code>setTimeout</code> 往后放，见<a href="/questions/perf-longtasks/">《什么是长任务，为什么会影响交互响应？怎样观测和拆分？》</a>。另外减少一次交互触发的组件重渲染范围，排序、过滤这类纯计算可以挪到 Worker。</p>
<p>如果是呈现延迟高，说明回调结束以后渲染很慢。DOM 太大可以用虚拟列表或 <code>content-visibility</code>。写完样式马上读 <code>offsetHeight</code> 这类布局属性，会逼浏览器立刻重新布局，这叫布局抖动，改成先批量读、再批量写。复杂选择器和大面积重绘也要简化。</p>
<h2>INP 好不代表用户等得少</h2>
<p>INP 只算到下一帧画出来为止。所以点击以后马上显示一个加载状态，下一帧很快出现，INP 就可能是良好的，哪怕数据两秒以后才回来。</p>
<p>这本身是合理的优化，用户至少知道页面有反应了。但“从点击到真正完成”是另一个业务指标，需要单独测。</p>
<h2>常见追问</h2>
<p><strong>为什么实验室里测不到很高的 INP？</strong></p>
<blockquote>
<p>因为 Lighthouse 这类工具只模拟加载，不会去点页面。INP 必须靠真实用户数据，或者自己在 DevTools 里手动录交互。实验室里可以用总阻塞时间 TBT 作为参考。</p>
</blockquote>
<p><strong>只优化事件回调就够了吗？</strong></p>
<blockquote>
<p>不够。很多时候输入延迟和呈现延迟才是大头，回调本身并不慢。所以要先拆三段看清楚，再决定改哪里。</p>
</blockquote>`};export{e as default};