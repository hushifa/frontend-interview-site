var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>原生 <code>&lt;select&gt;</code> 展开后的下拉面板由操作系统绘制，CSS 基本改不了它的样式，选项里也只能放纯文字。设计稿一要求带图标、圆角、自定义箭头，很多团队就只好用 <code>div</code> 自己写一个下拉组件，键盘操作和无障碍都得重新实现。</p>
<p>可定制 select 让原生 <code>&lt;select&gt;</code> 也能完全改样式。在 <code>select</code> 和代表下拉面板的 <code>::picker(select)</code> 上都设置 <code>appearance: base-select</code>，浏览器就去掉系统样式，只保留一套最基础的样式，剩下的都交给 CSS。</p>
<p>设置以后，<code>&lt;select&gt;</code> 的第一个子元素可以是 <code>&lt;button&gt;</code>，用来替换关闭状态下的按钮，里面放 <code>&lt;selectedcontent&gt;</code> 显示当前选中项。<code>&lt;option&gt;</code> 里可以放图片、图标这类非交互内容。<code>::picker-icon</code> 改下拉箭头，<code>::checkmark</code> 改选中标记。下拉面板本身是一个 popover，打开时进入顶层，并且已经自动用锚点定位跟按钮关联好了。</p>
<p>要注意支持现状。按 MDN 兼容数据，Chrome 135 和 Safari 27 起支持，Firefox 只能通过实验开关开启，所以还不是 Baseline。好在它是渐进增强，不支持的浏览器会忽略这些写法，显示普通的 <code>&lt;select&gt;</code>，功能照常可用。</p>
</blockquote>
<h2>怎样开启</h2>
<p>开启只需要一段 CSS，两个地方都要写：</p>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">select</span>,
::<span class="hljs-built_in">picker</span>(select) {
  <span class="hljs-attribute">appearance</span>: base-select;
}
</code></pre></div>
<p><code>select</code> 设置后，关闭状态的按钮可以自定义；<code>::picker(select)</code> 设置后，展开的下拉面板可以自定义。可以只给 <code>select</code> 开启、面板保持系统样式，但不能只开启面板而不开启 <code>select</code>。</p>
<h2>选项里放图标</h2>
<p>下面做一个带图标的选择框：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">select</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;pet&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">selectedcontent</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">selectedcontent</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">option</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;&quot;</span>&gt;</span>请选择宠物<span class="hljs-tag">&lt;/<span class="hljs-name">option</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">option</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;cat&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;icon&quot;</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>🐱<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>猫<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">option</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">option</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;dog&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;icon&quot;</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>🐶<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">span</span>&gt;</span>狗<span class="hljs-tag">&lt;/<span class="hljs-name">span</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">option</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">select</span>&gt;</span>
</code></pre></div>
<p>以前 <code>&lt;select&gt;</code> 里不能放 <code>&lt;button&gt;</code>，<code>&lt;option&gt;</code> 里也只能放文字，这两点在可定制 select 里都放开了。</p>
<p><code>&lt;selectedcontent&gt;</code> 会把当前选中的 <code>&lt;option&gt;</code> 的内容克隆一份显示在按钮里，所以选了“猫”，按钮上也会带着猫的图标。这个按钮默认是 inert 的，即使里面放了链接或按钮，整体也只当成一个按钮来交互。</p>
<p>那表单提交的值是什么？和原来一样是 <code>value</code>。没有写 <code>value</code> 时，浏览器取选中项的 <code>textContent</code> 去掉首尾空白作为值。</p>
<h2>箭头、选中标记和面板位置</h2>
<div class="not-prose code-block"><div class="code-language">CSS</div><pre><code class="hljs language-css"><span class="hljs-selector-tag">select</span>::picker-icon {
  <span class="hljs-attribute">transition</span>: rotate <span class="hljs-number">0.4s</span>;
}

<span class="hljs-selector-tag">select</span>:open::picker-icon {
  <span class="hljs-attribute">rotate</span>: <span class="hljs-number">180deg</span>;
}

<span class="hljs-selector-tag">option</span>::checkmark {
  <span class="hljs-attribute">content</span>: <span class="hljs-string">&#x27;✓&#x27;</span>;
}

::<span class="hljs-built_in">picker</span>(select) {
  <span class="hljs-attribute">top</span>: <span class="hljs-built_in">calc</span>(<span class="hljs-built_in">anchor</span>(bottom) + <span class="hljs-number">4px</span>);
}
</code></pre></div>
<p><code>::picker-icon</code> 是按钮里的下拉箭头，配合 <code>:open</code> 伪类可以在展开时转过来。<code>::checkmark</code> 是选中项前面的勾。这两个伪元素不在无障碍树里，<code>content</code> 写的文字读屏软件不会读出来，所以不要把重要信息放进去。</p>
<p>下拉面板是一个 popover，打开时进入顶层，不会被父元素的 <code>overflow</code> 裁掉。它和按钮之间已经有隐式的锚点关联，直接用 <code>anchor()</code> 就能调整位置，不用再写 <code>anchor-name</code>。浏览器默认样式还带了备选位置，面板快超出视口时会自动换个方向。锚点定位的细节见<a href="/questions/css-anchor-positioning/">《CSS Anchor Positioning 适合解决哪些浮层布局问题？》</a>。</p>
<h2>不支持的浏览器会怎样</h2>
<p>不支持的浏览器会完全忽略 <code>&lt;button&gt;&lt;selectedcontent&gt;&lt;/selectedcontent&gt;&lt;/button&gt;</code> 这段结构，<code>&lt;option&gt;</code> 里的非文字内容也会被去掉，只留下文字。最后得到的是一个普通的原生 <code>&lt;select&gt;</code>，能正常选择和提交。</p>
<p>所以它可以直接用在生产环境里，只要保证每个选项的文字本身就能说清楚意思。需要只在支持的浏览器里生效的样式，可以放进 <code>@supports (appearance: base-select)</code> 里。MDN 还提醒，有些 JavaScript 框架会拦截这些新元素，或者在服务端渲染时导致水合失败，用之前要在自己的框架里试一下。</p>
<h2>常见追问</h2>
<p><strong>和自己用 div 写的下拉组件比，好在哪里？</strong></p>
<blockquote>
<p>它仍然是原生 <code>&lt;select&gt;</code>，键盘操作、表单提交和读屏语义都由浏览器提供，不用自己实现。自己写的组件要补齐这些，见<a href="/questions/a11y-combobox/">《可访问的 Combobox 需要哪些键盘和 ARIA 行为？》</a>。</p>
</blockquote>
<p><strong>下拉面板能做打开动画吗？</strong></p>
<blockquote>
<p>可以。面板是 popover，可以和其他 popover 一样用 <code>@starting-style</code> 做进入动画，见<a href="/questions/css-starting-style-discrete-transition/">《@starting-style 和离散属性过渡解决了什么问题？》</a>。</p>
</blockquote>`};export{e as default};