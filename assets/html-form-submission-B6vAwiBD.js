var e={answerHtml:`<p>表单的“看得到”“可以编辑”和“会被提交”是三件不同的事。输入框里显示了邮箱，不代表浏览器一定会把它提交；控件被设为只读，也不代表它会从提交数据里消失。</p>
<p><code>label</code> 负责说明控件是什么，<code>id</code> 可以用于关联这个说明，<code>name</code> 才是提交的数据字段名。它们可以相同，但职责不能混淆。只写 <code>id=&quot;email&quot;</code> 而没有 name，浏览器通常不会把这个文本框当成 email 字段收集。</p>
<h3>从一个完整的表单看数据来源</h3>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;subscription&quot;</span> <span class="hljs-attr">action</span>=<span class="hljs-string">&quot;/subscribe&quot;</span> <span class="hljs-attr">method</span>=<span class="hljs-string">&quot;post&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;reader-email&quot;</span>&gt;</span>邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span>
    <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;reader-email&quot;</span>
    <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;email&quot;</span>
    <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span>
    <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;reader@example.com&quot;</span>
    <span class="hljs-attr">required</span>
  /&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">fieldset</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">legend</span>&gt;</span>感兴趣的专题<span class="hljs-tag">&lt;/<span class="hljs-name">legend</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;topic&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;html&quot;</span> <span class="hljs-attr">checked</span> /&gt;</span> HTML<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;topic&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;css&quot;</span> <span class="hljs-attr">checked</span> /&gt;</span> CSS<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;topic&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;react&quot;</span> /&gt;</span> React<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">fieldset</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;plan&quot;</span>&gt;</span>订阅方案<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;plan&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;plan&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;basic&quot;</span> <span class="hljs-attr">readonly</span> /&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;invite&quot;</span>&gt;</span>邀请码（暂不可用）<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;invite&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;invite&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;WELCOME&quot;</span> <span class="hljs-attr">disabled</span> /&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;intent&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;subscribe&quot;</span>&gt;</span>订阅<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span>&gt;</span>查看说明<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<p><code>for=&quot;reader-email&quot;</code> 与控件的 <code>id</code> 关联，点击“邮箱”标签可以把焦点交给控件，辅助技术也能获得名称。复选框则直接放在 label 中，属于隐式关联。同一文档中的 id 应保持唯一。</p>
<p>邮箱提交值来自控件的当前值。HTML 的 <code>value</code> 属性提供初始值，但用户编辑后的提交内容不是简单重新读取那段 HTML 属性文本。</p>
<p>两个选中的复选框使用相同的 name，产生两个 topic 条目：<code>html</code> 和 <code>css</code>。未选中的 React 不产生 topic 条目，也不会自动提交 <code>false</code>。如果复选框没有明确的 value，选中时常见的默认提交值是字符串 <code>on</code>，所以业务选项通常应写清具体值。</p>
<h3>readonly 和 disabled 为什么会得到不同数据</h3>
<p>只读文本框仍然可以参与提交，示例会收集 <code>plan=basic</code>。被禁用的邀请码字段不参与收集，虽然它仍然显示 WELCOME。禁用控件通常也不进入正常键盘焦点顺序；readonly 则允许用户聚焦、查看或复制适用控件的内容。</p>
<p>readonly 不是所有控件都支持的通用“锁定”开关，例如不能靠给 select 加 readonly 获得与文本框相同的行为。disabled 的 fieldset 也会影响其控件后代，并有第一个 legend 中控件等规则例外，应按 HTML 表单规则处理。</p>
<p>用 CSS 隐藏一个具名、未禁用的普通控件，并不等于把它排除出提交。反过来，不在 form 标签内部的控件，也可以通过 <code>form=&quot;subscription&quot;</code> 关联表单并参与收集。因此实际收集依据是表单关联和控件规则，而不只是“找所有可见的 input 后代”。</p>
<h3>用 FormData 保留浏览器的收集规则</h3>
<p>下面代码应在上面的 DOM 已就绪后执行。它阻止演示表单导航，只展示本次收集到的数据，不实际发送请求：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">const</span> form = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#subscription&#x27;</span>);

form.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;submit&#x27;</span>, <span class="hljs-function"><span class="hljs-params">event</span> =&gt;</span> {
  event.<span class="hljs-title function_">preventDefault</span>();
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FormData</span>(form, event.<span class="hljs-property">submitter</span>);

  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;email&#x27;</span>));  <span class="hljs-comment">// reader@example.com（未编辑时）</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data.<span class="hljs-title function_">getAll</span>(<span class="hljs-string">&#x27;topic&#x27;</span>)); <span class="hljs-comment">// [&#x27;html&#x27;, &#x27;css&#x27;]（保持默认选择时）</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;plan&#x27;</span>));   <span class="hljs-comment">// basic</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data.<span class="hljs-title function_">has</span>(<span class="hljs-string">&#x27;invite&#x27;</span>)); <span class="hljs-comment">// false</span>
  <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;intent&#x27;</span>)); <span class="hljs-comment">// subscribe（点击订阅按钮时）</span>
});
</code></pre></div>
<p><code>FormData</code> 保留同名多值。<code>get(&#x27;topic&#x27;)</code> 只取第一个，<code>getAll(&#x27;topic&#x27;)</code> 才能取得所有选择。直接 <code>Object.fromEntries(data)</code> 会让同名键被后面的值覆盖，不适合无条件转换有复选框组、多选下拉或多文件字段的表单。</p>
<p><code>event.submitter</code> 表示触发本次提交的按钮，可能是 null。把它传给 FormData，才能按规则包含该按钮的 name/value。单独 <code>new FormData(form)</code> 并不知道用户是点了“保存草稿”还是“正式发布”，不会自动选择一个提交按钮来收集。</p>
<p>构造 FormData 本身不会执行约束校验，也不会自动发送网络请求。它只是按当时的控件状态构造数据，因此如果要防重复点击，通常应先收集数据，再禁用相关按钮或字段；先禁用再收集，可能把需要的数据排除掉。</p>
<h3>提交按钮、Enter 和脚本提交的区别</h3>
<p>form 内没有明确指定类型的普通 button 通常会成为提交按钮，所以“查看说明”“添加一行”这类普通操作应显式写 <code>type=&quot;button&quot;</code>。监听 form 的 submit 事件，比只监听某个按钮的 click 更合适，因为键盘 Enter 等途径也可能触发表单提交。</p>
<p>用户激活提交按钮时，浏览器会按表单设置执行约束校验。存在 required、type=email 等不满足的字段时，通常先提示错误，表单不会进入正常 submit 事件流程；<code>novalidate</code> 等设置可以改变这个过程。</p>
<p>需要脚本模拟用户提交时，优先考虑 <code>form.requestSubmit(button)</code>，它经过相应校验和 submit 事件，也能使用指定按钮的提交参数。<code>form.submit()</code> 则直接提交，不触发 submit 事件，也不执行同样的交互式约束校验，不能把两者视为同义方法。</p>
<p>避免把控件命名为 <code>submit</code>，因为具名控件可能遮住表单对象的同名方法，让 <code>form.submit()</code> 变成“不是函数”。</p>
<h3>真正发送时，还要决定编码与结果处理</h3>
<p>原生 GET 通常把表单条目放入 URL 查询部分，适合可分享的搜索条件；POST 把数据放在请求体中，但 POST 本身不等于加密，传输保护仍需要 HTTPS。上传文件的原生表单通常需要 <code>enctype=&quot;multipart/form-data&quot;</code>。</p>
<p>若使用 <code>fetch</code> 并把 FormData 作为 body，通常不要手动设置 <code>Content-Type: multipart/form-data</code>。浏览器需要生成对应的 boundary 并放进请求头，手写一个缺少 boundary 的头会导致服务端无法正确解析。</p>
<p>收集和前端校验只是提交的前半段。实际业务还需要处理网络失败、服务端字段错误、重复提交和成功后的界面状态。readonly、hidden 和前端校验都不能防止请求被修改，服务端仍必须验证权限与字段内容。</p>
<p>补充参考：<a href="https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/requestSubmit">MDN · requestSubmit()</a>、<a href="https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest_API/Using_FormData_Objects">MDN · 使用 FormData 对象</a>。</p>`};export{e as default};