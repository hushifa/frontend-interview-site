var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>fr</code> 分配的是扣除固定轨道和 gap 之后的剩余空间。</li>
<li>单独的 <code>1fr</code> 隐含 <code>minmax(auto, 1fr)</code>，长内容会撑大轨道；<code>minmax(0, 1fr)</code> 允许列缩小，但内容仍要自己处理换行或滚动。</li>
<li><code>repeat(auto-fill, minmax(min(100%, 16rem), 1fr))</code> 可以按容器宽度自动决定列数，并在窄容器里不溢出。</li>
<li><code>auto-fill</code> 保留空轨道，<code>auto-fit</code> 折叠空轨道，让已有项目铺满一行。</li>
</ul>
<p>做一个商品列表时，通常要解决三件事：一行能放几列，每列如何瓜分空间，以及商品只有一两个时要不要把它们拉得很宽。<code>fr</code>、<code>minmax()</code> 和自动重复分别处理这些问题，不是几个可以随意互换的写法。</p>
<h2><code>fr</code> 分的是剩余空间</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.layout</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">width</span>: <span class="hljs-number">900px</span>;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">20px</span>;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">200px</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr) <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">2</span>fr);
}
</code></pre></div>
<p>假设没有额外的尺寸约束，先扣掉第一列的 <code>200px</code> 和两个 <code>20px</code> 间隙，还剩 <code>660px</code>。后两列按 1:2 分配，分别得到 <code>220px</code>、<code>440px</code>。</p>
<p>所以 <code>1fr 2fr</code> 不是各占容器总宽度的三分之一和三分之二，它们还要考虑固定轨道、间隙以及轨道自身的尺寸限制。相较直接写百分比，<code>fr</code> 在分配空间时会计入 <code>gap</code>，避免“列宽已经占满 100%，再加间隙就溢出”的常见问题。</p>
<h2>为什么常写 <code>minmax(0, 1fr)</code></h2>
<p>单独的 <code>1fr</code> 轨道隐含了自动最小值，通常可以理解成 <code>minmax(auto, 1fr)</code>。自动最小值可能受网格项目的内容贡献影响，因此一段很长、不能换行的内容有机会把轨道撑大。</p>
<p><code>minmax(0, 1fr)</code> 把轨道最小值明确设为 0，让这一列可以小于内容原本要求的最小宽度。但<strong>允许列缩小，不等于内容已经能正确展示</strong>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.article-layout</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-number">15rem</span> <span class="hljs-built_in">minmax</span>(<span class="hljs-number">0</span>, <span class="hljs-number">1</span>fr);
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
}

<span class="hljs-selector-class">.article-layout</span> &gt; <span class="hljs-selector-tag">main</span> {
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
}

<span class="hljs-selector-class">.article-layout</span> pre {
  <span class="hljs-attribute">max-width</span>: <span class="hljs-number">100%</span>;
  <span class="hljs-attribute">overflow</span>: auto;
}
</code></pre></div>
<p>这里正文可以换行，代码块在自身范围内横向滚动。把所有内容直接设成 <code>overflow: hidden</code> 虽然也能遮住溢出，却可能让用户看不到完整代码，不能混为一种修复。</p>
<p><code>minmax()</code> 的两个参数是轨道最小值与最大值，例如 <code>minmax(12rem, 1fr)</code> 表示至少 <code>12rem</code>，有余地时参与弹性分配。它不是“先按 1fr 算，再保证一定不溢出”，当容器小于 <code>12rem</code> 时，这个固定下限本身仍可能造成溢出。</p>
<h2>自动列数和窄屏下限一起处理</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;cards&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span>&gt;</span>课程一<span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span>&gt;</span>课程二<span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">article</span>&gt;</span>课程三<span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.cards</span> {
  <span class="hljs-attribute">display</span>: grid;
  <span class="hljs-attribute">gap</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">grid-template-columns</span>: <span class="hljs-built_in">repeat</span>(auto-fit, <span class="hljs-built_in">minmax</span>(<span class="hljs-built_in">min</span>(<span class="hljs-number">100%</span>, <span class="hljs-number">16rem</span>), <span class="hljs-number">1</span>fr));
}

<span class="hljs-selector-class">.cards</span> &gt; <span class="hljs-selector-tag">article</span> {
  <span class="hljs-attribute">min-width</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow-wrap</span>: anywhere;
}
</code></pre></div>
<p><code>repeat()</code> 重复的是轨道定义。这里浏览器会按当前容器宽度和间隙，计算能容纳多少列，而不是我们手动枚举手机两列、平板三列等断点。</p>
<p><code>min(100%, 16rem)</code> 在空间足够时提供 <code>16rem</code> 的下限，容器比这个值更窄时则允许下限降为容器宽度。否则直接写 <code>minmax(16rem, 1fr)</code>，在非常窄的侧栏里即使只排一列，也可能超出容器。</p>
<p>这类规则适合容器宽度已由页面布局明确分配的普通卡片列表。如果容器自身宽度完全依靠内容推导，自动重复和百分比尺寸的解析还会涉及内在尺寸规则，不能拿固定宽度下的计算直接套用。</p>
<h2><code>auto-fill</code> 和 <code>auto-fit</code> 到底差在哪</h2>
<p>把例子简化为宽 <code>700px</code> 的容器、<code>20px</code> 间隙、最小列宽 <code>200px</code>。一行最多能容纳三列，因为 <code>3 × 200 + 2 × 20 = 640px</code>，而四列放不下。</p>
<p>如果只有两个项目：</p>
<ul>
<li><code>repeat(auto-fill, minmax(200px, 1fr))</code> 保留三条轨道，三列各分得 <code>220px</code>。第三列虽然没有项目，仍然占位。</li>
<li><code>repeat(auto-fit, minmax(200px, 1fr))</code> 先按相同方式计算轨道数，再折叠空轨道及相应间隙。两个项目所在的列各分得 <code>340px</code>。</li>
</ul>
<p>如果三列都被占用，两种方式往往看起来没有区别。<code>auto-fit</code> 折叠的是<strong>整条没有流内项目放入或跨越的重复轨道</strong>，不是逐行删除每一行末尾的空格子。因此有四个项目时，第一行占满三列、第二行只有一个项目，第二行这个项目不会自动独占整行。</p>
<p>希望商品卡片在数量少时仍保持类似的列槽位，可以选 <code>auto-fill</code>；希望少量内容主动铺满一行，可以选 <code>auto-fit</code>。如果需要最后一行的每项单独伸展，可能更适合按行分配空间的 Flex，或者另行设计布局规则。</p>`};export{e as default};