var e={answerHtml:`<p>用户把鼠标移到“课程详情”链接上时，应用可能猜测他马上会点击，并提前准备下一个页面。普通 <code>prefetch</code> 主要提前获取资源；<code>prerender</code> 则可能在隐藏的文档中运行页面脚本、建立 DOM 和执行数据请求。两者都能降低点击后的等待，却也会提前消耗带宽、CPU、缓存和服务端资源。</p>
<p>Speculation Rules API 用一个 <code>type=&quot;speculationrules&quot;</code> 的 JSON 脚本声明哪些导航值得预取或预渲染：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;speculationrules&quot;</span>&gt;</span><span class="javascript">
{
  <span class="hljs-string">&quot;prefetch&quot;</span>: [
    {
      <span class="hljs-string">&quot;where&quot;</span>: { <span class="hljs-string">&quot;href_matches&quot;</span>: <span class="hljs-string">&quot;/courses/*&quot;</span> },
      <span class="hljs-string">&quot;eagerness&quot;</span>: <span class="hljs-string">&quot;moderate&quot;</span>
    }
  ],
  <span class="hljs-string">&quot;prerender&quot;</span>: [
    {
      <span class="hljs-string">&quot;where&quot;</span>: { <span class="hljs-string">&quot;href_matches&quot;</span>: <span class="hljs-string">&quot;/courses/featured&quot;</span> },
      <span class="hljs-string">&quot;eagerness&quot;</span>: <span class="hljs-string">&quot;conservative&quot;</span>
    }
  ]
}
</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>这是声明，不是保证。浏览器可以因为网络、设备内存、用户设置、页面策略或当前资源压力而不执行规则。规则也不能替应用保证“下次点击一定秒开”；上线前应通过实际导航指标比较启用与未启用的结果。</p>
<h2>prefetch 和 prerender 的成本不同</h2>
<p><code>prefetch</code> 通常提前获取未来导航需要的文档或资源，但不会把目标页面完整激活成可交互文档。它更适合低成本、可缓存、用户很可能马上访问的公共页面。</p>
<p><code>prerender</code> 会创建一个隐藏的页面执行上下文。目标页面可能执行 JavaScript、解析组件、发出数据请求、读取公开缓存、创建 WebSocket 或注册计时器，直到用户真正激活它。它适合极高概率的下一步导航和能安全在隐藏状态运行的页面，成本和副作用都更大。</p>
<p>不要把 prerender 理解成“只下载 HTML”：</p>
<ul>
<li>目标页面可能执行数据请求和客户端初始化；</li>
<li>计时器、分析脚本、广告、推送和 WebSocket 可能在激活前发生；</li>
<li>目标页面中的写操作或自动播放逻辑不能因为页面暂时不可见就假设没有影响；</li>
<li>页面可能因为内存压力被丢弃，预渲染工作不一定最终被用户使用。</li>
</ul>
<p>如果页面有登录、购物车、实时会话或用户特有数据，必须重新评估是否可以预渲染。服务端不要把“这是一次预渲染请求”当成用户已经明确点击了页面，也不要仅依赖用户代理字符串决定是否执行敏感操作。</p>
<h2>触发策略决定浪费率</h2>
<p><code>eagerness</code> 用来表达浏览器可以多早开始推测，常见值包括 <code>immediate</code>、<code>eager</code>、<code>moderate</code> 和 <code>conservative</code>。越积极，潜在收益越高，误猜成本也越高。规则中的 <code>where</code> 可以按链接匹配；它不是一套完整的业务权限或推荐系统。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">script</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;speculationrules&quot;</span>&gt;</span><span class="javascript">
{
  <span class="hljs-string">&quot;prefetch&quot;</span>: [
    {
      <span class="hljs-string">&quot;where&quot;</span>: {
        <span class="hljs-string">&quot;and&quot;</span>: [
          { <span class="hljs-string">&quot;href_matches&quot;</span>: <span class="hljs-string">&quot;/docs/*&quot;</span> },
          { <span class="hljs-string">&quot;not&quot;</span>: { <span class="hljs-string">&quot;selector_matches&quot;</span>: <span class="hljs-string">&quot;.external&quot;</span> } }
        ]
      },
      <span class="hljs-string">&quot;eagerness&quot;</span>: <span class="hljs-string">&quot;conservative&quot;</span>
    }
  ]
}
</span><span class="hljs-tag">&lt;/<span class="hljs-name">script</span>&gt;</span>
</code></pre></div>
<p>真实项目还应筛掉下载链接、登出、删除、支付、一次性回调和带明显副作用的地址。公共文章、文档和详情页通常比账户设置更适合预取。不能因为链接在首屏就全部预渲染，否则大量猜测会与当前页面的关键资源竞争。</p>
<p>同一页面的链接还可能随着用户筛选、权限和实验分组变化。规则脚本是声明性输入，应用要确保它匹配的 URL 与当前导航策略一致；动态插入规则、更新规则和浏览器支持范围应按目标版本验证，不要把某个 Chromium 版本的行为当成跨浏览器标准保证。</p>
<h2>预渲染页面要处理激活前后的生命周期</h2>
<p>页面可以通过 <code>document.prerendering</code> 判断当前文档是否正在以预渲染状态运行，并在激活时响应 <code>prerenderingchange</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">startUserVisibleWork</span>(<span class="hljs-params"></span>) {
  <span class="hljs-comment">// 只在页面真正对用户可见后启动分析、声音和实时连接。</span>
}

<span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">prerendering</span>) {
  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;prerenderingchange&#x27;</span>, startUserVisibleWork, {
    <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span>,
  });
} <span class="hljs-keyword">else</span> {
  <span class="hljs-title function_">startUserVisibleWork</span>();
}
</code></pre></div>
<p>这只是页面自身的生命周期处理。组件中的动画、轮询、WebSocket、媒体播放和分析 SDK 也要遵守同样的边界。<code>visibilityState</code>、页面生命周期和 <code>document.prerendering</code> 解决的问题不同，不能只监听 <code>visibilitychange</code> 就认为隐藏预渲染页面的所有工作都安全。</p>
<p>需要用户明确动作的代码应延后到激活或真实交互之后，例如提交表单、创建订单、请求摄像头、播放声音和发送“已阅读”事件。预渲染期间可以准备只读数据，但不能把准备请求当作业务确认。服务端也应让 GET 读取保持无副作用，不能依赖“用户点击后才会访问这个 GET”来保护写操作。</p>
<h2>缓存、认证和隐私要一起设计</h2>
<p>预取请求可能先于用户点击到达服务端，甚至最终没有被使用。它可能进入浏览器、CDN 或应用缓存，影响缓存命中率和服务端负载。带 Cookie 的私有页面要特别谨慎：提前获取用户特有数据会扩大无效请求和缓存配置错误的影响。</p>
<p>页面输出要根据响应的公共性设置缓存。不能把带用户身份的响应误放进共享 CDN，也不能因为 URL 匹配了“详情页”就省略授权。预取/预渲染不绕过 CORS、CSP、Cookie、SameSite 或权限策略；它只是改变请求可能发生的时间。</p>
<p>分析和广告系统也要区分“预渲染加载”和“用户真正查看”。如果页面一启动就上报曝光、转化或播放，预渲染会夸大业务指标。可以等待激活、用户可见或真实交互后再记录，并在服务端和数据仓库中区分导航类型。不要为了修正统计而把所有预渲染请求简单丢弃，先明确指标定义。</p>
<h2>与 link prefetch 和资源提示不是同一层</h2>
<p><code>&lt;link rel=&quot;prefetch&quot;&gt;</code> 是资源提示，<code>preconnect</code> 只准备连接，<code>preload</code> 提前获取当前页面确定需要的资源；Speculation Rules 面向未来导航的文档级预取和预渲染。它们可以同时出现，但不能互相替代：</p>
<ul>
<li>当前页面确定需要的字体或首屏图片，优先评估 preload；</li>
<li>未来用户可能访问的公共文档，才考虑 prefetch；</li>
<li>下一步导航概率很高且页面无隐藏副作用，才考虑 prerender；</li>
<li>任何提示都可能被浏览器忽略，不能代替正确的缓存、代码分割和服务端响应。</li>
</ul>
<p>如果点击后的主要等待来自当前页面长任务、布局或数据接口，预渲染未来页面不一定能解决问题，甚至会争用主线程和网络。应先用 Navigation Timing、PerformanceObserver、网络瀑布和真实用户数据定位瓶颈，再决定是否增加推测。</p>
<h2>失败、回退和导航竞态</h2>
<p>预取或预渲染被取消、资源失败、规则不支持或目标页面发生版本变化时，普通导航仍必须能正常工作。不能让页面只在推测成功时才正确显示。目标文档使用新的静态资源版本时，缓存和 HTML 兼容策略也要支持普通请求与预渲染请求的切换。</p>
<p>用户可能在推测过程中点击另一个链接。应用不能把第一个目标的迟到数据写入第二个页面；路由层仍要使用当前导航身份、AbortSignal 或版本检查。预渲染文档被激活后，客户端状态接管要避免重复请求、重复事件监听和错误的滚动/焦点恢复。</p>
<h2>兼容性和验收</h2>
<p>Speculation Rules API 的支持和具体规则能力取决于浏览器版本、平台和页面策略。旧浏览器会忽略脚本或继续走普通导航，因此 HTML、链接和路由必须先在无推测环境下可用。能力检测不能只看脚本标签是否成功插入，还要观察实际导航和页面生命周期。</p>
<p>验收至少包括：</p>
<ul>
<li>规则不匹配、浏览器不支持、网络慢和内存紧张时的普通导航；</li>
<li>预取与预渲染的请求数量、缓存命中、服务端负载和未使用比例；</li>
<li>登录、登出、支付、删除、下载和一次性回调不会被提前执行；</li>
<li>预渲染期间的分析、动画、音频、WebSocket 和用户可见工作只在合适时机启动；</li>
<li>目标页面激活、被丢弃、快速切换和资源版本更新后的状态一致性；</li>
<li>低端设备、移动网络、数据节省模式和无痕模式下的性能与隐私影响。</li>
</ul>
<p>推测规则的目标是减少用户已经决定导航后的等待，不是让浏览器无条件提前运行更多页面。把页面副作用、缓存、认证、统计和生命周期都纳入设计，才可能在真实用户中获得净收益；否则“预渲染更快”很容易变成更高的流量和更难解释的数据。</p>`};export{e as default};