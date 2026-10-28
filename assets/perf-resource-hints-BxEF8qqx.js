var e={answerHtml:`<h2>简答</h2>
<ul>
<li>preload 用来提前获取当前页面确定会用、但发现得晚的资源。</li>
<li>as、type、crossorigin 必须与实际使用一致，否则会重复下载。</li>
<li>响应式图片要用 imagesrcset、imagesizes 预加载实际会选中的候选。</li>
<li>全部 preload 会挤占关键资源带宽；模块依赖使用 modulepreload。</li>
</ul>
<p>浏览器只有发现资源地址后才能请求它。HTML 中的普通图片很早就能被发现，但深层 CSS 中的字体、背景图或脚本执行后才插入的资源，可能要等前面的文件下载解析后才暴露地址。</p>
<p>preload 用来提前告诉浏览器：“当前页面稍后确定会使用这个资源，请现在开始获取。”它主要缩短发现资源的等待，不会自动执行脚本或应用样式。</p>
<h2>一个字体预加载需要与真正的使用方式一致</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span>
  <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span>
  <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/fonts/body.woff2&quot;</span>
  <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;font&quot;</span>
  <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;font/woff2&quot;</span>
  <span class="hljs-attr">crossorigin</span>
/&gt;</span>
</code></pre></div>
<p>CSS 仍需通过 @font-face 引用同一字体。as 声明资源用途，影响请求语义和调度；type 可让浏览器判断是否支持这种格式；字体获取使用 CORS 模式，因此通常即使同源也要配置匹配的 crossorigin。</p>
<p>字体跨源时，服务端仍需返回相应 CORS 许可。preload 不会替服务器补响应头，也不会解决字体文件本身不可用的问题。</p>
<p>如果真正使用的是另一个 URL、不同凭据模式或不同候选资源，预加载结果可能无法按预期复用。看到页面发出了请求不等于预加载成功优化，可能只是提前下载了一份没有用到的文件。</p>
<h2>响应式图片要预加载实际会选中的候选</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span>
  <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span>
  <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;image&quot;</span>
  <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/images/hero-1280.webp&quot;</span>
  <span class="hljs-attr">imagesrcset</span>=<span class="hljs-string">&quot;/images/hero-640.webp 640w, /images/hero-1280.webp 1280w&quot;</span>
  <span class="hljs-attr">imagesizes</span>=<span class="hljs-string">&quot;(max-width: 700px) 100vw, 1280px&quot;</span>
/&gt;</span>
</code></pre></div>
<p>后续 img 应采用对应的 srcset 和 sizes。若手机实际选择 640w，而预加载固定下载 1280w，就可能下载两张图，反而浪费带宽。</p>
<p>picture 的格式回退也要谨慎。浏览器可能同时支持 AVIF 和 WebP，如果你把两个格式都 preload，它可能都下载，但 picture 最终只消费一个。不要把“列出全部候选”误当作浏览器一定会只预取最佳那张。</p>
<h2>几种资源提示解决不同问题</h2>
<table><thead><tr><th>机制</th><th>主要用途</th><th>不应误解为</th></tr></thead><tbody><tr><td>preload</td><td>提前获取当前页面需要的资源</td><td>自动执行或自动应用资源</td></tr><tr><td>modulepreload</td><td>为模块脚本加载做准备，具有模块处理语义</td><td>普通 fetch 的简单别名</td></tr><tr><td>prefetch</td><td>为可能的后续导航或使用提前准备资源</td><td>保证立刻下载或永久缓存</td></tr><tr><td>preconnect</td><td>提前建立目标来源连接</td><td>提前下载该来源全部文件</td></tr><tr><td>dns-prefetch</td><td>提前进行 DNS 解析</td><td>已经完成 TLS 连接</td></tr></tbody></table>
<p>模块入口及其依赖优先考虑构建工具生成的 modulepreload。浏览器对依赖获取和调度有自己的策略，不应手工给每个模块加重复提示。</p>
<p>preconnect 适合即将使用的重要跨源服务，但连接也占资源。对很多不一定访问的域名预连接会浪费开销。当前页面的紧急资源也不宜只依赖面向未来使用的 prefetch。</p>
<h2>为什么“全部 preload”会变慢</h2>
<p>资源在有限带宽和 CPU 上竞争。提前请求低优先级内容，可能挤占首屏 CSS、关键图片和必要脚本的下载机会；即使资源更早到达，解析执行仍可能堵住主线程。</p>
<p>应该优先找“发现得晚，但很快就确定要用”的少数资源。若资源本来已经在 HTML 前部被浏览器及时发现，额外提示的收益可能很小。若真正瓶颈是服务器等待或主线程长任务，增加 preload 也不会直接修复它。</p>
<p>验证时看冷缓存网络瀑布：请求是否更早开始、是否复用、是否出现重复下载，以及关键内容出现时间有没有改善。控制台的未使用预加载提示可以提供线索，但没有提示也不能证明有收益。</p>
<p>最后还要测不同视口、登录状态和页面分支。对某个用户必需的字体或组件，可能在另一个分支根本不用；提示应跟随真实页面需求生成，而不是长期堆在全站模板里。</p>`};export{e as default};