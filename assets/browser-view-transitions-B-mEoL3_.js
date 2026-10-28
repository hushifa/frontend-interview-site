var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>document.startViewTransition(update)</code>：浏览器先截取旧画面，执行 <code>update</code> 修改 DOM，再截取新画面，默认用淡入淡出过渡。</li>
<li>给元素设置 <code>view-transition-name</code>，浏览器会单独为它做位置和尺寸的过渡，实现&quot;共享元素&quot;动画。</li>
<li>动画用 <code>::view-transition-old()</code>、<code>::view-transition-new()</code> 等伪元素和普通 CSS 定制。</li>
<li>跨文档（MPA）切换：两个同源页面都声明 <code>@view-transition { navigation: auto; }</code>。</li>
<li>不支持的浏览器直接执行更新，没有动画；需要尊重 <code>prefers-reduced-motion</code>。</li>
</ul>
<h2>同文档示例</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">navigate</span>(<span class="hljs-params">render</span>) {
  <span class="hljs-keyword">if</span> (!<span class="hljs-variable language_">document</span>.<span class="hljs-property">startViewTransition</span>) {
    <span class="hljs-title function_">render</span>();
    <span class="hljs-keyword">return</span>;
  }
  <span class="hljs-keyword">const</span> transition = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">startViewTransition</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">render</span>());
  <span class="hljs-keyword">return</span> transition.<span class="hljs-property">finished</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.product-image</span> {
  <span class="hljs-attribute">view-transition-name</span>: product-hero;
}

::<span class="hljs-built_in">view-transition-old</span>(root),
::<span class="hljs-built_in">view-transition-new</span>(root) {
  <span class="hljs-attribute">animation-duration</span>: <span class="hljs-number">200ms</span>;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  ::<span class="hljs-built_in">view-transition-group</span>(*) {
    <span class="hljs-attribute">animation</span>: none;
  }
}
</code></pre></div>
<p>同一时刻页面上每个 <code>view-transition-name</code> 必须唯一，否则过渡会被跳过。列表项可以只在被点击的那一项上临时设置名称。</p>
<p><code>render</code> 可以返回 Promise，浏览器等它完成后才截取新画面，这段时间页面不响应交互，所以数据应先加载好再开始过渡。</p>
<h2>返回对象</h2>
<ul>
<li><code>updateCallbackDone</code>：DOM 更新完成。</li>
<li><code>ready</code>：伪元素已创建，动画即将开始，可以在这里用 Web Animations API 自定义动画。</li>
<li><code>finished</code>：动画结束。</li>
<li><code>skipTransition()</code>：跳过动画，DOM 更新照常执行。</li>
</ul>
<h2>跨文档切换</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@view-transition</span> {
  navigation: auto;
}
</code></pre></div>
<p>两个页面都写这条规则，同源导航时就会有过渡。离开页面时触发 <code>pageswap</code>，新页面在首次渲染前触发 <code>pagereveal</code>，可以在其中根据来源页面设置不同的动画。</p>
<h2>兼容性</h2>
<p>同文档切换已是 Baseline；跨文档切换 Chromium 和 Safari 支持，Firefox 尚未支持。两者都可以作为渐进增强，不支持时页面照常切换。</p>`};export{e as default};