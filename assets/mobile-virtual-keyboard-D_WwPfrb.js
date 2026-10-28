var e={answerHtml:`<h2>简答</h2>
<ul>
<li>键盘弹出时，多数移动浏览器默认只缩小可视视口（visual viewport），布局视口不变，所以 <code>position: fixed; bottom: 0</code> 的元素会被键盘挡住。</li>
<li><code>window.visualViewport</code> 提供可视区域的尺寸和偏移，监听它的 <code>resize</code> 和 <code>scroll</code> 事件可以让底部栏贴在键盘上方，主流移动浏览器都支持。</li>
<li>viewport meta 的 <code>interactive-widget=resizes-content</code> 让键盘弹出时缩小布局视口，Chrome for Android 和 Firefox for Android 支持，Safari 不支持。</li>
<li>VirtualKeyboard API（<code>navigator.virtualKeyboard</code>）只在 Chromium 中可用，适合需要精确控制键盘区域的场景。</li>
<li>输入框聚焦时用 <code>scrollIntoView</code> 确保它在可视区域内，并在真机上测试 iOS 和 Android。</li>
</ul>
<h2>两个视口</h2>
<ul>
<li><strong>布局视口</strong>：CSS 布局的基准，<code>fixed</code> 定位相对它计算。</li>
<li><strong>可视视口</strong>：用户当前实际看到的区域，键盘弹出、双指缩放时会变小或移动。</li>
</ul>
<p>键盘弹出后可视视口变矮，但布局视口高度不变，固定在布局视口底部的元素就落在了键盘下面。</p>
<h2>用 VisualViewport 跟随键盘</h2>
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
<p><code>innerHeight</code> 是布局视口高度，减去可视视口高度和偏移，就是被键盘占据的高度。用 <code>transform</code> 移动比修改 <code>bottom</code> 更不容易引起布局抖动。</p>
<h2>声明式方案：interactive-widget</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">meta</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;viewport&quot;</span> <span class="hljs-attr">content</span>=<span class="hljs-string">&quot;width=device-width, initial-scale=1, interactive-widget=resizes-content&quot;</span> /&gt;</span>
</code></pre></div>
<table><thead><tr><th>值</th><th>键盘弹出时</th></tr></thead><tbody><tr><td><code>resizes-visual</code>（默认）</td><td>只缩小可视视口</td></tr><tr><td><code>resizes-content</code></td><td>布局视口也缩小，<code>fixed</code> 元素和 <code>dvh</code> 自动避开键盘</td></tr><tr><td><code>overlays-content</code></td><td>都不缩小，键盘覆盖在内容上</td></tr></tbody></table>
<p>不支持的浏览器（如 Safari）忽略这个参数，仍需 VisualViewport 方案兜底。</p>
<h2>VirtualKeyboard API</h2>
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
<p>开启 <code>overlaysContent</code> 后浏览器不再调整视口，由页面用 <code>env(keyboard-inset-*)</code> 自己留出键盘空间。这个 API 是实验性的，只在 Chromium 系浏览器的安全上下文中可用。</p>
<h2>输入框被挡住</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">input.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;focus&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> input.<span class="hljs-title function_">scrollIntoView</span>({ <span class="hljs-attr">block</span>: <span class="hljs-string">&#x27;center&#x27;</span> }), <span class="hljs-number">300</span>);
});
</code></pre></div>
<p>键盘动画结束后可视视口才稳定，延迟后再滚动更可靠。滚动容器内的输入框还要确认容器本身的高度会随键盘变化。</p>
<h2>测试要点</h2>
<ul>
<li>iOS Safari、Android Chrome 和目标 App 的 WebView 分别测试，WebView 的行为还受原生配置影响。</li>
<li>测试横屏、外接键盘、第三方输入法（高度不同）以及键盘收起后布局是否恢复。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么 <code>100vh</code> 的页面键盘弹出后还能滚动？<code>vh</code> 不随键盘变化，用 <code>dvh</code> 或配合 <code>interactive-widget</code> 处理。</li>
<li>安全区域和键盘有什么关系？两者独立，底部栏同时要避开手势条和键盘，见《移动端安全区域怎样避免内容被刘海和底部手势条遮挡？》。</li>
</ul>`};export{e as default};