var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>两个单位都是“倍数乘以参照值”，区别在参照谁。<code>rem</code> 参照根元素 <code>html</code> 的字号，<code>em</code> 参照当前元素自己的字号。</p>
<p>换算就是乘法。浏览器默认根字号通常是 16px，这时 <code>1.5rem</code> 是 24px；一个字号 20px 的元素上，<code>padding: 1em</code> 就是 20px。</p>
<p><code>em</code> 最容易算错。写在 <code>font-size</code> 上时，它参照的是父元素的字号，所以一层套一层都写 <code>1.5em</code>，字号会变成 1.5 倍、2.25 倍地往上叠。<code>rem</code> 始终参照根元素，不会叠加，所以全局字号和间距一般用 <code>rem</code>，只有希望跟着组件字号一起缩放的尺寸才用 <code>em</code>。</p>
<p>还要注意用户的字号设置。根字号保持 <code>100%</code>，用户在浏览器里调大默认字号，所有 <code>rem</code> 尺寸会一起变大；根字号写死成 px，这个设置就被忽略了。边框、阴影这类不需要跟着字号变的细节，直接用 <code>px</code>。</p>
</blockquote>
<h2>两个单位分别参照谁</h2>
<p>MDN 对这两个单位的定义是：<code>rem</code> 表示根元素（通常是 <code>&lt;html&gt;</code>）的字号，常见的浏览器默认值是 16px，但用户设置可以改它；<code>em</code> 表示元素计算后的字号，用在 <code>font-size</code> 属性本身时表示继承来的字号，也就是父元素的字号。</p>
<p>下面这段 CSS 中，外层容器字号是 16px，里面两层都写 <code>1.5em</code>，另一个元素写 <code>1.5rem</code>。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.parent</span> { <span class="hljs-attribute">font-size</span>: <span class="hljs-number">16px</span>; }
<span class="hljs-selector-class">.nested</span> { <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1.5em</span>; }
<span class="hljs-selector-class">.root-based</span> { <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1.5rem</span>; }
</code></pre></div>
<p>用 headless Chrome 实测，在根字号为 16px 的页面里，<code>.nested</code> 套两层后字号是 36px，即 16 × 1.5 × 1.5；<code>.root-based</code> 不管套在哪里都是 24px。这就是 <code>em</code> 会叠加、<code>rem</code> 不会的原因：每一层的 <code>em</code> 都以父元素算好的字号为基准。</p>
<p>同一个元素上，<code>font-size</code> 以外的属性写 <code>em</code>，参照的是这个元素自己的字号。实测一个 <code>font-size: 20px; width: 10em</code> 的元素，宽度是 200px。按钮的内边距用 <code>em</code>，按钮字号变大，内边距跟着变大，就是利用这一点。</p>
<h2>怎么换算</h2>
<p>公式都是 <code>px = 数值 × 参照值</code>。反过来，已知设计稿的 px 要换成 <code>rem</code>，就除以根字号，比如根字号 16px 时 24px 写成 <code>1.5rem</code>。</p>
<p>有一种老写法是把根字号设为 <code>62.5%</code>，16px 的 62.5% 是 10px，这样 <code>1.5rem</code> 就是 15px，换算方便。实测在 Chrome 里设了以后，<code>1.5rem</code> 计算出来正是 15px。它基于百分比，用户把浏览器默认字号调大时会一起变大，比直接写 <code>html { font-size: 10px }</code> 好。</p>
<h2>一个页面里怎样分配 px、rem 和 em</h2>
<p>下面是一个常见的组合：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">html</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">100%</span>;
}

<span class="hljs-selector-tag">body</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-selector-class">.button</span> {
  <span class="hljs-attribute">font-size</span>: <span class="hljs-number">1.125rem</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">0.5em</span> <span class="hljs-number">1em</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid;
}
</code></pre></div>
<p>根字号保持 <code>100%</code>，也就是用户设置的默认字号，正文用 <code>1rem</code>。按钮字号是 <code>1.125rem</code>，根字号 16px 时是 18px；它的内边距用 <code>em</code>，按按钮自己的 18px 算，上下 9px、左右 18px，以后按钮字号调大，内边距会跟着变大。边框用 <code>1px</code>，不管字号多大都是一条细线。</p>
<p>为什么全局用 <code>rem</code> 而不是 <code>em</code>？因为 <code>em</code> 的参照会随所在位置变化，同一个组件放进字号不同的容器里，尺寸就不一样了；<code>rem</code> 只看根元素，放在哪里都一样。只有“希望跟着这个组件字号一起缩放”的尺寸才用 <code>em</code>。</p>
<p>移动端用 <code>rem</code> 或 <code>vw</code> 做整屏等比缩放的完整方案，见<a href="/questions/mobile-adaptation/">《移动端怎样做屏幕适配？1px 边框为什么看起来变粗了？》</a>；<code>vw</code>、<code>svh</code>、<code>dvh</code> 等视口单位，见<a href="/questions/css-units-viewport/">《vw、vh、svh、lvh、dvh 有什么区别？移动端整屏高度怎么写？》</a>。</p>
<h2>常见追问</h2>
<p><strong>子元素继承的是 em 还是算好的 px？</strong></p>
<blockquote>
<p>继承的是计算值。MDN 说明子元素不会继承父元素写的相对值，而是继承算出来的值。所以父元素 <code>font-size: 1.5em</code> 算出 24px，子元素继承到的就是 24px，子元素再写 <code>1.5em</code> 才会在 24px 的基础上乘。</p>
</blockquote>
<p><strong>rem 的根字号可以用媒体查询改吗？</strong></p>
<blockquote>
<p>可以。在媒体查询里改 <code>html</code> 的 <code>font-size</code>，所有 <code>rem</code> 尺寸会一起变。不过要用百分比或 <code>rem</code> 这类相对值来改，保留用户在浏览器里设置的默认字号。</p>
</blockquote>`};export{e as default};