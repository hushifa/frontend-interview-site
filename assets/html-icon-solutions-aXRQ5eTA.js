var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>后台系统里有上百个图标：菜单前的小图标、只有一个叉号的关闭按钮、带两种颜色的状态图标。早年常用 iconfont，把图标做成一套字体，写个类名就能显示，颜色和大小跟着文字走。现在更多用 SVG，要么做成 SVG Sprite，用 <code>&lt;use&gt;</code> 引用，要么每个图标写成一个组件按需引入。</p>
<p>iconfont 的好处是用法简单，可是一个字形只能是一种颜色，图标要等字体文件下载完才能显示，而且通过 CSS <code>content</code> 插入的内容不在 DOM 里，有的读屏软件不会读出来。SVG 是矢量图，本身就能多色，用 <code>fill=&quot;currentColor&quot;</code> 也能跟随文字颜色。</p>
<p>SVG Sprite 把所有图标写成 <code>&lt;symbol&gt;</code> 放在一个 SVG 里，页面上用 <code>&lt;use href=&quot;#icon-close&quot;&gt;</code> 引用，图标只定义一次。图标组件把每个 SVG 编译成一个组件，打包工具只打进用到的图标，用起来和普通组件一样，可以直接传颜色、大小和标签。</p>
<p>无障碍方面，和文字一起出现、只起装饰作用的图标加 <code>aria-hidden=&quot;true&quot;</code>，让读屏软件跳过；只有图标、没有文字的按钮要用 <code>aria-label</code> 写清楚用途，比如“关闭”。</p>
</blockquote>
<h2>iconfont 是怎样工作的，问题在哪</h2>
<p>iconfont 把每个图标画成字体里的一个字形，再用 <code>@font-face</code> 加载这份字体，通过类名在伪元素上插入对应的字符：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.icon-close</span><span class="hljs-selector-pseudo">::before</span> {
  <span class="hljs-attribute">font-family</span>: <span class="hljs-string">&#x27;my-icons&#x27;</span>;
  <span class="hljs-attribute">content</span>: <span class="hljs-string">&#x27;\\e601&#x27;</span>;
}
</code></pre></div>
<p>因为它本质上是文字，所以 <code>color</code>、<code>font-size</code> 直接生效，这是它当年流行的原因。可是同一个字形只能填一种颜色，想做双色图标就得叠两个字形。</p>
<p>字体需要单独下载，下载完成前或下载失败时，图标就显示不出来。字体文件还要注意格式，MDN 的字体教程推荐 WOFF2，并说明现代浏览器都支持；文字加载期间的显示策略见<a href="/questions/perf-font-loading/">《网页字体加载怎样优化？font-display、子集化、preload 和 size-adjust 各解决什么问题？》</a>。</p>
<p>还有一个无障碍问题。MDN 在 <code>content</code> 属性的说明里提到，CSS 生成的内容不在 DOM 里，不会出现在无障碍树中，部分读屏软件和浏览器的组合不会读出它。所以图标如果承载了必要信息，不能只靠伪元素表达。</p>
<h2>SVG Sprite 怎样用</h2>
<p><code>&lt;symbol&gt;</code> 定义一个不直接显示的图形模板，<code>&lt;use&gt;</code> 按 <code>id</code> 把它实例化出来。把所有图标的 <code>&lt;symbol&gt;</code> 放在页面里一个隐藏的 SVG 中，用的地方只写一行引用：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">style</span>=<span class="hljs-string">&quot;display: none&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">symbol</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;icon-close&quot;</span> <span class="hljs-attr">viewBox</span>=<span class="hljs-string">&quot;0 0 24 24&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">path</span> <span class="hljs-attr">d</span>=<span class="hljs-string">&quot;M6 6l12 12M18 6L6 18&quot;</span> <span class="hljs-attr">stroke</span>=<span class="hljs-string">&quot;currentColor&quot;</span> <span class="hljs-attr">stroke-width</span>=<span class="hljs-string">&quot;2&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">symbol</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;关闭&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;16&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;16&quot;</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">use</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;#icon-close&quot;</span> /&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p><code>stroke=&quot;currentColor&quot;</code> 让线条颜色取当前元素的 <code>color</code>，所以改按钮的文字颜色，图标颜色也跟着变。为什么颜色写在 <code>&lt;symbol&gt;</code> 里而不是 <code>&lt;use&gt;</code> 上？MDN 说明，被引用的元素上已经定义的属性，<code>&lt;use&gt;</code> 上的同名属性大多会被忽略；<code>&lt;use&gt;</code> 克隆出来的内容也不暴露在 DOM 里，CSS 属性不保证能继承进去。所以想从外面控制颜色，最稳妥的写法是在图形里用 <code>currentColor</code>。</p>
<p><code>&lt;use&gt;</code> 也能引用外部文件里的 symbol，比如 <code>href=&quot;/icons.svg#icon-close&quot;</code>，这样图标文件能被浏览器缓存。要注意 MDN 提到的限制：浏览器可能对 <code>&lt;use&gt;</code> 应用同源策略，拒绝加载跨域的地址，目前也没有办法为 <code>&lt;use&gt;</code> 设置跨域策略，所以图标文件要和页面同源，放在 CDN 的其他域名下可能加载不出来。</p>
<h2>图标组件解决了什么</h2>
<p>在 React、Vue 项目里，常见做法是把每个 SVG 文件转成组件，比如 <code>&lt;CloseIcon size={16} /&gt;</code>。每个图标是一个独立的模块，打包工具可以只打进实际用到的图标，不用一次加载整套图标。组件也方便统一处理默认尺寸、<code>currentColor</code> 和无障碍属性。</p>
<p>代价是图标的 SVG 代码会进入 JavaScript 包。图标数量很多、同一个图标在页面里重复上百次时，每处都是一份完整的 SVG 节点，这时 Sprite 只定义一次的方式更省。</p>
<h2>无障碍怎样处理</h2>
<p>MDN 对 <code>aria-hidden</code> 的说明是：<code>aria-hidden=&quot;true&quot;</code> 会把元素和它的子元素从无障碍树中移除，适合隐藏纯装饰性的内容，比如图标；但它不会在视觉上隐藏任何东西，也不能加在能获得焦点的元素或它的祖先上。</p>
<p>所以有两种情况要分开。图标旁边已经有文字，比如“搜索”按钮里的放大镜，图标只是装饰，给 SVG 加 <code>aria-hidden=&quot;true&quot;</code>，读屏软件只读“搜索”。按钮里只有图标没有文字，MDN 在 <code>aria-label</code> 的说明里正好用了这个例子：只含 SVG 图标的按钮没有可访问名称，要用 <code>aria-label</code> 提供，比如上面代码里的 <code>aria-label=&quot;关闭&quot;</code>，同时把里面的 SVG 隐藏，避免重复。</p>
<h2>常见追问</h2>
<p><strong>图标颜色为什么改不了？</strong></p>
<blockquote>
<p>多数情况是 SVG 里的 <code>path</code> 写死了 <code>fill=&quot;#333&quot;</code> 这样的颜色。外部的 CSS 或 <code>&lt;use&gt;</code> 上的属性覆盖不了它，要把图标源文件里的颜色改成 <code>currentColor</code>，再通过 <code>color</code> 控制。</p>
</blockquote>
<p><strong>SVG 里的 title 能代替 aria-label 吗？</strong></p>
<blockquote>
<p><code>&lt;title&gt;</code> 能为 SVG 提供简短的可访问描述，浏览器通常还会显示成悬停提示。不过对图标按钮来说，把名称写在按钮的 <code>aria-label</code> 上更直接，SVG 本身用 <code>aria-hidden</code> 隐藏，名称只有一个来源，不容易重复朗读。</p>
</blockquote>
<p><strong>老项目里的 iconfont 要不要全部换掉？</strong></p>
<blockquote>
<p>不必一次换完。可以新图标用 SVG，旧图标在改到相关页面时逐步替换。先处理影响最大的地方，比如只有图标没有文字的按钮，要补上可访问名称。</p>
</blockquote>`};export{e as default};