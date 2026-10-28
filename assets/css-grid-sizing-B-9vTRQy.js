var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>fr</code> 分配的是减去固定轨道和间距后的剩余空间，<code>1fr 2fr</code> 按 1:2 分。</li>
<li><code>1fr</code> 的最小值是 <code>auto</code>，内容很宽时轨道会被撑开；要严格等分用 <code>minmax(0, 1fr)</code>。</li>
<li><code>repeat(auto-fill, minmax(200px, 1fr))</code> 按容器宽度放尽可能多的列，项目少时保留空列。</li>
<li><code>auto-fit</code> 规则相同，但会把没有项目的空轨道折叠成 0，已有项目会拉伸占满整行。</li>
<li>项目数足够填满一行时，两者结果完全一样。</li>
</ul>
<h2>自动列数</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.grid</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">200px</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">16px</span>;
}
</code></pre></div>
<p>容器 1000px、间距 16px 时可以放 4 列。只有 2 个项目时：</p>
<ul>
<li><code>auto-fill</code>：仍然生成 4 列，2 个项目各占一列宽度，右边空出两列。</li>
<li><code>auto-fit</code>：空的 2 列折叠，2 个项目各自拉宽到约 492px。</li>
</ul>
<p>商品列表这类希望卡片大小一致的场景用 <code>auto-fill</code>；希望少量项目铺满的用 <code>auto-fit</code>。</p>
<h2>fr 和 minmax</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> {
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">240px</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
}
</code></pre></div>
<p>侧栏固定 240px，主区占剩余空间。主区里有宽表格或长代码时，<code>minmax(0, 1fr)</code> 允许轨道比内容窄，内容自己滚动；只写 <code>1fr</code> 会把主区撑宽，页面出现横向滚动。</p>
<h2>隐式轨道</h2>
<p>项目超出显式定义的行时，浏览器自动创建隐式行，尺寸由 <code>grid-auto-rows</code> 决定：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.grid</span> {
  <span class="hljs-attribute">grid-auto-rows</span>: <span class="hljs-built_in">minmax</span>(<span class="hljs-number">120px</span>, auto);
}
</code></pre></div>
<p>每行至少 120px，内容多时自动变高。</p>
<h2>常见追问</h2>
<ul>
<li><code>minmax(200px, 1fr)</code> 在容器比 200px 还窄时怎么办？列不会小于 200px，会溢出容器。可以写成 <code>minmax(min(200px, 100%), 1fr)</code>，窄容器里退成一列。</li>
</ul>`};export{e as default};