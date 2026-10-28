var e={answerHtml:`<h2>简答</h2>
<ul>
<li>在类上声明 <code>static formAssociated = true</code>，构造函数里调用 <code>this.attachInternals()</code> 拿到 <code>ElementInternals</code>。</li>
<li><code>internals.setFormValue(value)</code> 设置随表单提交的值，<code>internals.setValidity(flags, message, anchor)</code> 设置校验状态。</li>
<li>元素连接到页面后就要同步一次校验状态，否则用户不操作直接提交时，表单会认为它有效。</li>
<li>浏览器会调用 <code>formResetCallback</code>、<code>formDisabledCallback</code>、<code>formStateRestoreCallback</code> 等生命周期方法。</li>
<li>无障碍属性用 <code>internals.role</code>、<code>internals.ariaDisabled</code> 等设置，不需要写在宿主元素的属性上。</li>
</ul>
<h2>示例：必填的评分组件</h2>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">class</span> <span class="hljs-title class_">StarRating</span> <span class="hljs-keyword">extends</span> <span class="hljs-title class_ inherited__">HTMLElement</span> {
  <span class="hljs-keyword">static</span> formAssociated = <span class="hljs-literal">true</span>;
  <span class="hljs-keyword">static</span> observedAttributes = [<span class="hljs-string">&#x27;required&#x27;</span>];
  #internals = <span class="hljs-variable language_">this</span>.<span class="hljs-title function_">attachInternals</span>();
  #value = <span class="hljs-string">&#x27;&#x27;</span>;

  <span class="hljs-title function_">connectedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-property">role</span> = <span class="hljs-string">&#x27;radiogroup&#x27;</span>;
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">sync</span>();
  }

  <span class="hljs-title function_">attributeChangedCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">sync</span>();
  }

  <span class="hljs-keyword">set</span> <span class="hljs-title function_">value</span>(<span class="hljs-params">next</span>) {
    <span class="hljs-variable language_">this</span>.#value = <span class="hljs-title class_">String</span>(next);
    <span class="hljs-variable language_">this</span>.#<span class="hljs-title function_">sync</span>();
  }

  <span class="hljs-keyword">get</span> <span class="hljs-title function_">value</span>() {
    <span class="hljs-keyword">return</span> <span class="hljs-variable language_">this</span>.#value;
  }

  <span class="hljs-title function_">formResetCallback</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.<span class="hljs-property">value</span> = <span class="hljs-string">&#x27;&#x27;</span>;
  }

  <span class="hljs-title function_">formDisabledCallback</span>(<span class="hljs-params">disabled</span>) {
    <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-property">ariaDisabled</span> = <span class="hljs-title class_">String</span>(disabled);
  }

  #<span class="hljs-title function_">sync</span>(<span class="hljs-params"></span>) {
    <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setFormValue</span>(<span class="hljs-variable language_">this</span>.#value);
    <span class="hljs-keyword">if</span> (<span class="hljs-variable language_">this</span>.<span class="hljs-title function_">hasAttribute</span>(<span class="hljs-string">&#x27;required&#x27;</span>) &amp;&amp; <span class="hljs-variable language_">this</span>.#value === <span class="hljs-string">&#x27;&#x27;</span>) {
      <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setValidity</span>({ <span class="hljs-attr">valueMissing</span>: <span class="hljs-literal">true</span> }, <span class="hljs-string">&#x27;请选择评分&#x27;</span>);
    } <span class="hljs-keyword">else</span> {
      <span class="hljs-variable language_">this</span>.#internals.<span class="hljs-title function_">setValidity</span>({});
    }
  }
}

customElements.<span class="hljs-title function_">define</span>(<span class="hljs-string">&#x27;star-rating&#x27;</span>, <span class="hljs-title class_">StarRating</span>);
</code></pre></div>
<div class="not-prose code-block"><div class="code-language">HTML</div><pre><code class="hljs language-html"><span class="hljs-tag">&lt;<span class="hljs-name">form</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">star-rating</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;score&quot;</span> <span class="hljs-attr">required</span>&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">star-rating</span>&gt;</span>
  <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>提交<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
</code></pre></div>
<ul>
<li>提交时浏览器检查到 <code>valueMissing</code>，阻止提交并显示&quot;请选择评分&quot;。</li>
<li>提交成功时，<code>FormData</code> 里有 <code>score</code> 字段。</li>
<li>去掉 <code>required</code> 属性后，<code>attributeChangedCallback</code> 重新同步，空值也能提交。</li>
</ul>
<h2>校验消息显示位置</h2>
<p>浏览器原生气泡会锚定到 <code>setValidity</code> 的第三个参数，通常传入 Shadow DOM 里可聚焦的元素。如果要自己显示错误文本，在 <code>invalid</code> 事件中读取 <code>this.#internals.validationMessage</code> 写入错误区域，并调用 <code>event.preventDefault()</code> 关闭原生气泡。</p>
<h2>能获得的原生能力</h2>
<ul>
<li><code>form.elements</code>、<code>new FormData(form)</code> 能拿到它。</li>
<li><code>&lt;fieldset disabled&gt;</code> 会通过 <code>formDisabledCallback</code> 通知它。</li>
<li>表单的 <code>checkValidity()</code>、<code>reportValidity()</code> 和元素的 <code>:invalid</code> 伪类会使用它的校验状态。如果希望元素自己也有 <code>checkValidity()</code> 方法，在类上定义并转调 <code>internals.checkValidity()</code>。</li>
<li>浏览器的前进后退和自动填充通过 <code>formStateRestoreCallback</code> 恢复值。</li>
</ul>`};export{e as default};