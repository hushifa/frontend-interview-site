var e={answerHtml:`<h2>简答</h2>
<ul>
<li>给 div 加 click 只完成了点击处理，焦点、键盘激活和读屏语义都要另外补。</li>
<li>执行操作用 button，跳转到可定位地址用带 href 的 a。</li>
<li>原生按钮会把 Enter 和空格转成激活行为，不要再在 keydown 里重复调用同一逻辑。</li>
<li>按状态类型选择属性：开关用 <code>aria-pressed</code>，展开用 <code>aria-expanded</code>，复选框用自身的 checked。</li>
</ul>
<p>给 div 加上 click 监听，只完成了“收到点击事件时运行代码”。用户用 Tab 能不能到达它，用 Enter 或空格能不能激活它，屏幕阅读器会不会把它当成按钮，仍然是没解决的问题。</p>
<p>原生 button 已经提供了这些基础语义和交互规则。使用它不是只为了通过检查工具，而是让鼠标、触摸、键盘和辅助技术都能通过各自习惯的方式完成同一个操作。</p>
<h2>先区分操作和导航</h2>
<p>提交表单、打开对话框、切换收藏状态，通常用 button。跳转到另一张页面或某个可定位地址，通常用带 href 的 a。即使视觉上都设计成长方形，也应该根据行为选择元素。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">a</span> <span class="hljs-attr">href</span>=<span class="hljs-string">&quot;/questions/js-this/&quot;</span>&gt;</span>阅读 this 题解<span class="hljs-tag">&lt;/<span class="hljs-name">a</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;open-settings&quot;</span>&gt;</span>打开阅读设置<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>链接有复制地址、在新标签页打开、浏览器状态栏预览等行为。用 button 加 <code>location.href</code> 模拟导航，会丢掉或需要重做其中一部分；用 <code>href=&quot;#&quot;</code> 的链接触发纯操作，则可能额外改变 URL 或滚动位置。</p>
<h2>一个开关按钮不需要手写 Enter 与空格</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;favorite&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-pressed</span>=<span class="hljs-string">&quot;false&quot;</span>&gt;</span>
  收藏
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> favorite = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#favorite&#x27;</span>);

favorite.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">const</span> pressed = favorite.<span class="hljs-title function_">getAttribute</span>(<span class="hljs-string">&#x27;aria-pressed&#x27;</span>) === <span class="hljs-string">&#x27;true&#x27;</span>;
  favorite.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-pressed&#x27;</span>, <span class="hljs-title class_">String</span>(!pressed));
});
</code></pre></div>
<p>原生按钮会把相应的键盘激活转成按钮激活行为，click 监听器可以处理这些入口，不仅仅处理鼠标。这里用 aria-pressed 表示一个可切换的按下状态，标签“收藏”保持稳定，辅助技术可以结合状态解释它。</p>
<p>不要再不加区分地同时监听 keydown，在 Enter 或空格时又调用一次相同逻辑，否则可能与原生激活重复，出现一次按键切换两次、最后看起来没有变化的问题。不同按键的激活时机也不应该用一个随意的键盘事件处理器模拟。</p>
<p>aria-pressed 不适合所有状态。展开说明通常用 aria-expanded，复选框使用它自身的 checked 状态，异步保存是否完成则需要相应的状态反馈。ARIA 表达的是具体语义，而不是万能的布尔开关。</p>
<h2>type 和可访问名称是两项基本配置</h2>
<p>在表单中，普通 button 没有明确写 type 时通常会作为提交按钮。非提交操作应写 <code>type=&quot;button&quot;</code>，提交表单则写 <code>type=&quot;submit&quot;</code>。否则点“打开说明”也可能触发提交和校验，甚至跳转页面。</p>
<p>文字按钮通常可以从文字内容获得可访问名称。只有图标时，应补充名称，例如：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;关闭设置&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span> <span class="hljs-attr">focusable</span>=<span class="hljs-string">&quot;false&quot;</span> <span class="hljs-attr">viewBox</span>=<span class="hljs-string">&quot;0 0 24 24&quot;</span>
       <span class="hljs-attr">width</span>=<span class="hljs-string">&quot;20&quot;</span> <span class="hljs-attr">height</span>=<span class="hljs-string">&quot;20&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">path</span> <span class="hljs-attr">d</span>=<span class="hljs-string">&quot;M6 6 18 18M18 6 6 18&quot;</span> <span class="hljs-attr">fill</span>=<span class="hljs-string">&quot;none&quot;</span>
          <span class="hljs-attr">stroke</span>=<span class="hljs-string">&quot;currentColor&quot;</span> <span class="hljs-attr">stroke-width</span>=<span class="hljs-string">&quot;2&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>这里 SVG 是装饰，操作名称来自按钮的 aria-label。也可以使用视觉隐藏的文本。不要只依赖鼠标悬停才出现的 title；触屏和不同辅助技术下，它不一定提供同样的可发现体验。</p>
<p>按钮已经有可见文字时，通常不需要再写一个不同含义的 aria-label。覆盖后可能让用户看到“保存”，语音操作和辅助技术却面对另一个名称。名称应尽量与用户看到的操作一致。</p>
<h2>disabled 与 aria-disabled 不能互换</h2>
<p><code>disabled</code> 会让原生按钮不可激活，并通常将它移出正常焦点导航；相关表单数据也按禁用控件规则处理。它适合真正不可用的操作，但需要确保用户能理解为什么不可用。</p>
<p><code>aria-disabled=&quot;true&quot;</code> 只向辅助技术表达禁用状态，不会自动阻止点击、键盘激活或代码执行。如果为了让用户仍能聚焦并了解不可用原因而选用它，应用就必须同时阻止实际操作并提供视觉提示，不能只改属性。</p>
<p>异步操作中，也不要只靠禁用按钮解决所有重复请求问题。点击入口、快捷键入口和请求状态都可能参与，业务仍应设计相应的防重复与幂等处理。</p>
<h2>自定义外观不必放弃原生行为</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">button</span><span class="hljs-selector-pseudo">:focus-visible</span> {
  <span class="hljs-attribute">outline</span>: <span class="hljs-number">3px</span> solid <span class="hljs-number">#2563eb</span>;
  <span class="hljs-attribute">outline-offset</span>: <span class="hljs-number">3px</span>;
}

<span class="hljs-selector-tag">button</span><span class="hljs-selector-attr">[aria-pressed=<span class="hljs-string">&quot;true&quot;</span>]</span> {
  <span class="hljs-attribute">background</span>: <span class="hljs-number">#1d4ed8</span>;
  <span class="hljs-attribute">color</span>: white;
}
</code></pre></div>
<p>可以使用 CSS 改颜色、边框、布局和图标，不必为了摆脱默认样式改成 div。保留可见焦点，给触摸操作足够面积，并保证状态不是只有细微颜色差别。</p>
<p>不应在 button 内再嵌套链接、另一个 button 等交互元素。如果整个卡片可导航，同时又有收藏按钮，应把导航和收藏设计成相互独立的可操作元素，避免嵌套交互造成激活目标混乱。</p>
<p>如果确实无法使用原生元素，<code>role=&quot;button&quot;</code> 也只补充角色，并不会附赠键盘激活、Tab 顺序或 disabled 行为。还需要处理 tabindex、键盘默认行为、名称、状态和焦点等细节。既然大多数普通操作都能用 button，优先采用原生控件通常更可靠，也更容易维护。</p>`};export{e as default};