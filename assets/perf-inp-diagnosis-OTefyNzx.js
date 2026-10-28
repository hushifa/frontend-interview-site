var e={answerHtml:`<p>用户点击筛选按钮后，页面过了半秒才显示结果。把所有 JavaScript 都压到 50 毫秒以内并不能保证体验良好，因为浏览器可能先忙于处理其他任务，事件处理结束后又花很久做样式、布局和绘制。INP（Interaction to Next Paint）关注交互开始到下一次呈现之间的完整时间，诊断时必须把这段时间拆开。</p>
<h2>一次交互包含三个阶段</h2>
<ol>
<li><strong>输入延迟</strong>：浏览器收到用户操作后，等待主线程可以运行事件处理的时间。</li>
<li><strong>处理时间</strong>：事件监听器及其同步调用执行的时间。</li>
<li><strong>呈现延迟</strong>：处理结束后，浏览器完成样式计算、布局、绘制并提交下一帧的时间。</li>
</ol>
<p>长任务可能导致第一阶段变长；事件处理器可能触发大量组件更新；DOM 变化又可能让第三阶段变长。只看点击回调的耗时，无法解释后两种情况。</p>
<h2>用 Event Timing 观察交互候选</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeInteractions</span>(<span class="hljs-params">onInteraction</span>) {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;PerformanceObserver&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>)) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  <span class="hljs-keyword">const</span> types = <span class="hljs-title class_">PerformanceObserver</span>.<span class="hljs-property">supportedEntryTypes</span> ?? [];
  <span class="hljs-keyword">if</span> (!types.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;event&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
      <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">Number</span>.<span class="hljs-built_in">isFinite</span>(entry.<span class="hljs-property">interactionId</span>) || entry.<span class="hljs-property">interactionId</span> === <span class="hljs-number">0</span>) <span class="hljs-keyword">continue</span>;
      <span class="hljs-title function_">onInteraction</span>({
        <span class="hljs-attr">name</span>: entry.<span class="hljs-property">name</span>,
        <span class="hljs-attr">startTime</span>: entry.<span class="hljs-property">startTime</span>,
        <span class="hljs-attr">duration</span>: entry.<span class="hljs-property">duration</span>,
        <span class="hljs-attr">interactionId</span>: entry.<span class="hljs-property">interactionId</span>,
        <span class="hljs-attr">processingStart</span>: entry.<span class="hljs-property">processingStart</span>,
        <span class="hljs-attr">processingEnd</span>: entry.<span class="hljs-property">processingEnd</span>,
        <span class="hljs-attr">presentationTime</span>: entry.<span class="hljs-property">presentationTime</span>,
      });
    }
  });

  observer.<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;event&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">durationThreshold</span>: <span class="hljs-number">16</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>不同浏览器对 Event Timing 字段、事件类型和缓冲行为的支持会变化，代码必须做特性检测。<code>duration</code> 是浏览器记录的事件持续时间，不能简单当成“业务函数执行时间”；同一交互可能产生多个事件条目，真实 RUM 计算需要使用规范和官方库定义的聚合方式。示例用于理解诊断字段，不应直接用一个条目替代完整 INP 计算。</p>
<p>可以先拆分单个事件条目的阶段，帮助定位，而不自行实现整页 INP 聚合：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">splitEventTiming</span>(<span class="hljs-params">entry</span>) {
  <span class="hljs-keyword">const</span> { startTime, processingStart, processingEnd, duration } = entry;
  <span class="hljs-keyword">if</span> (![startTime, processingStart, processingEnd, duration].<span class="hljs-title function_">every</span>(<span class="hljs-title class_">Number</span>.<span class="hljs-property">isFinite</span>) ||
      startTime &lt; <span class="hljs-number">0</span> || processingStart &lt; startTime || processingEnd &lt; processingStart || duration &lt; <span class="hljs-number">0</span>) {
    <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  }
  <span class="hljs-keyword">return</span> {
    <span class="hljs-attr">inputDelay</span>: processingStart - startTime,
    <span class="hljs-attr">processingDuration</span>: processingEnd - processingStart,
    <span class="hljs-comment">// duration 会被量化，差值只能作为估算；避免显示负延迟。</span>
    <span class="hljs-attr">presentationDelayEstimate</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">max</span>(<span class="hljs-number">0</span>, startTime + duration - processingEnd),
  };
}
</code></pre></div>
<p>例如 startTime=100、processingStart=130、processingEnd=150、duration=80，得到约 30 毫秒输入等待、20 毫秒处理和 30 毫秒呈现等待。真实 duration 有精度限制，不能据此报告微秒级差异。连续拖动或滚动的流畅度也不能只靠 INP 判断；INP 主要关注点击、轻触和键盘等交互，动画帧问题另用性能时间线诊断。</p>
<h2>先按交互类型复现，再看调用栈</h2>
<p>开发环境先关闭无关扩展，使用固定数据和固定设备复现“点击筛选”“输入搜索”“打开菜单”等具体动作。DevTools Performance 录制应覆盖动作前后的完整时间线，观察：</p>
<ul>
<li>事件开始前是否有长任务或大量脚本执行；</li>
<li>事件处理器是否同步解析、排序或序列化大数据；</li>
<li>框架提交是否更新了过多节点；</li>
<li>样式、布局、绘制是否占据主要时间；</li>
<li>是否因为同步读取布局属性触发强制布局；</li>
<li>下一帧是否被图片解码、第三方脚本或动画占用。</li>
</ul>
<p>先确定阶段，再决定优化方向。单纯增加防抖可能减少事件数量，却无法修复一次点击后的昂贵渲染；把任务丢进 <code>setTimeout</code> 也可能只是把呈现延迟推后。</p>
<h2>输入延迟高：减少主线程争用</h2>
<p>输入前的长任务通常来自初始化、第三方脚本、批量数据处理或大段同步渲染。可按任务拆分、延迟非关键初始化、使用 Worker 处理纯计算，或在空闲时段安排低优先级工作。不能把所有工作都搬进 Worker：DOM 和大部分框架渲染仍需要主线程，序列化大对象本身也有成本。</p>
<p>避免同步 XHR 等阻塞操作，也不要在用户每次按键时执行全量搜索。await fetch 本身会让出执行，不是“网络等待期间一直占住主线程”；但结果返回后的解析、排序和渲染仍可能产生长任务。输入值可以先更新轻量 UI，再取消旧请求；服务端结果返回后还要验证请求序号，避免旧结果覆盖新输入。</p>
<p>如果点击后立即显示加载反馈，下一帧可以很快出现，即使接口两秒后才完成，INP 仍可能良好。结果完成时间是另一个业务指标，需要分别测量；不能用低 INP 证明端到端操作已经足够快。</p>
<h2>处理时间高：缩小一次更新的工作量</h2>
<p>事件回调应尽快完成必要状态更新，把不影响下一帧的工作拆开。列表筛选可以先更新加载状态，再分页或虚拟化渲染；复杂排序可以在 Worker 中执行，或在服务端查询。框架中要检查组件是否因为父状态变化而全部重渲染，使用稳定 key、细粒度状态和合理的 memo 化，但不要盲目给每个组件套缓存。</p>
<p>如果事件来自连续输入或拖动，应使用节流和合并更新；如果是必须响应的单次点击，重点是减少同步计算和 DOM 更新。任何优化都要重新录制，确认交互结果没有被延迟到下一次任务之后。</p>
<h2>呈现延迟高：检查样式、布局和绘制</h2>
<p>事件处理完成后仍然慢，常见原因包括大量 DOM、复杂选择器、布局抖动、图片解码、阴影和透明叠加。把 DOM 写入和读取交错执行会触发强制布局：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// 容易产生布局抖动：写入后立即读取，再写入</span>
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> items) {
  item.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${nextWidth}</span>px\`</span>;
  <span class="hljs-keyword">const</span> height = item.<span class="hljs-property">offsetHeight</span>;
  item.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translateY(<span class="hljs-subst">\${height}</span>px)\`</span>;
}
</code></pre></div>
<p>可以先批量读取需要的尺寸，再批量写入；对不需要立刻参与布局的内容使用合适的容器隔离、虚拟化或延迟渲染。<code>content-visibility</code>、合成层和 <code>will-change</code> 不是万能开关，滥用会增加内存或造成合成压力，必须通过录制验证。</p>
<h2>RUM 中不要只上报平均值</h2>
<p>INP 是长尾体验指标，平均值会掩盖低端设备和特定交互的问题。生产监测应按页面、交互名称、设备类别、连接类型和版本计算分位数，并记录输入到处理开始、处理结束到呈现的大致阶段。采集需采样并脱敏，交互名称使用固定白名单，不能把输入框内容或完整 URL 当作标签。</p>
<p>开发环境的单次录制与 RUM 的统计用途不同：前者用来定位调用栈，后者用来判断问题是否普遍以及修复是否有效。发布新版本后应比较同一页面、同一交互和相近设备分布，避免把流量结构变化误判为代码优化。</p>
<h2>兼容性和降级</h2>
<p>Event Timing、<code>presentationTime</code> 和交互观察能力并非所有浏览器都完整支持。缺少这些 API 时，仍可以使用 DevTools、Long Task 观察、用户计时标记和框架性能工具做部分诊断。性能采集脚本失败不能阻断业务页面；关键交互应优先保持可用，再逐步增强数据采集。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://web.dev/articles/inp">web.dev · Interaction to Next Paint</a></li>
<li><a href="https://w3c.github.io/event-timing/">W3C · Event Timing</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceEventTiming">MDN · PerformanceEventTiming</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver">MDN · PerformanceObserver</a></li>
</ul>`};export{e as default};