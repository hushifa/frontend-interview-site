var e={answerHtml:`<h2>简答</h2>
<ul>
<li>确认范围：看 75 分位而不是平均值，按页面、版本、设备、网络拆分，找出问题从哪次发布开始、影响哪类用户。</li>
<li>复现：在实验室固定设备（或 CPU 降速）、网络、缓存状态和数据量，每次只改变一个因素，多次运行比较。</li>
<li>定位：LCP 看瀑布图中最大内容在哪一段等待；INP 看最慢交互慢在输入延迟、处理还是呈现。</li>
<li>修复：措施要对应瓶颈，图片压缩修不了主线程长任务，代码拆分修不了慢接口。</li>
<li>验证：同场景对比修复前后，再小比例发布观察 RUM，同时看错误率和业务完成率。</li>
</ul>
<h2>案例：题库首页 INP 从 180ms 升到 420ms，LCP 也变差</h2>
<p><strong>1. 确认范围</strong></p>
<p>RUM 显示问题集中在中低端 Android、新版本发布之后，INP 的慢交互主要是&quot;输入搜索关键词&quot;，LCP 元素是首屏的题目列表文本。</p>
<p><strong>2. 复现</strong></p>
<p>用 DevTools 开启 4 倍 CPU 降速和慢速 4G，加载与线上相同规模的题目数据，录制&quot;冷启动首页&quot;和&quot;输入关键词&quot;两个流程。</p>
<p><strong>3. 定位 LCP</strong></p>
<p>瀑布图显示列表数据在 JS 包下载、执行后才请求，新版本的 JS 包增大了 40%。列表依赖客户端渲染，形成&quot;HTML → JS → 数据 → 渲染&quot;的串行链路。</p>
<p><strong>4. 定位 INP</strong></p>
<p>Performance 面板里，每次按键触发对全部题目的同步过滤和全量重渲染，单次处理超过 300ms。web-vitals 的 attribution 数据也显示处理时间占大部分，见<a href="/questions/perf-inp-diagnosis/">《INP 很高时，如何定位到底是哪一段交互变慢？》</a>。</p>
<p><strong>5. 修复</strong></p>
<table><thead><tr><th>瓶颈</th><th>措施</th></tr></thead><tbody><tr><td>列表靠客户端渲染</td><td>首屏列表改为预渲染进 HTML</td></tr><tr><td>JS 包变大</td><td>分析产物，把新引入的大依赖改为按需加载</td></tr><tr><td>每次按键全量过滤</td><td>预先建立搜索索引，输入防抖，结果区域用低优先级更新</td></tr><tr><td>全量重渲染</td><td>虚拟列表，只渲染可见的行</td></tr></tbody></table>
<p><strong>6. 验证</strong></p>
<p>同一实验室场景多次运行，对比中位数和 75 分位。灰度发布 10% 流量，按设备分组对比 RUM 的 INP、LCP，同时确认搜索成功率没有下降，再全量发布。</p>
<h2>容易出错的地方</h2>
<ul>
<li>只看平均值：少数严重慢的用户被淹没。</li>
<li>看一次最好成绩：实验室结果有波动，要多次运行。</li>
<li>修复与瓶颈不对应：给组件加 memo 但瓶颈其实是网络。</li>
<li>只看技术指标：把结果推迟到点击后才显示，指标好看了，用户完成任务的时间却变长。</li>
<li>流量结构变化：新增了大量高端设备用户，整体指标变好不代表代码变快。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>RUM 和实验室测试怎么配合？RUM 回答&quot;谁慢、有多普遍&quot;，实验室回答&quot;为什么慢&quot;，见<a href="/questions/perf-rum/">《真实用户监测与实验室性能测试为什么要结合？》</a>。</li>
<li>怎样防止再次退化？在 CI 中加入性能预算，见<a href="/questions/performance-budget/">《前端性能预算应该怎样制定和落地？》</a>。</li>
</ul>`};export{e as default};