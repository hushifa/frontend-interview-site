var e={answerHtml:`<h2>简答</h2>
<ul>
<li>预算必须带条件：哪个页面、什么设备和网络、冷缓存还是热缓存、测哪个指标。</li>
<li>三类预算：资源（首屏 JS 压缩后体积、图片总量）、运行时（Total Blocking Time、最长任务）、体验（LCP、INP、CLS 的 75 分位）。</li>
<li>数值从当前基线出发，结合 Core Web Vitals 的&quot;良好&quot;阈值（LCP ≤ 2.5s、INP ≤ 200ms、CLS ≤ 0.1）设定，不照搬别人的数字。</li>
<li>设两条线：超过警告线在 PR 中提示，超过阻断线禁止合并，例外要写明原因和复查时间。</li>
<li>体积预算不等于体验：把关键代码改成懒加载，体积达标了，首次交互可能更慢。</li>
</ul>
<h2>预算示例</h2>
<table><thead><tr><th>页面</th><th>条件</th><th>预算</th></tr></thead><tbody><tr><td>首页</td><td>移动端、4G、冷缓存</td><td>首屏 JS（gzip）≤ 170 KB，LCP p75 ≤ 2.5s，CLS p75 ≤ 0.1</td></tr><tr><td>题目详情</td><td>直接打开深链接</td><td>首屏 JS ≤ 150 KB，正文出现 ≤ 2s</td></tr><tr><td>搜索</td><td>真实数据量，连续输入</td><td>单次输入处理 ≤ 50ms，INP p75 ≤ 200ms</td></tr></tbody></table>
<p>数值只是示例，按项目基线制定。</p>
<h2>在 CI 中检查</h2>
<ul>
<li>资源预算：读取构建产物的清单（如 Vite 的 manifest），计算每个入口静态依赖的分块去重后的压缩体积。不要硬编码带哈希的文件名。动态导入的分块单独计入&quot;首次使用该功能&quot;的预算。</li>
<li>实验室预算：用 Lighthouse CI 等工具在固定条件下运行多次取中位数，检查 LCP、TBT、CLS。</li>
<li>交互预算：用 Playwright 等脚本执行关键交互，结合 Performance API 测量处理时间。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-comment">// lighthouserc.js（示意）</span>
<span class="hljs-variable language_">module</span>.<span class="hljs-property">exports</span> = {
  <span class="hljs-attr">ci</span>: {
    <span class="hljs-attr">collect</span>: { <span class="hljs-attr">numberOfRuns</span>: <span class="hljs-number">3</span>, <span class="hljs-attr">url</span>: [<span class="hljs-string">&#x27;http://localhost:4173/&#x27;</span>] },
    <span class="hljs-attr">assert</span>: {
      <span class="hljs-attr">assertions</span>: {
        <span class="hljs-string">&#x27;largest-contentful-paint&#x27;</span>: [<span class="hljs-string">&#x27;error&#x27;</span>, { <span class="hljs-attr">maxNumericValue</span>: <span class="hljs-number">2500</span> }],
        <span class="hljs-string">&#x27;cumulative-layout-shift&#x27;</span>: [<span class="hljs-string">&#x27;error&#x27;</span>, { <span class="hljs-attr">maxNumericValue</span>: <span class="hljs-number">0.1</span> }],
        <span class="hljs-string">&#x27;total-blocking-time&#x27;</span>: [<span class="hljs-string">&#x27;warn&#x27;</span>, { <span class="hljs-attr">maxNumericValue</span>: <span class="hljs-number">200</span> }],
      },
    },
  },
};
</code></pre></div>
<p>实验室测不到真实 INP，只能用 TBT 和脚本化交互作为替代。</p>
<h2>超出预算时</h2>
<ol>
<li>用构建分析工具找出增长来源：新依赖、重复打包的模块、意外的静态导入、polyfill、图片字体。</li>
<li>判断是否值得：新功能带来的价值能否抵消代价，有没有更轻的替代库。</li>
<li>处理：按需加载低频功能、替换依赖、压缩资源、移除重复模块。</li>
<li>确有必要时调整预算，并记录原因。</li>
</ol>
<h2>线上跟踪</h2>
<p>CI 只能防止明显退化，真实用户的体验还要看 RUM：按版本对比 75 分位，关注连续多个版本的小幅上涨，见<a href="/questions/perf-rum/">《真实用户监测与实验室性能测试为什么要结合？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>第三方脚本算不算？算。它们同样占用带宽和主线程，应单独设预算并定期复查。</li>
<li>压缩用 gzip 还是 Brotli 算？和线上实际使用的一致，并固定压缩参数，否则前后不可比。</li>
</ul>`};export{e as default};