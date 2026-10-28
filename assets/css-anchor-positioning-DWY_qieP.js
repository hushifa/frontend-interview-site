var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>anchor-name</code> 给锚点命名，<code>position-anchor</code> 让绝对或固定定位的浮层引用它，浮层不必是锚点的后代。</li>
<li>精确贴边用 <code>anchor()</code> 引用锚点的某条边；列表里同名锚点要用 <code>anchor-scope</code> 限定，否则会找到最后一个同名锚点。</li>
<li>放不下时用 <code>position-try</code> 等回退位置，不支持的浏览器用 <code>@supports</code> 降级。</li>
<li>它只负责几何关系，打开关闭、Escape、焦点和 ARIA 状态仍要自己实现。</li>
</ul>
<p>工具提示、下拉菜单和上下文菜单通常要贴着一个按钮，同时不能跑出视口。传统做法是 JavaScript 读取按钮的 <code>getBoundingClientRect()</code>，计算 top/left，再监听滚动和窗口变化；这会增加测量、重排和生命周期管理成本。</p>
<p>CSS Anchor Positioning 让一个元素声明为锚点，另一个绝对或固定定位元素引用它的几何位置。它能减少一部分命令式测量，但仍是较新的 CSS 能力，语法、浏览器覆盖和复杂滚动场景要按目标环境验证。</p>
<h2>锚点定义的是关系，不是 DOM 父子结构</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;help-button&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;help-popover&quot;</span>&gt;</span>
  帮助
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;help-popover&quot;</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;help-popover&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tooltip&quot;</span>&gt;</span>
  这里是说明文字。
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.help-button</span> {
  <span class="hljs-attribute">anchor-name</span>: --help-anchor;
}

<span class="hljs-selector-class">.help-popover</span> {
  <span class="hljs-attribute">position</span>: fixed;
  <span class="hljs-attribute">position-anchor</span>: --help-anchor;
  <span class="hljs-attribute">position</span>-area: block-end span-inline-end;
  <span class="hljs-attribute">margin-block-start</span>: <span class="hljs-number">0.5rem</span>;
}
</code></pre></div>
<p><code>anchor-name</code> 给元素命名，<code>position-anchor</code> 让浮层引用它；浮层不必是按钮的后代。需要精确贴边时，用 <code>anchor()</code> 函数引用锚点的某条边：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.tooltip</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">position-anchor</span>: --save-button;
  <span class="hljs-attribute">top</span>: <span class="hljs-built_in">anchor</span>(bottom);
  <span class="hljs-attribute">left</span>: <span class="hljs-built_in">anchor</span>(center);
  <span class="hljs-attribute">translate</span>: -<span class="hljs-number">50%</span> <span class="hljs-number">0.5rem</span>;
}

<span class="hljs-comment">/* 列表里每一项都叫 --row-action 时，限定名称只在本项内查找 */</span>
<span class="hljs-selector-class">.row</span> {
  anchor-scope: --row-action;
}
</code></pre></div>
<p>列表重复渲染同名锚点时，不加 <code>anchor-scope</code> 的话，所有浮层都会找到最后一个同名锚点。各浏览器的支持版本以 MDN 兼容表为准，上线前用 <code>@supports (anchor-name: --a)</code> 提供回退。</p>
<p>如果页面存在多个同名锚点，必须明确哪个元素会被引用，不能让组件实例依赖全局名称碰巧解析正确。组件销毁和重复渲染时也要保持名称作用域清楚，避免一个浮层漂到另一个实例的按钮旁边。</p>
<h2>回退位置要表达“放不下怎么办”</h2>
<p>浮层可能贴近视口边缘、滚动容器或键盘。只指定一个理想位置不能保证它永远可见；应定义备用位置或使用 <code>position-try</code> 等相应机制，并为不支持的浏览器提供降级：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-keyword">@supports</span> (<span class="hljs-attribute">anchor-name</span>: --help-anchor) {
  <span class="hljs-selector-class">.help-popover</span> {
    <span class="hljs-attribute">position</span>: fixed;
    <span class="hljs-attribute">position-anchor</span>: --help-anchor;
    <span class="hljs-attribute">position</span>-area: block-end;
    <span class="hljs-attribute">position</span>-try-fallbacks: flip-block, flip-inline;
  }
}

<span class="hljs-keyword">@supports</span> <span class="hljs-keyword">not</span> (<span class="hljs-attribute">anchor-name</span>: --help-anchor) {
  <span class="hljs-selector-class">.help-popover</span> {
    <span class="hljs-attribute">position</span>: absolute;
  }
}
</code></pre></div>
<p>示例只表达渐进增强思路。<code>position: absolute</code> 的降级仍需要合适的定位容器和可能的 JavaScript 计算，不能因为有一条 fallback 规则就保证弹层不会出界。</p>
<p>浮层的定位上下文、<code>position: fixed</code>、transform 祖先、滚动容器和 top layer 会影响最终结果。一个视觉上贴着按钮的元素，可能在另一个裁剪或层叠上下文中被截断；Anchor Positioning 不会自动取消所有 <code>overflow</code> 和 <code>z-index</code> 限制。</p>
<h2>CSS 定位不能替代交互状态</h2>
<p>Anchor Positioning 只负责几何关系，不会自动实现打开、关闭、Escape、焦点移动、点击外部关闭或读屏语义。工具提示、菜单和对话框是不同模式，不能因为它们都“浮在按钮旁边”就使用相同的 ARIA 和焦点策略。</p>
<p>如果浮层由按钮控制，应同步 <code>aria-expanded</code>、<code>aria-controls</code> 或 <code>aria-describedby</code>；真正需要操作的菜单通常要管理焦点，不能只用 <code>:hover</code> 显示。触摸、键盘、缩放和移动端虚拟键盘也可能改变可用空间。</p>
<h2>与 JavaScript 测量相比的取舍</h2>
<p>CSS Anchor Positioning 适合锚点和浮层关系主要由布局决定的场景，能让浏览器参与回退和滚动更新，减少手写监听和几何同步。JavaScript 仍适合复杂碰撞算法、跨窗口坐标、拖拽和需要读取业务状态的定位。</p>
<p>不应把 JavaScript 全部删除后再发现业务需要知道浮层实际位置。必要时仍可以用 ResizeObserver、IntersectionObserver 或 <code>getBoundingClientRect()</code> 做业务判断，但要避免每次滚动事件都强制布局。</p>
<p>兼容性降级要保持功能可用：不支持新属性时，菜单仍应能打开、内容仍应可读、键盘仍能操作。不能因为追求漂亮的自动翻转就让旧浏览器中的按钮没有任何可发现的替代入口。</p>
<p>验收应覆盖锚点靠近四个边缘、滚动容器、缩放、长文本、多实例、动态插入、键盘焦点、读屏器、触摸和不支持该 API 的浏览器。布局 API 通过只证明位置关系成立，不证明完整浮层交互已经可用。</p>`};export{e as default};