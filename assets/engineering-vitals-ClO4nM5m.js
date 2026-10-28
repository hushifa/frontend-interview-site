var e={answerHtml:`<h2>简答</h2>
<ul>
<li>LCP（最大内容绘制）衡量主要内容多快出现，良好标准是 2.5 秒以内。</li>
<li>INP（交互到下一次绘制）衡量页面对点击、按键的响应速度，良好标准是 200 毫秒以内；它在 2024 年 3 月取代了 FID。</li>
<li>CLS（累积布局偏移）衡量内容意外移动的程度，良好标准是 0.1 以下。</li>
<li>评估时取真实用户数据的第 75 百分位，桌面和移动端分开看。</li>
<li>Lighthouse 等实验室工具适合诊断，但测不出真实用户的 INP，最终以现场数据为准。</li>
</ul>
<h2>三个指标</h2>
<table><thead><tr><th>指标</th><th>衡量什么</th><th>良好</th><th>较差</th></tr></thead><tbody><tr><td>LCP</td><td>视口内最大的图片或文本块渲染完成的时间</td><td>≤ 2.5 s</td><td>&gt; 4 s</td></tr><tr><td>INP</td><td>页面生命周期内交互延迟的代表值（接近最慢的那次）</td><td>≤ 200 ms</td><td>&gt; 500 ms</td></tr><tr><td>CLS</td><td>意外布局偏移的最大会话窗口得分</td><td>≤ 0.1</td><td>&gt; 0.25</td></tr></tbody></table>
<h2>常见原因和优化方向</h2>
<p><strong>LCP</strong>：服务器响应慢、LCP 图片被懒加载或发现得晚、渲染阻塞的 CSS/JS、客户端渲染才生成内容。优化方向是缩短 TTFB、用 <code>fetchpriority=&quot;high&quot;</code> 和预加载让 LCP 资源尽早下载、避免对首屏图片使用 <code>loading=&quot;lazy&quot;</code>。</p>
<p><strong>INP</strong>：事件处理里有长任务、一次交互触发大量渲染、主线程被第三方脚本占用。优化方向是拆分长任务并让出主线程、先更新可见反馈再处理其余工作、减少不必要的重新渲染。</p>
<p><strong>CLS</strong>：图片和广告位没有预留尺寸、字体切换导致文字重排、在已有内容上方插入横幅。优化方向是设置 <code>width</code>/<code>height</code> 或 <code>aspect-ratio</code>、给动态内容预留空间、用 <code>font-display</code> 和尺寸匹配的备用字体。用户交互后 500 毫秒内发生的偏移不计入 CLS。</p>
<h2>采集真实数据</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { onLCP, onINP, onCLS } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;web-vitals&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">send</span>(<span class="hljs-params">metric</span>) {
  navigator.<span class="hljs-title function_">sendBeacon</span>(<span class="hljs-string">&#x27;/vitals&#x27;</span>, <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({
    <span class="hljs-attr">name</span>: metric.<span class="hljs-property">name</span>,
    <span class="hljs-attr">value</span>: metric.<span class="hljs-property">value</span>,
    <span class="hljs-attr">rating</span>: metric.<span class="hljs-property">rating</span>,
    <span class="hljs-attr">id</span>: metric.<span class="hljs-property">id</span>,
  }));
}

<span class="hljs-title function_">onLCP</span>(send);
<span class="hljs-title function_">onINP</span>(send);
<span class="hljs-title function_">onCLS</span>(send);
</code></pre></div>
<ul>
<li>INP 和 CLS 要到页面隐藏或卸载时才能得出最终值，<code>web-vitals</code> 会在页面进入后台时上报，所以用 <code>sendBeacon</code> 而不是普通请求。</li>
<li>同时上报页面路径、设备类型、网络类型，才能定位是哪类用户变慢。</li>
<li>Chrome 用户体验报告（CrUX）提供公开站点的真实数据；Safari 和 Firefox 对这些指标的支持不完整，自采数据会偏向 Chromium 用户。</li>
</ul>
<h2>实验室与现场</h2>
<p>Lighthouse 在固定设备和网络条件下模拟加载，能稳定复现 LCP、CLS 问题，并用总阻塞时间（TBT）近似反映交互风险。真实用户的设备、网络和交互方式差异很大，两者数值不同是正常的。先用现场数据确定问题，再用实验室工具复现和验证修复。</p>
<h2>常见追问</h2>
<ul>
<li>单页应用路由切换算吗？这三个指标都以页面加载为单位，软导航不会重置 LCP；INP 和 CLS 会持续累计到页面卸载。</li>
<li>指标全绿就代表体验好吗？它们只覆盖加载、响应和稳定性，业务关键流程的耗时还需要自定义指标。</li>
</ul>`};export{e as default};