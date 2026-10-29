var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前做页面切换动画，得同时保留新旧两份 DOM，自己算位置、写动画，很麻烦。View Transitions API 把这件事交给了浏览器：调用 <code>document.startViewTransition(update)</code>，浏览器先截下旧画面，执行 <code>update</code> 改 DOM，再截下新画面，默认用淡入淡出从旧画面过渡到新画面。</p>
<p>想让某个元素单独“飞”过去，比如列表里的缩略图变成详情页的大图，就给它设 <code>view-transition-name</code>。浏览器会为它单独做位置和尺寸的过渡，这叫共享元素动画。动画用 <code>::view-transition-old()</code>、<code>::view-transition-new()</code> 这些伪元素加普通 CSS 来定制。</p>
<p>多页应用也能用。两个同源页面都声明 <code>@view-transition { navigation: auto; }</code>，页面跳转时就有过渡。</p>
<p>要注意，不支持的浏览器直接执行更新，没有动画，所以可以放心当渐进增强。另外要尊重 <code>prefers-reduced-motion</code>，用户设置了减少动画就关掉。</p>
</blockquote>
<h2>先看同文档切换怎么写</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">navigate</span>(<span class="hljs-params">render</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">document</span>.<span class="hljs-property">startViewTransition</span>) {
    <span class="hljs-title function_">render</span>();
    <span class="hljs-keyword">return</span>;
  }
  <span class="hljs-keyword">const</span> transition = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">startViewTransition</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">render</span>());
  <span class="hljs-keyword">return</span> transition.<span class="hljs-property">finished</span>;
}
</code></pre></div>
<p>不支持就直接 <code>render()</code>，支持就把 <code>render</code> 包进 <code>startViewTransition</code>。</p>
<p>样式这边，给商品图起个名字，调一下动画时长，再照顾减少动画的用户：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.product-image</span> {
  <span class="hljs-attribute">view-transition-name</span>: product-hero;
}

::<span class="hljs-built_in">view-transition-old</span>(root),
::<span class="hljs-built_in">view-transition-new</span>(root) {
  <span class="hljs-attribute">animation-duration</span>: <span class="hljs-number">200ms</span>;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  ::<span class="hljs-built_in">view-transition-group</span>(*),
  ::<span class="hljs-built_in">view-transition-old</span>(*),
  ::<span class="hljs-built_in">view-transition-new</span>(*) {
    <span class="hljs-attribute">animation</span>: none;
  }
}
</code></pre></div>
<h2>为什么设了名字动画却没了</h2>
<p>同一时刻，页面上每个 <code>view-transition-name</code> 必须唯一。如果列表里每一项都设了同一个名字，过渡会被直接跳过。</p>
<p>改法是只在被点击的那一项上临时设置名字，其他项不设。</p>
<h2>为什么切换时页面没反应</h2>
<p><code>render</code> 可以返回 Promise，浏览器会等它完成才截新画面。可是这段等待期间，页面不响应交互。如果在 <code>render</code> 里去请求数据，网络一慢，用户就会觉得页面卡住了。所以数据应该先加载好，再开始过渡。</p>
<h2>startViewTransition 返回了什么</h2>
<p>返回的对象上有三个 Promise 和一个方法。<code>updateCallbackDone</code> 在 DOM 更新完成时兑现。<code>ready</code> 在伪元素创建好、动画即将开始时兑现，可以在这里用 Web Animations API 写自定义动画。<code>finished</code> 在动画结束时兑现。<code>skipTransition()</code> 跳过动画，但 DOM 更新照常执行。</p>
<h2>跨文档切换怎么开</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@view-transition</span> {
  navigation: auto;
}
</code></pre></div>
<p>两个页面都写这条规则，同源导航时就会有过渡。离开页面时会触发 <code>pageswap</code>，新页面在首次渲染前会触发 <code>pagereveal</code>，可以在里面根据是从哪个页面来的，设置不同的动画。</p>
<p>兼容性上，同文档切换已经是 Baseline；跨文档切换 Chromium 和 Safari 支持，Firefox 还不支持。两者都可以作为渐进增强，不支持时页面照常切换。</p>
<h2>常见追问</h2>
<p><strong>列表项都设了 <code>view-transition-name</code>，为什么没有动画？</strong></p>
<blockquote>
<p>因为同一时刻每个名字必须唯一，重名时过渡会被跳过。只在被点击的那一项上临时设置名字就行。</p>
</blockquote>
<p><strong>不支持 View Transitions 的浏览器会怎样？</strong></p>
<blockquote>
<p>直接执行 DOM 更新，只是没有动画，功能不受影响。所以它很适合当渐进增强来用。</p>
</blockquote>`};export{e as default};