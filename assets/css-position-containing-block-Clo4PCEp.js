var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>absolute</code> 的包含块是最近的 <code>position</code> 非 <code>static</code> 的祖先的内边距盒；找不到时是初始包含块。</li>
<li><code>fixed</code> 默认相对视口，但祖先设置了 <code>transform</code>、<code>perspective</code>、<code>filter</code>、<code>contain: paint</code> 或对应的 <code>will-change</code> 时，会相对该祖先定位。</li>
<li><code>sticky</code> 在最近的滚动祖先里按 <code>top</code> 等阈值吸附，吸附范围不超过自己的父元素。</li>
<li>百分比的 <code>top</code>、<code>width</code> 也按包含块计算。</li>
<li>浮层被裁剪或位置不对时，先在开发者工具里找到它的包含块。</li>
</ul>
<h2>absolute</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">position</span>: relative;
}

<span class="hljs-selector-class">.card</span> <span class="hljs-selector-class">.badge</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">inset-block-start</span>: <span class="hljs-number">8px</span>;
  <span class="hljs-attribute">inset-inline-end</span>: <span class="hljs-number">8px</span>;
}
</code></pre></div>
<p><code>.card</code> 设置 <code>position: relative</code> 只是为了成为包含块，本身不移动。</p>
<h2>fixed 失效</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.modal-wrapper</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateZ</span>(<span class="hljs-number">0</span>);
}

<span class="hljs-selector-class">.modal-wrapper</span> <span class="hljs-selector-class">.overlay</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">inset</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<p><code>.overlay</code> 只盖住 <code>.modal-wrapper</code>，而不是整个视口。常见原因是动画库在祖先上加了 <code>transform</code>。解决办法是把浮层渲染到 <code>body</code> 下（React 的 Portal），或使用 <code>&lt;dialog&gt;</code> 和 popover，它们进入顶层，不受祖先影响。</p>
<h2>sticky 不生效的原因</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.table-head</span> {
  <span class="hljs-attribute">position</span>: sticky;
  <span class="hljs-attribute">top</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<ul>
<li>没有设置 <code>top</code>、<code>bottom</code> 等阈值。</li>
<li>某个祖先设置了 <code>overflow: hidden</code> 或 <code>auto</code>，sticky 改为相对这个祖先吸附，而它可能并不滚动。</li>
<li>父元素和 sticky 元素一样高，没有可吸附的距离。</li>
<li>在 flex 或 grid 中被拉伸成和父元素一样高，可以加 <code>align-self: start</code>。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>overflow: clip</code> 和 <code>hidden</code> 对 sticky 有区别吗？有。<code>clip</code> 不会创建滚动容器，sticky 仍然相对外层真正滚动的祖先吸附。</li>
</ul>`};export{e as default};