var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>树控件就是编辑器侧栏里那种文件树，文件夹可以层层展开。结构上，<code>role=&quot;tree&quot;</code> 包着若干 <code>role=&quot;treeitem&quot;</code>；有子节点的项加 <code>aria-expanded</code> 表示展开还是折叠，子节点包在 <code>role=&quot;group&quot;</code> 里。</p>
<p>整棵树只占一个 Tab 位置。只有当前项是 <code>tabindex=&quot;0&quot;</code>，其余都是 <code>-1</code>，用户 Tab 一次进去，再 Tab 一次就出来。在树里面用键盘走：↓ 和 ↑ 移到下一个或上一个可见节点，→ 展开或进入第一个子节点，← 折叠或回到父节点，Home 和 End 跳到首尾，Enter 激活。要支持多选，就在 tree 上加 <code>aria-multiselectable=&quot;true&quot;</code>，节点用 <code>aria-selected</code> 表示选中。</p>
<p>不过不是所有层级结构都该做成 tree。文件导航、侧栏目录这类只需要展开和跳转的场景，用嵌套的 <code>ul</code> 加链接，或者 <code>&lt;details&gt;</code>，更简单，读屏体验也更稳定。</p>
</blockquote>
<h2>结构怎么写</h2>
<p>下面是一棵小文件树，<code>src</code> 展开着，<code>components</code> 折叠着。</p>
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
<p>注意 <code>main.ts</code> 没有 <code>aria-expanded</code>。它是叶子节点，没有可以展开的东西；如果也写上，读屏会把它读成“已折叠”，用户会以为里面还有内容。</p>
<p><code>components</code> 下面的 <code>group</code> 加了 <code>hidden</code>。折叠的子组一定要真正隐藏，否则读屏用户仍然能浏览到里面的节点，和视觉上看到的不一致。</p>
<h2>方向键怎样只走可见节点</h2>
<p>按 ↓ 时，焦点应该跳过折叠起来的节点。下面先找出所有可见节点，再按偏移量移动。</p>
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
<p>“可见节点”指的是所有祖先都已经展开的节点。判断方法很直接：如果一个节点被某个隐藏的 <code>group</code> 包着，它就看不见。</p>
<p>移动时把旧节点的 <code>tabIndex</code> 改成 -1，新节点改成 0。这样用户 Tab 出去再回来，焦点还停在上次的位置，这就是漫游 tabindex。</p>
<h2>树很大时怎么办</h2>
<p>节点很多时，通常只渲染展开的部分。可这样一来，读屏就数不出层级和位置了。所以要给每个节点设置 <code>aria-level</code>、<code>aria-setsize</code>、<code>aria-posinset</code>，读屏才能读出类似“第 2 级，共 5 项中的第 3 项”。</p>
<p>子节点是异步加载的，就在加载期间设置 <code>aria-busy=&quot;true&quot;</code>，加载完再移除。APG 还推荐一个可选行为：输入首字母，跳到匹配的节点。</p>
<h2>常见追问</h2>
<p><strong>侧栏导航要不要用 <code>role=&quot;tree&quot;</code>？</strong></p>
<blockquote>
<p>一般不要。tree 角色会让读屏进入应用模式，用户必须用方向键操作，不能用平时浏览链接的方式。普通导航用嵌套列表加链接就够了。</p>
</blockquote>`};export{e as default};