var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>做折叠面板时，<code>height: 0</code> 切到 <code>height: auto</code>，加了 transition 也不会有动画，直接跳过去。因为 <code>interpolate-size</code> 的默认值是 <code>numeric-only</code>，只允许在数字之间算中间值。在 <code>:root</code> 上写 <code>interpolate-size: allow-keywords</code>，<code>auto</code> 这类关键字就能参与过渡了。</p>
<p>它有个限制：两端至少有一端是长度或百分比。<code>auto</code> 到 <code>max-content</code> 这种两端都是关键字的，还是不能过渡。这个属性会继承，一般在 <code>:root</code> 或组件容器上写一次就行。</p>
<p>另一个办法是 <code>calc-size()</code>，适合要在内容高度上再做计算的场景。只做动画的话，MDN 推荐用 <code>interpolate-size</code>。</p>
<p>要注意它目前还是实验特性，支持有限。所以写法上要保证不支持时展开和收起照样能用，只是没有动画。</p>
</blockquote>
<h2>折叠面板</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">interpolate-size</span>: allow-keywords) {
  <span class="hljs-selector-pseudo">:root</span> {
    interpolate-size: allow-keywords;
  }
}

<span class="hljs-selector-class">.panel</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">transition</span>: height <span class="hljs-number">200ms</span> ease;
}

<span class="hljs-selector-class">.panel</span><span class="hljs-selector-class">.open</span> {
  <span class="hljs-attribute">height</span>: auto;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.panel</span> {
    <span class="hljs-attribute">transition</span>: none;
  }
}
</code></pre></div>
<p>注意展开和收起的样式写在 <code>@supports</code> 外面。所以不支持的浏览器里，<code>.open</code> 照样把高度设成 <code>auto</code>，功能完整，只是没有动画。</p>
<p><code>overflow: hidden</code> 在动画过程中和收起以后都保留着。不然高度变到一半时，内容比盒子高，会冒出滚动条。</p>
<h2>details 元素怎么做</h2>
<p><code>&lt;details&gt;</code> 里展开的内容由一个伪元素 <code>::details-content</code> 承载。只对它做过渡，<code>&lt;summary&gt;</code> 那一行就不会被裁掉：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">details</span>::details-content {
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">transition</span>:
    height <span class="hljs-number">200ms</span> ease,
    content-visibility <span class="hljs-number">200ms</span> allow-discrete;
}

<span class="hljs-selector-tag">details</span><span class="hljs-selector-attr">[open]</span>::details-content {
  <span class="hljs-attribute">height</span>: auto;
}
</code></pre></div>
<p>为什么要多写一个 <code>content-visibility</code> 的过渡？因为收起时，浏览器会把内容切成 <code>content-visibility: hidden</code>，内容一下子就没了，高度动画根本看不到。<code>content-visibility</code> 是离散属性，只能直接切换，没有中间值。加上 <code>allow-discrete</code>，它会等高度动画结束再切过去。</p>
<p><code>::details-content</code> 已经是 Baseline 2025，比 <code>interpolate-size</code> 支持得广。没有高度动画的浏览器里，面板照样能展开收起。</p>
<h2>calc-size() 什么时候用</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.panel</span><span class="hljs-selector-class">.open</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-built_in">calc-size</span>(auto, size + <span class="hljs-number">16px</span>);
}
</code></pre></div>
<p><code>size</code> 代表 <code>auto</code> 算出来的高度。需要“内容高度再加一点”这种计算时才用它，普通的展开动画用 <code>interpolate-size</code> 就够了。</p>
<h2>以前是怎么做的</h2>
<p>最常见的是过渡 <code>max-height</code> 到一个足够大的值。问题是动画按这个大值走，内容越短，前面越多时间花在“看不见的高度”上，看起来像有延迟。</p>
<p>另一种是用 JavaScript 读 <code>scrollHeight</code>，把高度写成具体像素，动画结束后再改回 <code>auto</code>。这样可靠，但要处理内容变化、动画中途反向这些情况。</p>
<p>还有一种是用 Grid，让 <code>grid-template-rows</code> 从 <code>0fr</code> 过渡到 <code>1fr</code>。Grid 轨道本来就能插值，兼容性好，到现在仍是常用的回退方案。</p>
<h2>常见追问</h2>
<p><strong>为什么浏览器不默认允许 auto 动画？</strong></p>
<blockquote>
<p>因为现有的样式表都默认固有尺寸是不能动画的。如果默认打开，很多已有页面的行为会突然变化，所以要开发者自己选择开启。</p>
</blockquote>`};export{e as default};