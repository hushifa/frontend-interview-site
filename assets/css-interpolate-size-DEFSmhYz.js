var e={answerHtml:`<p>折叠面板、帮助说明和菜单经常需要从“没有高度”展开到内容的自然高度。过去 CSS 不能直接可靠地在 <code>height: 0</code> 和 <code>height: auto</code> 之间插值，因为 <code>auto</code> 不是一个确定的数值，而是要经过内容、字体、内边距和布局上下文计算出来的 intrinsic size。开发者通常只能用 JavaScript 读取 <code>scrollHeight</code>，或者用一个足够大的 <code>max-height</code> 猜测上限。</p>
<p>现代 CSS 提供 <code>interpolate-size</code>，允许在数值和部分 intrinsic size 关键字之间插值：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-pseudo">:root</span> {
  interpolate-size: allow-keywords;
}

<span class="hljs-selector-class">.details</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: clip;
  <span class="hljs-attribute">transition</span>: height <span class="hljs-number">260ms</span> ease;
}

<span class="hljs-selector-class">.details</span><span class="hljs-selector-attr">[open]</span> {
  <span class="hljs-attribute">height</span>: auto;
}
</code></pre></div>
<p>在支持的浏览器中，面板可以从 0 平滑过渡到内容计算出的自然高度。<code>interpolate-size</code> 通常继承，放在根元素可以让子树沿用策略；也可以只在特定组件上启用，避免无意影响整个页面。</p>
<h2>为什么 <code>auto</code> 过去不能直接动画</h2>
<p>数值到数值的过渡可以按时间计算中间值，例如 0px 到 300px。<code>auto</code> 则不是一个固定长度：内容变多、字体加载完成、容器宽度变化或内边距改变，都可能让它重新计算。浏览器过去没有统一的中间值定义，因此常见结果是直接跳到最终高度。</p>
<p><code>interpolate-size: allow-keywords</code> 并不是让所有 CSS 关键字都自动可动画。支持的关键字、属性和浏览器版本需要查目标环境；不支持的组合仍可能离散切换。<code>auto</code> 的最终值还会受到 min/max 约束、盒模型、网格或 flex 布局影响，不能把动画时长和视觉位移当成固定像素关系。</p>
<h2>calc-size() 可以对 intrinsic size 做计算</h2>
<p>当需要在自然高度基础上增加或限制空间时，可以使用 <code>calc-size()</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.details</span><span class="hljs-selector-attr">[open]</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-built_in">calc-size</span>(auto, size + <span class="hljs-number">1rem</span>);
}
</code></pre></div>
<p><code>calc-size()</code> 的语法和支持范围比普通 <code>calc()</code> 更特殊，它允许在 intrinsic size 关键字上进行受支持的计算。不要把 <code>calc(auto + 1rem)</code> 当成等价写法；普通 <code>calc()</code> 并不能任意把 <code>auto</code> 当成数值参与运算。</p>
<p>实际组件通常还要把最大高度和溢出策略写清楚。可以让自然高度负责展开，再让外层布局或内部滚动容器限制过长内容；不要为了追求一行 CSS 而写出目标浏览器不支持的混合计算表达式。</p>
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
</code></pre></div>
<h2>展开状态不能只由 CSS 视觉决定</h2>
<p>一个面板看起来展开，不代表读屏器和键盘用户知道状态。按钮应使用 <code>aria-expanded</code> 和 <code>aria-controls</code>，内容区域要有稳定的 ID：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span>
  <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>
  <span class="hljs-attr">aria-expanded</span>=<span class="hljs-string">&quot;false&quot;</span>
  <span class="hljs-attr">aria-controls</span>=<span class="hljs-string">&quot;shipping-help&quot;</span>
  <span class="hljs-attr">data-toggle</span>=<span class="hljs-string">&quot;shipping-help&quot;</span>
&gt;</span>
  了解配送方式
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">section</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;shipping-help&quot;</span> <span class="hljs-attr">hidden</span>&gt;</span>
  配送时间会根据地区和库存变化。
<span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> button = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;[data-toggle]&#x27;</span>);
<span class="hljs-keyword">const</span> panel = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">\`#<span class="hljs-subst">\${button.getAttribute(<span class="hljs-string">&#x27;aria-controls&#x27;</span>)}</span>\`</span>);

button.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> expanded = button.<span class="hljs-title function_">getAttribute</span>(<span class="hljs-string">&#x27;aria-expanded&#x27;</span>) === <span class="hljs-string">&#x27;true&#x27;</span>;
  button.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-expanded&#x27;</span>, <span class="hljs-title class_">String</span>(!expanded));
  panel.<span class="hljs-property">hidden</span> = expanded;
});
</code></pre></div>
<p>如果使用 <code>hidden</code>，面板在隐藏时不会参与布局和辅助技术树，直接从 <code>hidden</code> 变为可见可能需要配合 <code>@starting-style</code> 和离散过渡；如果只用 <code>height: 0</code>，内容可能仍被读屏器读取，也可能仍能获得焦点。选择“保留在 DOM 但不可交互”还是“完全隐藏”，要根据组件语义和动画需求决定。<code>interpolate-size</code> 只处理尺寸，不会替你同步 <code>hidden</code>、<code>inert</code>、ARIA 和焦点。</p>
<h2>auto 高度动画会触发布局</h2>
<p>高度变化会影响后续内容的位置，通常需要重新计算布局和绘制。它和只改变 <code>transform</code> 的合成动画成本不同，不能因为动画由 CSS 声明就认为不会触发 layout。一个长页面里同时展开多个面板，可能造成较多布局工作和明显的输入延迟。</p>
<p>可以采用以下策略降低成本：</p>
<ul>
<li>只对用户主动展开的局部内容使用动画，不让大量列表同时自动展开；</li>
<li>限制面板最大高度，超出部分在内部滚动；</li>
<li>让图片、字体和异步内容尺寸尽量稳定，避免动画过程中自然高度不断变化；</li>
<li>对低端设备和 <code>prefers-reduced-motion: reduce</code> 提供无动画路径；</li>
<li>用 Performance 面板测量布局、绘制和输入延迟，不用属性名称推断性能。</li>
</ul>
<p>如果展开后内容还会异步加载，动画可能先到一个高度，再因数据到达继续移动。可以先显示稳定的占位区域，或在内容准备好后开始过渡；不要为了让动画“完整”而阻塞用户查看已经可用的文字。</p>
<h2>不要把 max-height 猜测当作等价回退</h2>
<p>旧浏览器常见回退是：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.legacy-panel</span> {
  <span class="hljs-attribute">max-height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
  <span class="hljs-attribute">transition</span>: max-height <span class="hljs-number">240ms</span> ease;
}

<span class="hljs-selector-class">.legacy-panel</span><span class="hljs-selector-class">.is-open</span> {
  <span class="hljs-attribute">max-height</span>: <span class="hljs-number">40rem</span>;
}
</code></pre></div>
<p>它可以提供视觉效果，但时长与真实内容高度不成比例：短内容可能很快完成，长内容可能提前截断或看起来慢；当内容超过 40rem 时会被隐藏。若使用这个回退，必须设置足够明确的内容上限、可滚动策略和无动画可用路径，不能把一个任意大数字宣传成自然高度动画。</p>
<p>另一种回退是 JavaScript 读取 <code>scrollHeight</code>，把当前数值写入 <code>height</code>，在 transition 结束后恢复 <code>auto</code>。这种方式需要处理字体变化、窗口调整、内容异步更新、取消动画和组件卸载，且读取与写入布局属性可能造成强制同步布局。现代浏览器增强与旧浏览器回退应由组件封装，不要让业务页面到处复制一套时序代码。</p>
<h2>与 display 和 starting-style 的关系</h2>
<p>如果元素从 <code>display: none</code> 变为可见，仅有 <code>interpolate-size</code> 还不够，因为没有可见的起始样式。可以结合 <code>@starting-style</code> 和 <code>transition-behavior: allow-discrete</code>，让显示状态和高度/透明度一起处理：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.panel</span> {
  <span class="hljs-attribute">display</span>: none;
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: clip;
  <span class="hljs-attribute">transition</span>:
    height <span class="hljs-number">220ms</span> ease,
    opacity <span class="hljs-number">160ms</span> ease,
    display <span class="hljs-number">220ms</span> allow-discrete;
}

<span class="hljs-selector-class">.panel</span><span class="hljs-selector-attr">[data-open=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
  <span class="hljs-attribute">display</span>: block;
  <span class="hljs-attribute">height</span>: auto;
  <span class="hljs-attribute">opacity</span>: <span class="hljs-number">1</span>;
}

<span class="hljs-keyword">@starting-style</span> {
  <span class="hljs-selector-class">.panel</span><span class="hljs-selector-attr">[data-open=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
    <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
    <span class="hljs-attribute">opacity</span>: <span class="hljs-number">0</span>;
  }
}
</code></pre></div>
<p>这仍然需要按目标浏览器测试，尤其是 display 的离散切换时机、内容可访问性和关闭后的清理。很多组件更适合保留节点并使用 <code>hidden</code>/<code>inert</code> 状态管理，而不是把每个生命周期都压缩成一个 CSS 选择器。</p>
<h2>兼容性、降级和验收</h2>
<p><code>interpolate-size</code> 和 <code>calc-size()</code> 属于较新的 CSS 能力，支持范围需要查兼容性数据。可以把它们作为增强，旧浏览器继续使用固定高度、max-height 或无动画展开：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.panel</span> {
  <span class="hljs-attribute">height</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">overflow</span>: hidden;
}

<span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">interpolate-size</span>: allow-keywords) {
  <span class="hljs-selector-pseudo">:root</span> {
    interpolate-size: allow-keywords;
  }

  <span class="hljs-selector-class">.panel</span><span class="hljs-selector-attr">[data-open=<span class="hljs-string">&#x27;true&#x27;</span>]</span> {
    <span class="hljs-attribute">height</span>: auto;
  }
}
</code></pre></div>
<p>能力检测通过也不代表所有 intrinsic 关键字和组合属性都支持，仍要在目标浏览器中测试。验收至少包括：</p>
<ul>
<li>空内容、短内容、超长内容、异步内容和图片/字体加载；</li>
<li>展开、收起、快速重复点击、页面卸载和导航取消；</li>
<li>键盘、读屏、<code>aria-expanded</code>、焦点、<code>hidden</code> 和 <code>inert</code>；</li>
<li>窄屏、文字放大、RTL、低端设备和减少动态效果偏好；</li>
<li>不支持新 CSS 能力的浏览器，以及 max-height/JavaScript 回退的截断和性能。</li>
</ul>
<p><code>interpolate-size</code> 解决的是“浏览器怎样在数值和自然尺寸之间计算中间状态”，不是一个完整的手风琴组件。内容语义、可访问状态、布局成本、异步生命周期和兼容回退仍需要由组件设计负责。</p>`};export{e as default};