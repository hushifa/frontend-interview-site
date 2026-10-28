var e={answerHtml:`<h2>简答</h2>
<ul>
<li>结构：<code>role=&quot;tree&quot;</code> 包含若干 <code>role=&quot;treeitem&quot;</code>，有子节点的项加 <code>aria-expanded</code>，子节点包在 <code>role=&quot;group&quot;</code> 中。</li>
<li>只有当前项 <code>tabindex=&quot;0&quot;</code>，其余 <code>-1</code>；Tab 进出整棵树一次。</li>
<li>键盘：↓/↑ 移动到下一个或上一个可见节点，→ 展开或进入第一个子节点，← 折叠或回到父节点，Home/End 跳到首尾，Enter 激活。</li>
<li>多选树在 tree 上加 <code>aria-multiselectable=&quot;true&quot;</code>，节点用 <code>aria-selected</code> 表示选中。</li>
<li>文件导航、侧栏目录这类只需要展开和跳转的场景，用嵌套 <code>ul</code> 加链接或 <code>&lt;details&gt;</code> 更简单，读屏体验也更稳定。</li>
</ul>
<h2>结构</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tree&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;项目文件&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;treeitem&quot;</span> <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;0&quot;</span>&gt;</span>
    src
    <span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;group&quot;</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;treeitem&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>main.ts<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;treeitem&quot;</span> <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;false&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>
        components
        <span class="hljs-tag">&lt;<span class="hljs-name">ul</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;group&quot;</span> <span class="hljs-attr">hidden</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;treeitem&quot;</span> <span class="hljs-attr">tabindex</span>=<span class="hljs-string">&quot;-1&quot;</span>&gt;</span>Button.tsx<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
</code></pre></div>
<p>叶子节点不要写 <code>aria-expanded</code>，否则读屏会读成“已折叠”。折叠的子组要真正隐藏（<code>hidden</code>），否则读屏仍能浏览到它们。</p>
<h2>键盘移动</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">visibleItems</span>(<span class="hljs-params">tree</span>) {
  <span class="hljs-keyword">return</span> [...tree.<span class="hljs-title function_">querySelectorAll</span>(<span class="hljs-string">&#x27;[role=&quot;treeitem&quot;]&#x27;</span>)].<span class="hljs-title function_">filter</span>(
    <span class="hljs-function">(<span class="hljs-params">item</span>) =&gt;</span> !item.<span class="hljs-title function_">closest</span>(<span class="hljs-string">&#x27;[role=&quot;group&quot;][hidden]&#x27;</span>),
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">moveFocus</span>(<span class="hljs-params">tree, current, offset</span>) {
  <span class="hljs-keyword">const</span> items = <span class="hljs-title function_">visibleItems</span>(tree);
  <span class="hljs-keyword">const</span> next = items[items.<span class="hljs-title function_">indexOf</span>(current) + offset];
  <span class="hljs-keyword">if</span> (!next) <span class="hljs-keyword">return</span>;
  current.<span class="hljs-property">tabIndex</span> = -<span class="hljs-number">1</span>;
  next.<span class="hljs-property">tabIndex</span> = <span class="hljs-number">0</span>;
  next.<span class="hljs-title function_">focus</span>();
}
</code></pre></div>
<p>“可见节点”是指所有祖先都已展开的节点，方向键只在这些节点之间移动。</p>
<h2>大型树</h2>
<ul>
<li>节点很多时只渲染展开部分，为每个节点设置 <code>aria-level</code>、<code>aria-setsize</code>、<code>aria-posinset</code>，读屏才能读出“第 2 级，共 5 项中的第 3 项”。</li>
<li>异步加载子节点时设置 <code>aria-busy=&quot;true&quot;</code>，加载完成后再移除。</li>
<li>支持输入首字母跳到匹配的节点，是 APG 推荐的可选行为。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>侧栏导航要不要用 <code>role=&quot;tree&quot;</code>？通常不要。tree 角色会让读屏进入应用模式，用户必须用方向键而不能用常规的链接浏览方式。普通导航用嵌套列表和链接即可。</li>
</ul>`};export{e as default};