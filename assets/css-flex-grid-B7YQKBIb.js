var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>Flex 是从内容出发的。项目先按自己的大小一个个排开，再分剩下的空间。换行以后，每一行各算各的。</p>
<p>Grid 是从布局出发的。先把行和列画好，这些行列叫轨道，再把项目放进格子里。所以不同行的同一列天然是对齐的。</p>
<p>所以要“最后一行的卡片和上面对齐”，用 Grid；要“按钮按文字宽度依次排开”，用 Flex。两者也经常嵌套使用，页面骨架用 Grid，卡片里一行图标加文字用 Flex。</p>
<p>它们都支持 <code>gap</code>，<code>justify-*</code>、<code>align-*</code> 这些对齐属性的用法也基本一样，换起来成本不高。</p>
</blockquote>
<h2>换行时差别最明显</h2>
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
<p>标签有长有短，用 Flex 让每个标签按自己的文字宽度排，排不下就换行，正合适。</p>
<p>卡片要整整齐齐排成列，就该用 Grid。有人用 Flex 加 <code>flex: 1 1 200px</code> 来做卡片网格，前几行看着没问题，可最后一行如果只剩两张，这两张会被拉宽，跟上面的列对不齐。原因就是 Flex 每一行单独分配空间，它不知道上一行的列在哪里。</p>
<h2>常见场景怎么选</h2>
<p>导航栏、按钮组、表单里的一行，这种一个方向排列的，用 Flex。</p>
<p>页面的头部、侧栏、主区、底部，以及卡片网格、图库，需要行和列同时对齐，用 Grid。</p>
<p>图标加文字垂直居中，两种都可以。子组件要对齐父布局的列，用 Grid 加 subgrid。</p>
<h2>居中怎么写</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.center</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">place-items</span>: center;
}
</code></pre></div>
<p>用 Flex 写是 <code>display: flex; justify-content: center; align-items: center;</code>，效果一样，Grid 写法只是更短。</p>
<h2>常见追问</h2>
<p><strong>Grid 的性能是不是比 Flex 差？</strong></p>
<blockquote>
<p>日常页面里，这点差别可以忽略。真正的性能问题通常来自布局抖动或者节点太多，而不是选了哪种布局。</p>
</blockquote>`};export{e as default};