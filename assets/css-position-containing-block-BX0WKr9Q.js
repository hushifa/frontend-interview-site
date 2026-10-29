var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>定位元素写 <code>top: 0</code>，这个 0 是从哪里算起的？这个“参照框”叫包含块。<code>absolute</code> 的包含块是最近一个 <code>position</code> 不是 <code>static</code> 的祖先，取它的内边距盒；一个都找不到，就用初始包含块。</p>
<p><code>fixed</code> 默认相对视口。但只要祖先设置了 <code>transform</code>、<code>perspective</code>、<code>filter</code>、<code>contain: paint</code>，或者对应的 <code>will-change</code>，它就改为相对这个祖先定位，这是全屏遮罩只盖住一小块的常见原因。</p>
<p><code>sticky</code> 是在最近的滚动祖先里，滚到 <code>top</code> 这类阈值时吸住，但吸附范围不会超出自己的父元素。</p>
<p>百分比的 <code>top</code>、<code>width</code> 也是按包含块算的。浮层被裁或者位置不对时，先在开发者工具里找到它的包含块是谁。</p>
</blockquote>
<h2>absolute：为什么父元素要写 relative</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.card</span> {
  <span class="hljs-attribute">position</span>: relative;
}

<span class="hljs-selector-class">.card</span> <span class="hljs-selector-class">.badge</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">inset-block-start</span>: <span class="hljs-number">8px</span>;
  <span class="hljs-attribute">inset-inline-end</span>: <span class="hljs-number">8px</span>;
}
</code></pre></div>
<p>角标要放在卡片右上角。如果 <code>.card</code> 没写 <code>position: relative</code>，角标会一直往上找定位祖先，可能找到页面最外层，跑到整个页面的右上角去。</p>
<p><code>.card</code> 写 <code>position: relative</code> 但不写偏移，它自己不会动。这么写只是为了让它成为角标的包含块。</p>
<h2>fixed：全屏遮罩为什么只盖住了一块</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.modal-wrapper</span> {
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateZ</span>(<span class="hljs-number">0</span>);
}

<span class="hljs-selector-class">.modal-wrapper</span> <span class="hljs-selector-class">.overlay</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">inset</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<p><code>.overlay</code> 本来要盖住整个视口，结果只盖住了 <code>.modal-wrapper</code> 那一块。</p>
<p>原因是祖先有 <code>transform</code>。祖先一旦设置了 <code>transform</code>，它就成了里面 <code>fixed</code> 元素的包含块，<code>inset: 0</code> 是相对它算的。这种 <code>transform</code> 往往不是自己写的，而是动画库加上去的。</p>
<p>改法是把浮层渲染到 <code>body</code> 下面，React 里用 Portal 就是做这个。或者直接用 <code>&lt;dialog&gt;</code> 和 popover，它们会进入顶层，不受祖先样式影响。</p>
<h2>sticky 为什么不生效</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.table-head</span> {
  <span class="hljs-attribute">position</span>: sticky;
  <span class="hljs-attribute">top</span>: <span class="hljs-number">0</span>;
}
</code></pre></div>
<p>写了这几行，表头却不吸顶，通常是下面几个原因。</p>
<p>第一，没有写 <code>top</code>、<code>bottom</code> 这类阈值，浏览器不知道什么时候该吸住。</p>
<p>第二，某个祖先设置了 <code>overflow: hidden</code> 或 <code>auto</code>。这个祖先就成了滚动容器，sticky 改为相对它吸附。可是它自己可能根本不滚动，真正在滚的是外面的页面，于是看起来就没效果。</p>
<p>第三，父元素和 sticky 元素一样高。sticky 不能跑出父元素，父元素没有多余的高度，就没有可以吸附的距离。</p>
<p>第四，在 flex 或 grid 里，sticky 元素被拉伸得和父元素一样高，跟第三种是一回事。加上 <code>align-self: start</code> 就好。</p>
<h2>常见追问</h2>
<p><strong><code>overflow: clip</code> 和 <code>hidden</code> 对 sticky 有区别吗？</strong></p>
<blockquote>
<p>有。<code>hidden</code> 会创建滚动容器，sticky 会改为相对它吸附。<code>clip</code> 只裁剪，不创建滚动容器，所以 sticky 还是相对外层真正在滚动的祖先吸附。</p>
</blockquote>`};export{e as default};