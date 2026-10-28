var e={answerHtml:`<p>线上监控显示题库首页的 INP 从 180ms 上升到 420ms，LCP 也变差。直接把所有图片换成 WebP 或给组件加 <code>memo</code>，可能只修到其中一个症状。性能诊断应先确认谁变慢、在哪个阶段变慢，再用可复现证据验证原因和修复。</p>
<h2>先用 RUM 确认问题范围</h2>
<p>把总体平均值拆成页面、版本、设备、网络、地区和任务类型。问题可能只发生在低端 Android、某个版本或首次打开搜索列表；混在全站平均值里，会让修复方向失真。</p>
<p>同时记录样本量、p75/p95、指标缺失率和采样变化。INP 变差时要知道是哪类交互；LCP 变差时要知道最大内容是文本、图片还是动态插入元素。SPA 路由切换还需要自己定义任务起点和结束，而不能把文档导航指标直接套到所有页面。</p>
<p>业务指标也要一起看：搜索完成率、题目打开率、错误率和页面退出率。如果把列表结果延迟到用户点击后才出现，某个实验室指标可能改善，但用户完成任务的时间反而变长。</p>
<h2>再建立固定的实验室场景</h2>
<p>选取真实数据量、固定视口、设备 CPU、网络、缓存和浏览器版本。记录冷缓存首页、输入关键词、连续筛选、打开题目和滚动列表等流程；每次只改变一个主要因素，运行多次并比较分布。</p>
<p>实验室测试要先确认页面真正进入目标状态。只等待固定 2 秒会把“仍在 loading 的稳定占位”误当成结果；应等待题目列表、字体、图片和交互状态满足明确条件。测试数据应与线上问题接近，但不要把生产用户资料直接复制到测试环境。</p>
<h2>用瀑布图判断 LCP 的等待位置</h2>
<p>如果 LCP 是首屏图片，检查它是否发现得晚、是否被 CSS/字体/脚本阻塞、是否下载了过大的候选，或 CDN/服务器响应慢。<code>preload</code> 只有在资源确定会使用且发现确实较晚时有帮助；错误 preload 可能抢占带宽。</p>
<p>如果 LCP 是标题或列表文本，检查 HTML 到达、字体交换、客户端渲染和数据请求。SSR/SSG 可以提前交付正文，但 hydration 和主线程执行仍可能延迟内容稳定。不要看到 HTML 早到就宣布 LCP 问题已经解决。</p>
<h2>用 Performance 轨迹定位 INP</h2>
<p>找出实际最慢交互的事件处理、事件后脚本、样式计算、Layout、Paint 和长任务。常见原因包括：筛选时同步过滤几万项、一次性创建大量卡片、读写 DOM 交错导致强制布局、第三方脚本占用主线程，或错误提示更新触发了全页重渲染。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">PerformanceObserver</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> {
  <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> list.<span class="hljs-title function_">getEntries</span>()) {
    <span class="hljs-keyword">if</span> (entry.<span class="hljs-property">duration</span> &gt; <span class="hljs-number">50</span>) {
      <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&#x27;长任务&#x27;</span>, entry.<span class="hljs-property">duration</span>, entry.<span class="hljs-property">name</span>);
    }
  }
});

observer.<span class="hljs-title function_">observe</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;longtask&#x27;</span>, <span class="hljs-attr">buffered</span>: <span class="hljs-literal">true</span> });
</code></pre></div>
<p>Long Task 只能帮助发现主线程阻塞，不能直接告诉你 INP 的业务原因。要把轨迹中的任务与用户点击、组件更新和数据量对应起来；浏览器 Performance、React/Vue Profiler 和 RUM 记录要互相印证。</p>
<h2>选择修复要对应瓶颈</h2>
<p>如果列表渲染和布局占主要时间，可以减少 DOM、使用虚拟列表、稳定组件输入或把非关键区域延迟；如果过滤计算占主要时间，可以优化算法、缓存派生结果、分片让出主线程或使用 Worker；如果网络瀑布占主要时间，可以并行请求、减少关键数据、改善缓存和传输。</p>
<p><code>useTransition</code>、<code>useDeferredValue</code> 或框架调度可以让输入先响应，但不会自动减少同步计算、网络请求或 DOM 数量。把整个输入值放进低优先级更新可能造成输入延迟，应该只延迟结果区域。</p>
<p>图片预留尺寸可以减少 CLS，不能直接修复主线程长任务；拆分代码可以减少首屏下载，不能自动修复接口慢。每个修复都要确认没有牺牲键盘、读屏、错误反馈和内容完整性。</p>
<h2>修复后要用对照和分批发布验证</h2>
<p>在相同实验室场景下比较修复前后 p50/p75、长任务、LCP/INP/CLS、资源大小和内存。然后通过小比例发布或实验组观察真实用户分布，按设备和版本分组，并同时观察错误率、任务完成率和服务器成本。</p>
<p>不要只看一次最好成绩，也不要把分位数简单平均。线上样本构成可能改变，监控 SDK 采样或页面流量变化也会让指标变化。修复后若总体改善但低端设备仍变差，应继续按人群定位，而不是宣布所有用户已经恢复。</p>
<p>完整闭环应留下：问题人群和指标口径、可复现场景、证据截图/轨迹、根因、改动、回归风险、分批结果和回滚条件。性能优化不是收集一组漂亮分数，而是让真实用户更快完成重要任务，并且能解释为什么这次改动有效。</p>`};export{e as default};