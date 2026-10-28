var e={answerHtml:`<h2>简答</h2>
<ul>
<li>可选值：<code>none</code>、<code>text</code>、<code>decimal</code>、<code>numeric</code>、<code>tel</code>、<code>search</code>、<code>email</code>、<code>url</code>。</li>
<li>验证码、银行卡号这类“由数字组成但不是数值”的字段，用 <code>type=&quot;text&quot;</code> 加 <code>inputmode=&quot;numeric&quot;</code>，而不是 <code>type=&quot;number&quot;</code>。</li>
<li><code>type=&quot;number&quot;</code> 会显示步进按钮、滚轮会改值、会丢掉前导 0，不适合编号。</li>
<li>需要小数点的金额用 <code>decimal</code>，电话号码用 <code>type=&quot;tel&quot;</code>，它本身就会弹出电话键盘。</li>
<li>用户仍可以粘贴或用外接键盘输入任何字符，所以要配合 <code>pattern</code> 和服务端校验。</li>
</ul>
<h2>示例</h2>
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
<p><code>enterkeyhint</code> 改变键盘回车键的文字，可选 <code>enter</code>、<code>done</code>、<code>go</code>、<code>next</code>、<code>previous</code>、<code>search</code>、<code>send</code>。</p>
<h2>type 和 inputmode 的分工</h2>
<table><thead><tr><th>属性</th><th>作用</th></tr></thead><tbody><tr><td><code>type</code></td><td>控件类型、内置校验、值的格式</td></tr><tr><td><code>inputmode</code></td><td>只影响虚拟键盘</td></tr><tr><td><code>autocomplete</code></td><td>字段用途和自动填充</td></tr><tr><td><code>pattern</code></td><td>校验规则</td></tr></tbody></table>
<p><code>type=&quot;email&quot;</code> 已经会弹出邮箱键盘并校验格式，不需要再写 <code>inputmode=&quot;email&quot;</code>。<code>inputmode</code> 主要用于 <code>type=&quot;text&quot;</code> 或 <code>contenteditable</code> 元素。</p>
<h2>常见追问</h2>
<ul>
<li><code>inputmode=&quot;none&quot;</code> 有什么用？用于页面自己提供输入面板的场景，例如自定义数字键盘，避免系统键盘弹出遮挡。</li>
</ul>`};export{e as default};