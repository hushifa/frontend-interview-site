var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面卡了，我们想知道是哪段脚本干的。Long Animation Frames，简称 LoAF，就是浏览器把超过 50 毫秒才完成渲染的帧记下来，并且告诉你这一帧里跑过哪些脚本。</p>
<p>它和 Long Tasks API 的区别是，长任务只看单个任务，LoAF 看的是一整帧。比如两个 30 毫秒的任务落在同一帧里，单个都不算长任务，但这一帧已经超过 50 毫秒了，LoAF 能发现。</p>
<p>每个条目里有整帧耗时 <code>duration</code>、阻塞时间 <code>blockingDuration</code>、渲染开始时间 <code>renderStart</code>、样式布局开始时间 <code>styleAndLayoutStart</code>，还有 <code>scripts</code> 列表。列表里每个脚本都有调用者 <code>invoker</code>、来源文件 <code>sourceURL</code>、函数名 <code>sourceFunctionName</code>、耗时，以及强制布局耗时 <code>forcedStyleAndLayoutDuration</code>，能直接定位到具体脚本。</p>
<p>要注意，MDN 标注它为实验性、有限可用，所以要先做特性检测，不支持时退回 Event Timing 和实验室录制。</p>
</blockquote>
<h2>怎样采集</h2>
<p>先检测浏览器支不支持，再用 <code>PerformanceObserver</code> 观察 <code>long-animation-frame</code>，把需要的字段挑出来上报：</p>
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
<p><code>invoker</code> 告诉你是谁调起了这段脚本，比如 <code>BUTTON#submit.onclick</code> 就是提交按钮的点击回调；<code>invokerType</code> 说明调用方式，比如事件监听还是定时器。</p>
<h2>blockingDuration 是怎么算的</h2>
<p><code>duration</code> 是整帧的时间，可是一帧长并不全是坏事，用户真正受影响的是主线程被堵住的那部分。<code>blockingDuration</code> 就是在算这个。</p>
<p>规则是：取帧里每个超过 50ms 的任务，各自减去 50ms 再求和；其中最长的那个任务，还要先加上渲染时间再减。比如一帧里有 70ms 和 120ms 两个任务、渲染用了 20ms，结果是 (70 − 50) + (120 + 20 − 50) = 110ms。</p>
<h2>从字段看出是什么问题</h2>
<p>拿到数据以后，不同字段异常指向不同的原因：</p>
<table><thead><tr><th>现象</th><th>指向的问题</th><th>方向</th></tr></thead><tbody><tr><td>某个 <code>invoker</code> 的 <code>duration</code> 很大</td><td>事件处理或回调里做了大量同步工作</td><td>减少工作、分片、Worker</td></tr><tr><td><code>forcedStyleAndLayoutDuration</code> 很大</td><td>写 DOM 后立即读布局属性（布局抖动）</td><td>先批量读再批量写</td></tr><tr><td><code>sourceURL</code> 是第三方域名</td><td>第三方脚本在交互时执行</td><td>延迟加载或隔离第三方，见<a href="/questions/perf-third-party-scripts/">《第三方脚本怎样接入，才能控制性能和安全风险？》</a></td></tr><tr><td>脚本时间不多，<code>renderStart</code> 到结束很长</td><td>样式计算和布局成本高</td><td>缩小 DOM、简化选择器、<code>content-visibility</code></td></tr></tbody></table>
<p>其中强制布局最容易被忽略。脚本改了 DOM，浏览器本来可以等到这一帧最后再统一算布局；可如果脚本紧接着读 <code>offsetHeight</code> 这类属性，浏览器只能马上算一遍，这段时间就记在 <code>forcedStyleAndLayoutDuration</code> 里。</p>
<h2>和长任务、INP 是什么关系</h2>
<p>Long Tasks API 只能告诉你“有长任务”，归因只到 iframe 这一级，不知道是哪段脚本，见<a href="/questions/perf-longtasks/">《什么是长任务，为什么会影响交互响应？怎样观测和拆分？》</a>。</p>
<p>Event Timing 和 INP 能告诉你哪次交互慢、慢在输入延迟、处理还是呈现。所以实际排查时，先用 INP 找到慢交互的时间段，再看同一时间段的 LoAF，就能找到具体脚本，见<a href="/questions/perf-inp-diagnosis/">《INP 很高时，如何定位到底是哪一段交互变慢？》</a>。</p>
<h2>上报时要注意什么</h2>
<p><code>sourceURL</code> 是打包后的文件地址，要配合版本号和 Source Map 在服务端还原，Source Map 本身不要公开。</p>
<p>上报量也要控制。只报超过阈值的帧并且采样，观察回调里不要做重活，否则监控本身又制造了卡顿。页面隐藏时用 <code>navigator.sendBeacon()</code> 批量发出去。</p>
<h2>常见追问</h2>
<p><strong>为什么有时 <code>scripts</code> 是空的？</strong></p>
<blockquote>
<p>很短的脚本不会单独记录。另外这一帧的时间也可能主要花在样式、布局和绘制上，本来就没什么脚本。</p>
</blockquote>
<p><strong>不支持 LoAF 的浏览器怎么办？</strong></p>
<blockquote>
<p>用 Event Timing、自己打的交互标记和 DevTools 录制来代替。</p>
</blockquote>`};export{e as default};