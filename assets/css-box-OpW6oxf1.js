var e={answerHtml:`<p><code>content-box</code> 下，声明的 <code>width</code> 指内容区宽度，边框盒宽度还要加上左右 padding 与 border。<code>border-box</code> 下，声明的宽度包含内容、padding 和 border。margin 不属于这两种宽度。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css">*, *<span class="hljs-selector-pseudo">::before</span>, *<span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
}
</code></pre></div>
<p>实际布局还会受到 <code>min-width</code>、<code>max-width</code>、Flex 收缩和内容最小尺寸等约束。排查“宽度不对”时，应检查最终计算样式，而不只看 width。</p>
<h3>复习提示</h3>
<p>回答时先区分 HTML 语义、CSS 规则和浏览器默认行为，再说明结构、样式与交互之间的影响。涉及兼容性时给出目标浏览器范围，不把某个浏览器的现象当成规范结论。可先用一个最小示例验证“盒模型、box-sizing”，再补充空值、异常和兼容性边界。</p>`};export{e as default};