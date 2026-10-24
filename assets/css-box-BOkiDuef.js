var e={answerHtml:`<p><code>content-box</code> 下，声明的 <code>width</code> 指内容区宽度，边框盒宽度还要加上左右 padding 与 border。<code>border-box</code> 下，声明的宽度包含内容、padding 和 border。margin 不属于这两种宽度。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css">*, *<span class="hljs-selector-pseudo">::before</span>, *<span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
}
</code></pre></div>
<p>实际布局还会受到 <code>min-width</code>、<code>max-width</code>、Flex 收缩和内容最小尺寸等约束。排查“宽度不对”时，应检查最终计算样式，而不只看 width。</p>`};export{e as default};