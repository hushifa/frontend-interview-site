var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>dialog.showModal()</code>：模态，页面其他部分不能操作，按 Esc 关闭，有 <code>::backdrop</code> 遮罩。</li>
<li><code>dialog.show()</code>：非模态对话框，不进入顶层，也没有遮罩。</li>
<li><code>popover</code>：非模态浮层，点击外部或按 Esc 自动关闭（<code>popover=&quot;auto&quot;</code>），用 <code>popovertarget</code> 不写 JavaScript 就能打开。</li>
<li>两者都进入顶层（top layer），不受父元素的 <code>z-index</code> 和 <code>overflow</code> 影响。</li>
<li>关闭后焦点会回到打开它的元素，但对话框内部的初始焦点、名称仍需要正确设置。</li>
</ul>
<h2>模态对话框</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;open&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">dialog</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirm&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;confirm-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirm-title&quot;</span>&gt;</span>删除这条记录？<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;dialog&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;cancel&quot;</span>&gt;</span>取消<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;ok&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">dialog</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> dialog = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#confirm&#x27;</span>);
<span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#open&#x27;</span>).<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> dialog.<span class="hljs-title function_">showModal</span>());
dialog.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;close&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-keyword">if</span> (dialog.<span class="hljs-property">returnValue</span> === <span class="hljs-string">&#x27;ok&#x27;</span>) <span class="hljs-title function_">deleteRecord</span>();
});
</code></pre></div>
<p><code>method=&quot;dialog&quot;</code> 的表单提交时关闭对话框，被点击按钮的 <code>value</code> 存到 <code>returnValue</code>，不会发起网络请求。</p>
<p>点击遮罩关闭可以用 <code>closedby=&quot;any&quot;</code> 属性，不支持时监听对话框的 <code>click</code> 事件，判断点击目标是否是 <code>dialog</code> 本身。</p>
<h2>Popover</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">popovertarget</span>=<span class="hljs-string">&quot;menu&quot;</span>&gt;</span>更多<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;menu&quot;</span> <span class="hljs-attr">popover</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>重命名<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>复制<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<ul>
<li><code>popover=&quot;auto&quot;</code>：打开一个会关闭其他 auto popover，点击外部关闭。</li>
<li><code>popover=&quot;manual&quot;</code>：只能通过代码或按钮关闭，适合通知。</li>
<li>位置用锚点定位，见《CSS Anchor Positioning 适合解决哪些浮层布局问题？》。</li>
</ul>
<p>Popover 不是菜单组件，也不会自动加 <code>role</code>。做菜单时仍要实现方向键导航和对应的 ARIA 角色。</p>
<h2>怎么选</h2>
<table><thead><tr><th>场景</th><th>选择</th></tr></thead><tbody><tr><td>确认删除、填写表单，必须先处理</td><td><code>showModal()</code></td></tr><tr><td>下拉菜单、提示气泡、选择器</td><td><code>popover</code></td></tr><tr><td>页面角落的聊天窗口</td><td><code>dialog.show()</code> 或 <code>popover=&quot;manual&quot;</code></td></tr></tbody></table>
<h2>常见追问</h2>
<ul>
<li>怎样做进入和退出动画？用 <code>@starting-style</code> 和 <code>transition-behavior: allow-discrete</code>，见《@starting-style 和离散属性过渡解决了什么问题？》。</li>
</ul>`};export{e as default};