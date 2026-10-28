var e={answerHtml:`<p>一个常见需求是：点击按钮后插入一个提示框，希望它从透明和轻微下移的状态淡入；关闭时再淡出，然后从 DOM 中移除。很多人会直接给提示框写 <code>transition</code>，却发现首次出现没有动画，关闭时也来不及播放就消失了。</p>
<p>原因不是 transition 失效，而是浏览器没有同时看到“起始样式”和“结束样式”。元素刚插入时通常只有最终样式，或者它仍然是 <code>display: none</code>；如果脚本立刻删除它，浏览器也没有机会在下一次样式计算中观察到退出状态。</p>
<h2>首次插入为什么没有起始帧</h2>
<p>传统写法会先加一个初始类，再通过下一帧移除它：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> notice = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">createElement</span>(<span class="hljs-string">&#x27;div&#x27;</span>);
notice.<span class="hljs-property">className</span> = <span class="hljs-string">&#x27;notice notice--entering&#x27;</span>;
notice.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;已保存&#x27;</span>;
<span class="hljs-variable language_">document</span>.<span class="hljs-property">body</span>.<span class="hljs-title function_">append</span>(notice);

<span class="hljs-title function_">requestAnimationFrame</span>(<span class="hljs-function">() =&gt;</span> {
  notice.<span class="hljs-property">classList</span>.<span class="hljs-title function_">remove</span>(<span class="hljs-string">&#x27;notice--entering&#x27;</span>);
});
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.notice</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">0</span>);
  <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">180ms</span> ease, transform <span class="hljs-number">180ms</span> ease;
}

<span class="hljs-selector-class">.notice--entering</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">8px</span>);
}
</code></pre></div>
<p>这能工作，但把“等待一次渲染再改类名”的时序交给了 JavaScript。组件重渲染、批量插入、SSR 激活或测试环境中的不同调度，都可能让这段代码变得脆弱。<code>@starting-style</code> 允许 CSS 为“没有前一个可见样式”的元素声明起始状态：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.notice</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">0</span>);
  <span class="hljs-attribute">transition</span>: opacity <span class="hljs-number">180ms</span> ease, transform <span class="hljs-number">180ms</span> ease;
}

<span class="hljs-keyword">@starting-style</span> {
  <span class="hljs-selector-class">.notice</span> {
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
    <span class="hljs-attribute">transform</span>: <span class="hljs-built_in">translateY</span>(<span class="hljs-number">8px</span>);
  }
}
</code></pre></div>
<p>当元素第一次获得可见样式时，浏览器可以把 <code>@starting-style</code> 中的值作为过渡起点。它不是一个 JavaScript 回调，也不会创建额外 DOM 节点；规则仍然受层叠、选择器和媒体查询影响。起始规则只适用于没有可用前一帧的情况，元素已经存在并只是修改普通属性时，仍由常规 transition 处理。</p>
<h2><code>display</code> 是离散属性，不能像 opacity 一样插值</h2>
<p><code>opacity</code> 可以在 0 到 1 之间逐步计算，<code>display</code> 则通常只有 <code>none</code> 或某个显示值。过去给 <code>display</code> 写 transition 没有意义：浏览器必须在某个时刻切换值，不能生成中间的半个 <code>display</code>。</p>
<p>CSS Transitions Level 2 引入了 <code>transition-behavior: allow-discrete</code>，允许离散属性参与过渡时间线。对 <code>display</code> 和 <code>content-visibility</code>，浏览器会在适合保持内容可见的时刻切换值，从而让 opacity/transform 有机会播放：</p>
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
<p>也可以把行为单独写成：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.dialog</span> {
  <span class="hljs-attribute">transition-behavior</span>: allow-discrete;
}
</code></pre></div>
<p>这段 CSS 只负责动画。真正的对话框仍应使用原生 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code>、关闭按钮、焦点管理和 <code>closedby</code> 等适用能力，不能把一个 <code>div</code> 加上透明度就当成可访问的模态框。原生对话框的 <code>open</code> 属性变化、背景遮罩和焦点返回也要在目标浏览器中单独验证。</p>
<h2>退出动画需要让元素暂时保持在布局中</h2>
<p>出现动画可以在元素插入时由 <code>@starting-style</code> 提供起点；退出动画则需要先把元素改成“正在退出”的状态，再在 <code>transitionend</code> 之后删除，或者让离散属性的过渡负责延迟隐藏：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.toast</span> {
  <span class="hljs-attribute">display</span>: block;
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
  <span class="hljs-attribute">translate</span>: <span class="hljs-number">0</span> <span class="hljs-number">0</span>;
  <span class="hljs-attribute">transition</span>:
    opacity <span class="hljs-number">160ms</span> ease,
    translate <span class="hljs-number">160ms</span> ease,
    display <span class="hljs-number">160ms</span> allow-discrete;
}

<span class="hljs-selector-class">.toast</span><span class="hljs-selector-attr">[data-closing=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attribute">display</span>: none;
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">translate</span>: <span class="hljs-number">0</span> <span class="hljs-number">6px</span>;
}
</code></pre></div>
<p>在支持离散过渡的浏览器中，<code>display</code> 的切换时间会配合可见动画；但生产组件不能只依赖它来完成业务清理。若需要释放事件监听、定时器或焦点，仍应在组件状态进入关闭阶段时执行清理，并确保动画被跳过时也能完成。用户开启减少动态效果时，关闭路径应立即进入稳定状态，不要让资源释放依赖一个可能被禁用的动画事件。</p>
<p>使用 <code>transitionend</code> 时还要注意：事件可能因为属性被再次修改、元素被移除、页面进入后台或用户偏好变化而不触发。业务状态不能永远等待这个事件。可以同时保留状态机超时、<code>transitioncancel</code> 处理和显式的无动画分支；如果只是视觉效果，最好让生命周期由组件状态控制，动画只作为表现层。</p>
<h2><code>@starting-style</code> 不等于“任何插入都自动动画”</h2>
<p>下面几种情况仍需要额外设计：</p>
<ul>
<li>元素没有从 <code>display: none</code> 变为可见状态，而是被直接替换成另一个节点；需要确认新节点确实匹配了 starting-style；</li>
<li>SSR 输出的首屏元素可能已经处于最终样式，客户端激活时不应为了动画造成闪烁；首屏内容通常需要关闭入场动画或只对用户触发的新增内容启用；</li>
<li><code>prefers-reduced-motion: reduce</code> 下应缩短或删除位移、缩放和连续动画，同时保留状态反馈；</li>
<li><code>visibility</code>、<code>pointer-events</code>、<code>inert</code> 和 <code>aria-hidden</code> 的切换要与可操作性一致，不能只是把元素变透明却仍拦截点击或被读屏读取；</li>
<li><code>overflow</code>、堆叠上下文和 <code>position</code> 可能裁剪或遮挡动画，问题不一定来自 transition 本身。</li>
</ul>
<p>例如，一个提示框在淡出期间仍不应接收点击：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.toast</span><span class="hljs-selector-attr">[data-closing=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attribute">pointer-events</span>: none;
}

<span class="hljs-keyword">@media</span> (<span class="hljs-attribute">prefers-reduced-motion</span>: reduce) {
  <span class="hljs-selector-class">.toast</span>,
  <span class="hljs-selector-class">.dialog</span> {
    <span class="hljs-attribute">transition-duration</span>: <span class="hljs-number">1ms</span>;
    <span class="hljs-attribute">transform</span>: none;
    <span class="hljs-attribute">translate</span>: none;
  }
}
</code></pre></div>
<p><code>pointer-events: none</code> 不会自动改变键盘焦点和辅助技术语义；如果关闭状态已经不应出现在交互树中，还要同步管理 <code>inert</code>、焦点和 ARIA 状态。动画属性与可访问性状态应由同一个组件状态驱动，避免 CSS 和脚本各自维护一套真假状态。</p>
<h2>兼容性和渐进增强</h2>
<p><code>@starting-style</code>、<code>transition-behavior: allow-discrete</code> 和离散属性的具体支持范围取决于浏览器版本。它们属于较新的 CSS 能力，不能把“现代浏览器能显示”直接等同于“所有目标浏览器都能按预期过渡”。应根据项目的浏览器基线查 MDN 兼容性数据，并在真实目标浏览器中测试插入、关闭、快速重复打开和页面卸载。</p>
<p>渐进增强的基本策略是：即使不支持这些特性，内容仍然显示、关闭按钮仍然有效、焦点仍然可用，只是没有入场或退出动画。可以通过 <code>@supports</code> 只增强视觉表现：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.notice</span> {
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">transition-behavior</span>: allow-discrete) {
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
<p>面试中如果只回答“加 <code>@starting-style</code> 就能解决首次动画”，还不完整。真正要检查的是：浏览器有没有看到起始状态，离散属性是否需要延迟切换，退出时元素是否仍然存在，动画是否会影响焦点和辅助技术，以及不支持新特性的环境是否仍能完成同一件事。CSS 负责表达视觉时间线，组件状态负责内容、交互和资源生命周期，分清这两层才能让实现既好看又可靠。</p>`};export{e as default};