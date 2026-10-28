var e={answerHtml:`<h2>简答</h2>
<ul>
<li>锚点元素用 <code>anchor-name</code> 声明名字，浮层用 <code>position: absolute</code> 或 <code>fixed</code> 加 <code>position-anchor</code> 关联它。</li>
<li>关联本身不移动元素，还要用 <code>position-area</code>、<code>anchor()</code> 或 <code>anchor-center</code> 指定位置。</li>
<li><code>position-try-fallbacks</code> 在默认位置溢出时依次尝试备选位置，例如 <code>flip-block</code>。</li>
<li>列表里多个元素用同一个锚点名时，浮层默认绑定源码顺序最后一个；用 <code>anchor-scope</code> 把名字限定在子树内。</li>
<li><code>anchor-name</code> 自 2026 年 1 月起进入 Baseline，较新的部分支持程度不一，旧浏览器仍需回退。</li>
</ul>
<h2>基本用法</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;save&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;tip&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;tooltip&quot;</span>&gt;</span>保存后会同步到所有设备<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.save</span> {
  <span class="hljs-attribute">anchor-name</span>: --save;
}

<span class="hljs-selector-class">.tip</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">position-anchor</span>: --save;
  <span class="hljs-attribute">position</span>-area: top;
  <span class="hljs-attribute">margin-block-end</span>: <span class="hljs-number">8px</span>;
  <span class="hljs-attribute">position</span>-try-fallbacks: flip-block;
}
</code></pre></div>
<p><code>position-area</code> 把锚点当成 3×3 网格的中心格，<code>top</code> 表示放在锚点上方并在水平方向跨满整行。上方空间不够时，<code>flip-block</code> 会把浮层翻到下方。</p>
<p>需要更精细的控制时用 <code>anchor()</code>，它返回长度，可以参与 <code>calc()</code>：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.tip</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">position-anchor</span>: --save;
  <span class="hljs-attribute">top</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-built_in">anchor</span>(bottom) + <span class="hljs-number">6px</span>);
  <span class="hljs-attribute">justify-self</span>: anchor-center;
}
</code></pre></div>
<h2>重复组件里的锚点</h2>
<p>表格每一行都有一个“更多”按钮时，所有按钮使用同一个锚点名，浮层会全部指向最后一个按钮。给行元素加 <code>anchor-scope</code>，让名字只在行内可见：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-class">.row</span> {
  anchor-scope: --row-action;
}

<span class="hljs-selector-class">.row</span> <span class="hljs-selector-class">.more</span> {
  <span class="hljs-attribute">anchor-name</span>: --row-action;
}

<span class="hljs-selector-class">.row</span> <span class="hljs-selector-class">.menu</span> {
  <span class="hljs-attribute">position</span>: absolute;
  <span class="hljs-attribute">position-anchor</span>: --row-action;
  <span class="hljs-attribute">position</span>-area: bottom span-right;
}
</code></pre></div>
<h2>和 Popover 配合</h2>
<p>用 <code>popovertarget</code> 打开的 popover 会获得隐式锚点，就是触发它的按钮。这时可以不写 <code>anchor-name</code>，但要清掉 popover 默认的居中样式：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-attr">[popover]</span> {
  <span class="hljs-attribute">inset</span>: auto;
  <span class="hljs-attribute">margin</span>: <span class="hljs-number">0</span>;
  <span class="hljs-attribute">position</span>-area: bottom;
}
</code></pre></div>
<p>Popover 负责顶层显示、轻量关闭和焦点行为，锚点定位只负责位置，两者分工互补。</p>
<h2>回退</h2>
<p>不支持的浏览器里浮层会按普通绝对定位处理。可以先写一个可用的定位，再用 <code>@supports (anchor-name: --a)</code> 加强。需要支持旧浏览器的复杂场景，仍可使用 Floating UI 这类库计算位置。</p>
<p>锚点必须被渲染；锚点是 <code>display: none</code> 时，浮层会退回最近的定位祖先。</p>
<h2>常见追问</h2>
<ul>
<li>浮层离开视口后要不要隐藏？可以用 <code>position-visibility: anchors-visible</code>，在锚点滚出视口时隐藏浮层。</li>
<li>锚点定位能代替 tooltip 的无障碍处理吗？不能。<code>aria-describedby</code>、键盘触发和 Esc 关闭仍需要单独实现。</li>
</ul>`};export{e as default};