var e={answerHtml:`<p>页面“慢”可能指正文迟迟出现，也可能指点击后没有反馈，或者内容突然移动导致点错。LCP、INP、CLS 分别观察这些不同方面，不能用其中一个数字概括所有体验。</p>
<p>当前常用的良好阈值为：</p>
<table><thead><tr><th>指标</th><th>观察的体验</th><th>良好阈值</th></tr></thead><tbody><tr><td>LCP</td><td>主要内容的加载与呈现</td><td>不超过 2.5 秒</td></tr><tr><td>INP</td><td>交互后的响应与下一次呈现</td><td>不超过 200 毫秒</td></tr><tr><td>CLS</td><td>意外的视觉布局移动</td><td>不超过 0.1，无时间单位</td></tr></tbody></table>
<p>这些阈值是评估标准，不是超过一毫秒就产生性质完全不同的用户体验。正式评估通常关注真实用户样本的第 75 百分位，并区分移动端、桌面端等条件，而不是只看一次测试或平均值。</p>
<h2>LCP 不等于整个页面加载完成</h2>
<p>Largest Contentful Paint 关注初始视口中符合规则的较大内容元素，例如主要图像或文本块。加载过程中候选可能变化，最终指标不是随便找到一个面积最大的 DOM 节点，再读取它的加载时间。</p>
<p>它也不是最大文件的下载时间，不等于 load 事件。图像可能下载完了，却还要等样式、解码或主线程才能呈现；服务器首字节慢和资源发现太晚，也可能把 LCP 推迟。</p>
<p>优化应先确认实际 LCP 元素与等待阶段。若是首屏主图，检查它是否过晚发现、被误设懒加载、尺寸过大或优先级不合适；若主要等待来自服务器和脚本，仅压缩图片可能没有解决根因。</p>
<h2>INP 观察完整交互延迟，不只是事件函数耗时</h2>
<p>Interaction to Next Paint 关注符合规则的点击、触摸和键盘交互，从交互发生到相应下一次画面呈现的延迟。它包括输入等待、事件处理以及之后到呈现之间的等待。</p>
<p>因此一个 click 回调本身只运行几毫秒，主线程前面排着长任务，INP 仍可能很差。回调结束后触发昂贵布局和渲染，也会影响响应。</p>
<p>它在页面访问过程中观察多次交互，考虑较慢交互并按规则处理极端值。不能把它简单说成所有交互的平均耗时，也不宜把滚动、鼠标悬停等连续活动全部当成同样的交互样本。交互很多时还会按相应规则忽略部分极端值，并非永远取绝对最大值。</p>
<p>没有符合条件的交互时，可能没有可用 INP，不应把缺失数据直接填成 0。点击后很快显示加载提示、但业务结果很久才返回，也可能具有不同于“最终操作完成时间”的 INP；业务等待仍需另外测量。</p>
<h2>CLS 衡量位移，不是页面高度变化次数</h2>
<p>Cumulative Layout Shift 关注非预期的可见布局偏移，并结合影响范围与移动距离计算分值。缺少尺寸的图片、迟到的广告或异步内容插入到已有内容上方，都是常见原因。</p>
<p>现代 CLS 采用会话窗口规则：相邻位移间隔小于一秒、窗口持续不超过相应五秒范围，取其中分值最大的窗口，而不是把用户停留期间的所有位移无限累加。</p>
<p>与近期用户输入相关的某些位移会按规则排除，但不能因此认定“用户点过一次，后续所有移动都不计”。延迟很久才插入的内容，仍可能成为意外偏移。</p>
<p>为图像、嵌入区域和异步内容预留合理空间，通常比事后修饰动效更直接。CLS 低也不代表所有动画都舒适，视觉体验还有指标未覆盖的方面。</p>
<h2>第 75 百分位与本机一次测试不同</h2>
<p>某项指标的第 75 百分位达到阈值，强调的是相应样本分布，而不是少数高速设备上的最好结果。地区、网络、设备、缓存、导航类型和访问流程都可能改变分布。</p>
<p>实验室测试便于控制变量和定位长任务、资源瀑布或位移来源，但它不能代表所有真实访问。默认页面加载测试中的 TBT 等指标有诊断价值，也不等于已经测到了真实用户的 INP。</p>
<p>应把实验室诊断与真实用户监测结合：前者解释为什么慢，后者帮助判断影响了多少人、哪些条件最明显。</p>
<h2>采集可以使用维护中的实现</h2>
<p>web-vitals 库封装了多项指标和生命周期处理。在合适的浏览器初始化入口可以接入：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">import</span> { onCLS, onINP, onLCP } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;web-vitals&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">logMetric</span>(<span class="hljs-params">metric</span>) {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>({
    <span class="hljs-attr">name</span>: metric.<span class="hljs-property">name</span>,
    <span class="hljs-attr">value</span>: metric.<span class="hljs-property">value</span>,
    <span class="hljs-attr">rating</span>: metric.<span class="hljs-property">rating</span>,
    <span class="hljs-attr">id</span>: metric.<span class="hljs-property">id</span>,
    <span class="hljs-attr">delta</span>: metric.<span class="hljs-property">delta</span>,
    <span class="hljs-attr">navigationType</span>: metric.<span class="hljs-property">navigationType</span>,
  });
}

<span class="hljs-title function_">onCLS</span>(logMetric);
<span class="hljs-title function_">onINP</span>(logMetric);
<span class="hljs-title function_">onLCP</span>(logMetric);
</code></pre></div>
<p>这个例子只输出到本地控制台，不是完整的监控系统。实际应明确采样、去重、页面与版本归属，并避免在每次组件渲染时重复注册采集。</p>
<p>同一指标可能随生命周期或配置产生更新，不能把每次回调里的累计 value 全部相加当成最终分数。应按指标身份与上报方案处理更新或 delta，并区分导航与缓存恢复等情况。</p>
<p>浏览器对底层性能接口的支持和暴露范围也会影响数据。使用库不意味着每个页面都一定得到三项完整样本，真实监控要保留缺失与环境差异。</p>
<h2>用指标缩小问题范围，再看用户任务</h2>
<p>LCP 差时看内容发现与呈现，INP 差时看主线程和交互处理，CLS 差时看空间预留与布局变化。先确认具体原因，再选择预加载、代码分割、任务拆分或布局调整。</p>
<p>最终还应验证搜索、保存、阅读和导航等真实任务。三个指标都好，不保证所有业务过程都顺畅；但把它们的含义分清楚，可以避免把所有性能问题都归结为“包太大”或“网络慢”。</p>`};export{e as default};