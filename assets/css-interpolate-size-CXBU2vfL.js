var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>auto</code> 不是确定数值，过去 <code>height: 0</code> 到 <code>height: auto</code> 无法插值，只能用 JavaScript 读 <code>scrollHeight</code> 或猜一个 <code>max-height</code>。</li>
<li><code>interpolate-size: allow-keywords</code> 允许数值和 <code>auto</code> 等尺寸关键字之间插值，属性会继承，可以放在根元素或单个组件上。</li>
<li><code>calc-size(auto, size + 1rem)</code> 可以在自然尺寸上做计算；普通 <code>calc(auto + 1rem)</code> 不成立。</li>
<li>它只处理尺寸，<code>hidden</code>、<code>inert</code>、ARIA 和焦点仍要由组件同步；高度动画会触发布局。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  interpolate-size: allow-keywords;
}

<span class="hljs-selector-tag">details</span>::details-content {
  <span class="hljs-attribute">block-size</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: clip;
  <span class="hljs-attribute">transition</span>:
    block-size <span class="hljs-number">260ms</span> ease,
    content-visibility <span class="hljs-number">260ms</span> allow-discrete;
}

<span class="hljs-selector-tag">details</span><span class="hljs-selector-attr">[open]</span>::details-content {
  <span class="hljs-attribute">block-size</span>: auto;
}
</code></pre></div>
<p>过渡写在 <code>::details-content</code> 上，而不是 <code>&lt;details&gt;</code> 本身，否则 <code>&lt;summary&gt;</code> 也会被裁掉。</p>
<h2>calc-size() 和高度上限</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.accordion-panel</span> {
  interpolate-size: allow-keywords;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">max-block-size</span>: <span class="hljs-number">60vh</span>;
  <span class="hljs-attribute">overflow</span>: clip;
  <span class="hljs-attribute">transition</span>: height <span class="hljs-number">220ms</span> ease;
}

<span class="hljs-selector-class">.accordion-panel</span><span class="hljs-selector-attr">[data-expanded=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attribute">height</span>: auto;
  <span class="hljs-attribute">overflow</span>: auto;
}

<span class="hljs-selector-class">.note</span><span class="hljs-selector-attr">[data-expanded=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-built_in">calc-size</span>(auto, size + <span class="hljs-number">1rem</span>);
}
</code></pre></div>
<p>自然高度负责展开，超长内容由 <code>max-block-size</code> 加内部滚动处理。</p>
<h2>展开状态不能只靠视觉</h2>
<p>按钮要用 <code>aria-expanded</code> 和 <code>aria-controls</code> 表达状态。只用 <code>height: 0</code> 收起时，内容仍可能被读屏读到、被 Tab 聚焦，需要配合 <code>inert</code>；用 <code>hidden</code> 则要结合 <code>@starting-style</code> 和离散过渡才能有动画（见“@starting-style 和离散属性过渡解决了什么问题？”）。</p>
<h2>布局成本</h2>
<p>高度变化会推动后续内容，每帧都要重新布局，成本高于 transform 动画。只对用户主动展开的局部内容使用，限制最大高度，给图片和异步内容预留尺寸，并为 <code>prefers-reduced-motion: reduce</code> 提供无动画路径。</p>
<h2>旧方案为什么不等价</h2>
<p><code>max-height: 40rem</code> 的回退动画时长与真实内容不成比例，超过上限的内容会被截掉。JavaScript 读写 <code>scrollHeight</code> 要处理字体变化、窗口调整、取消动画和卸载，还可能造成强制同步布局，应封装在组件里。</p>
<h2>兼容回退</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.panel</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
}

<span class="hljs-comment">/* 展开状态写在 @supports 外：不支持的浏览器照样能展开，只是没有动画 */</span>
<span class="hljs-selector-class">.panel</span><span class="hljs-selector-attr">[data-open=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attribute">height</span>: auto;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">interpolate-size</span>: allow-keywords) {
  <span class="hljs-selector-class">.panel</span> {
    interpolate-size: allow-keywords;
    <span class="hljs-attribute">transition</span>: height <span class="hljs-number">220ms</span> ease;
  }
}
</code></pre></div>
<p>能力检测通过也不代表所有关键字组合都支持。验收覆盖空内容、超长内容、异步内容、快速重复点击、键盘与读屏、文字放大，以及不支持的浏览器。</p>`};export{e as default};