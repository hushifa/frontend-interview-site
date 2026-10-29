var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>三者各管一件事。<code>label</code> 是给人看的名字，用 <code>&lt;label for=&quot;id&quot;&gt;</code> 关联，或者用 label 把控件包起来，读屏会读出这个名字，点文字也能聚焦或勾选控件。<code>name</code> 是提交时的字段名，<code>value</code> 是提交的值。</p>
<p>哪些控件会提交，规则要记清楚。只有带 <code>name</code> 的才提交；<code>disabled</code> 的不提交，<code>readonly</code> 的会提交。没勾选的复选框和单选框什么都不提交；勾选了但没写 <code>value</code>，提交的是字符串 <code>&quot;on&quot;</code>。</p>
<p>同名的多个控件，比如一组多选框，会提交多条记录，用 <code>formData.getAll(name)</code> 读出来。</p>
<p>还有一个实用的细节：被点击的提交按钮如果有 <code>name</code>，它的值也会提交，可以用来区分用户点的是“保存”还是“发布”。</p>
</blockquote>
<h2>看一个表单到底提交了什么</h2>
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
<p><code>author</code> 和 <code>draftId</code> 都不能编辑，为什么一个拿得到、一个是 <code>null</code>？因为 <code>readonly</code> 只是不让改，值照样提交；<code>disabled</code> 表示这个控件不参与表单，值不提交。</p>
<p><code>tag</code> 两个都勾选时，<code>get(&#x27;tag&#x27;)</code> 只会拿到第一个，要用 <code>getAll</code> 才能拿到全部。</p>
<p><code>action</code> 的值来自点击的那个按钮。注意 <code>new FormData(form, event.submitter)</code> 的第二个参数，它把被点击的按钮加进去。只传 <code>form</code> 的话，按钮的值是不包含在里面的。</p>
<h2>表单有哪几种提交方式</h2>
<p><code>method=&quot;get&quot;</code> 把字段拼到网址的查询参数里，适合搜索。</p>
<p><code>method=&quot;post&quot;</code> 默认编码成 <code>application/x-www-form-urlencoded</code>。要上传文件，得加 <code>enctype=&quot;multipart/form-data&quot;</code>。</p>
<p>用代码提交时，<code>form.requestSubmit()</code> 会先校验，再触发 <code>submit</code> 事件，跟用户点按钮一样。<code>form.submit()</code> 跳过校验和事件，直接提交。</p>
<h2>控件的名字要怎么给</h2>
<p><code>placeholder</code> 不能当名字用。用户一输入它就消失了，也不是所有读屏都能可靠地读出来。</p>
<p>一组单选框或复选框，用 <code>fieldset</code> 包起来，再用 <code>legend</code> 说明这一组问的是什么，比如上面的“标签”。</p>
<p>补充说明用 <code>aria-describedby</code> 关联，读屏会在读完名字以后接着读出来。</p>
<h2>常见追问</h2>
<p><strong>不想让用户改，又要提交这个值，用 <code>readonly</code> 还是 <code>disabled</code>？</strong></p>
<blockquote>
<p>用 <code>readonly</code>。它能聚焦，也会提交；<code>disabled</code> 两样都没有。不过复选框和下拉框不支持 <code>readonly</code>，这时可以用一个隐藏的 <code>input</code> 来提交值。</p>
</blockquote>`};export{e as default};