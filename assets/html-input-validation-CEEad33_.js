var e={answerHtml:`<h2>简答</h2>
<ul>
<li>原生校验把约束写在控件上，例如 <code>type=&quot;email&quot; required</code>，比给所有字段写正则更清楚。</li>
<li><code>pattern</code> 要匹配整个值，不要带 JavaScript 正则字面量的斜杠。</li>
<li><code>validity</code> 提供各项结果，<code>checkValidity()</code> 只检查并返回布尔值，<code>reportValidity()</code> 还会显示浏览器提示。</li>
<li><code>setCustomValidity()</code> 设置的错误必须在条件满足后清空，否则字段会一直无效；服务端仍要重新校验。</li>
</ul>
<p>原生表单校验的价值，是让“字段有什么约束”直接写在控件上，并让浏览器在适当时机检查这些约束。它能减少重复编写的基础校验代码，但不会自动理解“用户名是否已被占用”“这个优惠券属于谁”等业务事实。</p>
<p>例如邮箱输入框写成 <code>type=&quot;email&quot; required</code>，就已经表达了“不能为空，且需要符合浏览器接受的邮箱语法”。这比普通文本框配一段只在按钮点击时运行的正则，更容易覆盖键盘提交等入口。</p>
<h2>先用对属性，而不是给所有字段写正则</h2>
<table><thead><tr><th>约束</th><th>常见用途</th><th>容易误解的地方</th></tr></thead><tbody><tr><td><code>required</code></td><td>必须提供值或完成指定选择</td><td>不同控件的规则不同，例如必选复选框与单选组</td></tr><tr><td><code>type=&quot;email&quot;</code>、<code>url</code></td><td>检查对应的基本语法</td><td>不保证邮箱存在、URL 可访问</td></tr><tr><td><code>min</code>、<code>max</code></td><td>数值、日期等的范围</td><td>不是字符串长度限制</td></tr><tr><td><code>step</code></td><td>数值或日期时间的步进规则</td><td>number 默认步进通常是 1，小数可能触发不匹配</td></tr><tr><td><code>minlength</code>、<code>maxlength</code></td><td>适用文本控件的长度</td><td>不能用来限制 number 的数字位数</td></tr><tr><td><code>pattern</code></td><td>适用文本控件的整个值满足格式</td><td>空值通常还要靠 required 判定必填</td></tr></tbody></table>
<p><code>pattern=&quot;[0-9]{6}&quot;</code> 表达六位 ASCII 数字，不是“包含某一段六位数字就行”。不要把 JavaScript 正则字面量的斜杠一起写进去，也不要想当然地把所有 JavaScript 正则用法照搬到 HTML pattern；其编译与 Unicode 规则应按当前 HTML 要求核对。</p>
<h2>validity、checkValidity 和 reportValidity 有何区别</h2>
<p>控件的 <code>validity</code> 提供结果信息，例如 <code>valueMissing</code>、<code>typeMismatch</code>、<code>rangeUnderflow</code>、<code>stepMismatch</code>、<code>patternMismatch</code> 和 <code>customError</code>。<code>validity.valid</code> 表示这些检查是否整体通过，不包含你还没写进去的业务规则。</p>
<p><code>checkValidity()</code> 执行检查并返回布尔值，失败时可触发 invalid 事件，但不会默认替你展示浏览器交互式错误提示。<code>reportValidity()</code> 除了检查，还会按浏览器行为报告未被取消的校验错误，适合明确要求用户现在修复字段的时机。</p>
<p>两者既可以在单个控件上调用，也可以在 form 上检查相关可校验控件。并非所有控件都参与约束校验，<code>willValidate</code> 可以帮助判断，例如 disabled 控件不应被当作一个正在等待用户填写的必填项。</p>
<h2>自定义错误必须同时设计清除路径</h2>
<p>下面用“确认密码与密码一致”补充原生规则。HTML 仍负责必填和密码最短长度，JavaScript 只负责两次值是否一致。</p>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;account-form&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;password&quot;</span>&gt;</span>密码<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span>
         <span class="hljs-attr">minlength</span>=<span class="hljs-string">&quot;12&quot;</span> <span class="hljs-attr">required</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;new-password&quot;</span> /&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;confirmation&quot;</span>&gt;</span>确认密码<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirmation&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;confirmation&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span>
         <span class="hljs-attr">required</span> <span class="hljs-attr">autocomplete</span>=<span class="hljs-string">&quot;new-password&quot;</span>
         <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;confirmation-error&quot;</span> /&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;confirmation-error&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>创建账户<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> password = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#password&#x27;</span>);
<span class="hljs-keyword">const</span> confirmation = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#confirmation&#x27;</span>);
<span class="hljs-keyword">const</span> error = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#confirmation-error&#x27;</span>);

<span class="hljs-keyword">function</span> <span class="hljs-title function_">updateConfirmation</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> mismatch = confirmation.<span class="hljs-property">value</span> !== <span class="hljs-string">&#x27;&#x27;</span> &amp;&amp;
    confirmation.<span class="hljs-property">value</span> !== password.<span class="hljs-property">value</span>;
  <span class="hljs-keyword">const</span> message = mismatch ? <span class="hljs-string">&#x27;两次输入的密码不一致，请重新确认。&#x27;</span> : <span class="hljs-string">&#x27;&#x27;</span>;

  confirmation.<span class="hljs-title function_">setCustomValidity</span>(message);
  <span class="hljs-keyword">if</span> (mismatch) confirmation.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-invalid&#x27;</span>, <span class="hljs-string">&#x27;true&#x27;</span>);
  <span class="hljs-keyword">else</span> confirmation.<span class="hljs-title function_">removeAttribute</span>(<span class="hljs-string">&#x27;aria-invalid&#x27;</span>);
  error.<span class="hljs-property">textContent</span> = message;
}

password.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, updateConfirmation);
confirmation.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, updateConfirmation);
<span class="hljs-title function_">updateConfirmation</span>();
</code></pre></div>
<p><code>setCustomValidity(&#x27;非空消息&#x27;)</code> 设置一个持续存在的自定义错误。浏览器不会因为用户后来改对了值，就猜出业务规则并自动清掉它。必须在合法时调用 <code>setCustomValidity(&#x27;&#x27;)</code>，否则表单会一直被 customError 阻止。</p>
<p>两边都监听 input，是因为用户改完“确认密码”之后，也可能返回去修改第一遍密码。只监听确认框，会让原本相等的两个值变得不等，却仍保留旧的合法状态。</p>
<p>确认框为空时不设置“不一致”，把空值交给 required 处理。这里的文字错误与字段通过 aria-describedby 关联，同时提供了实际可读提示；aria-invalid 只是补充语义，不会替代约束校验。真实产品还应选择适当的提示时机，例如失焦后或首次提交后再展示错误，避免一开始就把整个空表单标红。</p>
<h2>校验发生在提交事件之前</h2>
<p>正常激活提交按钮或调用 <code>requestSubmit()</code> 时，浏览器会按表单设置进行交互式校验。不通过时通常不会触发正常的 submit 事件，所以不能把“显示所有原生错误”的逻辑全放进 submit 回调后才执行。</p>
<p><code>novalidate</code>、提交按钮的 <code>formnovalidate</code> 和直接调用 <code>form.submit()</code> 可以改变或绕过这条自动校验路径。它们不意味着字段突然符合要求，也不意味着显式调用 <code>checkValidity()</code> 永远返回 true。</p>
<p>脚本设置值时还要注意规则边界：例如 minlength、maxlength 对用户编辑与程序赋值的检查行为存在区别。不要以为 <code>input.value = 某个值</code> 之后，所有约束都一定按手动输入时完全相同的方式执行。跨字段校验也需要在程序修改值后主动同步，而不是假定一定触发 input 事件。</p>
<h2>异步校验和可信验证需要另外处理</h2>
<p>检查用户名是否占用，需要服务端响应。输入从 A 变成 B 后，A 的慢响应不能覆盖 B 的校验结果；可以使用请求序号、取消请求和当前值比对来避免过期结果生效。网络失败也不能被当成“用户名肯定可用”。</p>
<p>前端通过校验只说明当前界面按现有规则接受了数据。用户可以修改 HTML、绕过页面直接发送请求，服务器数据也可能在检查后变化。因此服务端仍需检查格式、权限、唯一性与业务约束，并把可修复的错误返回到相应字段。</p>
<p>不要在每次输入时粗暴删除暂时“不合法”的字符。输入法组合过程、负数输入到一半、小数点、粘贴和自动填充都可能产生中间状态。保留用户输入、在合适时机解释怎样修复，通常比悄悄改掉内容更可靠。</p>`};export{e as default};