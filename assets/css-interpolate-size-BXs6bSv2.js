var e={answerHtml:`<h2>简答</h2>
<ul>
<li>默认值 <code>numeric-only</code> 下，<code>height: 0</code> 到 <code>height: auto</code> 不会过渡；在 <code>:root</code> 设置 <code>interpolate-size: allow-keywords</code> 后可以过渡。</li>
<li>两端必须有一端是长度或百分比，两个固有尺寸之间（如 <code>auto</code> 到 <code>max-content</code>）仍然不能插值。</li>
<li>该属性可继承，所以通常在 <code>:root</code> 或组件容器上设置一次。</li>
<li><code>calc-size()</code> 也能实现，适合需要在固有尺寸上再做计算的场景；只做动画时 MDN 推荐用 <code>interpolate-size</code>。</li>
<li>截至目前它是实验特性，属于有限可用，不支持时展开和收起应照常工作，只是没有动画。</li>
</ul>
<h2>折叠面板</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  interpolate-size: allow-keywords;
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
<p>展开和收起的状态写在 <code>@supports</code> 之外，不支持的浏览器里 <code>.open</code> 仍会把高度设为 <code>auto</code>，功能完整。<code>overflow: hidden</code> 在动画期间和收起后都保持，避免过渡中途出现滚动条。</p>
<h2>details 元素</h2>
<p><code>&lt;details&gt;</code> 的内容由 <code>::details-content</code> 伪元素承载。只对它做过渡，<code>&lt;summary&gt;</code> 不会被裁掉：</p>
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
<p>收起时浏览器会把内容切到 <code>content-visibility: hidden</code>，加上 <code>allow-discrete</code> 才能等高度动画结束后再隐藏。<code>::details-content</code> 的支持范围比 <code>interpolate-size</code> 更窄，要单独检查。</p>
<h2>calc-size()</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.panel</span><span class="hljs-selector-class">.open</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-built_in">calc-size</span>(auto, size + <span class="hljs-number">16px</span>);
}
</code></pre></div>
<p><code>size</code> 代表 <code>auto</code> 计算出的高度。需要“内容高度再加一点”这类计算时才用它。</p>
<h2>以前的做法</h2>
<ul>
<li>过渡 <code>max-height</code> 到一个足够大的值：时间曲线会失真，内容越短动画越像有延迟。</li>
<li>用 JavaScript 读取 <code>scrollHeight</code> 写成像素值，结束后再改回 <code>auto</code>：可靠但要处理内容变化和中途反向。</li>
<li>用 <code>grid-template-rows: 0fr</code> 到 <code>1fr</code>：Grid 轨道可以插值，兼容性好，至今仍是常用的回退方案。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么不默认允许？现有样式表假设固有尺寸不能动画，默认开启会改变已有页面的行为。</li>
</ul>`};export{e as default};