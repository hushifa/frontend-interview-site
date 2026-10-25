var e={answerHtml:`<p>同一组工具按钮，在文章页希望留白舒适，在数据表格旁希望紧凑。两处区域的宽度可能完全一样，因此尺寸查询不能表达这个区别。这里的依据是父级选择的“显示密度”，可以使用容器样式查询，让内部组件读取祖先的配置。</p>
<p><strong>尺寸查询问“容器有多大”，样式查询问“容器上的某项样式是否满足条件”。</strong> 常见实现是通过 <code>style(--自定义属性: 值)</code> 查询 CSS 自定义属性。不要据此推断所有普通 CSS 属性都已经能在所有浏览器中查询。</p>
<h3>一个紧凑工具栏的例子</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;workspace&quot;</span> <span class="hljs-attr">data-density</span>=<span class="hljs-string">&quot;compact&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;toolbar&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;文档操作&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>预览<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.workspace</span> {
  <span class="hljs-attribute">container-name</span>: workspace;
  <span class="hljs-attr">--density</span>: comfortable;
}

<span class="hljs-selector-class">.workspace</span><span class="hljs-selector-attr">[data-density=<span class="hljs-string">&quot;compact&quot;</span>]</span> {
  <span class="hljs-attr">--density</span>: compact;
}

<span class="hljs-selector-class">.toolbar</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">flex-wrap</span>: wrap;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">0.75rem</span>;
}

<span class="hljs-selector-class">.toolbar</span> <span class="hljs-selector-tag">button</span> {
  <span class="hljs-attribute">font</span>: inherit;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">0.75rem</span> <span class="hljs-number">1rem</span>;
}

<span class="hljs-keyword">@container</span> workspace style(<span class="hljs-attribute">--density</span>: compact) {
  <span class="hljs-selector-class">.toolbar</span> {
    <span class="hljs-attribute">gap</span>: <span class="hljs-number">0.375rem</span>;
  }

  <span class="hljs-selector-class">.toolbar</span> <span class="hljs-selector-tag">button</span> {
    <span class="hljs-attribute">padding</span>: <span class="hljs-number">0.5rem</span> <span class="hljs-number">0.75rem</span>;
  }
}
</code></pre></div>
<p>外层的 <code>data-density</code> 把配置写成 <code>--density: compact</code>。查询找到名为 <code>workspace</code> 的祖先，读取它的自定义属性；条件满足后，内部工具栏缩小间距和按钮内边距。移除 <code>data-density=&quot;compact&quot;</code>，就回到基础布局。</p>
<p>这里没有 <code>container-type: inline-size</code>，因为我们没有查询宽度。仅做这种样式查询，不需要为了建立尺寸容器而给布局增加尺寸包含。<code>container-name</code> 的作用是明确读取哪一层祖先，特别适合页面上有多个可嵌套的配置区域时使用。</p>
<p>规则仍然作用于容器里的元素，不能用这条查询让 <code>.workspace</code> 依据自己的 <code>--density</code> 再改变自己的该属性。选中 <code>.workspace</code> 时，查询会寻找它的祖先，而不是把它自身当作查询来源。</p>
<h3>为什么不直接使用 CSS 变量</h3>
<p>如果只需要改变一个间距，变量往往更简单：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.workspace</span> {
  <span class="hljs-attr">--toolbar-gap</span>: <span class="hljs-number">0.75rem</span>;
}

<span class="hljs-selector-class">.workspace</span><span class="hljs-selector-attr">[data-density=<span class="hljs-string">&quot;compact&quot;</span>]</span> {
  <span class="hljs-attr">--toolbar-gap</span>: <span class="hljs-number">0.375rem</span>;
}

<span class="hljs-selector-class">.toolbar</span> {
  <span class="hljs-attribute">gap</span>: <span class="hljs-built_in">var</span>(--toolbar-gap, <span class="hljs-number">0.75rem</span>);
}
</code></pre></div>
<p>这已经足以解决“传一个值”的问题。样式查询更适合一个语义配置需要触发多条规则的情况，例如 <code>compact</code> 同时影响间距、说明文字的展示方式和工具栏布局。它让组件解释配置，而不是要求父级了解每个内部选择器。</p>
<p>如果父子结构固定、没有复用需要，<code>.workspace[data-density=&quot;compact&quot;] .toolbar</code> 也完全合理。不能因为语法新，就把简单的后代选择器全部改成样式查询。</p>
<h3>自定义属性的值如何比较</h3>
<p>未注册的自定义属性通常不会被当成颜色、长度等具体类型理解。比如 <code>--accent: #0000ff</code> 与查询中的 <code>style(--accent: blue)</code>，不能只因为肉眼看到同一种蓝色，就认为一定匹配。通过 <code>@property</code> 注册类型会影响计算与比较规则，也会影响初始值和继承。</p>
<p>对于密度、主题模式等开关，用 <code>compact</code>、<code>comfortable</code> 这样约定明确的值更容易维护。普通自定义属性默认会继承；如果不用容器名称，最近的祖先也可能已经继承了该值，因此要区分“值从哪儿继承”与“查询选中了哪个祖先”。</p>
<p>兼容性要按 <code>style()</code> 的具体功能核对，支持尺寸查询不代表支持所有样式查询。在目标浏览器实测上述 <code>data-density</code> 切换；不支持时保留舒适的基础布局即可。若紧凑模式是必要功能，则使用类名或属性选择器作为实现或回退，不要让关键内容依赖查询成功才出现。</p>`};export{e as default};