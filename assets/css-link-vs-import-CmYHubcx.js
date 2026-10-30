var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>引入外部 CSS 有两种写法：在 HTML 的 <code>&lt;head&gt;</code> 里写 <code>&lt;link rel=&quot;stylesheet&quot; href=&quot;a.css&quot;&gt;</code>，或者在 CSS 文件开头写 <code>@import &quot;a.css&quot;;</code>。两者最终都让样式生效，区别在于浏览器什么时候知道要下载它。</p>
<p><code>link</code> 写在 HTML 里，浏览器解析 HTML 时就发现了，可以和页面里其他资源一起尽早下载。<code>@import</code> 藏在 CSS 文件里，要等外层的 CSS 下载并解析后才发现，再去下载，这就形成了串行的请求链。Chrome 团队的性能建议明确说不要在 CSS 里用 <code>@import</code>，因为它会推迟 CSSOM 的构建，而 <code>&lt;head&gt;</code> 里的样式表本身就会阻塞渲染。</p>
<p><code>link</code> 是 DOM 元素，可以用 JavaScript 创建、删除，或者切换 <code>disabled</code> 属性来启用、停用一份样式表，比如做主题切换；还能用 <code>media</code> 属性让打印样式之类的不阻塞渲染。<code>@import</code> 是 CSS 规则，只能通过 CSSOM 里的 <code>CSSImportRule</code> 读取。</p>
<p><code>@import</code> 也有自己的优势：它可以带 <code>layer()</code> 把整份外部样式放进一个层叠层，<code>link</code> 没有对应的属性；还可以带 <code>supports()</code> 和媒体查询，条件不满足时浏览器可以不下载。要注意 <code>@import</code> 必须写在样式表最前面，只能排在 <code>@charset</code> 和 <code>@layer</code> 声明之后，否则会被忽略。</p>
</blockquote>
<h2>两种写法的加载时机</h2>
<p>先看两种写法：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- index.html --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;stylesheet&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;base.css&quot;</span> /&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;stylesheet&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;theme.css&quot;</span> /&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-comment">/* base.css */</span>
<span class="hljs-keyword">@import</span> <span class="hljs-string">&quot;theme.css&quot;</span>;
<span class="hljs-selector-tag">body</span> { <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>; }
</code></pre></div>
<p>第一种写法里，浏览器读到 HTML 就知道要下载 <code>base.css</code> 和 <code>theme.css</code>，两个请求可以同时发出去。</p>
<p>第二种写法里，HTML 里只有 <code>base.css</code>。浏览器要先把 <code>base.css</code> 下载下来、开始解析，读到 <code>@import</code> 才知道还有 <code>theme.css</code>，这时才发出第二个请求。也就是说，第二个文件至少要多等一个来回。Chrome 团队的性能指南把这叫做“串行的请求链”，并建议不要在 CSS 里用 <code>@import</code>。</p>
<p>为什么这个延迟会影响首屏？MDN 写明，<code>&lt;head&gt;</code> 里 <code>rel=&quot;stylesheet&quot;</code> 的 <code>link</code> 默认会阻塞渲染，<code>load</code> 事件要等样式表连同它导入的内容都加载解析完才触发。所以 <code>@import</code> 进来的文件越晚被发现，页面越晚开始渲染。</p>
<p>用构建工具时情况不同。比如 Vite 文档写明它通过 postcss-import 预先内联 CSS 里的 <code>@import</code>，浏览器拿到的是合并后的文件，就没有这个问题。上面说的串行请求，指的是浏览器直接加载带 <code>@import</code> 的 CSS 文件的情况。</p>
<h2>在 JavaScript 里能做什么</h2>
<p><code>link</code> 是普通的 DOM 元素，可以随时插入、删除。MDN 提到，<code>link</code> 上的 <code>disabled</code> 属性如果在 HTML 里就写上，页面加载时不会下载这份样式表，等属性被去掉再按需加载；在 DOM 上设置 <code>disabled</code>，这份样式表会从 <code>document.styleSheets</code> 里移除。所以主题切换常常是准备几个 <code>link</code>，切换它们的 <code>disabled</code>。</p>
<p><code>link</code> 还有 <code>load</code> 和 <code>error</code> 事件，可以知道样式表是否加载成功。</p>
<p><code>@import</code> 是 CSS 规则，不在 DOM 里。通过 <code>document.styleSheets[0].cssRules</code> 能拿到一个 <code>CSSImportRule</code> 对象，读它的 <code>href</code>、<code>media</code>、<code>layerName</code>、<code>supportsText</code> 和导入进来的 <code>styleSheet</code>，但没有办法像操作元素那样启用、停用它。</p>
<h2>条件加载：media 和 supports()</h2>
<p>两种写法都能按媒体条件引入：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">link</span> <span class="hljs-attr">rel</span>=<span class="hljs-string">&quot;stylesheet&quot;</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;print.css&quot;</span> <span class="hljs-attr">media</span>=<span class="hljs-string">&quot;print&quot;</span> /&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@import</span> <span class="hljs-string">&quot;print.css&quot;</span> print;
<span class="hljs-keyword">@import</span> <span class="hljs-string">&quot;grid.css&quot;</span> supports(<span class="hljs-attribute">display</span>: <span class="hljs-attribute">grid</span>) screen <span class="hljs-keyword">and</span> (<span class="hljs-attribute">width</span> &lt;= <span class="hljs-number">400px</span>);
</code></pre></div>
<p>MDN 对 <code>@import</code> 的说法是，浏览器不支持其中任何一个媒体查询时不加载这个资源；<code>supports()</code> 条件不满足时可能不下载，即使通过其他途径下载了也不会应用。<code>supports()</code> 是 <code>@import</code> 独有的，<code>link</code> 没有对应的属性。</p>
<p><code>link</code> 的 <code>media</code> 属性常被用来减少阻塞渲染。Chrome 团队的指南建议给打印样式、只在桌面用的样式这类当前用不到的样式表加上 <code>media</code> 属性，让它们下载时不阻塞渲染。</p>
<h2>@import 和层叠层</h2>
<p><code>@import</code> 可以直接把一份外部样式放进层叠层：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@layer</span> reset, vendor, app;
<span class="hljs-keyword">@import</span> url(<span class="hljs-string">&quot;normalize.css&quot;</span>) layer(reset);
<span class="hljs-keyword">@import</span> url(<span class="hljs-string">&quot;vendor.css&quot;</span>) layer(vendor);
</code></pre></div>
<p>MDN 说明，导入的规则在层叠中的表现，就像直接写在 <code>@import</code> 所在的位置一样；加上 <code>layer()</code> 以后，它们属于指定的层。<code>link</code> 元素没有 <code>layer</code> 属性，MDN 的属性列表里也没有，想把第三方库放进某个层，要么用 <code>@import ... layer()</code>，要么用构建工具包一层。层叠层的用法见<a href="/questions/css-modern-architecture/">《CSS Modules、层叠层和自定义属性怎样帮助维护样式？》</a>。</p>
<p>这里也看到了 <code>@import</code> 位置的限制。MDN 写明，<code>@import</code> 必须在样式表最前面，只能排在 <code>@charset</code> 和用来声明层的 <code>@layer</code> 语句之后，放在其他规则后面会被忽略。它也不能写在 <code>@media</code> 这类条件规则里面，条件要直接写在 <code>@import</code> 后面。</p>
<h2>常见追问</h2>
<p><strong>Sass 里的 <code>@import</code> 和 CSS 的 <code>@import</code> 是一回事吗？</strong></p>
<blockquote>
<p>不是。Sass 的 <code>@import</code> 在编译时把文件内容合并进来，浏览器根本看不到它，而且 Sass 已经推荐改用 <code>@use</code>，见<a href="/questions/css-preprocessors/">《Sass、Less 这类 CSS 预处理器解决了什么问题？原生 CSS 现在能替代它们吗？》</a>。原生 CSS 的 <code>@import</code> 是浏览器运行时去下载另一份样式表。</p>
</blockquote>
<p><strong>动态插入的 <code>link</code> 会阻塞渲染吗？</strong></p>
<blockquote>
<p>默认不会。MDN 写明只有 <code>&lt;head&gt;</code> 里的 <code>link</code> 可能阻塞渲染，解析 HTML 时发现的 <code>rel=&quot;stylesheet&quot;</code> 默认阻塞；如果是用脚本动态加进去的，要另外设置 <code>blocking=&quot;render&quot;</code> 才会阻塞渲染。</p>
</blockquote>`};export{e as default};