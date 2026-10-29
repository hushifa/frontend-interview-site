var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>性能预算就是给性能定一条不能超的线，比如首页首屏 JS 压缩后不超过 170KB。关键是预算必须带条件：哪个页面、什么设备和网络、冷缓存还是热缓存、测哪个指标，不带条件的数字没法比较。</p>
<p>预算一般分三类。资源预算管体积，比如首屏 JS、图片总量；运行时预算管主线程，比如总阻塞时间、最长任务；体验预算管用户感受，比如 LCP、INP、CLS 的 75 分位。数值从项目现在的基线出发，结合 Core Web Vitals 的“良好”阈值来定，不照搬别人的数字。</p>
<p>落地时放进 CI，设两条线：超过警告线在 PR 里提示，超过阻断线禁止合并，例外要写明原因和复查时间。上线以后再用 RUM 跟踪真实用户的趋势。</p>
<p>要注意，体积达标不等于体验好。比如把关键代码改成懒加载，体积是降下来了，用户第一次用这个功能时反而更慢。</p>
</blockquote>
<h2>预算长什么样</h2>
<p>下面是几个示例，每一条都写明了页面和条件：</p>
<table><thead><tr><th>页面</th><th>条件</th><th>预算</th></tr></thead><tbody><tr><td>首页</td><td>移动端、4G、冷缓存</td><td>首屏 JS（gzip）≤ 170 KB，LCP p75 ≤ 2.5s，CLS p75 ≤ 0.1</td></tr><tr><td>题目详情</td><td>直接打开深链接</td><td>首屏 JS ≤ 150 KB，正文出现 ≤ 2s</td></tr><tr><td>搜索</td><td>真实数据量，连续输入</td><td>单次输入处理 ≤ 50ms，INP p75 ≤ 200ms</td></tr></tbody></table>
<p>这些数字只是示例，要按自己项目的基线来定。Core Web Vitals 的良好阈值是 LCP ≤ 2.5s、INP ≤ 200ms、CLS ≤ 0.1，可以作为体验预算的参考目标。</p>
<h2>在 CI 里怎么检查</h2>
<p>资源预算的检查方式，是读取构建产物的清单，比如 Vite 的 manifest，算出每个入口静态依赖的所有分块，去重以后加起来的压缩体积。为什么不能直接写文件名？因为文件名带内容哈希，每次构建都会变。动态导入的分块要单独计入“首次使用这个功能”的预算，不能混进首屏。</p>
<p>实验室预算可以用 Lighthouse CI 这类工具，在固定条件下跑多次取中位数，检查 LCP、TBT、CLS。下面是一个示意配置：</p>
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
<p><code>error</code> 对应阻断线，超了就失败；<code>warn</code> 对应警告线，只提示。<code>numberOfRuns: 3</code> 是为了减少单次结果的波动。</p>
<p>为什么这里没有 INP？因为实验室工具不会去点页面，测不到真实 INP，只能用 TBT 代替。要测交互，可以用 Playwright 这类脚本执行关键操作，再用 Performance API 测处理时间。</p>
<h2>超出预算了怎么办</h2>
<p>超了不代表一定要砍功能，按下面的顺序处理：</p>
<ol>
<li>用构建分析工具找出增长来自哪里：新依赖、重复打包的模块、意外的静态导入、polyfill、图片和字体。</li>
<li>判断值不值：新功能带来的价值能不能抵消代价，有没有更轻的替代库。</li>
<li>处理：低频功能按需加载、换依赖、压缩资源、去掉重复模块。</li>
<li>确实有必要时调整预算，并把原因记下来。</li>
</ol>
<h2>上线以后怎么跟踪</h2>
<p>CI 只能挡住明显的退化，真实用户的体验还要看 RUM。按版本对比 75 分位，特别要留意连续好几个版本的小幅上涨，每次都不超线，累计起来就很可观了，见<a href="/questions/perf-rum/">《真实用户监测与实验室性能测试为什么要结合？》</a>。</p>
<h2>常见追问</h2>
<p><strong>第三方脚本算不算进预算？</strong></p>
<blockquote>
<p>算。它们一样占带宽和主线程，应该单独设预算，并且定期复查。</p>
</blockquote>
<p><strong>压缩体积用 gzip 还是 Brotli 算？</strong></p>
<blockquote>
<p>和线上实际用的一致，并且固定压缩参数。否则前后两次的数字没法比较。</p>
</blockquote>`};export{e as default};