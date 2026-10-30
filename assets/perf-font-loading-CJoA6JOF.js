var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>页面用了自定义字体，用户打开时字体文件还没下完，文字要么暂时看不见，要么先用系统字体显示、等字体到了再换。字体加载优化要解决的就是这段时间里的三个问题：文字看不见太久、字体文件太大、换字体时页面跳动。</p>
<p><code>font-display</code> 管第一件事，它决定字体没到时文字是先隐藏还是先用回退字体显示，以及字体晚到了还换不换。正文常用 <code>swap</code> 或 <code>optional</code>，不让用户长时间对着空白。</p>
<p>文件大小靠子集化和 <code>unicode-range</code>。子集化是用工具把用不到的字形删掉再生成 WOFF2；<code>unicode-range</code> 把一套字体拆成几个文件并标明各自覆盖的字符，页面用不到某个范围的字符，那个文件就不下载。首屏一定要用的字体再用 <code>&lt;link rel=&quot;preload&quot; as=&quot;font&quot;&gt;</code> 提前下载，这里必须写 <code>crossorigin</code>，否则预加载的文件用不上，字体会再下一遍。</p>
<p>最后要注意页面跳动。回退字体和网页字体宽度不同，换字体时文字会重新排版，造成布局偏移，影响 CLS。可以用 <code>size-adjust</code> 等描述符把回退字体调到接近网页字体的尺寸，具体比例要按两种字体的实际度量来算。</p>
</blockquote>
<h2>字体没到时文字怎么显示</h2>
<p>浏览器从开始用某个网页字体起，把等待过程分成三段。阻塞期里，字体还没到，文字用一个不可见的回退字体占位，也就是用户看不到字；交换期里，先用回退字体显示，字体在这段时间到了就换上；进入失败期以后，字体再到也不换了。<code>font-display</code> 就是调这三段的长短：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&#x27;/fonts/brand-latin.woff2&#x27;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&#x27;woff2&#x27;</span>);
  <span class="hljs-attribute">font-display</span>: swap;
}
</code></pre></div>
<p>按 MDN 的说法，<code>block</code> 是短阻塞期加无限交换期；<code>swap</code> 是极短阻塞期加无限交换期；<code>fallback</code> 是极短阻塞期加短交换期；<code>optional</code> 是极短阻塞期，没有交换期。CSS Fonts 规范建议，“短”在大多数情况下取 3 秒，“极短”取 100 毫秒以内。</p>
<p>那正文该选哪个？如果品牌字体一定要出现，并且能接受换一次字，用 <code>swap</code>。如果更在意页面稳定，用 <code>optional</code>，第一次访问字体没及时到就一直用回退字体，等有缓存以后再用品牌字体。各个值的细节可以看<a href="/questions/css-font-loading/">《font-display 怎样影响字体加载期间的文字显示？》</a>。</p>
<h2>怎样让字体文件变小</h2>
<p>格式先统一成 WOFF2。MDN 的网页字体教程写道，所有现代浏览器都支持 WOFF2，只提供需要的格式，既能减少要提供的文件数，也有助于让字体下载更小。</p>
<p>然后是子集化，也就是只保留页面真正用到的字形。中文字体动辄几千上万个字，最省的做法是只给标题等固定文字生成子集。fontTools 的 <code>subset</code> 命令可以按文字或码点范围生成子集，并直接输出 WOFF2：</p>
<div class="not-prose code-block"><div class="code-language">bash</div><pre><code class="hljs language-bash">fonttools subset brand.ttf --text-file=title-chars.txt --flavor=woff2 --output-file=brand-title.woff2
</code></pre></div>
<p>正文的文字不固定，没法只取几个字，这时可以按 Unicode 范围把字体拆成多个文件，再用 <code>unicode-range</code> 告诉浏览器每个文件覆盖哪些字符：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&#x27;/fonts/brand-latin.woff2&#x27;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&#x27;woff2&#x27;</span>);
  <span class="hljs-attribute">unicode-range</span>: <span class="hljs-number">U+0000-00FF</span>;
  <span class="hljs-attribute">font-display</span>: swap;
}

<span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">url</span>(<span class="hljs-string">&#x27;/fonts/brand-cjk-1.woff2&#x27;</span>) <span class="hljs-built_in">format</span>(<span class="hljs-string">&#x27;woff2&#x27;</span>);
  <span class="hljs-attribute">unicode-range</span>: <span class="hljs-number">U+4E00-5FFF</span>;
  <span class="hljs-attribute">font-display</span>: swap;
}
</code></pre></div>
<p>两段声明用同一个 <code>font-family</code>，看起来像同一套字体，浏览器会按页面上出现的字符决定下载哪个文件。MDN 写得很明确：页面上一个范围里的字符都没用到，这个文件就不下载；只要用到一个，就下载整个文件。所以 <code>unicode-range</code> 本身不会把文件变小，它只是让你可以把字体拆细，拆得越细，每个页面要下的就越少。</p>
<h2>preload 字体为什么必须写 crossorigin</h2>
<p>字体写在 CSS 的 <code>@font-face</code> 里，浏览器要先拿到 CSS，再发现页面用到了它，才会去下载，发现得比较晚。MDN 在介绍 preload 时也说，资源被发现得越晚、体积越大，预加载的好处越明显。首屏关键字体可以在 HTML 里提前声明：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;preload&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/fonts/brand-latin.woff2&quot;</span> <span class="hljs-attr">as</span>=<span class="hljs-string">&quot;font&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;font/woff2&quot;</span> <span class="hljs-attr">crossorigin</span> /&gt;</span>
</code></pre></div>
<p><code>as=&quot;font&quot;</code> 告诉浏览器这是字体，<code>type</code> 让不支持 WOFF2 的浏览器跳过这次下载。读者通常会问：字体就放在自己的域名下，为什么还要写 <code>crossorigin</code>？MDN 的解释是，字体总是以匿名模式的 CORS 请求获取的，预加载的 <code>crossorigin</code> 要和真正请求的 CORS 模式一致，哪怕请求并不跨域。不写 <code>crossorigin</code>，预加载的请求模式就和 <code>@font-face</code> 发出的请求对不上，预加载的那份用不上。</p>
<p>preload 只用于首屏马上要用的那一两个字体文件。它和 prefetch、preconnect 的区别，可以看<a href="/questions/perf-preload-prefetch/">《preload、prefetch、preconnect、dns-prefetch 和 modulepreload 有什么区别？》</a>。</p>
<h2>换字体时页面为什么会跳</h2>
<p>用 <code>swap</code> 时，用户先看到的是回退字体。两种字体的字宽、行高往往不一样，品牌字体一到，每行能放的字数变了，段落高度跟着变，下面的内容就被往下推。这种不是由用户操作引起的位移，就是 CLS 衡量的布局偏移，指标含义见<a href="/questions/engineering-vitals/">《LCP、INP、CLS 分别衡量什么？》</a>。</p>
<p>改法是不直接用系统字体当回退，而是声明一个“调整过尺寸的系统字体”：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@font-face</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand Fallback&#x27;</span>;
  <span class="hljs-attribute">src</span>: <span class="hljs-built_in">local</span>(<span class="hljs-string">&#x27;Arial&#x27;</span>);
  size-adjust: <span class="hljs-number">104%</span>;
  ascent-override: <span class="hljs-number">92%</span>;
}

<span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;Brand&#x27;</span>, <span class="hljs-string">&#x27;Brand Fallback&#x27;</span>, sans-serif;
}
</code></pre></div>
<p><code>size-adjust</code> 是一个缩放倍数，按 MDN 的说明，这个字体的字形轮廓和各项度量都会按这个比例缩放，MDN 也专门举了用它调整回退字体、让它更接近主字体的例子。<code>ascent-override</code> 调的是基线以上的高度。这里的 104% 和 92% 只用来演示，实际数值要根据两种字体的度量计算，不能照抄。调好以后，回退字体排出来的行宽和行高接近品牌字体，换字体时文字基本不会重新折行。</p>
<h2>常见追问</h2>
<p><strong>用 JavaScript 能知道字体什么时候加载好吗？</strong></p>
<blockquote>
<p>能。<code>document.fonts.ready</code> 返回一个 Promise，按 MDN 的说明，它要等文档的字体加载完、布局操作完成、也不再需要加载其他字体时才会完成。比如在 Canvas 上画文字或者要测量文字宽度时，等它完成再做，量出来的才是网页字体的尺寸。</p>
</blockquote>
<p><strong>local() 有什么用？</strong></p>
<blockquote>
<p><code>src</code> 里可以先写 <code>local()</code>，用户电脑上装了这个字体就直接用本地的，找不到才去下载 <code>url()</code> 里的文件。MDN 提醒浏览器按声明顺序尝试，所以 <code>local()</code> 通常写在 <code>url()</code> 前面。上面调整回退字体的例子，也是用 <code>local()</code> 引用系统自带的 Arial。</p>
</blockquote>`};export{e as default};