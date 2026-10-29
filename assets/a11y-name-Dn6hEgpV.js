var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>读屏聚焦到一个控件时，先读它叫什么，这就是可访问名称，比如“删除”“搜索”，要简短好认。描述是额外的说明，比如“密码至少 8 位”，用 <code>aria-describedby</code> 关联，在名称和角色之后才读出来。</p>
<p>名称从哪里来，有固定的优先级：<code>aria-labelledby</code> 最高，然后是 <code>aria-label</code>，再是原生方式，比如 <code>&lt;label&gt;</code>、<code>alt</code>、按钮文字、<code>legend</code>、<code>caption</code>，最后才是 <code>title</code>。按钮和链接的名称来自它们的内容；<code>input</code> 的名称来自 <code>&lt;label&gt;</code>，<code>placeholder</code> 不应该当名称用。</p>
<p>有些角色不能从内容算出名称，比如 <code>listitem</code>，以及没有角色的 <code>div</code>。给它们加 <code>aria-label</code>，读屏也常常不理会。</p>
<p>还要注意，看得见的文字要和名称一致。按钮上写“提交”，<code>aria-label</code> 却写“发送表单”，语音控制的用户说“点击提交”就找不到它了（WCAG 2.5.3）。</p>
</blockquote>
<h2>三种常见写法</h2>
<p>下面分别是图标按钮、带说明的输入框，以及用页面上已有文字拼成名称的按钮。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-comment">&lt;!-- 图标按钮 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;关闭&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">svg</span> <span class="hljs-attr">aria-hidden</span>=<span class="hljs-string">&quot;true&quot;</span>&gt;</span>…<span class="hljs-tag">&lt;/<span class="hljs-name">svg</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 输入框加说明 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;pw&quot;</span>&gt;</span>密码<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;pw&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;pw-hint&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;pw-hint&quot;</span>&gt;</span>至少 8 位，包含字母和数字<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>

<span class="hljs-comment">&lt;!-- 用已有文字组成名称 --&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">h2</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;order-title&quot;</span>&gt;</span>订单 #1024<span class="hljs-tag">&lt;/<span class="hljs-name">h2</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;del&quot;</span> <span class="hljs-attr">aria-labelledby</span>=<span class="hljs-string">&quot;del order-title&quot;</span>&gt;</span>删除<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
</code></pre></div>
<p>图标按钮里只有一个图标，没有文字，读屏不知道它叫什么，所以用 <code>aria-label</code> 给它起名，图标本身用 <code>aria-hidden</code> 藏起来。</p>
<p>第二个输入框，名称来自 <code>&lt;label&gt;</code>，是“密码”；描述来自 <code>aria-describedby</code>，是那行提示。读屏会先读“密码”，再读提示。</p>
<p>最后一个按钮最值得说。<code>aria-labelledby</code> 引用了两个 ID：按钮自己和订单标题，所以它的名称是“删除 订单 #1024”。列表里有很多“删除”按钮时，读屏用户靠这个才能分清删的是哪一个。</p>
<h2>常见错误</h2>
<p>只用 <code>placeholder</code> 当提示是不行的。用户一输入它就消失了，部分读屏也不会可靠地读它。</p>
<p>用 <code>title</code> 当名称也不好。触屏和键盘用户根本看不到那个悬停提示框。</p>
<p>图片的 <code>alt</code> 写成“图片”或者文件名，等于没写。装饰性的图片用 <code>alt=&quot;&quot;</code>，有信息的图片要写出它想传达的内容。</p>
<p>名称里不要带上角色。按钮名称写“提交按钮”，读屏会读成“提交按钮，按钮”。</p>
<h2>怎样查看计算结果</h2>
<p>开发者工具里的 Accessibility 面板会显示元素最终算出来的名称、名称的来源、角色和描述。名称有好几个来源时，看这里比看代码可靠。</p>
<h2>常见追问</h2>
<p><strong><code>aria-label</code> 和 <code>aria-labelledby</code> 怎么选？</strong></p>
<blockquote>
<p>页面上已经有可见文字时，用 <code>aria-labelledby</code> 引用它，这样翻译和文案修改都会同步生效。没有可见文字时，才用 <code>aria-label</code>。</p>
</blockquote>`};export{e as default};