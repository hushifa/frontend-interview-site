var e={answerHtml:`<h2>简答</h2>
<ul>
<li>元素从 <code>display: none</code> 变为可见时没有“上一帧样式”，普通 transition 不会触发；<code>@starting-style</code> 补上这个起点。</li>
<li>离散属性默认在过渡开始时立即切换；加 <code>allow-discrete</code> 后，<code>display</code> 会推迟到退出动画结束才变成 <code>none</code>。</li>
<li>对 popover 和模态 dialog，退出动画还要过渡 <code>overlay</code>，否则元素会提前离开顶层。</li>
<li><code>@starting-style</code> 和原规则优先级相同，单独写时要放在原规则之后，嵌套写法没有这个问题。</li>
<li><code>@starting-style</code> 自 2024 年 8 月起进入 Baseline，不支持时元素直接出现和消失。</li>
</ul>
<h2>Popover 的进入和退出</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-attr">[popover]</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">8px</span>);
  <span class="hljs-attribute">transition</span>:
    opacity <span class="hljs-number">200ms</span>,
    transform <span class="hljs-number">200ms</span>,
    overlay <span class="hljs-number">200ms</span> allow-discrete,
    display <span class="hljs-number">200ms</span> allow-discrete;
}

<span class="hljs-selector-attr">[popover]</span>:popover-open {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transform</span>: none;

  <span class="hljs-keyword">@starting-style</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
    <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">8px</span>);
  }
}
</code></pre></div>
<ul>
<li>打开时：元素先按 <code>@starting-style</code> 里的值计算一次，再过渡到打开状态。</li>
<li>关闭时：元素从打开状态过渡回 <code>[popover]</code> 的基础样式，而不是回到 <code>@starting-style</code>。<code>display</code> 和 <code>overlay</code> 在 200ms 后才切换，退出动画因此可见。</li>
</ul>
<p><code>::backdrop</code> 不能嵌套 <code>@starting-style</code>，要单独写一个块，放在 <code>[popover]:popover-open::backdrop</code> 规则之后。dialog 的写法相同，选择器换成 <code>dialog</code> 和 <code>dialog[open]</code>。</p>
<h2>以前为什么难做</h2>
<p>不用这两个特性时，常见写法是先移除 <code>display: none</code>，等浏览器完成一次样式计算后再加上可见状态的类。只用一次 <code>requestAnimationFrame</code> 往往不够，因为回调运行在同一帧的样式计算之前，起点和终点被合并成一次计算，过渡不会播放。实践中要用两次 rAF，或者在中间读取 <code>offsetHeight</code> 强制计算样式。退出时还要监听 <code>transitionend</code> 再设置 <code>display: none</code>，并处理动画中途再次打开的情况。</p>
<p>现在这些步骤由 CSS 完成，JavaScript 只负责切换状态，例如调用 <code>showPopover()</code>。</p>
<h2>动态插入的元素</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.toast</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">150ms</span>;

  <span class="hljs-keyword">@starting-style</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  }
}
</code></pre></div>
<p>新插入 DOM 的 <code>.toast</code> 会从透明淡入。移除节点时仍然没有退出动画，因为节点已经不在页面上；需要退出效果时，先切换一个隐藏状态，等 <code>transitionend</code> 后再移除。</p>
<h2>常见追问</h2>
<ul>
<li>和 <code>prefers-reduced-motion</code> 怎样配合？在减少动画的媒体查询里把 <code>transition</code> 设为 <code>none</code>，状态切换仍然正常。</li>
</ul>`};export{e as default};