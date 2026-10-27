var e={answerHtml:`<h2>主线程为什么会让按钮“没有反应”</h2>
<p>浏览器的 JavaScript、样式计算、布局和部分绘制工作会竞争主线程。用户点击时，如果主线程正在解析大 JSON、执行同步计算或运行第三方脚本，事件只能排队，按钮就像没有响应。</p>
<p>Long Tasks API 记录主线程连续忙碌超过 50ms 的时间段，告诉你“这里有一段可能影响交互的工作”。它不会直接告诉你是哪一行函数慢，也不会中断已经开始的任务。</p>
<h2>建立观察器时要轻量且可清理</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">watchLongTasks</span>(<span class="hljs-params">onTask</span>) {
  <span class="hljs-keyword">if</span> (
    <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">PerformanceObserver</span> === <span class="hljs-string">&#x27;undefined&#x27;</span> ||
    !<span class="hljs-title class_">PerformanceObserver</span>.<span class="hljs-property">supportedEntryTypes</span>?.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;longtask&#x27;</span>)
  ) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
      <span class="hljs-title function_">onTask</span>({
        <span class="hljs-attr">startTime</span>: entry.<span class="hljs-property">startTime</span>,
        <span class="hljs-attr">duration</span>: entry.<span class="hljs-property">duration</span>,
        <span class="hljs-attr">containers</span>: entry.<span class="hljs-property">attribution</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> ({
          <span class="hljs-attr">type</span>: item.<span class="hljs-property">containerType</span>,
          <span class="hljs-attr">id</span>: item.<span class="hljs-property">containerId</span>,
        })),
      });
    }
  });

  observer.<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;longtask&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p><code>buffered</code> 只能读取当前性能时间线中仍可用的条目，不是完整历史。回调通常在任务结束后才收到通知，不能用它实时打断任务。上报逻辑应放入有上限的队列并批量发送，不能在回调中同步序列化大对象，否则监控本身会增加主线程负担。</p>
<p>组件卸载或页面切换时要断开观察器，避免重复订阅。能力检测失败时应正常降级，不能因为浏览器不支持就阻塞页面功能。</p>
<h2>attribution 不是慢函数的调用栈</h2>
<p>归属信息有助于区分当前页面、iframe 或容器，但跨源隐私限制可能让信息很少。<code>containerId</code> 也不等于具体业务函数。要知道究竟是 JSON 解析、渲染、布局还是第三方脚本耗时，仍需在实验室用 Performance 面板录制相同操作，查看调用栈和任务内部事件。</p>
<p>线上记录页面类型、应用版本、设备和必要的业务阶段即可。完整容器 URL 可能带查询参数和敏感信息，不应默认上报。其他 API 如 Long Animation Frames 的支持度和统计含义不同，不能未经确认就当成替代品。</p>
<h2>把长任务和用户操作对齐</h2>
<p><code>startTime</code> 和 <code>duration</code> 给出一段与当前页面性能时间基准一致的区间。可以把它和点击、输入、路由切换的 mark 对齐，判断用户操作是否落在忙碌区间内：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">performance.<span class="hljs-title function_">mark</span>(<span class="hljs-string">&#x27;search-click&#x27;</span>);
<span class="hljs-comment">// 更新筛选条件或开始请求</span>
</code></pre></div>
<p>一个 120ms 的长任务不一定影响用户；如果它发生在页面空闲时，优先级可能低于一个 60ms 但正好阻塞输入的任务。只统计长任务数量而不看页面类型和用户操作，会把修复重点放错。</p>
<h2>不要把 Long Task、TBT 和 INP 混成一个指标</h2>
<p>Long Task 的 <code>duration</code> 是整个忙碌区间。实验室 TBT 可能只累计特定窗口内每个任务超过 50ms 的部分，还受测量窗口和算法影响；把所有 Long Task 相加不能叫 TBT。</p>
<p>INP 关注交互发生到下一次呈现的延迟，除了主线程任务，还受事件处理、布局、绘制和交互选择规则影响。没有 Long Task 不代表 INP 一定好，许多短任务连在一起、布局更新或观测不支持都可能隐藏问题。</p>
<h2>从监测到修复要形成闭环</h2>
<p>先用 RUM 找出移动端搜索、列表展开等高影响场景，再在受控设备上录制调用栈。修复方向可能是分片、延迟非关键工作、减少同步 JSON 处理、虚拟化列表或移到 Worker。把一个大任务机械地切成很多微任务，也不保证浏览器会及时处理输入和绘制，需要用交互指标验证。</p>
<p>最终应同时观察长任务分布、INP、错误率和功能完成率。Long Tasks API 是定位线索，不是“页面流畅”的单一证明。</p>`};export{e as default};