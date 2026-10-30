var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>在 CSS 里写了一段 <code>@font-face</code>，浏览器并不会立刻下载这个字体。MDN 的说法是，下载时机由浏览器决定，多数浏览器等到第一次真正需要这个字体时才去取。所以字体常常发现得晚，文字会先空白或先用回退字体。</p>
<p>CSS Font Loading API 让 JavaScript 能自己控制这件事。<code>new FontFace(名称, 来源, 描述符)</code> 创建一个字体，参数写法和 <code>@font-face</code> 一样；调用 <code>load()</code> 立刻开始下载，返回一个 Promise；再用 <code>document.fonts.add()</code> 把它加进文档的字体集合，页面才能用它画字。</p>
<p>它最常用在“必须等字体好了才能做”的地方。比如在 Canvas 上画字，字体没好时画出来的是回退字体，画完也不会自动重画；又比如要测量文字宽度。这时等 <code>font.load()</code> 或者 <code>document.fonts.ready</code> 完成再画。</p>
<p>要注意 <code>document.fonts.check()</code>。它回答的是“用这个字体规格现在画字，会不会用到还没加载好的字体”，不是“这个字体能不能用”。传一个根本不存在的字体名，它也返回 <code>true</code>。</p>
</blockquote>
<h2>为什么写了 @font-face 字体还没下载</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&#x27;/fonts/brand.woff2&#x27;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&#x27;woff2&#x27;</span>);
}

<span class="hljs-selector-class">.title</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>, sans-serif;
}
</code></pre></div>
<p>这段 CSS 只是声明“有一个叫 Brand 的字体，文件在这里”。浏览器解析完 CSS、算好样式，发现页面上确实有元素要用 Brand 画字，才发请求。页面上没有 <code>.title</code> 元素，这个文件就一直不会下载。</p>
<p>这样设计是为了不浪费流量，一个样式表里可能声明了十几种字重，用不到的不该下载。可是代价是发现得晚：要先拿到 HTML，再拿到 CSS，再算样式，才轮到字体。加载期间文字怎么显示由 <code>font-display</code> 决定，提前下载可以用 <code>preload</code>，这些优化手段见<a href="/questions/perf-font-loading/">《网页字体加载怎样优化？font-display、子集化、preload 和 size-adjust 各解决什么问题？》</a>。</p>
<p><code>src</code> 里可以先写 <code>local()</code>。MDN 说明浏览器按声明的顺序尝试，用户本机装了这个字体就直接用，找不到才下载 <code>url()</code> 里的文件。</p>
<h2>用 JavaScript 加载一个字体</h2>
<p>下面加载一个字体，好了以后在 Canvas 上画字：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> font = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FontFace</span>(<span class="hljs-string">&#x27;Brand&#x27;</span>, <span class="hljs-string">&#x27;url(&quot;/fonts/brand.woff2&quot;)&#x27;</span>, { <span class="hljs-attr">weight</span>: <span class="hljs-string">&#x27;400&#x27;</span> });
<span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-title function_">add</span>(font);
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(font.<span class="hljs-property">status</span>); <span class="hljs-comment">// unloaded</span>

font.<span class="hljs-title function_">load</span>().<span class="hljs-title function_">then</span>(
  <span class="hljs-function">() =&gt;</span> {
    <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(font.<span class="hljs-property">status</span>); <span class="hljs-comment">// loaded</span>
    <span class="hljs-keyword">const</span> ctx = canvas.<span class="hljs-title function_">getContext</span>(<span class="hljs-string">&#x27;2d&#x27;</span>);
    ctx.<span class="hljs-property">font</span> = <span class="hljs-string">&#x27;36px Brand&#x27;</span>;
    ctx.<span class="hljs-title function_">fillText</span>(<span class="hljs-string">&#x27;字体已加载&#x27;</span>, <span class="hljs-number">20</span>, <span class="hljs-number">50</span>);
  },
  <span class="hljs-function">(<span class="hljs-params">error</span>) =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">error</span>(error),
);
</code></pre></div>
<p>第一次打印为什么是 <code>unloaded</code>？MDN 说明，来源是 URL 的 <code>FontFace</code> 只会校验定义，不会自动下载，状态是 <code>unloaded</code>。调用 <code>load()</code> 以后变成 <code>loading</code>，下载并解析成功变成 <code>loaded</code>，定义无效或文件取不到就是 <code>failed</code>。如果来源是一个 <code>ArrayBuffer</code>，数据已经在手上，就会自动加载。</p>
<p><code>document.fonts.add()</code> 这一步不能省。MDN 写明，字体可以在加入集合之前或之后加载，但必须加入集合才能用来画字。加入以后，浏览器在页面需要时也会自己去加载它。</p>
<p>为什么 Canvas 要等？DOM 里的文字，字体到了浏览器会自动用新字体重新排版；Canvas 画的是像素，画完就定了，字体后来到了也不会重画。所以要在 Promise 完成以后再调用 <code>fillText</code>。</p>
<h2>document.fonts.ready 和 load() 有什么不同</h2>
<p><code>font.load()</code> 只关心这一个字体。<code>document.fonts</code> 是整个文档的字体集合，<code>@font-face</code> 声明的字体和用 <code>add()</code> 加进来的字体都在里面，它提供了几个整体的入口：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-property">ready</span>.<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> {
  <span class="hljs-comment">// 文档里的字体都加载完、布局也完成了</span>
});

<span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-title function_">load</span>(<span class="hljs-string">&#x27;36px Brand&#x27;</span>).<span class="hljs-title function_">then</span>(<span class="hljs-function">(<span class="hljs-params">faces</span>) =&gt;</span> {
  <span class="hljs-comment">// faces 是匹配到并加载完成的 FontFace 数组</span>
});

<span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;loadingdone&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(event.<span class="hljs-property">fontfaces</span>.<span class="hljs-property">length</span>);
});
</code></pre></div>
<p><code>ready</code> 返回一个 Promise，MDN 说明它要等文档里的字体都加载完、布局也完成以后才完成，适合“等所有字体就绪再测量”。<code>document.fonts.load()</code> 接收一个和 CSS <code>font</code> 属性一样的字体规格，加载能匹配上的字体，结果是一个 <code>FontFace</code> 数组。集合上还会派发 <code>loading</code>、<code>loadingdone</code>、<code>loadingerror</code> 事件，事件对象的 <code>fontfaces</code> 是这一批相关的字体。</p>
<h2>为什么不能用 check() 判断字体是否可用</h2>
<p>很多人会写 <code>if (document.fonts.check(&#x27;16px Brand&#x27;))</code> 来判断字体是否加载好。可是 MDN 专门提醒，<code>check()</code> 的含义是“用这个规格画字，会不会用到集合里还没加载完的字体”。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-title function_">check</span>(<span class="hljs-string">&#x27;12px Courier&#x27;</span>);     <span class="hljs-comment">// true：匹配到的是系统字体</span>
<span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-title function_">check</span>(<span class="hljs-string">&#x27;12px i-dont-exist&#x27;</span>); <span class="hljs-comment">// true：集合里没有这个字体，也就不用等</span>
<span class="hljs-variable language_">document</span>.<span class="hljs-property">fonts</span>.<span class="hljs-title function_">check</span>(<span class="hljs-string">&#x27;12px molot, Courier&#x27;</span>); <span class="hljs-comment">// false：molot 在集合里，但还没加载</span>
</code></pre></div>
<p>第二行最容易误解。字体名写错了，<code>check()</code> 反而返回 <code>true</code>，因为集合里没有任何一个字体需要等待。所以要确认某个字体真的可用，应该看那个 <code>FontFace</code> 对象的 <code>status</code>，或者 <code>await font.load()</code>。</p>
<h2>常见追问</h2>
<p><strong>FontFace 的描述符写了 italic，字体就会变成斜体吗？</strong></p>
<blockquote>
<p>不会。MDN 说明，和 <code>@font-face</code> 一样，<code>style</code>、<code>weight</code> 这类描述符有的只是告诉浏览器“这个文件里是斜体”，用于匹配。文件本身是不是斜体，要由你保证。</p>
</blockquote>
<p><strong>字体加载失败怎么办？</strong></p>
<blockquote>
<p><code>font.load()</code> 返回的 Promise 会被拒绝，<code>status</code> 变成 <code>failed</code>，集合上会触发 <code>loadingerror</code>。页面上的文字会继续用 <code>font-family</code> 里后面的回退字体，Canvas 绘制可以在失败分支里改用系统字体。</p>
</blockquote>`};export{e as default};