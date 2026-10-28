var e={answerHtml:`<h2>简答</h2>
<ul>
<li>内置约束：<code>required</code>、<code>type=&quot;email&quot;</code>/<code>url</code>、<code>pattern</code>、<code>min</code>/<code>max</code>/<code>step</code>、<code>minlength</code>/<code>maxlength</code>。</li>
<li>不满足约束时，提交会被阻止并显示浏览器提示；<code>input.validity</code> 给出具体哪条失败。</li>
<li><code>setCustomValidity(&#x27;消息&#x27;)</code> 设置自定义错误，传空字符串才会清除，否则控件一直无效。</li>
<li><code>:user-invalid</code> 只在用户交互过后才匹配，比 <code>:invalid</code> 更适合显示错误样式，不会一打开页面就满屏红色。</li>
<li>前端校验只是体验优化，请求可以绕过页面直接发送，服务端必须重新校验。</li>
</ul>
<h2>自定义提示</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;signup&quot;</span> <span class="hljs-attr">novalidate</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;email&quot;</span>&gt;</span>邮箱<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">required</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;email-error&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;email-error&quot;</span> <span class="hljs-attr">class</span>=<span class="hljs-string">&quot;error&quot;</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>注册<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">form.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;submit&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  <span class="hljs-keyword">const</span> input = form.<span class="hljs-property">elements</span>.<span class="hljs-property">email</span>;
  <span class="hljs-keyword">const</span> error = <span class="hljs-variable language_">document</span>.<span class="hljs-title function_">querySelector</span>(<span class="hljs-string">&#x27;#email-error&#x27;</span>);

  <span class="hljs-keyword">if</span> (!input.<span class="hljs-title function_">checkValidity</span>()) {
    event.<span class="hljs-title function_">preventDefault</span>();
    error.<span class="hljs-property">textContent</span> = input.<span class="hljs-property">validity</span>.<span class="hljs-property">valueMissing</span>
      ? <span class="hljs-string">&#x27;请填写邮箱&#x27;</span>
      : <span class="hljs-string">&#x27;邮箱格式不正确&#x27;</span>;
    input.<span class="hljs-title function_">setAttribute</span>(<span class="hljs-string">&#x27;aria-invalid&#x27;</span>, <span class="hljs-string">&#x27;true&#x27;</span>);
    input.<span class="hljs-title function_">focus</span>();
  } <span class="hljs-keyword">else</span> {
    error.<span class="hljs-property">textContent</span> = <span class="hljs-string">&#x27;&#x27;</span>;
    input.<span class="hljs-title function_">removeAttribute</span>(<span class="hljs-string">&#x27;aria-invalid&#x27;</span>);
  }
});
</code></pre></div>
<p><code>novalidate</code> 关闭浏览器的气泡提示，改用页面内的错误文字。约束依然存在，<code>checkValidity()</code> 照常工作。</p>
<h2>跨字段规则</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">confirm.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  confirm.<span class="hljs-title function_">setCustomValidity</span>(
    confirm.<span class="hljs-property">value</span> === password.<span class="hljs-property">value</span> ? <span class="hljs-string">&#x27;&#x27;</span> : <span class="hljs-string">&#x27;两次密码不一致&#x27;</span>,
  );
});
</code></pre></div>
<h2>原生校验做不到的</h2>
<ul>
<li>异步检查，例如“用户名已被占用”，需要请求服务器。</li>
<li>依赖业务数据的规则，例如库存、权限。</li>
<li>浏览器默认气泡的样式、时机和语言无法定制，读屏体验也不一致，多数产品会改用自定义提示。</li>
</ul>
<h2>错误提示的无障碍</h2>
<ul>
<li>错误文字放在页面里，通过 <code>aria-describedby</code> 关联到控件。</li>
<li>提交失败时把焦点移到第一个错误字段，或在表单顶部列出错误并链接到各字段。</li>
<li>不要只用红色边框表示错误，要有文字说明。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li><code>pattern</code> 要不要写 <code>^</code> 和 <code>$</code>？不用，<code>pattern</code> 默认匹配整个值，并且使用 <code>v</code> 标志编译正则。</li>
</ul>`};export{e as default};