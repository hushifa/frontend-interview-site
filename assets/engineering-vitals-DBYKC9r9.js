var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>这三个指标是 Google 的 Core Web Vitals，分别对应用户最在意的三件事：页面主要内容多快出来，点了以后多快有反应，看的时候内容会不会突然跳。</p>
<p>LCP 叫最大内容绘制，指视口里最大的图片或文字块画出来的时间，2.5 秒以内算良好。INP 叫交互到下一次绘制，指点击、按键之后到页面画出下一帧要多久，200 毫秒以内算良好，它在 2024 年 3 月取代了 FID。CLS 叫累积布局偏移，衡量内容意外移动的程度，0.1 以下算良好。</p>
<p>评估时看的是真实用户数据的第 75 百分位，桌面和移动端分开算。Lighthouse 这类实验室工具适合找原因，但它不模拟用户交互，测不出真实的 INP，最后要以现场数据为准。</p>
<p>要注意，三个指标都绿了也不等于体验好，它们只覆盖加载、响应和稳定性，业务流程的耗时还得自己定指标去测。</p>
</blockquote>
<h2>三个指标各管什么</h2>
<p>先把三个指标的阈值放在一起看：</p>
<table><thead><tr><th>指标</th><th>衡量什么</th><th>良好</th><th>较差</th></tr></thead><tbody><tr><td>LCP</td><td>视口内最大的图片或文本块渲染完成的时间</td><td>≤ 2.5 s</td><td>&gt; 4 s</td></tr><tr><td>INP</td><td>页面生命周期内交互延迟的代表值（接近最慢的那次）</td><td>≤ 200 ms</td><td>&gt; 500 ms</td></tr><tr><td>CLS</td><td>意外布局偏移的最大会话窗口得分</td><td>≤ 0.1</td><td>&gt; 0.25</td></tr></tbody></table>
<p>LCP 回答的是“用户什么时候觉得页面出来了”。浏览器会记下视口里最大的那块内容什么时候画完，通常是首屏大图或者标题文字。</p>
<p>INP 回答的是“页面卡不卡”。用户在整个页面停留期间每一次点击、按键都会被记下来，INP 取的是接近最慢的那一次，所以只要有一次交互特别慢，INP 就会变差。</p>
<p>CLS 回答的是“内容会不会乱跳”。比如正要点一个按钮，上方突然插进来一张广告图，按钮被挤下去，点到了别的地方，这种移动就会计入 CLS。用户自己操作后 500 毫秒内发生的偏移不算，因为那是用户预期之内的变化。</p>
<h2>每个指标通常因为什么变差</h2>
<p>LCP 慢，常见原因是服务器响应慢、LCP 图片被懒加载或者发现得太晚、有阻塞渲染的 CSS 和 JS，或者内容要等客户端 JS 跑完才生成。所以改法是缩短 TTFB，也就是服务器返回第一个字节的时间；用 <code>fetchpriority=&quot;high&quot;</code> 和预加载让 LCP 资源尽早下载；首屏图片不要加 <code>loading=&quot;lazy&quot;</code>。</p>
<p>INP 高，常见原因是事件处理函数里有长任务、一次交互触发了大量渲染，或者主线程正被第三方脚本占着。改法是把长任务拆开、让出主线程，先把用户能看到的反馈更新出来，其余工作往后放，再减少不必要的重新渲染。</p>
<p>CLS 高，常见原因是图片和广告位没有预留尺寸、字体切换导致文字重排，或者在已有内容上方插入横幅。改法是给图片写 <code>width</code>、<code>height</code> 或 <code>aspect-ratio</code>，给动态内容提前留好位置，用 <code>font-display</code> 和尺寸接近的备用字体。</p>
<h2>怎样采集真实用户的数据</h2>
<p>官方的 <code>web-vitals</code> 库把这三个指标的计算细节都处理好了，只要注册回调、把结果发出去。</p>
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
<p>为什么用 <code>sendBeacon</code> 而不是普通的 <code>fetch</code>？因为 INP 和 CLS 要等用户一直用到页面隐藏或卸载时才能得出最终值，<code>web-vitals</code> 会在页面进入后台时上报。这个时候页面可能马上就关了，<code>sendBeacon</code> 交给浏览器在后台发送，不会因为页面关闭而丢掉。</p>
<p>光有数值还不够。上报时最好一起带上页面路径、设备类型、网络类型，这样才能看出到底是哪一类用户变慢了。</p>
<p>公开站点还可以看 Chrome 用户体验报告（CrUX），它是 Chrome 用户的真实数据。不过 Safari 和 Firefox 对这些指标支持不完整，所以自己采到的数据会偏向 Chromium 用户。</p>
<h2>实验室数据和现场数据为什么对不上</h2>
<p>Lighthouse 在固定的设备和网络条件下模拟一次加载，所以能稳定复现 LCP 和 CLS 的问题。它不会去点页面，所以用总阻塞时间（TBT）近似反映交互风险。</p>
<p>真实用户的设备、网络和操作方式差别很大，两边的数值不一样是正常的。合理的顺序是先用现场数据确定问题在哪，再用实验室工具复现，修完之后再验证。</p>
<h2>常见追问</h2>
<p><strong>单页应用切换路由，指标会重新算吗？</strong></p>
<blockquote>
<p>这三个指标都以一次页面加载为单位。软导航，也就是 SPA 内部的路由切换，不会重置 LCP；INP 和 CLS 会一直累计到页面卸载。</p>
</blockquote>
<p><strong>指标全绿，就代表体验好吗？</strong></p>
<blockquote>
<p>不一定。它们只覆盖加载、响应和稳定性三个方面。比如下单流程从点击到完成要多久，这类业务关键流程的耗时还需要自定义指标来测。</p>
</blockquote>`};export{e as default};