var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>模态对话框就是打开以后，用户只能和它交互、背后的页面暂时不能用的弹窗。它首先要有名称，用 <code>aria-labelledby</code> 指向标题，读屏打开时会读出来。</p>
<p>打开时，焦点要移进对话框。通常落在第一个可操作的元素上；内容很长时可以落在标题或对话框本身（加 <code>tabindex=&quot;-1&quot;</code>）；删除这类破坏性确认框，可以先聚焦“取消”。打开期间，背景不能交互、读屏浏览不到，Tab 也不会跑到背景里。</p>
<p>关闭时，按 Esc 能关，关闭后焦点回到打开它的按钮。如果那个按钮已经被删掉了，就移到一个合理的位置。</p>
<p>这些行为原生 <code>&lt;dialog&gt;</code> 的 <code>showModal()</code> 大多已经做好了：显示在最上层、背景变成惰性、Esc 关闭、恢复焦点。所以优先用它。</p>
</blockquote>
<h2>原生 dialog 怎么写</h2>
<p>下面是一个编辑资料的对话框，点按钮时用 <code>showModal()</code> 打开。</p>
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
<p><code>autofocus</code> 指定打开时焦点落在昵称输入框上。<code>form method=&quot;dialog&quot;</code> 让表单里的按钮直接关闭对话框。</p>
<p>背景为什么点不到？因为 <code>showModal()</code> 会让对话框以外的内容变成惰性，效果相当于给背景加了 <code>inert</code>：不能聚焦、不能点击、读屏也看不到。</p>
<h2>自己实现时要补什么</h2>
<p>有时候用不了原生 dialog，比如维护旧组件库。这时要自己补齐几件事：容器写上 <code>role=&quot;dialog&quot;</code>、<code>aria-modal=&quot;true&quot;</code> 和 <code>aria-labelledby</code>；打开时给背景容器加 <code>inert</code>，关闭时移除；监听 Esc 关闭；打开前记下 <code>document.activeElement</code>，关闭后调用它的 <code>focus()</code>；把对话框渲染到 <code>body</code> 下，免得被祖先的 <code>overflow</code> 或层叠上下文影响。</p>
<p>这里最常见的误解是以为加了 <code>aria-modal=&quot;true&quot;</code> 就够了。它只是告诉辅助技术“背景现在不可用”，并不会真的阻止交互，键盘照样能 Tab 到背景里。所以必须配合 <code>inert</code> 一起用。</p>
<h2>其他细节</h2>
<p>点遮罩关闭可以用 <code>closedby=&quot;any&quot;</code>。不过表单里有未保存的内容时，应该先确认再关。<code>closedby</code> 目前不是 Baseline，用之前要检测 <code>&#x27;closedBy&#x27; in HTMLDialogElement.prototype</code>。不支持时就监听 <code>click</code>，在 <code>event.target === dialog</code> 时调用 <code>close()</code>，因为点到遮罩时事件目标就是 dialog 本身。</p>
<p>打开对话框时通常要阻止背景滚动，可以写 <code>html:has(dialog[open]) { overflow: hidden; }</code>。对话框里出现错误提示或异步结果时，用 live region 播报。</p>
<p>最后，不需要挡住背景的提示，用 popover 或非模态对话框就行，不要什么都做成模态。</p>
<h2>常见追问</h2>
<p><strong>警告类对话框有什么不同？</strong></p>
<blockquote>
<p>需要用户马上确认的消息，用 <code>role=&quot;alertdialog&quot;</code>，再用 <code>aria-describedby</code> 指向消息内容。这样读屏打开时会把消息一起读出来。</p>
</blockquote>`};export{e as default};