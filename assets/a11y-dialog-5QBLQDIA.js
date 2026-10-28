var e={answerHtml:`<h2>简答</h2>
<ul>
<li>名称：用 <code>aria-labelledby</code> 指向对话框标题，读屏打开时会读出。</li>
<li>打开时焦点移到对话框内：通常是第一个可操作元素；内容很长时可以是标题或对话框本身（加 <code>tabindex=&quot;-1&quot;</code>）；破坏性确认框可以先聚焦“取消”。</li>
<li>背景不可交互、不可被读屏浏览，Tab 不会跑到背景里。</li>
<li>Esc 关闭，关闭后焦点回到打开它的按钮；触发按钮已被删除时，移到合理的位置。</li>
<li><code>&lt;dialog&gt;</code> 的 <code>showModal()</code> 自动处理顶层显示、背景惰性、Esc 关闭和焦点恢复，优先使用它。</li>
</ul>
<h2>原生实现</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;open&quot;</span>&gt;</span>编辑资料<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">dialog</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;edit&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;edit-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;edit-title&quot;</span>&gt;</span>编辑资料<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;dialog&quot;</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>昵称 <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;nickname&quot;</span> <span class="hljs-attr">autofocus</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;cancel&quot;</span> <span class="hljs-attr">formnovalidate</span>&gt;</span>取消<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;save&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">dialog</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#open&#x27;</span>).<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;click&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#edit&#x27;</span>).<span class="hljs-title function_">showModal</span>();
});
</code></pre></div>
<p><code>autofocus</code> 指定打开时的初始焦点。<code>showModal()</code> 会让对话框以外的内容变为惰性，相当于给背景加了 <code>inert</code>。</p>
<h2>自己实现时要补什么</h2>
<p>不能使用原生 dialog 时（例如旧组件库），需要：</p>
<ul>
<li>容器 <code>role=&quot;dialog&quot;</code>、<code>aria-modal=&quot;true&quot;</code>、<code>aria-labelledby</code>。</li>
<li>打开时给背景容器加 <code>inert</code>，关闭时移除。</li>
<li>监听 Esc 关闭。</li>
<li>记录打开前的 <code>document.activeElement</code>，关闭后调用它的 <code>focus()</code>。</li>
<li>把对话框渲染到 <code>body</code> 下，避免被祖先的 <code>overflow</code> 或层叠上下文影响。</li>
</ul>
<p>只加 <code>aria-modal=&quot;true&quot;</code> 不会阻止背景交互，它只是告诉辅助技术背景不可用，键盘仍能 Tab 到背景，必须配合 <code>inert</code>。</p>
<h2>其他细节</h2>
<ul>
<li>点击遮罩关闭可以用 <code>closedby=&quot;any&quot;</code>，表单有未保存内容时应先确认。<code>closedby</code> 目前不是 Baseline，要先检测 <code>&#x27;closedBy&#x27; in HTMLDialogElement.prototype</code>，不支持时监听 <code>click</code>，在 <code>event.target === dialog</code> 时调用 <code>close()</code>。</li>
<li>打开对话框时阻止背景滚动，可以用 <code>html:has(dialog[open]) { overflow: hidden; }</code>。</li>
<li>对话框里有错误提示或异步结果时，用 live region 播报。</li>
<li>不需要阻断背景的提示用 popover 或非模态对话框，不要滥用模态。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>警告类对话框有什么不同？需要用户立即确认的消息用 <code>role=&quot;alertdialog&quot;</code>，并用 <code>aria-describedby</code> 指向消息内容，读屏打开时会一起读出。</li>
</ul>`};export{e as default};