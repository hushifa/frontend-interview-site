var e={answerHtml:`<h2>简答</h2>
<ul>
<li>定位错位先找包含块：absolute 通常相对最近建立定位包含块的祖先的 padding box。</li>
<li>非 <code>none</code> 的 <code>transform</code>、某些 <code>contain</code> 和 <code>will-change</code> 也会建立包含块，甚至让 fixed 元素不再相对视口。</li>
<li>sticky 在流中占位，需要设置所在轴的偏移（如 <code>top: 0</code>），并受最近滚动容器和自身包含块范围限制。</li>
<li>sticky 不生效时检查偏移、祖先的 overflow 和可活动空间。</li>
</ul>
<p><code>top: 0</code> 只说明“距离某个参照区域的顶部为 0”，没有说明这个区域是谁。定位错位时，首先要找的是<strong>包含块</strong>：浏览器用来计算元素尺寸和位置的参照矩形。它不一定是 DOM 的直接父元素，也不一定是整个屏幕。</p>
<h2>absolute：找建立绝对定位包含块的祖先</h2>
<p>常见做法是在卡片上设置 <code>position: relative</code>，让右上角的徽章相对卡片定位：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">article</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;card&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;badge&quot;</span>&gt;</span>新内容<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span>&gt;</span>CSS 定位<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>徽章跟随卡片，正文正常参与排版。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">article</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">position</span>: relative;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">3rem</span> <span class="hljs-number">1rem</span> <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">border</span>: <span class="hljs-number">1px</span> solid <span class="hljs-number">#cbd5e1</span>;
}

<span class="hljs-selector-class">.badge</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">top</span>: <span class="hljs-number">0.75rem</span>;
  <span class="hljs-attribute">right</span>: <span class="hljs-number">0.75rem</span>;
}
</code></pre></div>
<p><code>.card</code> 仍然占据正常流中的位置，单独设置 <code>position: relative</code> 而不偏移，不会把它移走；<code>.badge</code> 脱离正常流，不会为自己预留一行。卡片顶部的内边距是特意给徽章腾出的空间。</p>
<p>对于这种普通块级定位祖先，绝对定位包含块通常由祖先的 padding box 边缘形成。<code>top: 0</code> 不是“放到祖先内容区文字起点”，不能忽略祖先的内边距和边框。</p>
<p>如果没有相应祖先，绝对定位会回到初始包含块。只记“最近非 static 祖先”仍然不够：<code>transform</code> 非 <code>none</code>、某些 <code>contain</code>、相关 <code>will-change</code> 等条件，也可能建立绝对定位包含块，即便祖先本身没有改 <code>position</code>。</p>
<h2>fixed：通常固定在视口，但有例外</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.help</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">right</span>: <span class="hljs-number">1rem</span>;
  <span class="hljs-attribute">bottom</span>: <span class="hljs-number">1rem</span>;
}
</code></pre></div>
<p>没有特殊祖先时，帮助按钮通常固定在视口右下角，随页面滚动不会像普通内容那样滚走。它也脱离正常流，因此需要确保不会挡住最后一段内容或表单操作。</p>
<p>但如果按钮被放进下面这样的祖先：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.panel</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateZ</span>(<span class="hljs-number">0</span>);
}
</code></pre></div>
<p>这个非 <code>none</code> 的 <code>transform</code> 会为固定定位后代建立包含块。即使 <code>translateZ(0)</code> 看起来没有移动任何东西，按钮也可能变成相对 <code>.panel</code> 定位，随这个面板一起滚动。</p>
<p>这也是“给祖先加了一个性能优化样式，悬浮按钮突然不悬浮”的常见原因。<code>contain: layout</code>、<code>contain: paint</code> 等条件也需要检查；<code>filter</code>、<code>perspective</code> 相关行为还要结合目标浏览器确认。仅在父级加 <code>position: relative</code>，则不会像 <code>transform</code> 一样自动把普通 fixed 后代的参照改到父级。</p>
<p>组件库把浮层通过 Portal 挂到更靠外的容器，常常是为了避开这样的祖先条件。但 Portal 只改变挂载位置，不会自动解决所有遮挡、裁剪和交互问题。</p>
<h2>sticky：在流中占位，再受滚动阈值约束</h2>
<p><code>sticky</code> 最适合章节标题、表头、目录等“开始跟着内容走，到了某个位置再暂时停住”的元素。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;reader&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;chapter-title&quot;</span>&gt;</span>第一章<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>这里放置足够长的章节内容，使 reader 产生滚动。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.reader</span> {
  <span class="hljs-attribute">max-height</span>: <span class="hljs-number">24rem</span>;
  <span class="hljs-attribute">overflow</span>: auto;
}

<span class="hljs-selector-class">.chapter-title</span> {
  <span class="hljs-attribute">position</span>: sticky;
  <span class="hljs-attribute">top</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">padding</span>: <span class="hljs-number">0.75rem</span>;
  <span class="hljs-attribute">background</span>: white;
  <span class="hljs-attribute">z-index</span>: <span class="hljs-number">1</span>;
}
</code></pre></div>
<p>当 <code>.reader</code> 的实际内容超过限高时，它成为可滚动区域。标题先按正常流排版，占位不消失；滚动到顶部阈值后，浏览器调整标题的视觉位置，使其在允许范围内贴住这个滚动区域顶部。</p>
<p>它不是一触发就永久变成 fixed。标题还要留在自身包含块的边界范围内，章节滚动到结尾时，不能无限停留在上方。示例如果只有一小段文字、不足以滚动，就看不到吸顶过程。</p>
<h2>sticky 没生效，应该检查什么</h2>
<p>先检查希望吸附的轴上有没有非 <code>auto</code> 的偏移，比如垂直方向的 <code>top: 0</code>。只写 <code>position: sticky</code>，该轴两端偏移仍为 <code>auto</code>，不会得到期待的粘性效果。</p>
<p>然后沿祖先检查 <code>overflow</code>。最近带滚动机制的祖先可能是 <code>overflow: auto</code>、<code>scroll</code> 或 <code>hidden</code> 的盒子，即使它当前并没有实际滚动。一个为了裁切内容而加入的 <code>overflow: hidden</code> 容器，就可能让 sticky 不再跟随页面滚动。单独设置某一轴的 overflow 还可能影响另一轴的计算值，要看 DevTools 的计算结果，而不只看源码。</p>
<p><code>overflow: clip</code> 单独使用时不建立滚动容器，与 <code>hidden</code> 不同，但它仍会裁切内容，也不支持相同的程序化滚动用途，不能不分析需求就直接替换。</p>
<p>最后检查空间：如果粘性元素被 Grid/Flex 拉伸得和可活动区域一样高，或者父级本来就没有足够长度，就可能没有可见的移动区间。按布局需要调整 <code>align-self: start</code> 等约束，比随意加大 <code>z-index</code> 更有效。</p>
<p>包含块回答“相对哪里定位”，滚动容器回答“哪块区域在滚”，层叠上下文回答“谁画在谁上面”，裁剪回答“哪些部分不允许画出来”。四者可能来自同一个祖先，但不是同一个概念，应分别定位问题。</p>`};export{e as default};