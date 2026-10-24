var e={answerHtml:`<p>Flexbox 主要处理一个方向上的空间分配，适合工具栏、导航和内容驱动的排列。Grid 同时定义行与列，适合卡片网格、页面骨架和跨行跨列布局。</p>
<p>两者可以组合使用。例如外层 Grid 划分侧栏与内容区，卡片内部使用 Flex 对齐标题和按钮。</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">240px</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">32px</span>;
}
</code></pre></div>
<p><code>minmax(0, 1fr)</code> 可以避免主列被长内容的默认最小尺寸撑开；Flex 子项有类似问题时可检查 <code>min-width: 0</code>。</p>
<h3>复习提示</h3>
<p>回答时先区分 HTML 语义、CSS 规则和浏览器默认行为，再说明结构、样式与交互之间的影响。涉及兼容性时给出目标浏览器范围，不把某个浏览器的现象当成规范结论。可先用一个最小示例验证“Flexbox、Grid、布局”，再补充空值、异常和兼容性边界。</p>`};export{e as default};