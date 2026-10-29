var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>选哪个，先问一句：这个浮层打开时，要不要挡住页面其他部分？</p>
<p>要挡住，用 <code>dialog.showModal()</code>。它打开的是模态对话框，页面其他部分不能操作，按 Esc 能关闭，还有 <code>::backdrop</code> 遮罩。<code>dialog.show()</code> 打开的是非模态对话框，不进入顶层，也没有遮罩。不挡页面的下拉菜单、提示气泡，用 <code>popover</code> 属性。<code>popover=&quot;auto&quot;</code> 点外面或按 Esc 会自动关闭，配合 <code>popovertarget</code> 不写 JavaScript 就能打开。</p>
<p>它们最大的好处是，<code>showModal()</code> 打开的对话框和 popover 都进入顶层（top layer），不受父元素 <code>z-index</code> 和 <code>overflow</code> 的影响，不会再被遮住或裁掉。</p>
<p>要注意，关闭后焦点会回到打开它的元素，但对话框里的初始焦点、对话框的名称，仍然要自己设置好。</p>
</blockquote>
<h2>一个确认删除的对话框</h2>
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
<p>这里没有给两个按钮写点击事件，怎么知道用户点了哪个？关键在 <code>method=&quot;dialog&quot;</code>。这种表单提交时不会发网络请求，而是关闭对话框，并把被点按钮的 <code>value</code> 存进 <code>dialog.returnValue</code>。所以在 <code>close</code> 事件里看 <code>returnValue</code> 是不是 <code>&#x27;ok&#x27;</code> 就行了。</p>
<p><code>aria-labelledby</code> 把标题关联成对话框的名称，读屏打开对话框时会读出“删除这条记录？”。</p>
<p>想要点击遮罩就关闭，可以用 <code>closedby=&quot;any&quot;</code> 属性。不支持的浏览器里，监听对话框的 <code>click</code> 事件，判断点击目标是不是 <code>dialog</code> 本身。</p>
<h2>Popover：不写 JavaScript 的浮层</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">popovertarget</span>=<span class="hljs-string">&quot;menu&quot;</span>&gt;</span>更多<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;menu&quot;</span> <span class="hljs-attr">popover</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>重命名<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>复制<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p>点“更多”就会打开菜单，再点外面或按 Esc 就关闭，一行脚本都没写。</p>
<p><code>popover</code> 有两种。<code>popover=&quot;auto&quot;</code> 是默认的，打开一个会自动关掉其他 auto popover，点外面就关闭。<code>popover=&quot;manual&quot;</code> 只能用代码或按钮关闭，适合通知这类不该被随手点掉的东西。</p>
<p>浮层放在哪里，用锚点定位来做，见<a href="/questions/css-anchor-positioning/">《CSS Anchor Positioning 适合解决哪些浮层布局问题？》</a>。</p>
<p>要注意，popover 不是菜单组件，也不会自动加 <code>role</code>。做菜单时，方向键导航和对应的 ARIA 角色还是要自己实现。</p>
<h2>场景怎么对应</h2>
<p>确认删除、填写表单这种必须先处理完的，用 <code>showModal()</code>。</p>
<p>下拉菜单、提示气泡、各种选择器，用 <code>popover</code>。</p>
<p>页面角落的聊天窗口，既不挡页面，又不该点外面就关，用 <code>dialog.show()</code> 或者 <code>popover=&quot;manual&quot;</code>。</p>
<h2>常见追问</h2>
<p><strong>对话框和 popover 怎样做进入和退出动画？</strong></p>
<blockquote>
<p>用 <code>@starting-style</code> 和 <code>transition-behavior: allow-discrete</code>，见<a href="/questions/css-starting-style-discrete-transition/">《@starting-style 和离散属性过渡解决了什么问题？》</a>。</p>
</blockquote>`};export{e as default};