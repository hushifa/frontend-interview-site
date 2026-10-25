var e={answerHtml:`<p>用户第一次打开文章页面，并不一定马上需要大型编辑器或图表模块。把这些低频功能留到需要时再获取，可以减少初始下载和执行压力。</p>
<p>代码分割决定代码怎样拆成不同资源块，懒加载决定什么时候开始取得或使用它们。一个应用虽然生成了多个文件，却仍可能在首屏一次加载全部文件，因此“分包了”不等于“懒加载了”。</p>
<h2>动态导入怎样建立边界</h2>
<p>下面的入口在用户需要备注编辑器时才导入相应模块：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">openNotes</span>(<span class="hljs-params">container, { signal } = {}</span>) {
  signal?.<span class="hljs-title function_">throwIfAborted</span>();
  <span class="hljs-keyword">const</span> { mountNotes } = <span class="hljs-keyword">await</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./notes-editor.js&#x27;</span>);
  signal?.<span class="hljs-title function_">throwIfAborted</span>();
  <span class="hljs-keyword">return</span> <span class="hljs-title function_">mountNotes</span>(container);
}
</code></pre></div>
<p>notes-editor.js 提供实际的挂载与清理：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">mountNotes</span>(<span class="hljs-params">container</span>) {
  <span class="hljs-keyword">const</span> input = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;textarea&#x27;</span>);
  input.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-label&#x27;</span>, <span class="hljs-string">&#x27;备注&#x27;</span>);
  container.<span class="hljs-title function_">replaceChildren</span>(input);
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> input.<span class="hljs-title function_">remove</span>();
}
</code></pre></div>
<p>构建器可以识别静态明确的动态导入路径，并生成相应异步块。调用方需要处理 openNotes 返回 Promise 的失败，获得清理函数后，在不再使用时调用它。</p>
<p>示例只展示加载与挂载边界，完整界面还需要加载提示、重复点击管理和失败后的操作入口。不要让用户点击后没有反馈地等待下载。</p>
<h2>取消等待意图，不等于取消模块下载</h2>
<p>原生 import() 没有通用的 AbortSignal 下载取消参数。示例在导入前后检查信号，是为了用户关闭功能后不再挂载旧界面，不是让传输中的 JavaScript 一定停止下载。</p>
<p>若调用者没有把组件生命周期与信号或版本检查关联起来，模块加载完成后仍可能覆盖已经变化的页面。已经挂载后又离开，则还需要调用返回的清理函数。</p>
<p>同一功能多次打开时，也应明确是否复用实例、是否先卸载旧实例。模块缓存与界面实例生命周期不是同一件事。</p>
<h2>模块通常会缓存，但不是所有失败都能原样重试</h2>
<p>同一个模块标识在同一执行环境中成功加载和执行后，后续 import 通常复用相应模块，不会每次重新执行全部顶层代码。再次调用导出的 mountNotes，仍可以创建新的界面实例。</p>
<p>加载、链接与执行是不同阶段。网络加载失败可能有再次获取机会，但模块执行时抛出的错误会按模块机制缓存，重复导入相同标识不等于重新从头执行。</p>
<p>把保存的 Promise 设回 undefined，不能保证修复所有动态导入失败。也不要不断附加随机查询参数强行绕过缓存，否则可能增加内存、重复执行副作用并破坏版本管理。</p>
<h2>哪些边界通常值得考虑</h2>
<p>非首屏路由、大型编辑器、低频弹窗、不同语言或格式的处理器，通常比一组很小的基础函数更适合作为边界。首屏主要内容和马上需要的交互，则不宜机械地全部推迟。</p>
<p>依赖也要一起分析。若主入口已经静态导入了同一个大库，后来给某个功能增加 import()，并不保证它就从初始路径消失。</p>
<p>动态路径需要让构建器能够识别候选范围，或者通过明确映射和相应工具能力建立白名单。任意运行时字符串并不保证都能被打包成正确的本地资源。</p>
<h2>预取可以减少首次点击等待，但会重新占用资源</h2>
<p>用户接近入口、明确表现出使用意图或页面有合适空闲机会时，可以提前准备可能需要的代码。这样是在初始成本和后续等待之间做取舍，不是免费加速。</p>
<p>如果把所有懒块都立即预加载，就可能重新引入原本希望减少的首屏流量。网络条件、设备资源和命中概率不同，策略也应有界。</p>
<p>框架的 lazy、Suspense 或路由加载能力可以帮助表达等待，但数据加载、资源错误和重试仍需要对应处理，不能只有一个永远不退出的 loading。</p>
<h2>发布新版本后，旧页面可能还引用旧块</h2>
<p>已经打开的页面可能持有旧入口，其中动态导入地址仍是旧哈希文件。如果部署时删除旧资源，用户稍后打开那个功能就可能遇到 404。</p>
<p>项目可以根据发布策略选择提供版本窗口，或明确检测加载失败并引导安全刷新；若选择只保留最新产物，也需要理解这种已打开页面的恢复问题。刷新前应考虑未保存输入，不能无限自动刷新来掩盖错误。</p>
<p>服务工作线程和 CDN 缓存还可能增加版本组合，入口、异步块与缓存策略应一起验证。</p>
<h2>最后同时看两种等待</h2>
<p>一方面检查初始 JS 与首屏关键路径是否减少，另一方面检查首次打开懒功能要等多久。拆成更多块也可能增加请求、重复模块或调度成本，不能只看某一个文件缩小了多少。</p>
<p>懒加载的目标是让用户先承担当前真正需要的成本，并在后续需要时可靠地提供功能，而不是单纯追求更多 chunk 文件。</p>`};export{e as default};