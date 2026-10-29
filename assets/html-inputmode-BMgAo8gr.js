var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>手机上填验证码，弹出来的是全键盘，还得切到数字，很麻烦。<code>inputmode</code> 就是告诉手机该弹哪种虚拟键盘，可选值有 <code>none</code>、<code>text</code>、<code>decimal</code>、<code>numeric</code>、<code>tel</code>、<code>search</code>、<code>email</code>、<code>url</code>。</p>
<p>验证码、银行卡号这种“全是数字但不是数值”的字段，用 <code>type=&quot;text&quot;</code> 加 <code>inputmode=&quot;numeric&quot;</code>，不要用 <code>type=&quot;number&quot;</code>。因为 <code>type=&quot;number&quot;</code> 会显示上下步进按钮，鼠标滚轮会改掉值，还会把开头的 0 丢掉。</p>
<p>金额要输小数点，用 <code>decimal</code>。电话号码直接用 <code>type=&quot;tel&quot;</code>，它本身就会弹电话键盘。</p>
<p>要注意，<code>inputmode</code> 只管键盘长什么样。用户照样能粘贴，或者用外接键盘输入任何字符，所以还是要配合 <code>pattern</code> 和服务端校验。</p>
</blockquote>
<h2>几种常见字段</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
  验证码
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span>
    <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;code&quot;</span>
    <span class="hljs-attr">inputmode</span>=<span class="hljs-string">&quot;numeric&quot;</span>
    <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;one-time-code&quot;</span>
    <span class="hljs-attr">pattern</span>=<span class="hljs-string">&quot;[0-9]{6}&quot;</span>
    <span class="hljs-attr">maxlength</span>=<span class="hljs-string">&quot;6&quot;</span>
  &gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
  金额
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;amount&quot;</span> <span class="hljs-attr">inputmode</span>=<span class="hljs-string">&quot;decimal&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
  搜索
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;search&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;q&quot;</span> <span class="hljs-attr">enterkeyhint</span>=<span class="hljs-string">&quot;search&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
</code></pre></div>
<p>验证码这个字段几个属性各司其职：<code>inputmode</code> 弹数字键盘，<code>autocomplete</code> 让系统能从短信里填验证码，<code>pattern</code> 校验是不是 6 位数字，<code>maxlength</code> 限制长度。</p>
<p>搜索框上的 <code>enterkeyhint</code> 改的是键盘上回车键显示的文字，可选 <code>enter</code>、<code>done</code>、<code>go</code>、<code>next</code>、<code>previous</code>、<code>search</code>、<code>send</code>。写 <code>search</code>，回车键就会显示成“搜索”。</p>
<h2>type 和 inputmode 怎么分工</h2>
<p><code>type</code> 决定这是什么控件，带有内置校验和值的格式。<code>inputmode</code> 只影响虚拟键盘。<code>autocomplete</code> 说明字段用途，用于自动填充。<code>pattern</code> 是校验规则。</p>
<p>所以 <code>type=&quot;email&quot;</code> 已经会弹出邮箱键盘、也会校验格式，不用再写 <code>inputmode=&quot;email&quot;</code>。<code>inputmode</code> 主要用在 <code>type=&quot;text&quot;</code> 或者 <code>contenteditable</code> 的元素上，这些地方 <code>type</code> 帮不上忙。</p>
<h2>常见追问</h2>
<p><strong><code>inputmode=&quot;none&quot;</code> 有什么用？</strong></p>
<blockquote>
<p>页面自己做了一个输入面板时用，比如自定义的数字键盘。写上 <code>none</code>，系统键盘就不会弹出来挡住页面自己的键盘。</p>
</blockquote>`};export{e as default};