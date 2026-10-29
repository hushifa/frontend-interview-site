var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>transition 要有“从哪里变到哪里”。元素从 <code>display: none</code> 变成可见时，它之前根本没被渲染，没有上一帧的样式，所以过渡不会触发，元素直接出现。<code>@starting-style</code> 就是给它补上这个起点。</p>
<p>退出也有问题。<code>display</code> 这种只能直接切换、没有中间值的属性叫离散属性，默认在过渡一开始就切换，元素瞬间变成 <code>none</code>，退出动画看不到。加上 <code>allow-discrete</code>，<code>display</code> 会等退出动画结束才变成 <code>none</code>。popover 和模态 dialog 还要多过渡一个 <code>overlay</code>，不然元素会提前离开顶层。</p>
<p>写法上要注意，<code>@starting-style</code> 和原规则的优先级一样，单独写的时候要放在原规则后面，嵌套写法没有这个问题。</p>
<p><code>@starting-style</code> 自 2024 年 8 月起进入 Baseline，不支持的浏览器里元素直接出现、直接消失，功能不受影响。</p>
</blockquote>
<h2>Popover 的进入和退出动画</h2>
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
<p>打开时，浏览器先按 <code>@starting-style</code> 里的值算一次，把它当成起点，再过渡到打开的样式，所以能看到淡入上移。</p>
<p>关闭时，元素从打开状态过渡回 <code>[popover]</code> 的基础样式，不是回到 <code>@starting-style</code>。因为加了 <code>allow-discrete</code>，<code>display</code> 和 <code>overlay</code> 等 200ms 后才切换，这期间淡出动画能完整播完。</p>
<p><code>::backdrop</code> 不能在里面嵌套 <code>@starting-style</code>，要单独写一块，放在 <code>[popover]:popover-open::backdrop</code> 规则后面。dialog 的写法一样，选择器换成 <code>dialog</code> 和 <code>dialog[open]</code>。</p>
<h2>以前为什么难做</h2>
<p>没有这两个特性时，常见写法是先去掉 <code>display: none</code>，等浏览器算完一次样式，再加上可见状态的类。</p>
<p>很多人以为用一次 <code>requestAnimationFrame</code> 就行，结果过渡还是不播。因为 rAF 回调运行在同一帧的样式计算之前，起点和终点被合并成一次计算，浏览器只看到了终点。实际要用两次 rAF，或者在中间读一下 <code>offsetHeight</code> 强制算样式。</p>
<p>退出时还要监听 <code>transitionend</code> 再设置 <code>display: none</code>，还得处理动画到一半用户又点开的情况。</p>
<p>现在这些都交给 CSS，JavaScript 只负责切换状态，比如调用 <code>showPopover()</code>。</p>
<h2>动态插入的元素</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.toast</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">150ms</span>;

  <span class="hljs-keyword">@starting-style</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  }
}
</code></pre></div>
<p>新插入页面的 <code>.toast</code> 会从透明淡入，这对动态插入的节点同样有效。</p>
<p>可是删除节点时，仍然没有退出动画，因为节点直接就不在页面上了。需要退出效果的话，先切换到一个隐藏状态，等 <code>transitionend</code> 以后再删除节点。</p>
<h2>常见追问</h2>
<p><strong>怎么和 <code>prefers-reduced-motion</code> 配合？</strong></p>
<blockquote>
<p>在减少动态效果的媒体查询里，把 <code>transition</code> 设成 <code>none</code>。状态切换还是正常的，只是没有动画。</p>
</blockquote>`};export{e as default};