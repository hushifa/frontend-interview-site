var e={answerHtml:`<h2>简答</h2>
<ul>
<li>没有 hydration 时，客户端启动会丢弃服务端 HTML 再重新渲染，可能出现闪烁，也会影响 LCP、CLS 等指标。</li>
<li>用 <code>provideClientHydration()</code> 开启后，Angular 匹配现有 DOM 节点，只挂载事件监听和状态。</li>
<li>服务端和客户端渲染出的 DOM 必须一致；不一致时 hydration 失败并抛出 DOM 不一致错误，应当作 bug 修复；只有加了 <code>ngSkipHydration</code> 的组件才会销毁后重新渲染。</li>
<li>直接用 <code>document</code>、<code>innerHTML</code> 或第三方库修改 DOM 会导致不一致，应改用 Angular API，或给组件加 <code>ngSkipHydration</code> 跳过。</li>
<li>事件重放（<code>withEventReplay()</code>）记录脚本加载完成前用户的点击，hydration 完成后重新派发；增量 hydration（<code>withIncrementalHydration()</code>）配合 <code>@defer</code> 按需激活部分区域。</li>
</ul>
<h2>开启</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { bootstrapApplication, provideClientHydration, withEventReplay } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/platform-browser&#x27;</span>;

<span class="hljs-title function_">bootstrapApplication</span>(<span class="hljs-title class_">App</span>, {
  <span class="hljs-attr">providers</span>: [<span class="hljs-title function_">provideClientHydration</span>(<span class="hljs-title function_">withEventReplay</span>())],
});
</code></pre></div>
<h2>常见的不一致来源</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-meta">@Component</span>({
  <span class="hljs-attr">template</span>: <span class="hljs-string">\`&lt;p&gt;{{ now }}&lt;/p&gt;\`</span>,
})
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Clock</span> {
  now = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>().<span class="hljs-title function_">toLocaleTimeString</span>(); <span class="hljs-comment">// 服务端和客户端时间不同</span>
}
</code></pre></div>
<ul>
<li>时间、随机数：服务端生成后通过 <code>TransferState</code> 或接口数据传给客户端，或者只在浏览器中更新（<code>afterNextRender</code>）。</li>
<li>浏览器专属 API：<code>window</code>、<code>localStorage</code> 在服务端不存在，放进 <code>afterNextRender</code> 中执行。</li>
<li>无效的 HTML 嵌套，例如 <code>&lt;p&gt;</code> 里放 <code>&lt;div&gt;</code>：浏览器解析时会自动修正结构，导致和 Angular 预期的 DOM 不一致。</li>
</ul>
<h2>跳过某个组件</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">legacy-chart</span> <span class="hljs-attr">ngSkipHydration</span> /&gt;</span>
</code></pre></div>
<p>该组件会在客户端重新渲染，适合暂时无法改造的第三方组件。只能加在组件宿主元素上。</p>
<h2>增量 hydration</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html">@defer (hydrate on viewport) {
  <span class="hljs-tag">&lt;<span class="hljs-name">app-comments</span> /&gt;</span>
}
</code></pre></div>
<p>服务端照常输出评论区的 HTML，客户端在它进入视口时才加载代码并 hydration。首屏需要下载和执行的 JavaScript 更少。</p>
<h2>常见追问</h2>
<ul>
<li>HTTP 请求会在客户端重复吗？开启 hydration 后，<code>HttpClient</code> 默认缓存服务端发出的 GET 请求结果并传给客户端，客户端不会再请求一次。</li>
<li>和 React hydration 有什么共同点？都要求两端结构一致，原理类似，见<a href="/questions/render-hydration/">《Hydration mismatch 为什么发生，应该怎样修复？》</a>。</li>
</ul>`};export{e as default};