var e={answerHtml:`<h2>简答</h2>
<ul>
<li>阈值：≤200ms 良好，200–500ms 需要改进，&gt;500ms 较差，按页面访问的 75 分位评估。</li>
<li>统计范围：页面生命周期内的点击、轻触和键盘交互，不包括滚动和缩放；交互达到 50 次及以上的页面取 98 分位，相当于每 50 次交互剔除一个最差值。</li>
<li>三个阶段：输入延迟（等主线程空闲）、处理时间（事件回调执行）、呈现延迟（回调结束到下一帧绘制）。</li>
<li>输入延迟高找长任务；处理时间高减少同步工作和更新范围；呈现延迟高检查样式、布局和 DOM 规模。</li>
<li>生产环境用 web-vitals 库的 attribution 版本采集，开发环境用 DevTools Performance 面板复现。</li>
</ul>
<h2>采集</h2>
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
<p>不用库时，可以直接观察 Event Timing：</p>
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
<p>一次交互会产生多个事件条目（如 <code>pointerdown</code>、<code>pointerup</code>、<code>click</code>），共用一个 <code>interactionId</code>，整页 INP 的计算规则比较复杂，生产环境优先使用 web-vitals 库。<code>duration</code> 精度为 8ms，阶段拆分只是估算。</p>
<h2>按阶段优化</h2>
<p><strong>输入延迟高</strong>：交互发生时主线程被别的任务占用。</p>
<ul>
<li>找出交互前后的长任务和长动画帧，见<a href="/questions/perf-long-animation-frames/">《如何用 Long Animation Frames API 定位卡顿来源？》</a>。</li>
<li>拆分初始化和第三方脚本，非关键工作推迟到空闲时段。</li>
</ul>
<p><strong>处理时间高</strong>：事件回调本身慢。</p>
<ul>
<li>回调里先更新能立即给出反馈的状态，其余工作用 <code>scheduler.yield()</code> 或 <code>setTimeout</code> 延后，见<a href="/questions/perf-longtasks/">《什么是长任务，为什么会影响交互响应？怎样观测和拆分？》</a>。</li>
<li>减少一次交互触发的组件重渲染范围，排序、过滤等纯计算移到 Worker。</li>
</ul>
<p><strong>呈现延迟高</strong>：回调结束后渲染慢。</p>
<ul>
<li>DOM 太大：虚拟列表、<code>content-visibility</code>。</li>
<li>布局抖动：避免写样式后立即读 <code>offsetHeight</code> 等布局属性，先批量读再批量写。</li>
<li>复杂选择器、大面积重绘：简化样式。</li>
</ul>
<h2>一个容易误解的点</h2>
<p>INP 只算到下一帧绘制。点击后立即显示加载状态，下一帧很快出现，INP 就可能良好，即使数据两秒后才返回。端到端完成时间是另一个业务指标，需要单独测量。</p>
<h2>常见追问</h2>
<ul>
<li>为什么实验室测不到高 INP？Lighthouse 等工具不模拟用户交互，INP 必须靠真实用户数据或手动录制；实验室可以用 Total Blocking Time 作为参考。</li>
<li>只优化事件回调够吗？不够。输入延迟和呈现延迟常常占主要部分。</li>
</ul>`};export{e as default};