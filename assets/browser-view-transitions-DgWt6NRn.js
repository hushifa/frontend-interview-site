var e={answerHtml:`<h2>先从一个常见的页面问题开始</h2>
<p>假设页面左侧是商品列表，右侧是商品详情。用户点击某个商品后，应用需要请求详情数据、替换右侧内容、修改地址栏，再把焦点放到详情标题上。如果直接执行 <code>innerHTML</code> 或更新框架状态，旧内容会突然消失，新内容突然出现，列表中的图片也无法和详情页里的图片建立视觉联系。</p>
<p>过去通常会自己写淡入淡出、记录旧节点、处理动画结束和快速点击。这样做容易遇到几个问题：动画期间用户又点击了其他商品；旧请求比新请求晚返回；组件已经卸载但回调还在修改 DOM；用户开启了减少动画后仍然被强制播放动画。</p>
<p>View Transitions API 解决的是“DOM 更新前后的视觉衔接”。它会在更新前捕获旧页面快照，执行更新后再捕获新页面快照，然后让浏览器对这些快照做动画。它不会替你请求数据，也不会替你决定哪个路由应该显示。</p>
<h2>最小的可运行流程</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">showProduct</span>(<span class="hljs-params">productId</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/products/<span class="hljs-subst">\${<span class="hljs-built_in">encodeURIComponent</span>(productId)}</span>\`</span>);
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`请求失败：<span class="hljs-subst">\${response.status}</span>\`</span>);
  <span class="hljs-keyword">const</span> product = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();

  <span class="hljs-keyword">const</span> <span class="hljs-title function_">updateDom</span> = (<span class="hljs-params"></span>) =&gt; {
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#product-name&#x27;</span>).<span class="hljs-property">textContent</span> = product.<span class="hljs-property">name</span>;
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#product-description&#x27;</span>).<span class="hljs-property">textContent</span> = product.<span class="hljs-property">description</span>;
    <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#product-image&#x27;</span>).<span class="hljs-property">src</span> = product.<span class="hljs-property">image</span>;
    <span class="hljs-variable language_">document</span>.<span class="hljs-property">title</span> = <span class="hljs-string">\`<span class="hljs-subst">\${product.name}</span> | 商品详情\`</span>;
  };

  <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">document</span>.<span class="hljs-property">startViewTransition</span>) {
    <span class="hljs-title function_">updateDom</span>();
    <span class="hljs-keyword">return</span>;
  }

  <span class="hljs-keyword">const</span> transition = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">startViewTransition</span>(updateDom);
  <span class="hljs-keyword">await</span> transition.<span class="hljs-property">finished</span>;
  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#product-name&#x27;</span>)?.<span class="hljs-title function_">focus</span>();
}
</code></pre></div>
<p>这里有一个重要的顺序：先完成数据请求，再把已经准备好的数据提交给过渡回调。这样旧页面不会因为网络慢而长时间停在“正在切换”的状态。对于需要立即反馈的界面，也可以先显示加载状态，再对加载状态到真实内容做一次短过渡。</p>
<p><code>startViewTransition</code> 的回调只应该负责提交页面状态。不要在里面启动无法取消的长时间计算，也不要把用户确认框放进去。回调返回 Promise 时，浏览器会等待异步更新完成，但等待时间过长会让过渡体验变差。</p>
<h2>快速点击时如何避免旧内容覆盖新内容</h2>
<p>页面切换最容易出错的情况是：用户先点击商品 A，又马上点击商品 B。A 的请求可能后返回，如果没有保护，它会把页面覆盖成 A，但地址栏已经是 B。可以使用 AbortController 和请求编号：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">let</span> currentRequest;
<span class="hljs-keyword">let</span> requestId = <span class="hljs-number">0</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">openProduct</span>(<span class="hljs-params">productId</span>) {
  currentRequest?.<span class="hljs-title function_">abort</span>();
  <span class="hljs-keyword">const</span> controller = <span class="hljs-keyword">new</span> <span class="hljs-title class_">AbortController</span>();
  currentRequest = controller;
  <span class="hljs-keyword">const</span> id = ++requestId;

  <span class="hljs-keyword">try</span> {
    <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">\`/api/products/<span class="hljs-subst">\${productId}</span>\`</span>, {
      <span class="hljs-attr">signal</span>: controller.<span class="hljs-property">signal</span>,
    });
    <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;商品加载失败&#x27;</span>);
    <span class="hljs-keyword">const</span> product = <span class="hljs-keyword">await</span> response.<span class="hljs-title function_">json</span>();

    <span class="hljs-keyword">if</span> (id !== requestId) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">const</span> <span class="hljs-title function_">update</span> = (<span class="hljs-params"></span>) =&gt; <span class="hljs-title function_">renderProduct</span>(product);
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">document</span>.<span class="hljs-property">startViewTransition</span>) {
      <span class="hljs-keyword">await</span> <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">startViewTransition</span>(update).<span class="hljs-property">finished</span>;
    } <span class="hljs-keyword">else</span> {
      <span class="hljs-title function_">update</span>();
    }
  } <span class="hljs-keyword">catch</span> (error) {
    <span class="hljs-keyword">if</span> (error.<span class="hljs-property">name</span> === <span class="hljs-string">&#x27;AbortError&#x27;</span>) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">if</span> (id === requestId) <span class="hljs-title function_">showProductError</span>(error);
  }
}
</code></pre></div>
<p>取消请求和请求编号分别解决不同问题。AbortController 能节省网络和解析工作，但第三方库或已经开始的同步计算不一定真正响应取消；请求编号则保证过期结果即使返回，也不能提交到当前页面。</p>
<h2>共享元素动画为什么需要唯一名称</h2>
<p>默认情况下，浏览器可能对整个页面做淡入淡出。如果希望列表里的商品图片移动到详情页，可以给旧页面和新页面中代表同一个商品的元素设置相同的 <code>view-transition-name</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.product-image</span> {
  <span class="hljs-attribute">view-transition-name</span>: product-image;
}

::<span class="hljs-built_in">view-transition-old</span>(product-image),
::<span class="hljs-built_in">view-transition-new</span>(product-image) {
  <span class="hljs-attribute">animation-duration</span>: <span class="hljs-number">240ms</span>;
  <span class="hljs-attribute">object-fit</span>: cover;
  <span class="hljs-attribute">border-radius</span>: <span class="hljs-number">12px</span>;
}
</code></pre></div>
<p>名称必须唯一。不能给列表中所有卡片都设置同一个名字，否则浏览器无法判断哪张图片对应详情页。列表通常只给当前点击的卡片临时设置名称，并在过渡结束后清理。若旧元素或新元素不存在，浏览器会回退到根过渡，应用不应依赖动画一定成功来完成业务逻辑。</p>
<h2>过渡完成后还要处理焦点和滚动</h2>
<p>动画不会自动完成无障碍处理。详情页更新后，键盘用户仍应知道焦点在哪里；标题可以使用 <code>tabindex=&quot;-1&quot;</code>，更新后调用 <code>focus()</code>。新页面通常滚到顶部，返回列表时则可能要恢复之前的滚动位置，这些都属于路由层逻辑。</p>
<p>如果用户设置了 <code>prefers-reduced-motion: reduce</code>，应关闭或缩短动画：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  ::<span class="hljs-built_in">view-transition-group</span>(*) {
    <span class="hljs-attribute">animation-duration</span>: <span class="hljs-number">1ms</span>;
  }
}
</code></pre></div>
<p>还要防止动画期间重复提交、重复发起导航和重复写入表单。可以禁用正在提交的按钮，但不要把整个页面设置成不可聚焦，否则会损害键盘和读屏器使用体验。</p>
<h2>哪些场景不适合使用</h2>
<p>View Transitions 不能修复数据请求慢、图片没有尺寸导致的布局跳动，也不能替代骨架屏和缓存。如果页面内容变化很小，简单的 CSS 过渡可能更容易维护。大图、视频和很长的页面参与截图时，还可能增加内存和合成开销。</p>
<p>它也不是路由库。React、Vue 或其他框架仍然负责组件树、状态和生命周期，路由库负责地址和导航。View Transitions 只作为渲染更新外层的增强能力。浏览器不支持时，应直接完成同样的 DOM 更新，不能让核心功能依赖动画接口。</p>
<p>在正式项目中，应测试快速连续点击、后退前进、数据请求失败、页面卸载、减少动画设置、低端设备和不支持该 API 的浏览器。确认这些情况都能正常工作后，再为关键页面增加共享元素动画。</p>`};export{e as default};