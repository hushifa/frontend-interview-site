var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>懒加载就是先不加载，等用到的时候再加载。它没有减少总的工作量，只是把工作挪到了后面。挪给用户暂时用不到的东西是赚的，挪给用户马上要用的东西就会变慢。</p>
<p>最典型的是首屏图片。首屏大图如果加了 <code>loading=&quot;lazy&quot;</code>，浏览器要等布局算出来、确认它在视口里才开始请求，LCP 就被推迟了。所以首屏图片不要懒加载，所有图片都写上宽高，懒加载的图片到了才不会把布局撑开。</p>
<p>代码懒加载也一样。如果点击以后才开始下载组件，组件跑起来再请求数据，数据回来再加载依赖，这几步是串行的，用户就要等好几轮。可以在用户表现出意图时，比如鼠标悬停、获得焦点，就提前开始下载。</p>
<p>还要注意，动态导入可能失败，特别是发布新版本后旧的分块被删掉了，所以要有错误提示和重试。</p>
</blockquote>
<h2>首屏图片为什么不能懒加载</h2>
<p>浏览器解析 HTML 时，看到普通的 <code>&lt;img&gt;</code> 就会尽早发请求。可是加了 <code>loading=&quot;lazy&quot;</code> 的图片，浏览器要先知道它会不会出现在视口里，这得等布局算出来以后才知道。所以首屏主图懒加载，请求反而比不加更晚。</p>
<p>下面是推荐的写法：首屏主图立即加载并提高优先级，首屏以下的图片懒加载，两种都写宽高。</p>
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
<p>为什么懒加载的图片也要写 <code>width</code> 和 <code>height</code>？因为图片还没下载时，浏览器不知道它多大，没法提前留出位置。等图片到了再撑开，下面的内容就会被推下去，这就是布局偏移，会计入 CLS。写了宽高或者 <code>aspect-ratio</code>，位置就提前留好了。</p>
<p>原生懒加载不会等图片真的进入视口才加载，而是接近视口时就提前开始，具体提前多少由浏览器决定。<code>iframe</code> 也支持 <code>loading=&quot;lazy&quot;</code>，适合页面下方的视频和地图嵌入。</p>
<h2>代码懒加载怎么避免多等一轮</h2>
<p>下面这个编辑器按钮，等用户点击才下载编辑器代码。为了不让用户干等，在鼠标移上去或者按钮获得焦点时就开始下载：</p>
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
<p><code>??=</code> 保证 <code>import()</code> 只发起一次，悬停时开始的下载，点击时直接复用同一个 Promise。从悬停到点击通常有几百毫秒，这段时间正好用来下载。</p>
<p>失败时为什么要把 <code>editorModule</code> 设回 <code>undefined</code>？因为失败的 Promise 会被一直缓存，不清掉的话下次点击还是拿到同一个失败结果，永远没法重试。</p>
<p>还有一点，触屏设备没有悬停，所以预取只能是加速手段，不能当成功能能用的前提。点击时没有提前下载好，也必须能正常加载。</p>
<h2>什么该懒加载，什么不该</h2>
<p>判断标准是：这个东西是不是大多数用户一进来就要用。</p>
<table><thead><tr><th>适合</th><th>不适合</th></tr></thead><tbody><tr><td>首屏以下的图片、视频、地图</td><td>首屏主图、Logo</td></tr><tr><td>低频的弹窗、编辑器、图表库</td><td>几乎每个用户都会打开的模块</td></tr><tr><td>只在特定路由使用的代码</td><td>很小的高频组件，拆分后请求开销大于收益</td></tr></tbody></table>
<h2>常见追问</h2>
<p><strong>怎么判断懒加载到底有没有收益？</strong></p>
<blockquote>
<p>对比两件事：冷缓存下首屏的 LCP，以及第一次使用这个功能时要等多久。只看拆出来的分块变多了，没有意义。</p>
</blockquote>
<p><strong>发布新版本后旧分块 404 了怎么办？</strong></p>
<blockquote>
<p>用户手里的旧页面还在引用旧的分块文件名，新版本部署后这些文件被删了，动态导入就会失败。可以把旧版本的静态资源保留一段时间，加载失败时提示用户刷新页面。</p>
</blockquote>`};export{e as default};