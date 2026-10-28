var e={answerHtml:`<h2>简答</h2>
<ul>
<li>LoAF 以帧为单位观察超过 50ms 的渲染更新，能发现多个中等任务合起来造成的卡顿。</li>
<li>用 PerformanceObserver 观察 long-animation-frame，buffered 只能读到缓冲区内的条目。</li>
<li>scripts 字段给出调用者、脚本 URL 和强制布局等归因信息。</li>
<li>按分位数聚合后再优化，并与 Long Tasks、Event Timing 配合；需要特性检测。</li>
</ul>
<p>页面明明没有一个持续几百毫秒的函数，用户却感觉点击后画面停顿。原因可能是多个中等耗时的脚本、样式计算、布局和绘制共同超过了一帧预算。只观察 Long Task 只能看到主线程上的长任务，无法完整回答“这一帧为什么没有及时呈现”。Long Animation Frames（LoAF）记录的是一帧从开始到完成的整体耗时，并提供参与这帧的脚本和渲染阶段信息。</p>
<h2>长动画帧和长任务观察的对象不同</h2>
<ul>
<li><strong>Long Task</strong>：单个主线程任务持续至少 50 毫秒，适合发现某段 JavaScript 或其他任务长时间占用主线程。</li>
<li><strong>Long Animation Frame</strong>：观察超过 50 毫秒的长帧处理，包含跨任务的脚本工作和渲染更新信息。50 毫秒是长帧报告阈值，不是流畅动画的帧预算；60 Hz 屏幕的一次刷新间隔约为 16.7 毫秒。</li>
</ul>
<p>两者可以同时出现，也可能只有其中一个被观察到。例如若多个 30 毫秒的脚本任务被安排在同一帧，它们单独都不到 50 毫秒，却可能共同造成长帧。反过来，一个长任务也可能发生在没有形成完整帧的时段。诊断时不要把两套指标当成重复数据相加。</p>
<h2>先用 <code>PerformanceObserver</code> 收集长帧</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeLongAnimationFrames</span>(<span class="hljs-params">onEntry</span>) {
  <span class="hljs-keyword">if</span> (!(<span class="hljs-string">&#x27;PerformanceObserver&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>)) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> supported = <span class="hljs-title class_">PerformanceObserver</span>.<span class="hljs-property">supportedEntryTypes</span> ?? [];
  <span class="hljs-keyword">if</span> (!supported.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;long-animation-frame&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
      <span class="hljs-title function_">onEntry</span>({
        <span class="hljs-attr">startTime</span>: entry.<span class="hljs-property">startTime</span>,
        <span class="hljs-attr">duration</span>: entry.<span class="hljs-property">duration</span>,
        <span class="hljs-attr">blockingDuration</span>: entry.<span class="hljs-property">blockingDuration</span>,
        <span class="hljs-attr">renderStart</span>: entry.<span class="hljs-property">renderStart</span>,
        <span class="hljs-attr">styleAndLayoutStart</span>: entry.<span class="hljs-property">styleAndLayoutStart</span>,
        <span class="hljs-attr">scripts</span>: entry.<span class="hljs-property">scripts</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">script</span>) =&gt;</span> ({
          <span class="hljs-attr">invoker</span>: script.<span class="hljs-property">invoker</span>,
          <span class="hljs-attr">sourceURL</span>: script.<span class="hljs-property">sourceURL</span>,
          <span class="hljs-attr">sourceFunctionName</span>: script.<span class="hljs-property">sourceFunctionName</span>,
          <span class="hljs-attr">duration</span>: script.<span class="hljs-property">duration</span>,
          <span class="hljs-attr">pauseDuration</span>: script.<span class="hljs-property">pauseDuration</span>,
          <span class="hljs-attr">forcedStyleAndLayoutDuration</span>: script.<span class="hljs-property">forcedStyleAndLayoutDuration</span>,
        })),
      });
    }
  });

  observer.<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;long-animation-frame&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}

<span class="hljs-keyword">const</span> stop = <span class="hljs-title function_">observeLongAnimationFrames</span>(<span class="hljs-function">(<span class="hljs-params">frame</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (frame.<span class="hljs-property">duration</span> &gt;= <span class="hljs-number">200</span>) {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;发现严重长帧&#x27;</span>, frame);
  }
});
</code></pre></div>
<p><code>buffered: true</code> 允许观察器读取观察开始前已经记录的条目，但只能读取浏览器保留的缓冲区，不等于能拿到页面生命周期内的全部历史。上报时应采样、限制字段长度并去掉用户输入等敏感信息；不能把每一帧的完整脚本路径无过滤地发送到远端。</p>
<p><code>blockingDuration</code> 描述主线程无法响应用户输入等高优先级任务的估算阻塞时间，不是 GPU 绘制时长，也不是 duration 减去一个刷新间隔。MDN 的计算说明围绕帧内超过 50 毫秒的任务，结合最长任务的渲染耗时计算；因此不能把它与 INP 或帧总时长直接互换。</p>
<p><code>renderStart</code> 包含 requestAnimationFrame 回调、样式布局和观察器回调等渲染周期工作，<code>styleAndLayoutStart</code> 标记样式布局阶段开始；不能把两者之差命名为“GPU 耗时”。这些时间戳可能为 0，应先检查再计算。较新的接口文档还描述了 paintTime、presentationTime，但目标浏览器未必支持；本例没有读取它们，不能声称已测得实际屏幕呈现等待。需要时另行做字段检测并与 DevTools 时间线核对。</p>
<h2><code>scripts</code> 能帮助定位“谁触发了这一帧”</h2>
<p>每个脚本记录通常会包含调用者、脚本 URL、函数名、脚本自身耗时，以及是否触发了强制样式或布局。可以用它区分几类常见问题：</p>
<ul>
<li>点击处理函数同步计算大量数据；</li>
<li>第三方脚本在交互时执行同步工作；</li>
<li>先写 DOM 再立即读布局属性，触发强制同步布局；</li>
<li>MutationObserver、ResizeObserver 或框架提交在同一帧集中修改节点；</li>
<li>样式选择器或 DOM 规模导致样式计算和布局耗时上升。</li>
</ul>
<p>记录中的 <code>sourceURL</code> 可能为空、被打包成产物地址，或因为跨域与隐私策略无法提供完整源码位置。生产环境应配合 Source Map 和版本标识在服务端还原，但不要把 Source Map 内容直接暴露给所有用户。</p>
<h2>不要只根据一个长帧就改代码</h2>
<p>真实用户数据可能受到后台标签页、设备降频、扩展程序和操作系统调度影响。应按页面、设备等级、交互类型和版本聚合，关注 P75/P95 等分位数，并结合用户动作和业务结果。一次 500 毫秒长帧说明需要调查，但不能单独证明某个函数是唯一原因。</p>
<p>开发环境可以用 Performance panel、CPU throttling 和录制的调用栈复现；生产环境则只上报经过采样的摘要，例如页面路由、交互名称、帧耗时区间、脚本来源类别和是否发生强制布局。用户输入、完整 URL 查询参数和内部路径应在采集前脱敏。</p>
<h2>和 Long Task、Event Timing 一起看</h2>
<p>LoAF 适合解释帧级阻塞，Long Task 适合发现单个长任务，Event Timing 适合观察输入事件从发生到处理和呈现的延迟。三者应使用共同的页面版本和时间线关联，而不是把每个指标的数值直接相加。比如一个输入延迟很高的事件可能由多个短任务组成，此时 LoAF 能补充“同一帧内还有哪些阶段耗时”。</p>
<h2>兼容性和降级</h2>
<p>Long Animation Frames API 仍不是所有浏览器和嵌入式 WebView 都支持。特性检测失败时，页面功能不能因此中断，可以降级为：</p>
<ol>
<li>使用 <code>PerformanceObserver</code> 观察 <code>longtask</code>；</li>
<li>通过 Event Timing 或自定义交互标记记录关键路径；</li>
<li>在开发环境用 DevTools Performance panel 做详细分析；</li>
<li>对不支持的环境只保留基础页面和请求耗时指标。</li>
</ol>
<p>不要为了采集性能数据在每个 <code>requestAnimationFrame</code> 中执行复杂逻辑，这会改变被测页面本身的性能。观察器回调也应快速结束，必要时把摘要放入队列，使用 <code>navigator.sendBeacon()</code> 或合适的后台发送方式批量上报。</p>
<h2>优化方向取决于证据</h2>
<p>如果脚本耗时占主导，可以拆分任务、延迟非关键工作、使用 Worker 或减少渲染次数；如果强制布局明显，应把 DOM 写入和读取分组，并减少布局依赖；如果样式和布局占主导，应缩小 DOM、简化选择器或使用合适的 <code>content-visibility</code> 等策略。优化后要在同一设备和交互场景重新测量，确认长帧分位数和用户实际输入延迟都改善，而不是只看到某一条调用栈变短。</p>
<h2>参考资料</h2>
<ul>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongAnimationFrameTiming">MDN · PerformanceLongAnimationFrameTiming</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/PerformanceObserver">MDN · PerformanceObserver</a></li>
<li><a href="https://w3c.github.io/long-animation-frames/">W3C · Long Animation Frames</a></li>
<li><a href="https://developer.mozilla.org/en-US/docs/Web/API/Long_Tasks_API">MDN · Long Tasks API</a></li>
</ul>`};export{e as default};