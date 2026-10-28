var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>inputmode</code> 只提示虚拟键盘类型，不限制粘贴、实体键盘或脚本赋值，也不改变值的类型。</li>
<li><code>type</code> 决定控件语义和校验，<code>inputmode</code> 决定键盘，<code>autocomplete</code> 说明字段用途，三者不能互相替代。</li>
<li>验证码用 <code>type=&quot;text&quot;</code>、<code>inputmode=&quot;numeric&quot;</code> 和 <code>autocomplete=&quot;one-time-code&quot;</code>，保留前导零。</li>
<li><code>type=&quot;number&quot;</code> 用于可以做数值运算的量，不适合验证码、卡号这类数字标识。</li>
</ul>
<p>让用户在手机上填写验证码时，如果弹出完整字母键盘，就需要先切换数字布局。<code>inputmode=&quot;numeric&quot;</code> 可以提示浏览器优先提供数字键盘，减少这一步操作。</p>
<p>但它只是输入方式提示。<strong>用户仍然可能粘贴其他内容、使用实体键盘或通过脚本赋值。</strong> 它既不会把 input.value 变成数字，也不是“禁止输入非数字”的校验器。</p>
<h2>先区分字段语义，再选择键盘</h2>
<p>一个字段可以同时有几种不同的信息：</p>
<table><thead><tr><th>属性</th><th>回答的问题</th></tr></thead><tbody><tr><td><code>type</code></td><td>这是什么控件或数据类型，采用哪些原生行为</td></tr><tr><td><code>inputmode</code></td><td>虚拟键盘最好呈现什么布局</td></tr><tr><td><code>autocomplete</code></td><td>浏览器或管理器可以如何理解和填充这个字段</td></tr><tr><td><code>required</code>、<code>pattern</code> 等</td><td>什么值才满足表单约束</td></tr><tr><td><code>enterkeyhint</code></td><td>虚拟键盘确认键适合显示什么文字或图标</td></tr></tbody></table>
<p>这些属性可以协作，但不能互相代替。例如 <code>type=&quot;email&quot;</code> 会提供邮箱控件的语义和基本格式检查，<code>inputmode=&quot;email&quot;</code> 单独使用则只是请求适合输入邮箱的键盘布局。</p>
<h2>验证码是数字字符组成的标识，不是数量</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;verification-code&quot;</span>&gt;</span>六位验证码<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span>
  <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;verification-code&quot;</span>
  <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;code&quot;</span>
  <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;text&quot;</span>
  <span class="hljs-attr">inputmode</span>=<span class="hljs-string">&quot;numeric&quot;</span>
  <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;one-time-code&quot;</span>
  <span class="hljs-attr">pattern</span>=<span class="hljs-string">&quot;[0-9]{6}&quot;</span>
  <span class="hljs-attr">maxlength</span>=<span class="hljs-string">&quot;6&quot;</span>
  <span class="hljs-attr">required</span>
  <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;code-help&quot;</span>
/&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;code-help&quot;</span>&gt;</span>请输入短信中的六位数字，可直接粘贴。<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
</code></pre></div>
<p><code>type=&quot;text&quot;</code> 保留字符串语义，像 <code>001234</code> 这样的前导零有意义，不应该先转成数值再丢掉。numeric 提示数字键盘，one-time-code 提示一次性验证码用途，pattern 与 required 负责相应的提交约束，maxlength 帮助限制手动编辑长度。</p>
<p>one-time-code 不会自动替应用申请所有短信读取权限，也不保证任何设备都能取出验证码；是否提供候选，仍受系统、浏览器和消息格式影响。输入框应一直允许正常手输与粘贴。</p>
<p>把验证码设成 <code>type=&quot;number&quot;</code> 不是更严格的做法。number 表达可以进行数值操作的量，涉及步进、范围和数值解析；适用的输入语法也不只是固定长度数字串，maxlength 对它并没有文本框相同的意义。</p>
<p>邮编、银行卡号等也应先看业务语义，而不是看到“目前大多是数字”就统一用 number。有些国家的邮编包含字母，国际电话还可能包含 <code>+</code>、空格或分机信息。</p>
<h2>numeric 与 decimal 应怎样选</h2>
<p>numeric 通常请求以数字 0–9 为主的键盘。decimal 请求适合小数输入的键盘，可能根据地区提供点号或逗号作为小数分隔符。两者是否显示负号、是否能方便切换其他字符，都取决于设备与实现。</p>
<p>如果是真正的数量，可以根据业务选择：</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;quantity&quot;</span>&gt;</span>商品数量<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;quantity&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;quantity&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;number&quot;</span>
       <span class="hljs-attr">min</span>=<span class="hljs-string">&quot;1&quot;</span> <span class="hljs-attr">step</span>=<span class="hljs-string">&quot;1&quot;</span> <span class="hljs-attr">inputmode</span>=<span class="hljs-string">&quot;numeric&quot;</span> /&gt;</span>
</code></pre></div>
<p>需要允许小数的数值控件，还要给出合理的 step，例如 <code>step=&quot;0.01&quot;</code> 或在确实不限步长时使用 <code>step=&quot;any&quot;</code>。只把 inputmode 改成 decimal，不会自动改变 number 的步进校验。</p>
<p>对于金额等需要严格处理精度、格式和本地化的字段，也可以使用 text 加 decimal 键盘提示，再明确规定允许格式与解析方式。不能直接假定用户所在地区的键盘一定提供 <code>.</code>，更不能用不加说明的替换规则把逗号、千位分隔符和小数分隔符混为一谈。</p>
<h2>其他布局提示有什么作用</h2>
<p><code>tel</code> 请求电话键盘，常见会包含 <code>*</code>、<code>#</code>；电话字段通常本来就应考虑 <code>type=&quot;tel&quot;</code>。<code>email</code>、<code>url</code> 让相关字符更容易输入；<code>search</code> 可以让确认键呈现搜索含义；<code>none</code> 请求不显示虚拟键盘，适用于确有替代输入控件的特殊场景，不能拿它强迫用户失去正常输入方式。</p>
<p>这些是浏览器可采用的提示，不是像素级的键盘设计规范。同一个 numeric 字段在 iOS、Android 和桌面实体键盘上出现不同体验，并不意味着属性写法一定有错。</p>
<p><code>enterkeyhint=&quot;next&quot;</code> 也不等于自动实现完整的焦点跳转流程。确认键的标签提示、表单默认提交行为和应用自己的焦点管理，仍要分别理解与测试。</p>
<h2>不要用拦截键盘事件代替数据校验</h2>
<p>只在 keydown 中屏蔽“不是数字的按键”，容易破坏退格、方向键、组合输入和快捷键，也覆盖不了粘贴、拖放或自动填充。键盘布局提示解决输入便利性，最终值的校验解决合法性，两层都需要，但职责不同。</p>
<p>测试时应覆盖有前导零的验证码、完整粘贴、空值、错误字符和自动填充，还要在真实手机上检查键盘是否遮挡当前字段或提交按钮。桌面设备模拟能检查布局，不保证真实虚拟键盘与输入法行为完全一致。</p>`};export{e as default};