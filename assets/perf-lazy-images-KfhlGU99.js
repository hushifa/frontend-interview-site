var e={answerHtml:`<h2>简答</h2>
<ul>
<li>懒加载没有减少总工作量，只是把它挪到后面；挪给&quot;用户马上要用的东西&quot;就会变慢。</li>
<li>首屏图片（尤其是 LCP 元素）不要加 <code>loading=&quot;lazy&quot;</code>，浏览器要等布局确定它在视口内才开始请求。</li>
<li>所有图片都写 <code>width</code>、<code>height</code>（或 <code>aspect-ratio</code>），懒加载的图片到达时才不会撑开布局造成 CLS。</li>
<li>点击后才开始的&quot;下载组件 → 请求数据 → 加载依赖&quot;是串行的，可以在用户表现出意图时（悬停、聚焦、即将进入视口）提前并行预取。</li>
<li>动态导入可能失败，特别是发布新版本后旧的分块被删除，要有错误提示和重试。</li>
</ul>
<h2>图片</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 首屏主图：立即加载并提高优先级 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">img</span> <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/hero.avif&quot;</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1200&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;600&quot;</span> <span class="hljs-attr">fetchpriority</span>=<span class="hljs-string">&quot;high&quot;</span> <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;产品主图&quot;</span> /&gt;</span>

<span class="hljs-comment">&lt;!-- 首屏以下：懒加载，预留尺寸 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">img</span>
  <span class="hljs-attr">src</span>=<span class="hljs-string">&quot;/card-640.avif&quot;</span>
  <span class="hljs-attr">srcset</span>=<span class="hljs-string">&quot;/card-640.avif 640w, /card-1280.avif 1280w&quot;</span>
  <span class="hljs-attr">sizes</span>=<span class="hljs-string">&quot;(max-width: 700px) 100vw, 640px&quot;</span>
  <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;1280&quot;</span>
  <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;720&quot;</span>
  <span class="hljs-attr">loading</span>=<span class="hljs-string">&quot;lazy&quot;</span>
  <span class="hljs-attr">alt</span>=<span class="hljs-string">&quot;组件布局示例&quot;</span>
/&gt;</span>
</code></pre></div>
<p>原生懒加载会在图片接近视口前提前开始加载，具体距离由浏览器决定。<code>iframe</code> 也支持 <code>loading=&quot;lazy&quot;</code>，适合页面下方的视频和地图嵌入。</p>
<h2>代码</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> button = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#open-editor&#x27;</span>);
<span class="hljs-keyword">let</span> editorModule;

<span class="hljs-comment">// 用户表现出意图时开始下载，不必等到点击</span>
<span class="hljs-keyword">const</span> <span class="hljs-title function_">preload</span> = (<span class="hljs-params"></span>) =&gt; (editorModule ??= <span class="hljs-keyword">import</span>(<span class="hljs-string">&#x27;./editor.js&#x27;</span>));
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;pointerenter&#x27;</span>, preload, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });
button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;focus&#x27;</span>, preload, { <span class="hljs-attr">once</span>: <span class="hljs-literal">true</span> });

button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-title function_">async</span> () =&gt; {
  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> { openEditor } = <span class="hljs-keyword">await</span> <span class="hljs-title function_">preload</span>();
    <span class="hljs-title function_">openEditor</span>();
  } <span class="hljs-keyword">catch</span> {
    editorModule = <span class="hljs-literal">undefined</span>;
    <span class="hljs-title function_">showError</span>(<span class="hljs-string">&#x27;加载失败，请刷新页面后重试&#x27;</span>);
  }
});
</code></pre></div>
<p>触屏设备没有悬停，预取只能是加速手段，不能作为功能可用的前提。</p>
<h2>什么该懒加载</h2>
<table><thead><tr><th>适合</th><th>不适合</th></tr></thead><tbody><tr><td>首屏以下的图片、视频、地图</td><td>首屏主图、Logo</td></tr><tr><td>低频的弹窗、编辑器、图表库</td><td>几乎每个用户都会打开的模块</td></tr><tr><td>只在特定路由使用的代码</td><td>很小的高频组件，拆分后请求开销大于收益</td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>怎么判断懒加载是否有收益？对比冷缓存首屏的 LCP，以及首次使用该功能时的等待时间，只看分块数量变多没有意义。</li>
<li>发布新版本后旧分块 404 怎么办？保留旧版本的静态资源一段时间，加载失败时提示刷新。</li>
</ul>`};export{e as default};