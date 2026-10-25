var e={answerHtml:`<p>用户说“有时点按钮没反应”，开发机却不容易复现。Long Tasks API 可以在支持的浏览器中记录主线程长时间占用的起点、持续时间和有限的归属信息，为线上排查提供线索。</p>
<p>它更像“这段时间主线程忙了很久”的报警器，不是直接给出慢函数调用栈的分析器。</p>
<h3>先检测支持，再建立观察器</h3>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">watchLongTasks</span>(<span class="hljs-params">onTask</span>) {
  <span class="hljs-keyword">if</span> (
    <span class="hljs-keyword">typeof</span> <span class="hljs-title class_">PerformanceObserver</span> === <span class="hljs-string">&#x27;undefined&#x27;</span> ||
    !<span class="hljs-title class_">PerformanceObserver</span>.<span class="hljs-property">supportedEntryTypes</span>.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;longtask&#x27;</span>)
  ) {
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};
  }

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
      <span class="hljs-title function_">onTask</span>({
        <span class="hljs-attr">startTime</span>: entry.<span class="hljs-property">startTime</span>,
        <span class="hljs-attr">duration</span>: entry.<span class="hljs-property">duration</span>,
        <span class="hljs-attr">name</span>: entry.<span class="hljs-property">name</span>,
        <span class="hljs-attr">containers</span>: entry.<span class="hljs-property">attribution</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> ({
          <span class="hljs-attr">type</span>: item.<span class="hljs-property">containerType</span>,
          <span class="hljs-attr">id</span>: item.<span class="hljs-property">containerId</span>,
          <span class="hljs-attr">name</span>: item.<span class="hljs-property">containerName</span>,
        })),
      });
    }
  });
  observer.<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;longtask&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>buffered 请求此前仍可用的条目，不保证取回页面历史上所有长任务。观察器一般在任务完成之后获得通知，因此它不能中途打断已经运行的长任务。</p>
<p>onTask 应尽量轻量，可以先存入有上限的队列，再批量上报。若监控回调本身进行大规模序列化或同步日志，反而会制造新的负担。组件或监控实例销毁时调用返回的函数，避免重复订阅。</p>
<h3>attribution 不是函数堆栈</h3>
<p>条目 name 与 attribution 主要帮助区分当前页面、子框架等浏览上下文。跨源隐私限制可能让信息非常有限；即使有 containerId，也只能帮助定位 iframe 容器，不代表它指向具体业务函数。</p>
<p>代码示例没有上报 containerSrc，因为完整 URL 可能含敏感参数。实际采集即使只包含容器名称，也应限制内容和收集范围。</p>
<p>需要定位哪个脚本或函数慢，通常还要在性能面板录制相同操作，查看任务内的调用栈、自身耗时以及样式布局事件。Long Animation Frames 等 API 在部分环境可提供额外信息，但支持度和统计含义不同，不能当作完全等价替换。</p>
<h3>把时间区间与操作关联</h3>
<p>startTime 与 duration 给出一个占用区间。可以与同一页面时间基准上的用户操作、路由切换或业务 mark 对齐，判断长任务是否覆盖了用户等待的阶段。</p>
<p>例如任务从 1000 毫秒执行到 1200 毫秒，用户在 1050 毫秒点击，那么事件可能因主线程忙而排队。但单看这个区间仍不能精确计算最终呈现时间，还要考虑事件处理与下一次绘制。</p>
<p>如果长任务发生在页面空闲时、没有影响用户当前任务，优先级可能低于直接阻塞输入的工作。线上分析应记录必要的页面类型和版本，避免把不同操作混在一起统计。</p>
<h3>长任务时长、TBT 与 INP 不能互换</h3>
<p>一个 120 毫秒长任务的 duration 是 120 毫秒。计算某些实验室指标中的阻塞部分时，可能按超过 50 毫秒的部分计为 70 毫秒，但 TBT 还有特定测量窗口和算法，不能把全天长任务简单相加就命名为 TBT。</p>
<p>INP 关注交互到下一次呈现的延迟，并有自身的交互选择和生命周期规则，不等于长任务总时长。多个低于长任务阈值的工作、布局与呈现延迟也可能让交互体验不佳。</p>
<p>因此“零 longtask 条目”只说明当前观测条件没有记录到符合阈值的任务，不能证明页面流畅；还可能是 API 不支持、观察开始较晚或数据被采样。</p>
<p>正确流程是用线上数据找高发场景，在受控环境复现并定位具体工作，修复后再检查交互指标及长任务分布。不要只为了让监控图表变干净而切成大量微任务，那并不保证把主线程交还给输入与渲染。</p>`};export{e as default};