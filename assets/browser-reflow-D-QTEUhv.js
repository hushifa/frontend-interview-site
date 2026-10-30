var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>浏览器通常很“懒”：你改了样式，它不会马上算布局，而是攒着，等到下一帧统一算。</p>
<p>可是如果你刚改完样式，马上去读 <code>offsetHeight</code>、<code>getBoundingClientRect()</code> 这类布局值，浏览器为了给你正确的数字，只能当场把布局算一遍。这就叫强制同步布局。</p>
<p>一次两次问题不大。但在循环里写一次、读一次，每次读都会触发一次布局，页面就会明显卡顿，这叫布局抖动（layout thrashing）。</p>
<p>解决办法是先把要读的值集中读完，再集中写。读写分散在不同模块时，可以把读取和写入分别排队，或者在 <code>requestAnimationFrame</code> 回调的开头先读，再写。</p>
</blockquote>
<h2>先看一个有问题的写法</h2>
<p>下面想把每个子元素的宽度设成容器的一半：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> items) {
  item.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${container.offsetWidth / <span class="hljs-number">2</span>}</span>px\`</span>;
}
</code></pre></div>
<p>代码看起来只读了一个值，问题在哪？每一轮都先读 <code>offsetWidth</code>，再写 <code>width</code>。写入让布局失效了，下一轮再读 <code>offsetWidth</code>，浏览器只好重新算一次布局。有一百个元素，就算一百次。</p>
<p>改法是先读后写，读只做一次：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> half = container.<span class="hljs-property">offsetWidth</span> / <span class="hljs-number">2</span>;
<span class="hljs-keyword">for</span> (<span class="hljs-keyword">const</span> item <span class="hljs-keyword">of</span> items) {
  item.<span class="hljs-property">style</span>.<span class="hljs-property">width</span> = <span class="hljs-string">\`<span class="hljs-subst">\${half}</span>px\`</span>;
}
</code></pre></div>
<p>现在循环里只有写入，浏览器可以把这些修改攒到一起，最后只算一次布局。</p>
<p>读写分散在不同模块里时，没法这么直接地调整顺序。可以把读取和写入分别排队，在同一帧里先执行所有读，再执行所有写。</p>
<h2>哪些读取会触发同步布局</h2>
<p>Chrome 工程师 Paul Irish 按 Blink 源码整理过一份清单，常见的有：<code>offsetTop/Left/Width/Height</code>、<code>clientWidth/Height</code>、<code>scrollTop</code>、<code>scrollHeight</code>、<code>getBoundingClientRect()</code>、用 <code>getComputedStyle()</code> 读 <code>width</code>、<code>height</code> 这类布局相关的属性、<code>scrollIntoView()</code>、<code>focus()</code>。清单针对 Chromium，作者说明 WebKit 基本一致，Gecko 大概也类似。</p>
<p>不过前提是“之前有待处理的修改”。清单的注释说明，只有上次布局之后文档有改动、让样式或布局失效了，读这些属性才有代价。如果没有改过，浏览器直接用上一帧的布局结果，web.dev 也建议把读取放在前面，正是为了用上这份现成的结果。</p>
<h2>还有哪些办法能减少布局成本</h2>
<p>动画优先用 <code>transform</code> 和 <code>opacity</code>，它们通常不触发布局，原因见<a href="/questions/browser-reflow-repaint/">《重排和重绘有什么区别？哪些操作会触发它们？》</a>。</p>
<p>用 <code>contain: layout</code> 告诉浏览器这个元素里的布局不影响外面，改了里面的东西不用重新检查整个页面。<code>content-visibility: auto</code> 更进一步，屏幕外的内容直接跳过布局和绘制，等快进入视口时再算。</p>
<p>批量插入节点时，先放进 <code>DocumentFragment</code>，再一次性挂到 DOM 上。</p>
<p>想知道元素尺寸什么时候变了，用 <code>ResizeObserver</code>，不要轮询读取。</p>
<h2>怎么找到是哪行代码触发的</h2>
<p>排查时可以用 Chrome DevTools 的 Performance 面板录一段，看主线程上的布局任务出现在哪段脚本之后。</p>
<h2>常见追问</h2>
<p><strong>只读布局属性、不改样式，会触发布局吗？</strong></p>
<blockquote>
<p>不会额外触发。只有在之前有待处理的样式修改时，读这些属性才会让浏览器当场重新计算。</p>
</blockquote>
<p><strong>为什么建议在 <code>requestAnimationFrame</code> 回调的开头读布局值？</strong></p>
<blockquote>
<p>因为 <code>requestAnimationFrame</code> 回调在一帧开始时运行，这时还没有新的样式修改，读到的是上一帧现成的布局结果，不会触发强制布局。读完再写，读和写就不会交替出现。</p>
</blockquote>`};export{e as default};