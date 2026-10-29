var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>给输入框写上规则，浏览器会在提交前帮你检查，这叫约束校验。内置的规则有 <code>required</code>、<code>type=&quot;email&quot;</code> 或 <code>url</code>、<code>pattern</code>、<code>min</code>/<code>max</code>/<code>step</code>、<code>minlength</code>/<code>maxlength</code>。不满足时，提交会被拦下来并显示浏览器的提示，<code>input.validity</code> 能告诉你具体是哪一条没通过。</p>
<p>想要自定义错误，用 <code>setCustomValidity(&#x27;消息&#x27;)</code>。要注意必须传空字符串才能清除，否则控件会一直是无效状态。显示错误样式时用 <code>:user-invalid</code>，它只在用户操作过以后才匹配，不会像 <code>:invalid</code> 那样一打开页面就满屏红色。</p>
<p>原生校验做不到的事情也要清楚：需要请求服务器的检查，比如用户名有没有被占用；依赖业务数据的规则，比如库存和权限。</p>
<p>最重要的一点，前端校验只是为了体验。请求完全可以绕过页面直接发给服务器，所以服务端必须重新校验。</p>
</blockquote>
<h2>用页面里的文字代替浏览器气泡</h2>
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
<p>表单上写了 <code>novalidate</code>，那 <code>required</code> 和 <code>type=&quot;email&quot;</code> 还有用吗？有用。<code>novalidate</code> 只是关掉浏览器自动拦截和气泡提示，规则本身还在，<code>checkValidity()</code> 照常工作。这样就能自己决定什么时候检查、错误文字写什么、显示在哪里。</p>
<p><code>validity.valueMissing</code> 表示没填，据此给出不同的提示。<code>aria-invalid</code> 告诉读屏这个字段有错，<code>aria-describedby</code> 让读屏接着读出错误文字。</p>
<h2>两个字段之间的比较怎么做</h2>
<p>内置规则只看单个字段。“两次密码要一致”这种规则，用 <code>setCustomValidity</code> 自己补：</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">confirm.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;input&#x27;</span>, <span class="hljs-function">() =&gt;</span> {
  confirm.<span class="hljs-title function_">setCustomValidity</span>(
    confirm.<span class="hljs-property">value</span> === password.<span class="hljs-property">value</span> ? <span class="hljs-string">&#x27;&#x27;</span> : <span class="hljs-string">&#x27;两次密码不一致&#x27;</span>,
  );
});
</code></pre></div>
<p>一致时一定要传空字符串，把错误清掉。不然用户改对了，字段还是无效，表单永远提交不了。</p>
<h2>为什么多数产品不用浏览器的默认提示</h2>
<p>浏览器默认气泡的样式和显示时机都没法定制。默认文案跟着浏览器语言走，文字可以用 <code>setCustomValidity()</code> 替换，样式却改不了。读屏体验在不同浏览器里也不一致。所以多数产品会改成上面那种页面里的自定义提示。</p>
<h2>错误提示要照顾无障碍</h2>
<p>错误文字放在页面里，用 <code>aria-describedby</code> 关联到对应的控件。</p>
<p>提交失败时，把焦点移到第一个出错的字段。或者在表单顶部列出所有错误，每条链接到对应的字段。</p>
<p>不要只靠红色边框表示错误，一定要有文字说明。</p>
<h2>常见追问</h2>
<p><strong><code>pattern</code> 里要不要写 <code>^</code> 和 <code>$</code>？</strong></p>
<blockquote>
<p>不用。<code>pattern</code> 默认就要求匹配整个值，并且是用 <code>v</code> 标志来编译正则的。</p>
</blockquote>`};export{e as default};