var e={answerHtml:`<p><code>content-box</code> 下，声明的 <code>width</code> 指内容区宽度，边框盒宽度还要加上左右 padding 与 border。<code>border-box</code> 下，声明的宽度包含内容、padding 和 border。margin 不属于这两种宽度。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css">*, *<span class="hljs-selector-pseudo">::before</span>, *<span class="hljs-selector-pseudo">::after</span> {
  <span class="hljs-attribute">box-sizing</span>: border-box;
}
</code></pre></div>
<p>实际布局还会受到 <code>min-width</code>、<code>max-width</code>、Flex 收缩和内容最小尺寸等约束。排查“宽度不对”时，应检查最终计算样式，而不只看 width。</p>
<h3>实现检查</h3>
<p>实际排查时先看语义结构和布局上下文，再查看计算后的样式、盒模型、层叠来源和绘制结果。把视觉问题拆成结构、尺寸、定位和绘制几步，通常比反复修改一个 CSS 属性更容易定位原因。</p>
<p>交付前还要检查键盘操作、响应式断点、文本放大、打印和减少动画偏好。兼容性结论应以目标浏览器和特性检测为前提，不要把某个浏览器的偶发现象当成通用规则。</p>`};export{e as default};