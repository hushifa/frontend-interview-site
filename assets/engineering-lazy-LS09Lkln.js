var e={answerHtml:`<h2>简答</h2>
<ul>
<li>代码分割把产物拆成多个文件；懒加载决定其中一部分等到需要时才下载执行，两者通常配合使用。</li>
<li>适合首屏用不到的内容：其他路由、弹窗、富文本编辑器、图表、管理后台等。</li>
<li><code>import()</code> 返回 Promise，同一模块只加载一次，之后重复调用拿到同一个模块实例。</li>
<li>要处理加载中状态、失败重试，以及提前预加载以减少用户等待。</li>
<li>发布新版本后旧页面可能请求已删除的旧 chunk，部署时要保留旧资源或在失败时提示刷新。</li>
</ul>
<h2>动态导入的基本形式</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  button.<span class="hljs-property">disabled</span> = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> { openEditor } = <span class="hljs-keyword">await</span> <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./editor.js&#x27;</span>);
    <span class="hljs-title function_">openEditor</span>();
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-title function_">showToast</span>(<span class="hljs-string">&#x27;编辑器加载失败，请重试&#x27;</span>);
  } <span class="hljs-keyword">finally</span> {
    button.<span class="hljs-property">disabled</span> = <span class="hljs-literal">false</span>;
  }
});
</code></pre></div>
<p>构建工具看到 <code>import(&#x27;./editor.js&#x27;)</code> 会把 editor 及其独占依赖拆成单独的 chunk。路径必须能被静态分析，完全由变量拼出的路径无法拆分。</p>
<ul>
<li>模块加载成功后会被缓存，再次点击不会重新下载。</li>
<li>加载失败的 Promise 不会自动重试；React 的 <code>lazy</code> 等封装通常也会缓存失败结果，需要自己实现重试逻辑或让用户刷新。</li>
<li><code>import()</code> 本身不能取消。组件在加载完成前卸载时，要在回调里判断组件是否仍然存在，再决定是否使用结果。</li>
</ul>
<h2>什么时候不该拆</h2>
<ul>
<li>首屏必须立即渲染的组件：拆出去只会多一次请求，推迟 LCP。</li>
<li>很小的模块：额外请求的开销大于节省的字节。</li>
<li>几乎每个页面都会用到的共享代码：应留在公共块里。</li>
</ul>
<h2>预加载减少等待</h2>
<ul>
<li>用户意图明显时提前加载，例如鼠标悬停或聚焦到链接上就调用 <code>import()</code>。</li>
<li>浏览器空闲时预加载下一步可能用到的路由。</li>
<li>Vite 会为动态导入的 chunk 自动生成依赖预加载，避免下载完入口后再串行请求依赖。</li>
</ul>
<h2>发布后的旧 chunk 404</h2>
<p>带哈希的 chunk 名在每次构建后可能改变。用户停留在旧页面时点击某个功能，浏览器会请求旧文件名，如果部署时把旧文件删了，就会加载失败。</p>
<p>常见做法：</p>
<ol>
<li>部署时保留上一两个版本的静态资源一段时间。</li>
<li>捕获 chunk 加载失败（Vite 会派发 <code>vite:preloadError</code> 事件），提示用户刷新或自动重新加载一次。</li>
</ol>
<h2>常见追问</h2>
<ul>
<li>路由级懒加载和组件级懒加载怎么选？路由是最自然的边界，先做路由级；页面内体积大且不一定使用的组件再单独拆。</li>
<li>懒加载会影响 SEO 吗？首屏核心内容不应懒加载；预渲染或 SSR 页面要确保关键内容在 HTML 中。</li>
</ul>`};export{e as default};