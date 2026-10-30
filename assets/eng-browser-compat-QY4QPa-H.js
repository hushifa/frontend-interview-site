var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>产品经理说“要兼容主流浏览器”，这句话没法落地。实际做法是先看自己网站的访问统计，结合业务要求，比如是否有政企客户、海外用户占多少，定出一份具体的支持范围，写成 browserslist 配置。Babel、Autoprefixer 这类工具都读它，“支持哪些浏览器”只在一个地方定义。</p>
<p>线上有用户反馈页面坏了，先在支持范围内的最低版本复现，看控制台报的是什么错。<code>SyntaxError</code> 多半是新语法没被转换，<code>xxx is not a function</code> 多半是缺了某个 API，样式错乱则要查 CSS 特性的支持情况。不同的原因，改法完全不一样。</p>
<p>写代码时按渐进增强的思路：先保证范围内所有浏览器都能完成核心操作，再用 CSS 的 <code>@supports</code> 和 JS 的 <code>if (&#x27;IntersectionObserver&#x27; in window)</code> 判断能力，给支持的浏览器更好的体验。判断的是功能，不是浏览器名字。</p>
<p>最后，范围和数据都会过时。要定期更新 browserslist 用到的浏览器数据，回看访问统计调整范围。</p>
</blockquote>
<h2>怎样用数据定支持范围</h2>
<p>支持范围应该来自自己用户的实际情况，而不是凭感觉。browserslist 的查询除了全球使用率，还支持 <code>&gt; 0.5% in my stats</code> 这类按自定义统计数据计算的写法，README 里列出了从 Google Analytics、Plausible 等平台导出数据的工具。</p>
<p>如果没有统计数据，browserslist 提供了 <code>defaults</code>，等于 <code>&gt; 0.5%, last 2 versions, Firefox ESR, not dead</code>，README 说它对大多数用户是合理的配置。<code>not dead</code> 用来排除超过 24 个月没有官方支持或更新的浏览器。想自己调整时，README 建议包含 <code>last 2 versions, not dead, &gt; 0.2%</code>，原因是只写 <code>last n versions</code> 不会包含仍然流行的老版本，只按使用率筛选又会让流行的浏览器越来越流行。</p>
<p>README 还提醒了两点：不要因为不认识某个浏览器就把它删掉，比如 Opera Mini 在非洲有上亿用户；只有在给只有一种浏览器的设备做应用时，才直接写 <code>last 2 Chrome versions</code> 这样的指定版本。另外它支持按 Baseline 查询，比如 <code>baseline widely available</code>，选出能支持所有“广泛可用”特性的浏览器版本。</p>
<h2>怎样把范围写进配置</h2>
<p>配置写在 <code>package.json</code> 的 <code>browserslist</code> 字段或项目根目录的 <code>.browserslistrc</code> 文件里：</p>
<div class="not-prose code-block"><div class="code-language">text</div><pre><code class="hljs language-text">&gt; 0.5%
last 2 versions
not dead
</code></pre></div>
<p>在项目目录运行 <code>npx browserslist</code>，就能看到这份配置实际选出了哪些浏览器和版本。这一步很有用，因为 <code>&gt; 0.5%</code> 这类条件选出来的结果并不直观，团队讨论时直接看列表更清楚。</p>
<p>这份列表定下来以后，构建 target、polyfill 和 TypeScript 的 <code>lib</code> 各自怎样配，见<a href="/questions/eng-browser-targets/">《编译目标、polyfill 和浏览器兼容性是什么关系？》</a>；Babel 的转换原理见<a href="/questions/eng-babel/">《Babel 是怎样把新语法转成旧语法的？语法转换和 polyfill 有什么区别？》</a>。</p>
<h2>线上出了兼容问题，怎样排查</h2>
<p>先确认问题出在哪个浏览器和版本。用户反馈里的 User-Agent、错误监控上报的浏览器信息，都能帮你缩小范围。然后在这个版本上复现，打开控制台看报错。</p>
<p>报错的类型决定了问题属于哪一类。如果是 <code>SyntaxError</code>，说明浏览器连代码都解析不了，通常是某个依赖带着新语法没被构建工具转换，整个脚本都不会执行，页面常常直接白屏。如果是 <code>TypeError: xxx is not a function</code> 或 <code>xxx is not defined</code>，语法没问题，是运行到这里时缺了某个内置 API。如果没有报错，只是布局错乱或样式不生效，就要查用到的 CSS 特性在这个版本里支不支持。</p>
<p>这三类问题的改法不同：语法问题调整编译目标或把依赖加入转换范围，API 问题补 polyfill 或做特性检测，CSS 问题写回退样式。具体每一类由哪项配置负责，见<a href="/questions/eng-browser-targets/">《编译目标、polyfill 和浏览器兼容性是什么关系？》</a>。</p>
<h2>写代码时怎样做特性检测</h2>
<p>特性检测是判断浏览器支不支持某个功能，而不是判断它是什么浏览器。MDN 把按浏览器名判断的做法叫作 browser sniffing，明确说这是应该避免的糟糕做法。真正需要知道的是功能能不能用，按功能本身判断更直接。</p>
<p>CSS 用 <code>@supports</code>。下面先写所有浏览器都能用的布局，支持 <code>display: grid</code> 的浏览器再改成网格：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.list</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">flex-wrap</span>: wrap;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">display</span>: <span class="hljs-attribute">grid</span>) {
  <span class="hljs-selector-class">.list</span> {
    <span class="hljs-attribute">display</span>: grid;
    <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">200px</span>, <span class="hljs-number">1</span>fr));
  }
}
</code></pre></div>
<p>MDN 提醒，<code>@supports</code> 里要写完整的声明，不能只写属性名，末尾也不加分号。</p>
<p>JS 一般检查对象上有没有对应的属性或方法，MDN 的例子是 <code>if (&quot;geolocation&quot; in navigator)</code>。CSS 的支持情况也能在 JS 里用 <code>CSS.supports()</code> 判断。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;IntersectionObserver&#x27;</span> <span class="hljs-keyword">in</span> <span class="hljs-variable language_">window</span>) {
  <span class="hljs-comment">// 用 IntersectionObserver 做懒加载</span>
} <span class="hljs-keyword">else</span> {
  <span class="hljs-comment">// 直接加载全部图片</span>
}
</code></pre></div>
<p>这就是渐进增强：不支持的浏览器仍能看到全部图片，只是少了懒加载带来的性能优化。MDN 对渐进增强的解释是，先给尽可能多的用户提供基本内容和功能，再给能运行新代码的浏览器提供更好的体验，通常用特性检测判断能力，用 polyfill 补上缺失的功能。MDN 也提到，有些功能无法检测出来，这时就要考虑 polyfill 之类的其他办法。</p>
<h2>怎样提前发现和长期维护</h2>
<p>配置写对了不代表页面真的能用。要在支持范围内的最低版本上跑一遍登录、下单这类关键流程，移动端还要在真机上看。eslint-plugin-compat 可以在写代码时提示用了列表里浏览器不支持的 API，把一部分问题提前到开发阶段。</p>
<p>browserslist 的版本数据来自 caniuse-lite，会随时间过时。README 推荐用 <code>update-browserslist-db</code> 更新数据，也有现成的 GitHub Action 定期自动更新并提交合并请求。支持范围本身也要定期回看统计数据调整。</p>
<h2>常见追问</h2>
<p><strong>渐进增强和优雅降级有什么区别？</strong></p>
<blockquote>
<p>渐进增强是从基础版本做起，再给能力更强的浏览器加功能；优雅降级是先按新浏览器做完整版本，再想办法让旧浏览器不至于坏掉。两者最后的效果可能相同，区别在出发点。渐进增强能保证基础功能一开始就被考虑到，更不容易漏掉。</p>
</blockquote>
<p><strong>列表外的浏览器用户打开了页面怎么办？</strong></p>
<blockquote>
<p>至少不要白屏。可以检测几个关键能力，不满足时显示一个提示页，说明推荐使用的浏览器；或者保证核心内容能显示，交互功能降级。判断依据仍然是特性检测，而不是 User-Agent。</p>
</blockquote>
<p><strong>为什么 <code>npx browserslist</code> 输出的结果过一段时间会变？</strong></p>
<blockquote>
<p>因为 <code>&gt; 0.5%</code>、<code>last 2 versions</code> 这些条件是按当前的浏览器数据计算的。浏览器发布新版本、使用率变化以后，同一份配置选出的版本就不一样了。这是期望的行为，配置描述的是规则，不是固定的版本号。</p>
</blockquote>`};export{e as default};