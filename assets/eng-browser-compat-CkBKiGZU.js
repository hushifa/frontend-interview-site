var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>用户反馈“页面在我手机上坏了”，第一步是拿到他的浏览器和版本，在支持范围内的最低版本上复现。支持范围事先写在 browserslist 里，排查时才知道这个版本该不该修。</p>
<p>复现后看控制台报什么错。<code>SyntaxError</code> 多半是新语法没被转换，整个脚本不执行，常常直接白屏；<code>xxx is not a function</code> 多半是缺了某个 API；没报错只是样式错乱，就要查 CSS 特性的支持情况。原因不同，改法也完全不一样。</p>
<p>写代码时按渐进增强的思路：先保证范围内所有浏览器都能完成核心操作，再用 CSS 的 <code>@supports</code> 和 JS 的 <code>if (&#x27;IntersectionObserver&#x27; in window)</code> 判断能力，给支持的浏览器更好的体验。判断的是功能，不是浏览器名字。</p>
<p>最后，要在最低版本上跑一遍关键流程，用 eslint-plugin-compat 这类工具在开发阶段提前发现问题，不要等用户反馈。</p>
</blockquote>
<h2>先有一份明确的支持范围</h2>
<p>排查之前要知道“该支持谁”。支持范围应该来自自己网站的访问统计和业务要求，写成一份 browserslist 配置，排查时才知道哪个最低版本必须修、哪个可以只给提示。范围怎样用数据定、怎样写进配置并让构建工具共用，见<a href="/questions/eng-browser-targets/">《browserslist、编译目标和 polyfill 注入分别怎样配置？》</a>。</p>
<h2>线上出了兼容问题，怎样排查</h2>
<p>先确认问题出在哪个浏览器和版本。用户反馈里的 User-Agent、错误监控上报的浏览器信息，都能帮你缩小范围。然后在这个版本上复现，打开控制台看报错。</p>
<p>报错的类型决定了问题属于哪一类。如果是 <code>SyntaxError</code>，说明浏览器连代码都解析不了，通常是某个依赖带着新语法没被构建工具转换，整个脚本都不会执行，页面常常直接白屏。如果是 <code>TypeError: xxx is not a function</code> 或 <code>xxx is not defined</code>，语法没问题，是运行到这里时缺了某个内置 API。如果没有报错，只是布局错乱或样式不生效，就要查用到的 CSS 特性在这个版本里支不支持。</p>
<p>这三类问题的改法不同：语法问题调整编译目标或把依赖加入转换范围，API 问题补 polyfill 或做特性检测，CSS 问题写回退样式。具体每一类由哪项配置负责，见<a href="/questions/eng-browser-targets/">《browserslist、编译目标和 polyfill 注入分别怎样配置？》</a>。</p>
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
<h2>常见追问</h2>
<p><strong>渐进增强和优雅降级有什么区别？</strong></p>
<blockquote>
<p>渐进增强是从基础版本做起，再给能力更强的浏览器加功能；优雅降级是先按新浏览器做完整版本，再想办法让旧浏览器不至于坏掉。两者最后的效果可能相同，区别在出发点。渐进增强能保证基础功能一开始就被考虑到，更不容易漏掉。</p>
</blockquote>
<p><strong>列表外的浏览器用户打开了页面怎么办？</strong></p>
<blockquote>
<p>至少不要白屏。可以检测几个关键能力，不满足时显示一个提示页，说明推荐使用的浏览器；或者保证核心内容能显示，交互功能降级。判断依据仍然是特性检测，而不是 User-Agent。</p>
</blockquote>`};export{e as default};