var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>fr</code> 是“份”的意思，分的是去掉固定宽度的列和间距以后剩下的空间，<code>1fr 2fr</code> 就是按 1:2 分。</p>
<p>要注意 <code>1fr</code> 的最小值是 <code>auto</code>，内容很宽时这一列会被撑开。想严格等分，要写 <code>minmax(0, 1fr)</code>。</p>
<p>想让列数跟着容器宽度变，用 <code>repeat(auto-fill, minmax(200px, 1fr))</code>，它会尽量多放列。<code>auto-fit</code> 规则一样，区别在于项目少、放不满一行时，<code>auto-fill</code> 把空列留着，<code>auto-fit</code> 把空列收成 0，让已有的项目拉宽铺满。</p>
<p>项目多到能填满一行时，两者的结果完全一样。</p>
</blockquote>
<h2>auto-fill 和 auto-fit 差在哪里</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.grid</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fill, <span class="hljs-built_in">minmax</span>(<span class="hljs-number">200px</span>, <span class="hljs-number">1</span>fr));
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">16px</span>;
}
</code></pre></div>
<p>容器宽 1000px，间距 16px，每列至少 200px，算下来可以放 4 列。现在只有 2 个项目，会怎样？</p>
<p>用 <code>auto-fill</code>，浏览器还是生成 4 列，2 个项目各占一列，右边空着两列。用 <code>auto-fit</code>，空着的 2 列被收成 0 宽，2 个项目各自拉宽到约 492px，铺满整行。</p>
<p>所以商品列表这种希望每张卡片大小一致的，用 <code>auto-fill</code>；希望项目少时也铺满一行的，用 <code>auto-fit</code>。</p>
<h2>为什么写了 1fr，页面还是出现横向滚动条</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> {
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">240px</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
}
</code></pre></div>
<p>侧栏固定 240px，主区占剩下的空间。如果第二列只写 <code>1fr</code>，主区里放一张很宽的表格或一段很长的代码，整个页面就会出现横向滚动条。</p>
<p>原因是 <code>1fr</code> 其实等于 <code>minmax(auto, 1fr)</code>，最小值是 <code>auto</code>，也就是内容的最小宽度，内容多宽这一列就至少多宽。写成 <code>minmax(0, 1fr)</code>，允许这一列比内容窄，内容自己在里面滚动。</p>
<h2>项目超出了定义的行怎么办</h2>
<p>项目比你定义的行还多时，浏览器会自动加行，这些自动加出来的行叫隐式轨道，高度由 <code>grid-auto-rows</code> 决定：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.grid</span> {
  <span class="hljs-attribute">grid-auto-rows</span>: <span class="hljs-built_in">minmax</span>(<span class="hljs-number">120px</span>, auto);
}
</code></pre></div>
<p>每行至少 120px，内容多时自动变高。</p>
<h2>常见追问</h2>
<p><strong>容器比 200px 还窄时，<code>minmax(200px, 1fr)</code> 会怎样？</strong></p>
<blockquote>
<p>列不会小于 200px，所以会溢出容器。可以改成 <code>minmax(min(200px, 100%), 1fr)</code>，容器很窄时，最小值变成容器宽度，退成一列。</p>
</blockquote>`};export{e as default};