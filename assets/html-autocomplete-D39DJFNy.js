var e={answerHtml:`<p>用户登录时，浏览器需要知道哪个框是账号、哪个框是已有密码；注册时，又需要知道这里应该生成新密码，而不是填入当前账号的旧密码。只给字段起一个内部变量名，浏览器不一定能准确推断这些用途。</p>
<p><code>autocomplete</code> 用标准化的语义提示协助识别字段。它可以是 <code>on</code>、<code>off</code>，也可以是按规定顺序组合的令牌，例如 <code>shipping street-address</code>。明确用途通常比只写 on 更有帮助。</p>
<h3>登录和注册不能共用一个模糊的 password 提示</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">&quot;/login&quot;</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;post&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;login-name&quot;</span>&gt;</span>账号邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;login-name&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;username&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span>
         <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;username&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;login-password&quot;</span>&gt;</span>密码<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;login-password&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span>
         <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;current-password&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>登录<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<p>账号恰好使用邮箱格式，type=email 负责输入语义与基本格式检查，autocomplete=username 则说明它是登录凭据里的用户名。注册收集联系邮箱时，autocomplete=email 更符合其用途；同一个数据格式在不同流程中可以承担不同角色。</p>
<p>已有密码用 current-password，新建或修改密码时的新密码框用 new-password。确认新密码也可以采用 new-password，让管理器理解这两个字段需要一致的新密码，而不是随便填入一个历史凭据。当前密码与新密码同时出现时，应分别标明。</p>
<p>常见其他令牌包括 name、given-name、family-name、email、tel、street-address、postal-code、one-time-code。选择令牌应对应实际字段含义，例如完整街道地址与其中的某一行地址不是完全相同的输入模型。</p>
<h3>重复地址需要说明属于哪一组</h3>
<p>如果页面同时有收货地址和账单地址，单独把两个地址框都写成 street-address，浏览器可能难以判断是否应该填同一份数据。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;shipping-address&quot;</span>&gt;</span>收货地址<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">textarea</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;shipping-address&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;shippingAddress&quot;</span>
          <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;section-order shipping street-address&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">textarea</span>&gt;</span>

<span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;billing-address&quot;</span>&gt;</span>账单地址<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
<span class="hljs-tag">&lt;<span class="hljs-name">textarea</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;billing-address&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;billingAddress&quot;</span>
          <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;section-order billing street-address&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">textarea</span>&gt;</span>
</code></pre></div>
<p><code>shipping</code>、<code>billing</code> 区分地址用途，<code>section-order</code> 是开发者命名的一组上下文。需要填写两位收件人或两套相同用途地址时，可以使用不同的 section 名字，帮助浏览器区分组。</p>
<p>这些令牌有规定顺序，section 分组应在前，用途限定随后，再写具体字段类型。不能把它们当成可以任意排列的 class 列表。<code>name</code> 则仍然决定提交时的字段名，并不会因为 autocomplete 写成 postal-code 就自动改名。</p>
<h3>为什么 off 不能保证“不填充、不保存”</h3>
<p><code>autocomplete=&quot;off&quot;</code> 表达的是不希望自动完成的提示。浏览器和密码管理器可能为了用户利益，对登录凭据采用自己的策略，不保证所有场景都严格遵循这个请求。</p>
<p>因此它不是阻止密码管理器、禁止浏览器保存数据或保护共享设备隐私的可靠安全边界。通过随机字段名、不可见诱饵框或不断切换 readonly 去干扰管理器，往往让正常用户更难登录，也容易破坏辅助技术和自动填充。</p>
<p>对于不适合复用历史内容的字段，可以准确表达用途或按需求使用 off，但仍应允许用户自主输入和粘贴。共享设备上的账号切换、退出登录和敏感操作确认，应由完整的产品流程负责，而不是押在一个属性上。</p>
<p>控件没有显式 autocomplete 时，可以继承其所属表单的设置。把整个 form 设为 off 会影响未单独标明的字段，也未必能阻止所有管理器行为，所以应该按真实用途安排字段级提示。</p>
<h3>自动填充是正常输入渠道，不是异常情况</h3>
<p>浏览器可以在页面加载、用户选取候选或管理器解锁时写入值。应用不能只靠 keydown 或 keyup 同步表单状态，否则用户没敲键盘，界面状态就可能与真实控件值不一致。</p>
<p>应按所用框架支持的输入事件与受控状态方式接入，并在最终提交时核对实际数据。程序给 input.value 赋值也不等于自动触发 input/change；不要把程序赋值与所有浏览器、所有密码管理器的填充事件一概而论。</p>
<p>有些框架在初始化时把已有控件值重新写为空，可能擦掉刚刚自动填入的内容。测试时要覆盖刷新后填充、返回页面、账号切换、填充后编辑以及提交，不能只测逐字手输。</p>
<p><code>:autofill</code> 等样式可以帮助识别或调整填充外观，但浏览器可能保留部分强调样式，不能依赖强制覆盖全部视觉细节作为功能是否正确的标准。</p>
<h3>字段语义有帮助，仍然需要标签与校验</h3>
<p>autocomplete 不能代替 label。用户需要持续可见的字段说明，辅助技术需要明确的可访问名称；placeholder 消失后，autocomplete 不会替页面显示一个新的标签。</p>
<p>自动填入的邮箱也不等于已经验证所有权，地址不等于仍可配送，密码不等于当前有效。填充后应让用户确认必要信息，提交时仍执行前后端校验、身份认证和对应的请求保护。</p>
<p>最终应该把它视为与浏览器、管理器协作的接口：给出准确、稳定的字段用途，让用户更容易填对；同时保留手动输入能力，并按业务规则判断数据是否可接受。</p>`};export{e as default};