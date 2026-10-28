var e={answerHtml:`<h2>简答</h2>
<ul>
<li>新插入的元素或从 <code>display: none</code> 变为可见的元素，浏览器只看到最终样式，没有起点，所以 transition 不播放。</li>
<li><code>@starting-style</code> 为“没有前一帧样式”的元素声明过渡起点，替代过去“先加类、下一帧再删类”的 JavaScript 时序。</li>
<li><code>display</code> 是离散属性，不能插值；<code>transition-behavior: allow-discrete</code> 让它在合适时刻切换，退出时 opacity 等动画才有机会播完。</li>
<li>动画只是表现层，焦点、<code>inert</code>、资源清理仍由组件状态负责；不支持时内容照常显示，只是没有动画。</li>
</ul>
<h2>首次插入为什么没有起始帧</h2>
<p>传统写法依赖 JavaScript 等一次渲染再移除初始类：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>.<span class="hljs-title function_">append</span>(notice); <span class="hljs-comment">// notice 带 notice--entering 类</span>
<span class="hljs-title function_">requestAnimationFrame</span>(<span class="hljs-function">() =&gt;</span> notice.<span class="hljs-property">classList</span>.<span class="hljs-title function_">remove</span>(<span class="hljs-string">&#x27;notice--entering&#x27;</span>));
</code></pre></div>
<p>组件重渲染、批量插入或 SSR 激活都可能打乱这段时序。用 <code>@starting-style</code> 改由 CSS 声明起点：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.notice</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transform</span>: none;
  <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">180ms</span> ease, transform <span class="hljs-number">180ms</span> ease;
}

<span class="hljs-keyword">@starting-style</span> {
  <span class="hljs-selector-class">.notice</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
    <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">8px</span>);
  }
}
</code></pre></div>
<p>起始规则只在元素第一次获得样式时生效；元素已存在、只是修改属性时，仍由普通 transition 处理。</p>
<h2>进入和退出都要处理 display</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.dialog</span> {
  <span class="hljs-attribute">display</span>: none;
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">12px</span>) <span class="hljs-built_in">scale</span>(<span class="hljs-number">0.98</span>);
  <span class="hljs-attribute">transition</span>:
    opacity <span class="hljs-number">180ms</span> ease,
    transform <span class="hljs-number">180ms</span> ease,
    display <span class="hljs-number">180ms</span> allow-discrete;
}

<span class="hljs-selector-class">.dialog</span><span class="hljs-selector-attr">[open]</span> {
  <span class="hljs-attribute">display</span>: block;
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transform</span>: none;
}

<span class="hljs-keyword">@starting-style</span> {
  <span class="hljs-selector-class">.dialog</span><span class="hljs-selector-attr">[open]</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
    <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">12px</span>) <span class="hljs-built_in">scale</span>(<span class="hljs-number">0.98</span>);
  }
}
</code></pre></div>
<p>进入时 <code>display</code> 立刻切到 <code>block</code>，再从 starting-style 过渡；退出时 <code>display: none</code> 会推迟到动画结束才生效。模态框本身仍应使用原生 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code>，这段 CSS 只负责视觉。</p>
<h2>退出动画不能承担业务清理</h2>
<p><code>transitionend</code> 可能因为属性被再次修改、元素被移除、页面进入后台或减少动态效果而不触发。释放监听、定时器和焦点应由组件状态在进入关闭阶段时完成，不要等动画事件。</p>
<p>淡出期间元素仍在页面上，要同步禁止交互：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.toast</span><span class="hljs-selector-attr">[data-closing=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attribute">pointer-events</span>: none;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.toast</span>,
  <span class="hljs-selector-class">.dialog</span> {
    <span class="hljs-attribute">transition-duration</span>: <span class="hljs-number">1ms</span>;
    <span class="hljs-attribute">transform</span>: none;
  }
}
</code></pre></div>
<p><code>pointer-events: none</code> 不影响键盘焦点和读屏，还需要配合 <code>inert</code> 和 ARIA 状态。SSR 首屏已经处于最终样式的内容，通常不应再播放入场动画。</p>
<h2>兼容与渐进增强</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">transition-behavior</span>: allow-discrete) {
  <span class="hljs-selector-class">.notice</span> {
    <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">180ms</span> ease, display <span class="hljs-number">180ms</span> allow-discrete;
  }

  <span class="hljs-keyword">@starting-style</span> {
    <span class="hljs-selector-class">.notice</span> {
      <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
    }
  }
}
</code></pre></div>
<p>支持范围以 MDN 兼容表为准。验收覆盖插入、关闭、快速重复打开、减少动态效果，以及不支持时内容、关闭按钮和焦点是否仍然正常。</p>`};export{e as default};