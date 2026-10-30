var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>以前打开一个模态对话框，至少要写一行 <code>addEventListener</code> 去调用 <code>showModal()</code>。现在给按钮写上 <code>commandfor=&quot;对话框 id&quot;</code> 和 <code>command=&quot;show-modal&quot;</code>，点击就能打开，一行脚本都不用写。</p>
<p><code>command</code> 内置了六个值：<code>show-modal</code>、<code>close</code>、<code>request-close</code> 控制 <code>&lt;dialog&gt;</code>，<code>show-popover</code>、<code>hide-popover</code>、<code>toggle-popover</code> 控制 popover。以 <code>--</code> 开头的是自定义命令，浏览器不做内置动作，只在目标元素上触发 <code>command</code> 事件，由脚本处理。它不用等 JavaScript 下载执行，按钮一出现就能用，而且是 <code>popovertarget</code> 更通用的版本。</p>
<p><code>popover</code> 属性有三种值。<code>auto</code> 是默认值，点外面或按 Esc 会关闭，打开一个会关掉其他非嵌套的 auto popover。<code>manual</code> 不能点外面关闭，也不会关掉别人，必须手动关。<code>hint</code> 适合悬停提示，可以点外面关闭，打开时不会关掉已经打开的 auto popover，只会关掉其他 hint。</p>
<p>要注意兼容性。Invoker Commands 是 Baseline 2025，2025 年 12 月起主流浏览器最新版都支持。<code>popover=&quot;hint&quot;</code> 较新，Chrome 151、Firefox 153 起支持，Safari 正式版还没有。</p>
</blockquote>
<h2>用按钮直接控制 dialog</h2>
<p>下面这个对话框没有一行脚本：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">commandfor</span>=<span class="hljs-string">&quot;confirm&quot;</span> <span class="hljs-attr">command</span>=<span class="hljs-string">&quot;show-modal&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">dialog</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirm&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;confirm-title&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirm-title&quot;</span>&gt;</span>删除这条记录？<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">commandfor</span>=<span class="hljs-string">&quot;confirm&quot;</span> <span class="hljs-attr">command</span>=<span class="hljs-string">&quot;close&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;cancel&quot;</span>&gt;</span>取消<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">commandfor</span>=<span class="hljs-string">&quot;confirm&quot;</span> <span class="hljs-attr">command</span>=<span class="hljs-string">&quot;close&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;ok&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">dialog</span>&gt;</span>
</code></pre></div>
<p><code>commandfor</code> 的值是要控制的元素的 <code>id</code>，<code>command</code> 是要执行的动作。<code>show-modal</code> 相当于调用 <code>showModal()</code>，对话框已经是模态时什么也不做。<code>close</code> 相当于调用 <code>close()</code>，按钮上的 <code>value</code> 会成为对话框的 <code>returnValue</code>，所以关闭以后照样可以在 <code>close</code> 事件里判断用户点的是哪个。</p>
<p><code>request-close</code> 和 <code>close</code> 的区别在于，它会先触发 <code>cancel</code> 事件，再触发 <code>close</code> 事件。在 <code>cancel</code> 里调用 <code>preventDefault()</code> 可以阻止关闭，适合“表单还没保存，确定要关闭吗”这种情况。</p>
<p>对话框本身的用法、<code>method=&quot;dialog&quot;</code> 和焦点规则，见<a href="/questions/html-dialog-popover/">《dialog 和 Popover API 应该怎样使用？》</a>。</p>
<h2>控制 popover 和自定义命令</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">commandfor</span>=<span class="hljs-string">&quot;menu&quot;</span> <span class="hljs-attr">command</span>=<span class="hljs-string">&quot;toggle-popover&quot;</span>&gt;</span>更多<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">div</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;menu&quot;</span> <span class="hljs-attr">popover</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">commandfor</span>=<span class="hljs-string">&quot;menu&quot;</span> <span class="hljs-attr">command</span>=<span class="hljs-string">&quot;hide-popover&quot;</span>&gt;</span>关闭<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">div</span>&gt;</span>
</code></pre></div>
<p><code>toggle-popover</code>、<code>show-popover</code>、<code>hide-popover</code> 分别等价于 <code>popovertargetaction</code> 的 <code>toggle</code>、<code>show</code>、<code>hide</code>。区别是 <code>popovertarget</code> 只能控制 popover，<code>commandfor</code> 还能控制 dialog 和自定义动作。</p>
<p>自定义命令以 <code>--</code> 开头。浏览器不会做任何内置操作，只在目标元素上派发一个 <code>CommandEvent</code>：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> image = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#photo&#x27;</span>);
image.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;command&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">command</span> === <span class="hljs-string">&#x27;--rotate-left&#x27;</span>) image.<span class="hljs-property">style</span>.<span class="hljs-property">rotate</span> = <span class="hljs-string">&#x27;-90deg&#x27;</span>;
  <span class="hljs-keyword">if</span> (event.<span class="hljs-property">command</span> === <span class="hljs-string">&#x27;--rotate-right&#x27;</span>) image.<span class="hljs-property">style</span>.<span class="hljs-property">rotate</span> = <span class="hljs-string">&#x27;90deg&#x27;</span>;
});
</code></pre></div>
<p>这样做的好处是，按钮和目标的关系写在 HTML 里，脚本只监听目标元素，不用再给每个按钮各绑一个事件。<code>event.command</code> 是按钮上的命令值，<code>event.source</code> 是触发命令的那个按钮。</p>
<h2>auto、manual 和 hint 怎么选</h2>
<p>三种值的差别在两件事上：能不能点外面关闭（light dismiss），打开时会不会关掉别的 popover。</p>
<p><code>auto</code> 是默认值，写 <code>popover</code> 或 <code>popover=&quot;&quot;</code> 都是它。点外面或按 Esc 会关闭；打开一个 auto popover，一般会关掉其他已经打开的 auto popover，除非它们是嵌套关系。所以同一时间通常只有一个 auto popover，适合下拉菜单。</p>
<p><code>manual</code> 不能点外面关闭，也不会被别的 popover 自动关掉，必须用按钮或脚本显式关闭。多个 manual popover 可以同时显示，适合通知、消息提示这类不该被随手关掉的东西。</p>
<p><code>hint</code> 介于两者之间。它可以点外面关闭，也会响应 Esc。打开时不会关掉已经打开的 auto popover，但会关掉其他不是它祖先的 hint popover。它通常配合 <code>mouseover</code>、<code>mouseout</code> 或 <code>focus</code>、<code>blur</code> 事件用脚本打开和关闭，做悬停提示。比如菜单是 auto popover，菜单项上悬停显示的说明用 hint，说明出现时菜单不会被关掉。</p>
<p>这里有一个容易踩的坑：如果用点击按钮的方式打开 hint，而按钮在 auto popover 外面，这次点击本身就算点了 auto popover 的外面，会把它关掉。hint 自己不关 auto，但点击这个动作会。</p>
<h2>常见追问</h2>
<p><strong>command 和 popovertarget 同时写会怎样？</strong></p>
<blockquote>
<p>MDN 没有说明哪个优先，同一个按钮只用一种写法即可。<code>commandfor</code> 能覆盖 <code>popovertarget</code> 的全部用法，新代码可以统一用 <code>commandfor</code>。</p>
</blockquote>
<p><strong>popover 的位置怎么定？</strong></p>
<blockquote>
<p>用锚点定位把浮层放在按钮旁边，见<a href="/questions/css-anchor-positioning/">《CSS Anchor Positioning 适合解决哪些浮层布局问题？》</a>。</p>
</blockquote>`};export{e as default};