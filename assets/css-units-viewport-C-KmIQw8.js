var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>字号和主要的间距用 <code>rem</code>，它相对根元素的字号。用户在浏览器设置里调大默认字号，整个页面会一起放大。用 <code>px</code> 写死字号，就把用户的这个设置忽略了。</p>
<p><code>em</code> 相对当前元素的字号，适合跟着组件一起缩放的尺寸，比如按钮内边距写成 <code>em</code>，按钮字号变大，内边距也跟着变大。要注意 <code>em</code> 嵌套使用时会一层层叠加。边框、阴影这类不需要跟着字号变的细节，用 <code>px</code>。</p>
<p>百分比参照什么，要看是哪个属性。<code>width</code> 参照包含块的宽度；<code>padding</code> 和 <code>margin</code> 也参照包含块的宽度，上下方向也是；<code>transform: translate</code> 参照元素自己。</p>
<p>移动端整屏高度最容易出问题。<code>100vh</code> 等于工具栏收起时的大视口，页面刚打开时工具栏是展开的，底部就被遮住了。<code>100svh</code> 是工具栏展开时的小视口，<code>100dvh</code> 跟着工具栏实时变化。</p>
</blockquote>
<h2>一个常见的组合</h2>
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

<span class="hljs-selector-class">.hero</span> {
  <span class="hljs-attribute">min-block-size</span>: <span class="hljs-number">100s</span>vh;
}
</code></pre></div>
<p>根字号保持 <code>100%</code>，也就是用户设置的默认字号。按钮的内边距用 <code>em</code>，是按按钮自己的 1.125rem 来算的。边框用 <code>1px</code>，不管字号多大都是一条细线。首屏区块用 <code>100svh</code>，保证工具栏展开时也能完整看到。</p>
<p>以前流行把根字号设成 <code>62.5%</code>，让 1rem 等于 10px，方便换算。可是这改变了用户默认字号的基准，现在一般不推荐。</p>
<h2>三种视口高度怎么选</h2>
<p>手机浏览器的地址栏和工具栏会随着滚动收起和展开，所以视口高度不是一个固定值。</p>
<p><code>svh</code> 是工具栏全部展开时的高度，也就是最小的视口。首屏内容必须完整可见时用它。</p>
<p><code>lvh</code> 是工具栏全部收起时的高度，也就是最大的视口。背景、装饰这类被挡住一点也无所谓的，可以用它。</p>
<p><code>dvh</code> 是当前实际的高度，会变。适合全屏应用的外壳。可是在长页面里，用户一滚动工具栏就变，<code>dvh</code> 的元素高度也跟着跳，所以不要用在普通区块上。</p>
<h2>其他常用单位</h2>
<p><code>ch</code> 是当前字体里“0”这个字符的宽度，<code>max-inline-size: 65ch</code> 常用来控制正文一行的长度。</p>
<p><code>lh</code> 是当前的行高，适合按行数设置高度。</p>
<p><code>cqi</code> 是容器查询单位，相对于查询容器的行内尺寸。</p>
<p><code>vw</code> 包含滚动条的宽度。所以桌面上有竖向滚动条时，<code>width: 100vw</code> 比页面可用宽度更宽，会多出横向滚动条。</p>
<h2>常见追问</h2>
<p><strong>字号要不要跟着屏幕宽度缩放？</strong></p>
<blockquote>
<p>可以用 <code>clamp(1rem, 0.9rem + 0.5vw, 1.25rem)</code> 这种写法。但中间那部分一定要包含 <code>rem</code>。只写 <code>vw</code> 的话，用户放大页面时视口宽度不变，字号也就不会变大。</p>
</blockquote>`};export{e as default};