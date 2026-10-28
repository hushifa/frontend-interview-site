var e={answerHtml:`<h2>简答</h2>
<ul>
<li>长任务看单个任务，LoAF 看一整帧：多个 30ms 的任务落在同一帧，单个都不算长任务，但会形成一个长动画帧。</li>
<li>条目字段：<code>duration</code>（整帧）、<code>blockingDuration</code>（帧内超出 50ms 预算的阻塞时间）、<code>renderStart</code>、<code>styleAndLayoutStart</code>、<code>scripts</code>。</li>
<li><code>scripts</code> 里每项包含 <code>invoker</code>（如 <code>BUTTON#submit.onclick</code>）、<code>invokerType</code>、<code>sourceURL</code>、<code>sourceFunctionName</code>、<code>duration</code>、<code>forcedStyleAndLayoutDuration</code>。</li>
<li>生产环境按页面、交互和设备聚合分位数，采样上报摘要；不支持时降级到 Event Timing 和实验室录制。</li>
<li>MDN 标注为实验性、有限可用，需要特性检测。</li>
</ul>
<h2>采集</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">observeLoAF</span>(<span class="hljs-params">report</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-title class_">PerformanceObserver</span>.<span class="hljs-property">supportedEntryTypes</span>?.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;long-animation-frame&#x27;</span>)) <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> {};

  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
    <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> frame <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
      <span class="hljs-title function_">report</span>({
        <span class="hljs-attr">duration</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(frame.<span class="hljs-property">duration</span>),
        <span class="hljs-attr">blocking</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(frame.<span class="hljs-property">blockingDuration</span>),
        <span class="hljs-attr">scripts</span>: frame.<span class="hljs-property">scripts</span>.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">script</span>) =&gt;</span> ({
          <span class="hljs-attr">invoker</span>: script.<span class="hljs-property">invoker</span>,
          <span class="hljs-attr">type</span>: script.<span class="hljs-property">invokerType</span>,
          <span class="hljs-attr">source</span>: script.<span class="hljs-property">sourceURL</span>,
          <span class="hljs-attr">fn</span>: script.<span class="hljs-property">sourceFunctionName</span>,
          <span class="hljs-attr">duration</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(script.<span class="hljs-property">duration</span>),
          <span class="hljs-attr">forcedLayout</span>: <span class="hljs-title class_">Math</span>.<span class="hljs-title function_">round</span>(script.<span class="hljs-property">forcedStyleAndLayoutDuration</span>),
        })),
      });
    }
  });
  observer.<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;long-animation-frame&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p><code>blockingDuration</code> 的算法：取帧内每个超过 50ms 的任务，各自减去 50ms 后求和，其中最长的任务还要加上渲染时间。例如 70ms 和 120ms 两个任务、渲染 20ms，结果是 (70 − 50) + (120 + 20 − 50) = 110ms。</p>
<h2>从字段到原因</h2>
<table><thead><tr><th>现象</th><th>指向的问题</th><th>方向</th></tr></thead><tbody><tr><td>某个 <code>invoker</code> 的 <code>duration</code> 很大</td><td>事件处理或回调里做了大量同步工作</td><td>减少工作、分片、Worker</td></tr><tr><td><code>forcedStyleAndLayoutDuration</code> 很大</td><td>写 DOM 后立即读布局属性（布局抖动）</td><td>先批量读再批量写</td></tr><tr><td><code>sourceURL</code> 是第三方域名</td><td>第三方脚本在交互时执行</td><td>延迟加载或隔离第三方，见<a href="/questions/perf-third-party-scripts/">《第三方脚本怎样接入，才能控制性能和安全风险？》</a></td></tr><tr><td>脚本时间不多，<code>renderStart</code> 到结束很长</td><td>样式计算和布局成本高</td><td>缩小 DOM、简化选择器、<code>content-visibility</code></td></tr></tbody></table>
<h2>和其他指标的关系</h2>
<ul>
<li>Long Tasks：只知道有长任务，归因只到 iframe 级别，见<a href="/questions/perf-longtasks/">《什么是长任务，为什么会影响交互响应？怎样观测和拆分？》</a>。</li>
<li>Event Timing / INP：知道哪次交互慢、慢在输入延迟、处理还是呈现。把慢交互的时间段和同时发生的 LoAF 关联，就能找到具体脚本，见<a href="/questions/perf-inp-diagnosis/">《INP 很高时，如何定位到底是哪一段交互变慢？》</a>。</li>
</ul>
<h2>上报注意</h2>
<ul>
<li><code>sourceURL</code> 是打包后的地址，配合版本号和 Source Map 在服务端还原，不要把 Source Map 公开。</li>
<li>只上报超过阈值的帧并采样，回调里不要做重活。</li>
<li>页面隐藏时用 <code>navigator.sendBeacon()</code> 批量发送。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么有时 <code>scripts</code> 为空？短脚本不会单独记录，帧的耗时也可能主要在样式、布局和绘制上。</li>
<li>不支持的浏览器怎么办？用 Event Timing、自定义交互标记和 DevTools 录制做替代。</li>
</ul>`};export{e as default};