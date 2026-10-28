var e={answerHtml:`<h2>简答</h2>
<ul>
<li>Flex 从内容出发：项目先按自身大小排开，再分配剩余空间，换行后每行独立计算。</li>
<li>Grid 从布局出发：先定义轨道，项目放进格子，不同行的同一列天然对齐。</li>
<li>需要“最后一行的卡片和上面对齐”时用 Grid；需要“按钮按文字宽度依次排开”时用 Flex。</li>
<li>两者可以嵌套：页面骨架用 Grid，卡片内部的一行图标和文字用 Flex。</li>
<li>两者都支持 <code>gap</code>，对齐属性（<code>justify-*</code>、<code>align-*</code>）用法基本一致。</li>
</ul>
<h2>换行时的差别</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.tags</span> {
  <span class="hljs-attribute">display</span>: flex;
  <span class="hljs-attribute">flex-wrap</span>: wrap;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">8px</span>;
}

<span class="hljs-selector-class">.cards</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">200px</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">16px</span>;
}
</code></pre></div>
<p>标签长短不一，用 Flex 让每个标签按内容宽度排列。卡片要整齐成列，用 Grid；如果用 Flex 加 <code>flex: 1 1 200px</code>，最后一行剩下的卡片会被拉宽，和上面的列对不齐。</p>
<h2>典型选择</h2>
<table><thead><tr><th>场景</th><th>选择</th></tr></thead><tbody><tr><td>导航栏、按钮组、表单一行</td><td>Flex</td></tr><tr><td>页面头部、侧栏、主区、底部</td><td>Grid</td></tr><tr><td>卡片网格、图库</td><td>Grid</td></tr><tr><td>图标加文字垂直居中</td><td>Flex 或 Grid 都可以</td></tr><tr><td>子组件要对齐父布局的列</td><td>Grid 加 subgrid</td></tr></tbody></table>
<h2>居中</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.center</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">place-items</span>: center;
}
</code></pre></div>
<p>Flex 写法是 <code>display: flex; justify-content: center; align-items: center;</code>，效果相同。</p>
<h2>常见追问</h2>
<ul>
<li>Grid 性能比 Flex 差吗？日常页面里差别可以忽略。性能问题通常来自布局抖动或节点过多，而不是选了哪种布局。</li>
</ul>`};export{e as default};