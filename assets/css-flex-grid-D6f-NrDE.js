var e={answerHtml:`<p>Flexbox 主要处理一个方向上的空间分配，适合工具栏、导航和内容驱动的排列。Grid 同时定义行与列，适合卡片网格、页面骨架和跨行跨列布局。</p>
<p>实际排查时先看语义结构和布局上下文，再查看计算后的样式、盒模型、层叠来源和绘制结果。把视觉问题拆成结构、尺寸、定位和绘制几步，通常比反复修改一个 CSS 属性更容易定位原因。</p>
<p>两者可以组合使用。例如外层 Grid 划分侧栏与内容区，卡片内部使用 Flex 对齐标题和按钮。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">240px</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">32px</span>;
}
</code></pre></div>
<p><code>minmax(0, 1fr)</code> 可以避免主列被长内容的默认最小尺寸撑开；Flex 子项有类似问题时可检查 <code>min-width: 0</code>。</p>
<p>交付前还要检查键盘操作、响应式断点、文本放大、打印和减少动画偏好。兼容性结论应以目标浏览器和特性检测为前提，不要把某个浏览器的偶发现象当成通用规则。</p>
<p>在实际项目中，先用一个最小 DOM 结构复现问题，再分别修改结构、布局和样式来源。这样能区分是选择器没有命中、布局上下文不同，还是元素已经绘制但被遮挡；修复后再回到真实页面验证长文本和窄屏。</p>`};export{e as default};