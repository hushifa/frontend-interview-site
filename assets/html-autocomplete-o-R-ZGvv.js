var e={answerHtml:`<h2>简答</h2>
<ul>
<li>正确的令牌让浏览器一键填好姓名、地址、电话，移动端能少打很多字。</li>
<li>登录用 <code>username</code> 和 <code>current-password</code>，注册和改密码用 <code>new-password</code>，浏览器会据此建议生成强密码。</li>
<li>短信验证码用 <code>one-time-code</code>，iOS 和 Android 可以直接从短信中提取。</li>
<li><code>autocomplete=&quot;off&quot;</code> 是提示，浏览器对登录框通常会忽略；不要为了“安全”关掉密码填充，这会让用户改用弱密码。</li>
<li>令牌可以组合分组和类型，例如 <code>shipping postal-code</code>、<code>billing street-address</code>。</li>
</ul>
<h2>登录表单</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
    邮箱
    <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;username&quot;</span> <span class="hljs-attr">required</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
    密码
    <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;current-password&quot;</span> <span class="hljs-attr">required</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>登录<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<p>用户名字段写 <code>username</code>，即使它是邮箱格式，密码管理器才能正确保存账号。</p>
<h2>地址和支付</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;name&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;name&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;tel&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;tel&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;tel&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;address&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;shipping street-address&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;postal&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;shipping postal-code&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;cc&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;cc-number&quot;</span> <span class="hljs-attr">inputmode</span>=<span class="hljs-string">&quot;numeric&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;exp&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;cc-exp&quot;</span>&gt;</span>
</code></pre></div>
<p>同一页面既有收货地址又有账单地址时，用 <code>shipping</code> 和 <code>billing</code> 区分，否则浏览器会把两组都填成一样的值。</p>
<h2>无障碍</h2>
<p>WCAG 1.3.5（识别输入用途）要求收集用户个人信息的字段标明用途，<code>autocomplete</code> 是满足它的标准方式。WCAG 2.2 新增的 3.3.7（冗余输入）要求同一流程里已填过的信息不再让用户重复输入，自动填充也能帮助满足。</p>
<h2>隐私</h2>
<ul>
<li>自动填充可能把信息填进页面上看不见的字段，所以不要在表单里放隐藏的输入框收集额外信息。</li>
<li>共享设备上，用户自己决定是否保存数据；网站能做的是不阻止正常填充，并提供退出登录。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>为什么 <code>autocomplete=&quot;off&quot;</code> 对密码框无效？浏览器认为阻止保存密码会降低安全性，所以主流浏览器对登录字段忽略这个值。</li>
</ul>`};export{e as default};