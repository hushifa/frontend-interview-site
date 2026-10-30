var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两个需求方向相反。预加载是“现在还用不到，先下载好”，比如轮播图的下一张、游戏开始前的素材；懒加载是“现在用不到，先别下载”，比如长列表里滚动到很下面才看得到的图片。</p>
<p>预加载用 <code>new Image()</code> 创建一个图片对象，给它设置 <code>src</code>，浏览器就会开始下载。它不需要插入页面。用 <code>onload</code> 和 <code>onerror</code> 把加载过程包成 Promise，再配合 <code>Promise.all</code>，就能等所有素材都准备好再开始。</p>
<p>懒加载先把真实地址写在 <code>data-src</code> 上，<code>src</code> 先不填。用 <code>IntersectionObserver</code> 监听这些图片，进入视口时把 <code>data-src</code> 赋给 <code>src</code>，然后调用 <code>unobserve</code> 不再监听。现在浏览器原生支持 <code>&lt;img loading=&quot;lazy&quot;&gt;</code>，没有特殊需求时优先用它。</p>
<p>要注意，首屏图片不能懒加载，否则请求会被推迟，最大内容绘制变慢；懒加载的图片要写好宽高，避免加载后撑开布局。</p>
</blockquote>
<h2>预加载：把 Image 包成 Promise</h2>
<p>下面的 <code>preloadImage</code> 把创建图片的方式作为参数传进来，浏览器里用默认的 <code>new Image()</code>。为了在 Node 里运行，示例传入一个用定时器模拟加载的假图片类，地址里带 <code>bad</code> 的模拟加载失败。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">preloadImage</span>(<span class="hljs-params">src, createImage = () =&gt; <span class="hljs-keyword">new</span> Image()</span>) {
  <span class="hljs-keyword">return</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function">(<span class="hljs-params">resolve, reject</span>) =&gt;</span> {
    <span class="hljs-keyword">const</span> image = <span class="hljs-title function_">createImage</span>();
    image.<span class="hljs-property">onload</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">resolve</span>(image);
    image.<span class="hljs-property">onerror</span> = <span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">reject</span>(<span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`图片加载失败：<span class="hljs-subst">\${src}</span>\`</span>));
    <span class="hljs-comment">// 先绑定事件再设置 src，加载完成时处理函数一定已经就位。</span>
    image.<span class="hljs-property">src</span> = src;
  });
}

<span class="hljs-keyword">class</span> <span class="hljs-title class_">FakeImage</span> {
  <span class="hljs-keyword">set</span> <span class="hljs-title function_">src</span>(<span class="hljs-params">value</span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">_src</span> = value;
    <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> (value.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;bad&#x27;</span>) ? <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">onerror</span>() : <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">onload</span>()), <span class="hljs-number">10</span>);
  }
  <span class="hljs-keyword">get</span> <span class="hljs-title function_">src</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.<span class="hljs-property">_src</span>;
  }
}
<span class="hljs-keyword">const</span> <span class="hljs-title function_">createFake</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-keyword">new</span> <span class="hljs-title class_">FakeImage</span>();

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">all</span>([<span class="hljs-string">&#x27;/a.png&#x27;</span>, <span class="hljs-string">&#x27;/b.png&#x27;</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">src</span>) =&gt;</span> <span class="hljs-title function_">preloadImage</span>(src, createFake))).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">images</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(images.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">image</span>) =&gt;</span> image.<span class="hljs-property">src</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// /a.png,/b.png</span>
});

<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">allSettled</span>([<span class="hljs-string">&#x27;/a.png&#x27;</span>, <span class="hljs-string">&#x27;/bad.png&#x27;</span>].<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">src</span>) =&gt;</span> <span class="hljs-title function_">preloadImage</span>(src, createFake))).<span class="hljs-title function_">then</span>(
  <span class="hljs-function">(<span class="hljs-params">results</span>) =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(results.<span class="hljs-title function_">map</span>(<span class="hljs-function">(<span class="hljs-params">result</span>) =&gt;</span> result.<span class="hljs-property">status</span>).<span class="hljs-title function_">join</span>(<span class="hljs-string">&#x27;,&#x27;</span>)); <span class="hljs-comment">// fulfilled,rejected</span>
  },
);
</code></pre></div>
<p>为什么第二组用 <code>Promise.allSettled</code>？<code>Promise.all</code> 只要有一张失败，整体就失败了。如果一张素材失败不影响开始，比如只是背景图，就用 <code>allSettled</code> 拿到每一张的结果，再决定要不要用占位图。几个方法的区别见<a href="/questions/js-promise-combinators/">《Promise.all、allSettled、race 和 any 如何选择？》</a>。</p>
<p>只想让浏览器提前下载某张图，也可以在 HTML 里写 <code>&lt;link rel=&quot;preload&quot; as=&quot;image&quot; href=&quot;...&quot;&gt;</code>，见<a href="/questions/network-dns-prefetch-preconnect/">《dns-prefetch、preconnect 和 preload 应该怎样选择？》</a>。</p>
<h2>懒加载：用 IntersectionObserver</h2>
<p><code>IntersectionObserver</code> 的作用是：告诉它要看哪些元素，元素和视口的相交情况变化时，它会调用回调。以前的做法是监听 <code>scroll</code> 事件，在回调里对每张图调用 <code>getBoundingClientRect</code> 算位置，这些计算都在主线程上反复执行；用 <code>IntersectionObserver</code> 就不用自己算了。下面是浏览器里的写法：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">lazyLoadImages</span>(<span class="hljs-params">selector = <span class="hljs-string">&#x27;img[data-src]&#x27;</span></span>) {
  <span class="hljs-keyword">const</span> images = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelectorAll</span>(selector);
  <span class="hljs-keyword">const</span> observer = <span class="hljs-keyword">new</span> <span class="hljs-title class_">IntersectionObserver</span>(
    <span class="hljs-function">(<span class="hljs-params">entries</span>) =&gt;</span> {
      <span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> entry <span class="hljs-keyword">of</span> entries) {
        <span class="hljs-keyword">if</span> (!entry.<span class="hljs-property">isIntersecting</span>) <span class="hljs-keyword">continue</span>;
        <span class="hljs-keyword">const</span> image = entry.<span class="hljs-property">target</span>;
        image.<span class="hljs-property">src</span> = image.<span class="hljs-property">dataset</span>.<span class="hljs-property">src</span>;
        image.<span class="hljs-title function_">removeAttribute</span>(<span class="hljs-string">&#x27;data-src&#x27;</span>);
        <span class="hljs-comment">// 已经开始加载的图片不再需要监听。</span>
        observer.<span class="hljs-title function_">unobserve</span>(image);
      }
    },
    <span class="hljs-comment">// 提前 200px 开始加载，用户滚到时图片多半已经准备好。</span>
    { <span class="hljs-attr">rootMargin</span>: <span class="hljs-string">&#x27;200px 0px&#x27;</span> },
  );
  images.<span class="hljs-title function_">forEach</span>(<span class="hljs-function">(<span class="hljs-params">image</span>) =&gt;</span> observer.<span class="hljs-title function_">observe</span>(image));
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> observer.<span class="hljs-title function_">disconnect</span>();
}
</code></pre></div>
<p>对应的 HTML 是 <code>&lt;img data-src=&quot;/photo.jpg&quot; width=&quot;400&quot; height=&quot;300&quot; alt=&quot;...&quot;&gt;</code>。<code>entry.isIntersecting</code> 为 <code>true</code> 表示元素进入了观察区域，<code>rootMargin</code> 把观察区域往外扩了 200 像素，所以图片在离视口还有一段距离时就开始加载。返回的函数调用 <code>disconnect</code>，页面切走时可以停止所有监听。</p>
<h2>原生 loading=&quot;lazy&quot; 能代替手写吗</h2>
<p>大多数情况下可以。<code>&lt;img loading=&quot;lazy&quot;&gt;</code> 的含义是，推迟加载，直到图片离视口达到浏览器计算出的距离。浏览器自己决定提前多少开始加载，不需要写 JavaScript。MDN 还提到，禁用 JavaScript 时浏览器不会推迟加载，这是为了防止网站用图片请求追踪用户的滚动位置。</p>
<p>需要自己控制时才手写，比如要精确设置提前量、加载完要加淡入效果，或者懒加载的不是 <code>&lt;img&gt;</code> 而是背景图。</p>
<p>不管哪种方式，MDN 都建议给懒加载的图片写明宽高。没加载的图片宽高是 0，加载以后突然撑开，正在看的内容会被挤下去。首屏图片为什么不能懒加载，见<a href="/questions/perf-lazy-images/">《懒加载为什么有时反而让首屏和首次交互变慢？》</a>。</p>
<h2>常见追问</h2>
<p><strong>预加载的图片没有插入页面，下载了有用吗？</strong></p>
<blockquote>
<p>有用。浏览器把下载好的图片放进缓存，之后页面上用到同一个地址，就会直接从缓存里拿，不用重新下载。前提是响应头允许缓存。</p>
</blockquote>
<p><strong>图片下载好了，插入页面时还会卡一下吗？</strong></p>
<blockquote>
<p>大图可能会，因为图片还要解码。可以在插入前调用 <code>image.decode()</code>，它返回一个 Promise，图片解码完成、可以安全插入页面时才完成。</p>
</blockquote>`};export{e as default};