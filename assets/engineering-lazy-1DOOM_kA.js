var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>代码分割是把打包产物拆成多个文件，懒加载是让其中一部分等到真正需要时才下载执行。两者通常一起用。</p>
<p>适合拆出去的是首屏用不到的内容，比如其他路由、弹窗、富文本编辑器、图表、管理后台。写法是用 <code>import()</code>，它返回一个 Promise，同一个模块只加载一次，之后再调用拿到的是同一个模块。</p>
<p>拆出去以后，要处理加载中的状态和失败重试，还可以提前预加载，减少用户等待。</p>
<p>有一个坑要注意：发布新版本后，停留在旧页面的用户可能去请求已经删掉的旧文件。所以部署时要保留旧资源，或者加载失败时提示刷新。</p>
</blockquote>
<h2>动态导入怎么写</h2>
<p>下面的例子在用户点按钮时才加载编辑器，并处理了加载中和失败的情况。</p>
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
<p>构建工具看到 <code>import(&#x27;./editor.js&#x27;)</code>，会把 editor 和只有它用到的依赖拆成一个单独的 chunk。前提是路径能被静态分析，完全用变量拼出来的路径，构建工具不知道该拆哪个文件。</p>
<p>模块加载成功以后会被缓存，所以再点一次按钮不会重新下载。</p>
<p>可是加载失败的 Promise 不会自动重试。React 的 <code>lazy</code> 这类封装通常也会把失败的结果缓存下来，所以要么自己写重试逻辑，要么让用户刷新页面。</p>
<p>另外，<code>import()</code> 本身没法取消。如果组件在加载完成前就卸载了，要在回调里先判断组件是否还在，再决定用不用这个结果。</p>
<h2>什么时候不该拆</h2>
<p>首屏必须立刻渲染的组件不该拆。拆出去只会多一次请求，反而推迟 LCP。</p>
<p>很小的模块也不该拆，额外一次请求的开销比省下的字节还大。</p>
<p>几乎每个页面都用到的共享代码，应该留在公共块里。</p>
<h2>怎样用预加载减少等待</h2>
<p>懒加载的代价是用户要等下载。所以可以在用户意图明显时提前加载，比如鼠标悬停或聚焦到链接上就调用 <code>import()</code>。浏览器空闲时，也可以预加载下一步可能用到的路由。</p>
<p>Vite 会为动态导入的 chunk 自动生成依赖预加载。这样不用等入口下载完，再一个个串行请求它的依赖。</p>
<h2>发布后为什么会出现旧 chunk 404</h2>
<p>chunk 的文件名带哈希，每次构建后可能都会变。用户一直停在旧页面，点某个功能时，浏览器请求的还是旧文件名。如果部署时把旧文件删了，加载就会失败。</p>
<p>常见的改法有两种。一是部署时把上一两个版本的静态资源保留一段时间。二是捕获 chunk 加载失败，Vite 会派发 <code>vite:preloadError</code> 事件，然后提示用户刷新，或者自动重新加载一次。</p>
<h2>常见追问</h2>
<p><strong>路由级懒加载和组件级懒加载怎么选？</strong></p>
<blockquote>
<p>路由是最自然的边界，先做路由级。页面里体积大、又不一定会用到的组件，再单独拆。</p>
</blockquote>
<p><strong>懒加载会影响 SEO 吗？</strong></p>
<blockquote>
<p>首屏的核心内容不应该懒加载。预渲染或 SSR 的页面，要确保关键内容就在 HTML 里。</p>
</blockquote>`};export{e as default};