var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>手机上点输入框，键盘弹起来，底部的操作栏经常被盖住。原因是多数移动浏览器默认只缩小“用户能看到的区域”，也就是可视视口，而页面布局用的布局视口不变。<code>position: fixed; bottom: 0</code> 是按布局视口算的，所以落到了键盘下面。</p>
<p>最通用的办法是 <code>window.visualViewport</code>。它能告诉你可视区域的尺寸和偏移，监听它的 <code>resize</code> 和 <code>scroll</code>，就能算出键盘高度，把底部栏挪上来。主流移动浏览器都支持。</p>
<p>另外两种办法支持范围小一些。viewport meta 里写 <code>interactive-widget=resizes-content</code>，键盘弹出时连布局视口一起缩小，Chrome 和 Firefox 的 Android 版支持，Safari 不支持。VirtualKeyboard API 只在 Chromium 里能用，适合要精确控制键盘区域的场景。</p>
<p>最后别忘了，输入框聚焦时用 <code>scrollIntoView</code> 保证它能被看到，并且要在 iOS 和 Android 真机上测。</p>
</blockquote>
<h2>两个视口有什么区别</h2>
<p>布局视口是 CSS 布局的基准，<code>fixed</code> 定位就是相对它算的。可视视口是用户当前实际看到的那块区域，键盘弹出、双指缩放时它会变小或者移动。</p>
<p>键盘弹出以后，可视视口变矮了，布局视口的高度却没变。所以固定在布局视口底部的元素，就跑到了键盘下面。</p>
<h2>用 VisualViewport 让底部栏跟着键盘</h2>
<p>下面的代码算出键盘挡住的高度，再把底部栏往上移这么多。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> bar = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;.bottom-bar&#x27;</span>);
<span class="hljs-keyword">const</span> vv = <span class="hljs-variable language_">window</span>.<span class="hljs-property">visualViewport</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">update</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> keyboard = <span class="hljs-variable language_">window</span>.<span class="hljs-property">innerHeight</span> - vv.<span class="hljs-property">height</span> - vv.<span class="hljs-property">offsetTop</span>;
  bar.<span class="hljs-property">style</span>.<span class="hljs-property">transform</span> = <span class="hljs-string">\`translateY(<span class="hljs-subst">\${-<span class="hljs-built_in">Math</span>.max(<span class="hljs-number">0</span>, keyboard)}</span>px)\`</span>;
}

<span class="hljs-keyword">if</span> (vv) {
  vv.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, update);
  vv.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;scroll&#x27;</span>, update);
}
</code></pre></div>
<p><code>innerHeight</code> 是布局视口的高度，减去可视视口的高度和它的偏移，剩下的就是被键盘占掉的高度。</p>
<p>为什么用 <code>transform</code> 而不改 <code>bottom</code>？因为 <code>transform</code> 不会引起重新布局，更不容易抖动。</p>
<h2>能不能让浏览器自己缩小布局</h2>
<p>可以在 viewport meta 里加 <code>interactive-widget</code>：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1, interactive-widget=resizes-content&quot;</span> /&gt;</span>
</code></pre></div>
<p>它有三个取值：</p>
<table><thead><tr><th>值</th><th>键盘弹出时</th></tr></thead><tbody><tr><td><code>resizes-visual</code>（默认）</td><td>只缩小可视视口</td></tr><tr><td><code>resizes-content</code></td><td>布局视口也缩小，<code>fixed</code> 元素和 <code>dvh</code> 自动避开键盘</td></tr><tr><td><code>overlays-content</code></td><td>都不缩小，键盘覆盖在内容上</td></tr></tbody></table>
<p>写了 <code>resizes-content</code>，布局视口跟着变矮，固定元素自然就避开了键盘，不用写 JS。可是 Safari 这类不支持的浏览器会直接忽略它，所以还得用 VisualViewport 方案兜底。</p>
<h2>VirtualKeyboard API 怎么用</h2>
<p>这个 API 反过来做：让浏览器完全不管视口，由页面自己给键盘留位置。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">if</span> (<span class="hljs-string">&#x27;virtualKeyboard&#x27;</span> <span class="hljs-keyword">in</span> navigator) {
  navigator.<span class="hljs-property">virtualKeyboard</span>.<span class="hljs-property">overlaysContent</span> = <span class="hljs-literal">true</span>;
}
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.chat</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-rows</span>: <span class="hljs-number">1</span>fr auto <span class="hljs-built_in">env</span>(keyboard-inset-height, <span class="hljs-number">0px</span>);
  <span class="hljs-attribute">height</span>: <span class="hljs-number">100</span>dvh;
}
</code></pre></div>
<p>打开 <code>overlaysContent</code> 以后，浏览器不再调整视口，键盘直接盖在内容上。页面用 <code>env(keyboard-inset-height)</code> 拿到键盘高度，在网格最后一行把空间留出来。这个 API 是实验性的，只在 Chromium 系浏览器的安全上下文里能用。</p>
<h2>输入框本身被挡住怎么办</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;focus&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> input.<span class="hljs-title function_">scrollIntoView</span>({ <span class="hljs-attr">block</span>: <span class="hljs-string">&#x27;center&#x27;</span> }), <span class="hljs-number">300</span>);
});
</code></pre></div>
<p>为什么要延迟？因为键盘弹出有动画，动画结束可视视口才稳定，这时再滚动更可靠。如果输入框在一个滚动容器里，还要确认容器的高度会随键盘变化，否则滚了也看不到。</p>
<h2>测试时要注意什么</h2>
<p>iOS Safari、Android Chrome 和你的 App 里的 WebView 要分别测，WebView 的表现还受原生配置影响。横屏、外接键盘、第三方输入法（高度各不相同）也要测，并且看键盘收起后布局能不能恢复。</p>
<h2>常见追问</h2>
<p><strong>为什么 100vh 的页面，键盘弹出后还能滚动？</strong></p>
<blockquote>
<p>因为 <code>vh</code> 不随键盘变化，页面还是原来那么高，可视区域却变小了。可以改用 <code>dvh</code>，或者配合 <code>interactive-widget</code> 处理。</p>
</blockquote>
<p><strong>安全区域和键盘有什么关系？</strong></p>
<blockquote>
<p>两者互不相干。底部栏既要避开手势条，也要避开键盘，两件事要分别处理，见<a href="/questions/mobile-safe-area/">《移动端安全区域怎样避免内容被刘海和底部手势条遮挡？》</a>。</p>
</blockquote>`};export{e as default};