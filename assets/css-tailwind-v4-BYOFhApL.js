var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>v3 项目里，主题色、字体、断点都写在 <code>tailwind.config.js</code> 里，CSS 文件开头写三条 <code>@tailwind</code> 指令。v4 把这些都搬进了 CSS：开头只写一行 <code>@import &quot;tailwindcss&quot;</code>，主题用 <code>@theme { --color-brand: ...; }</code> 定义。</p>
<p><code>@theme</code> 里的变量不只是 CSS 变量。变量名的前缀决定生成哪类工具类，写了 <code>--color-mint-500</code>，就有了 <code>bg-mint-500</code>、<code>text-mint-500</code>；写了 <code>--breakpoint-3xl</code>，就有了 <code>3xl:</code> 变体。编译后这些变量还会输出到 <code>:root</code> 上，组件样式和 JavaScript 都能直接用 <code>var(--color-mint-500)</code>。</p>
<p>好处是配置和样式在一个地方，主题值天然是运行时的 CSS 变量，不再需要 <code>resolveConfig</code> 把配置导给 JS。扫描源文件也变成了自动的，不用再写 <code>content</code> 数组，特殊路径用 <code>@source</code> 补充。</p>
<p>要注意几点。旧的 JS 配置不会再被自动读取，要用 <code>@config</code> 显式加载，<code>safelist</code>、<code>corePlugins</code> 等选项不再支持。v4 依赖 <code>@property</code>、<code>color-mix()</code> 等新 CSS 特性，官方说面向 Safari 16.4+、Chrome 111+、Firefox 128+，要支持更老的浏览器只能继续用 v3.4。</p>
</blockquote>
<h2>一个 v4 项目的入口 CSS 长什么样</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@import</span> <span class="hljs-string">&quot;tailwindcss&quot;</span>;

<span class="hljs-keyword">@theme</span> {
  <span class="hljs-attr">--font-display</span>: <span class="hljs-string">&quot;Satoshi&quot;</span>, <span class="hljs-string">&quot;sans-serif&quot;</span>;
  <span class="hljs-attr">--breakpoint-3xl</span>: <span class="hljs-number">120rem</span>;
  <span class="hljs-attr">--color-mint-500</span>: <span class="hljs-built_in">oklch</span>(<span class="hljs-number">0.72</span> <span class="hljs-number">0.11</span> <span class="hljs-number">178</span>);
}
</code></pre></div>
<p>第一行代替了 v3 的 <code>@tailwind base</code>、<code>@tailwind components</code>、<code>@tailwind utilities</code>。v4 自己处理 <code>@import</code> 和浏览器前缀，升级指南说用 PostCSS 时可以去掉 <code>postcss-import</code> 和 <code>autoprefixer</code>。PostCSS 插件也移到了单独的 <code>@tailwindcss/postcss</code> 包；用 Vite 的项目，官方推荐改用 <code>@tailwindcss/vite</code> 插件。</p>
<p><code>@theme</code> 里定义了三个变量，接下来就能在 HTML 里写 <code>font-display</code>、<code>3xl:grid-cols-6</code>、<code>bg-mint-500</code>。这几个类原本不存在，是因为定义了对应的变量才有的。</p>
<h2>为什么 @theme 不直接写成 :root</h2>
<p>官方文档的解释是，主题变量除了是 CSS 变量，还告诉 Tailwind 要生成哪些工具类，所以用专门的语法让这件事显式化。主题变量还必须写在顶层，不能嵌在选择器或媒体查询里，专门的语法方便强制这一点。</p>
<p>变量按命名空间对应工具类：<code>--color-*</code> 对应 <code>bg-*</code>、<code>text-*</code>、<code>fill-*</code> 这类颜色工具类，<code>--font-*</code> 对应 <code>font-*</code>，<code>--breakpoint-*</code> 对应响应式变体。像 <code>flex</code>、<code>object-cover</code> 这种值固定的工具类不受主题影响；<code>bg-red-200</code>、<code>font-serif</code> 能直接用，是因为默认主题定义了 <code>--color-red-200</code>、<code>--font-serif</code>。</p>
<p>所以选择规则很简单：希望这个值变成工具类，就写进 <code>@theme</code>；只是普通的 CSS 变量，不需要对应的工具类，就照常写在 <code>:root</code> 里。</p>
<h2>怎样扩展、覆盖和清空默认主题</h2>
<p>在 <code>@theme</code> 里写一个新变量就是扩展，写一个同名变量就是覆盖。要整组换掉，用星号语法把命名空间设成 <code>initial</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@import</span> <span class="hljs-string">&quot;tailwindcss&quot;</span>;

<span class="hljs-keyword">@theme</span> {
  <span class="hljs-attr">--color-</span>*: initial;
  <span class="hljs-attr">--color-brand</span>: <span class="hljs-built_in">oklch</span>(<span class="hljs-number">0.6</span> <span class="hljs-number">0.15</span> <span class="hljs-number">250</span>);
  <span class="hljs-attr">--color-surface</span>: <span class="hljs-built_in">oklch</span>(<span class="hljs-number">0.98</span> <span class="hljs-number">0</span> <span class="hljs-number">0</span>);
}
</code></pre></div>
<p>这样默认的 <code>red-500</code>、<code>blue-500</code> 都没了，只剩 <code>brand</code> 和 <code>surface</code> 两个颜色。写 <code>--*: initial</code> 则清空整个默认主题，只用自己定义的值。</p>
<h2>主题变量引用别的变量时为什么要加 inline</h2>
<p>先看一个问题：<code>@theme { --font-sans: var(--font-inter); }</code>，然后在某个子元素上才定义 <code>--font-inter</code>。文档说这时文字会退回 <code>sans-serif</code>，而不是 Inter。</p>
<p>原因在 CSS 变量的解析规则：<code>var(--font-sans)</code> 在定义 <code>--font-sans</code> 的那个元素上求值，那里还没有 <code>--font-inter</code>，后面子元素再定义也来不及了。</p>
<p>改法是写 <code>@theme inline { --font-sans: var(--font-inter); }</code>。加了 <code>inline</code>，生成的 <code>.font-sans</code> 会直接写成 <code>font-family: var(--font-inter)</code>，跳过中间那层变量，就在使用的元素上求值了。</p>
<h2>主题值怎样给 JavaScript 和组件样式用</h2>
<p>文档说，所有主题变量在编译时都会变成普通的 CSS 变量，输出在 <code>:root</code> 上。默认只输出用到的变量，想全部输出可以写 <code>@theme static</code>。</p>
<p>v3 提供了 <code>resolveConfig</code>，把 JS 配置展开成对象给其他代码用。v4 去掉了它，官方建议直接用生成的 CSS 变量，比如动画库可以直接把 <code>var(--color-blue-500)</code> 当目标值；确实需要具体值时，用 <code>getComputedStyle</code> 从根元素读取。这种“主题值就是 CSS 变量”的做法，和<a href="/questions/architecture-design-tokens/">《设计 token 为什么比散落的颜色变量更适合大型前端项目？》</a>讲的分层 token 可以直接对接。</p>
<h2>不写 content 以后，Tailwind 扫描哪些文件</h2>
<p>v3 要在配置里写 <code>content</code> 数组列出模板文件。v4 默认扫描项目里的所有文件，跳过 <code>.gitignore</code> 里的文件、<code>node_modules</code>、图片和压缩包这类二进制文件，以及 CSS 文件。扫描本身的原理，即“只为源码里出现的完整类名生成 CSS”，见<a href="/questions/css-in-js-atomic/">《CSS-in-JS 和原子化 CSS 怎么选？styled-components、Tailwind、CSS Modules 各适合什么场景？》</a>。</p>
<p>依赖通常在 <code>.gitignore</code> 里，所以用到一个基于 Tailwind 写的组件库时，要用 <code>@source &quot;../node_modules/@acmecorp/ui-lib&quot;</code> 显式加进来；不想扫描的目录用 <code>@source not</code>；完全不要自动检测，就在导入时写 <code>source(none)</code>，再逐个注册路径。</p>
<h2>从 v3 升级要注意什么</h2>
<p>官方提供了升级工具 <code>npx @tailwindcss/upgrade</code>，需要 Node.js 20 或更高版本，会更新依赖、把配置文件迁移成 CSS、改写模板里的类名。文档建议在新分支上运行，然后检查差异并在浏览器里测试。</p>
<p>几处需要人工确认的变化：</p>
<ul>
<li>JS 配置文件不再被自动发现。还要用的话写 <code>@config &quot;../../tailwind.config.js&quot;</code>，但 <code>corePlugins</code>、<code>safelist</code>、<code>separator</code> 不再支持，安全名单改用 <code>@source inline()</code>。</li>
<li>v3 里写在 <code>@layer utilities</code>、<code>@layer components</code> 里的类会被当成工具类，能配合 <code>hover:</code> 这类变体。v4 改用原生层叠层，不再接管 <code>@layer</code>，自定义工具类要改写成 <code>@utility</code>。</li>
<li>JS 插件用 <code>@plugin &quot;@tailwindcss/typography&quot;</code> 加载。</li>
<li>深色模式默认跟随 <code>prefers-color-scheme</code>；想用类名或属性手动切换，写 <code>@custom-variant dark (&amp;:where(.dark, .dark *));</code>。</li>
</ul>
<p>浏览器要求是决定能不能升级的硬条件。升级指南说 v4 依赖 <code>@property</code> 和 <code>color-mix()</code> 实现核心功能，在更老的浏览器里无法工作，这些浏览器的支持情况见<a href="/questions/css-oklch-color-mix/">《oklch()、color-mix() 和相对颜色语法怎样做主题色？》</a>。</p>
<h2>常见追问</h2>
<p><strong>v4 里还能用 tailwind.config.js 吗？</strong></p>
<blockquote>
<p>能，但要在 CSS 里用 <code>@config</code> 显式加载，v4 不再自动查找它。官方说 <code>@config</code>、<code>@plugin</code> 可以和 <code>@theme</code>、<code>@utility</code> 混用，方便一步步把配置迁到 CSS 里。<code>safelist</code>、<code>corePlugins</code>、<code>separator</code> 这几个选项不再支持。</p>
</blockquote>
<p><strong>Vue 单文件组件的 style 里用 @apply 报找不到类，怎么办？</strong></p>
<blockquote>
<p>组件的 <code>&lt;style&gt;</code> 块是单独处理的，看不到主样式表里的主题变量和自定义工具类。文档的办法是在块里写 <code>@reference &quot;../../app.css&quot;</code>，只引用、不重复输出样式；没有自定义主题时可以直接 <code>@reference &quot;tailwindcss&quot;</code>。</p>
</blockquote>
<p><strong>为什么 v4 生成的颜色是 oklch？</strong></p>
<blockquote>
<p>官方博客说 v4 重新设计了调色板，改成更鲜艳的 P3 色域颜色，默认主题里的颜色变量都用 <code>oklch()</code> 定义，比如 <code>--color-red-50: oklch(0.971 0.013 17.38)</code>。这也是它对浏览器版本有要求的原因之一。</p>
</blockquote>`};export{e as default};