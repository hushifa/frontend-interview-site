var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p><code>autocomplete</code> 告诉浏览器这个输入框是填什么的，用的是一组标准的词，叫令牌。写对了，浏览器能一键填好姓名、地址、电话，手机上能少打很多字。</p>
<p>登录表单用 <code>username</code> 和 <code>current-password</code>；注册和改密码用 <code>new-password</code>，浏览器会据此建议生成一个强密码。短信验证码用 <code>one-time-code</code>，iOS Safari 能从短信里把验证码提取出来填进去。令牌还能组合，比如 <code>shipping postal-code</code>、<code>billing street-address</code>，区分收货和账单。</p>
<p>有人为了“安全”写 <code>autocomplete=&quot;off&quot;</code>。但它只是提示，浏览器对登录框通常会忽略。而且不要为了安全关掉密码填充，这样用户只会改用更好记的弱密码。</p>
<p>要注意，它只是提示，不是限制。自动填进来的数据，服务端还是要校验。</p>
</blockquote>
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
<p>账号字段明明是邮箱，为什么写 <code>username</code> 而不是 <code>email</code>？因为对密码管理器来说，它是“跟这个密码配对的账号”。写 <code>username</code>，密码管理器才能正确保存和填充这对账号密码。</p>
<h2>地址和支付</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;name&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;name&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;tel&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;tel&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;tel&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;address&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;shipping street-address&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;postal&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;shipping postal-code&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;cc&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;cc-number&quot;</span> <span class="hljs-attr">inputmode</span>=<span class="hljs-string">&quot;numeric&quot;</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;exp&quot;</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;cc-exp&quot;</span>&gt;</span>
</code></pre></div>
<p>同一个页面上既有收货地址又有账单地址时，要用 <code>shipping</code> 和 <code>billing</code> 区分开。不区分的话，浏览器分不清两组字段，会把它们都填成一样的值。</p>
<h2>和无障碍有什么关系</h2>
<p>WCAG 1.3.5“识别输入用途”要求，收集用户个人信息的字段要标明用途，<code>autocomplete</code> 就是满足它的标准做法。</p>
<p>WCAG 2.2 新增的 3.3.7“冗余输入”要求，同一个流程里已经填过的信息，不要再让用户重复输入。自动填充也能帮助满足这一条。</p>
<h2>和隐私有什么关系</h2>
<p>自动填充有可能把信息填进页面上看不见的字段里。所以不要在表单里放隐藏的输入框去偷偷收集额外信息。</p>
<p>在共享设备上，要不要保存数据由用户自己决定。网站能做的，是不阻止正常的填充，并提供退出登录。</p>
<h2>常见追问</h2>
<p><strong>为什么 <code>autocomplete=&quot;off&quot;</code> 对密码框不起作用？</strong></p>
<blockquote>
<p>浏览器认为，阻止保存密码反而会降低安全性，用户会去用弱密码或者重复用同一个密码。所以主流浏览器对登录字段会忽略这个值。</p>
</blockquote>`};export{e as default};