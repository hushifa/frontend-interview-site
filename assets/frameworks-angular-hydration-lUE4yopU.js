var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>服务端渲染出 HTML 以后，浏览器已经能看到页面了。如果没有 hydration，客户端 Angular 启动时会把这份 HTML 丢掉，再自己重新渲染一遍，页面可能会闪一下，LCP、CLS 这些指标也会受影响。Hydration 的意思是不丢，直接复用已有的 DOM 节点，只把事件监听和状态接上去。</p>
<p>开启方法是在启动时加 <code>provideClientHydration()</code>。前提是服务端和客户端渲染出的 DOM 必须一致。不一致时 hydration 会失败，抛出 DOM 不一致的错误，这要当 bug 修。只有加了 <code>ngSkipHydration</code> 的组件，才会销毁后重新渲染。</p>
<p>最常见的不一致来源是直接操作 DOM，比如用 <code>document</code>、<code>innerHTML</code> 或者第三方库改结构。这种代码要改成 Angular 的 API，暂时改不了就给组件加 <code>ngSkipHydration</code>。</p>
<p>还有两个增强功能。事件重放会记下脚本加载完之前用户的点击，hydration 完成后再派发一次；增量 hydration 配合 <code>@defer</code>，让一部分区域按需激活。Angular v22 起，<code>provideClientHydration()</code> 默认开启增量 hydration，并自动带上事件重放；更早的版本要分别加 <code>withEventReplay()</code> 和 <code>withIncrementalHydration()</code>。</p>
</blockquote>
<h2>怎样开启</h2>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">import</span> { bootstrapApplication, provideClientHydration, withEventReplay } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;@angular/platform-browser&#x27;</span>;

<span class="hljs-title function_">bootstrapApplication</span>(<span class="hljs-title class_">App</span>, {
  <span class="hljs-attr">providers</span>: [<span class="hljs-title function_">provideClientHydration</span>(<span class="hljs-title function_">withEventReplay</span>())],
});
</code></pre></div>
<p>加上 <code>withEventReplay()</code> 是因为页面可见以后，脚本可能还没加载完。用户这时点了按钮，如果没有事件重放，这次点击就丢了。</p>
<p>这是 v22 之前的写法。v22 起只写 <code>provideClientHydration()</code> 就行：增量 hydration 默认开启，它依赖事件重放，所以会把事件重放一起打开，已有的 <code>withEventReplay()</code> 可以删掉。不想要增量 hydration 时，写 <code>provideClientHydration(withNoIncrementalHydration(), withEventReplay())</code>，事件重放仍然保留。</p>
<h2>两端为什么会不一致</h2>
<p>先看一个时钟组件：</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-meta">@Component</span>({
  <span class="hljs-attr">template</span>: <span class="hljs-string">\`&lt;p&gt;{{ now }}&lt;/p&gt;\`</span>,
})
<span class="hljs-keyword">export</span> <span class="hljs-keyword">class</span> <span class="hljs-title class_">Clock</span> {
  now = <span class="hljs-keyword">new</span> <span class="hljs-title class_">Date</span>().<span class="hljs-title function_">toLocaleTimeString</span>(); <span class="hljs-comment">// 服务端和客户端时间不同</span>
}
</code></pre></div>
<p>服务端渲染时算了一次时间，过了一会儿客户端又算一次，两次结果肯定不同，DOM 里的文字就对不上了。</p>
<p>这类问题有几种常见来源，改法也不一样：</p>
<ul>
<li>时间、随机数：在服务端生成，通过 <code>TransferState</code> 或接口数据传给客户端；或者只在浏览器里更新，放进 <code>afterNextRender</code>。</li>
<li>浏览器专属 API：<code>window</code>、<code>localStorage</code> 在服务端不存在，也放进 <code>afterNextRender</code> 里执行。</li>
<li>不合法的 HTML 嵌套：比如 <code>&lt;p&gt;</code> 里放 <code>&lt;div&gt;</code>。浏览器解析 HTML 时会自动把结构修正掉，结果实际 DOM 和 Angular 以为的不一样。</li>
</ul>
<h2>暂时改不了的组件怎么办</h2>
<p>可以先跳过它：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">legacy-chart</span> <span class="hljs-attr">ngSkipHydration</span> /&gt;</span>
</code></pre></div>
<p>这个组件会在客户端重新渲染，适合暂时没法改造的第三方组件。这个属性只能加在组件的宿主元素上。</p>
<h2>增量 hydration 是什么</h2>
<p>普通 hydration 要把整页的组件代码都下载下来才能激活。增量 hydration 让某些区域晚一点再激活：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html">@defer (hydrate on viewport) {
  <span class="hljs-tag">&lt;<span class="hljs-name">app-comments</span> /&gt;</span>
}
</code></pre></div>
<p>服务端照常把评论区的 HTML 输出来，用户能直接看到内容。等评论区滚进视口，客户端才去加载它的代码并 hydration。这样首屏要下载和执行的 JavaScript 就少了。</p>
<h2>常见追问</h2>
<p><strong>开启 hydration 后，HTTP 请求会在客户端再发一遍吗？</strong></p>
<blockquote>
<p>不会。开启 hydration 后，<code>HttpClient</code> 默认会缓存服务端发出的 GET 请求结果并传给客户端，客户端直接用，不再请求一次。</p>
</blockquote>
<p><strong>和 React 的 hydration 有什么共同点？</strong></p>
<blockquote>
<p>原理类似，都要求两端渲染出的结构一致，不一致的排查思路也差不多，详见<a href="/questions/render-hydration/">《Hydration mismatch 为什么发生，应该怎样修复？》</a>。</p>
</blockquote>`};export{e as default};