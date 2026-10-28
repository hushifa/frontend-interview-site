var e={answerHtml:`<h2>简答</h2>
<ul>
<li><code>&lt;label for=&quot;id&quot;&gt;</code> 或用 label 包住控件，读屏会读出名称，点击文字也能聚焦或勾选控件。</li>
<li>只有带 <code>name</code> 的控件才会提交；<code>disabled</code> 的控件不提交，<code>readonly</code> 的控件会提交。</li>
<li>未勾选的复选框和单选框不提交任何值；勾选但没写 <code>value</code> 时提交字符串 <code>&quot;on&quot;</code>。</li>
<li>同名的多个控件（如多选复选框）提交多条记录，用 <code>formData.getAll(name)</code> 读取。</li>
<li>点击的提交按钮如果有 <code>name</code>，它的值也会提交，可以用来区分“保存”和“发布”。</li>
</ul>
<h2>示例</h2>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;post&quot;</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">label</span> <span class="hljs-attr">for</span>=<span class="hljs-string">&quot;title&quot;</span>&gt;</span>标题<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;title&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;title&quot;</span> <span class="hljs-attr">required</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">fieldset</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">legend</span>&gt;</span>标签<span class="hljs-tag">&lt;/<span class="hljs-name">legend</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;tag&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;css&quot;</span>&gt;</span> CSS<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
    <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span><span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;tag&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;html&quot;</span>&gt;</span> HTML<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
  <span class="hljs-tag">&lt;/<span class="hljs-name">fieldset</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;author&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;hu&quot;</span> <span class="hljs-attr">readonly</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;draftId&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;42&quot;</span> <span class="hljs-attr">disabled</span>&gt;</span>

  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;action&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;save&quot;</span>&gt;</span>保存<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;action&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">&quot;publish&quot;</span>&gt;</span>发布<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js">form.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;submit&#x27;</span>, <span class="hljs-function">(<span class="hljs-params">event</span>) =&gt;</span> {
  event.<span class="hljs-title function_">preventDefault</span>();
  <span class="hljs-keyword">const</span> data = <span class="hljs-keyword">new</span> <span class="hljs-title class_">FormData</span>(form, event.<span class="hljs-property">submitter</span>);
  data.<span class="hljs-title function_">getAll</span>(<span class="hljs-string">&#x27;tag&#x27;</span>);   <span class="hljs-comment">// 例如 [&#x27;css&#x27;, &#x27;html&#x27;]</span>
  data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;author&#x27;</span>);   <span class="hljs-comment">// &#x27;hu&#x27;</span>
  data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;draftId&#x27;</span>);  <span class="hljs-comment">// null，disabled 不提交</span>
  data.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;action&#x27;</span>);   <span class="hljs-comment">// &#x27;save&#x27; 或 &#x27;publish&#x27;</span>
});
</code></pre></div>
<p><code>new FormData(form, submitter)</code> 的第二个参数把点击的按钮加进去；只传 <code>form</code> 时不包含按钮的值。</p>
<h2>提交方式</h2>
<ul>
<li><code>method=&quot;get&quot;</code> 把字段拼到 URL 查询参数里，适合搜索。</li>
<li><code>method=&quot;post&quot;</code> 默认编码为 <code>application/x-www-form-urlencoded</code>，上传文件需要 <code>enctype=&quot;multipart/form-data&quot;</code>。</li>
<li><code>form.requestSubmit()</code> 会先执行校验并触发 <code>submit</code> 事件；<code>form.submit()</code> 跳过校验和事件，直接提交。</li>
</ul>
<h2>名称</h2>
<ul>
<li><code>placeholder</code> 不是名称，输入后就消失了，也不被所有读屏可靠读出。</li>
<li>一组单选或复选框用 <code>fieldset</code> 和 <code>legend</code> 说明整组的问题。</li>
<li>补充说明用 <code>aria-describedby</code> 关联，读屏会在名称之后读出。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>不想让用户修改又想提交，用 <code>readonly</code> 还是 <code>disabled</code>？用 <code>readonly</code>。它保留焦点和提交，<code>disabled</code> 两者都没有。复选框和下拉框不支持 <code>readonly</code>，可以用隐藏的 <code>input</code> 提交值。</li>
</ul>`};export{e as default};