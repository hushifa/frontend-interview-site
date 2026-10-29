var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>自己写一个评分组件 <code>&lt;star-rating&gt;</code> 放进 <code>&lt;form&gt;</code>，默认情况下表单根本不认它：提交时没有它的值，<code>required</code> 也不起作用。</p>
<p>要让表单认它，在类上声明 <code>static formAssociated = true</code>，构造时调用 <code>this.attachInternals()</code>，拿到一个 <code>ElementInternals</code> 对象。它相当于浏览器给组件开的一个“表单接口”：<code>setFormValue(value)</code> 设置提交的值，<code>setValidity(flags, message, anchor)</code> 设置校验状态。</p>
<p>接上以后，组件就有了原生控件的能力：<code>FormData</code> 能拿到它的值，表单校验会检查它，浏览器还会在重置、禁用、恢复状态时调用 <code>formResetCallback</code>、<code>formDisabledCallback</code>、<code>formStateRestoreCallback</code>。无障碍属性也可以用 <code>internals.role</code>、<code>internals.ariaDisabled</code> 设置，不用写在宿主元素上。</p>
<p>最容易漏的是：元素一连接到页面就要同步一次校验状态。否则用户什么都不点直接提交，表单会以为它是有效的。</p>
</blockquote>
<h2>写一个必填的评分组件</h2>
<p>下面的组件只做一件事：保存一个评分值，必填且为空时报错。</p>
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
<p>所有改动都汇总到 <code>#sync()</code>：先用 <code>setFormValue</code> 告诉表单当前值，再根据是否必填设置校验状态。<code>setValidity({ valueMissing: true }, &#x27;请选择评分&#x27;)</code> 表示“缺值”，第二个参数是提示文字；传空对象 <code>{}</code> 表示有效。</p>
<p>所以用户不选就点提交，浏览器检查到 <code>valueMissing</code>，会阻止提交并显示“请选择评分”。选了以后提交成功，<code>FormData</code> 里就有 <code>score</code> 字段。</p>
<p>为什么 <code>connectedCallback</code> 里也要调用 <code>#sync()</code>？因为初始值是空的，如果不在一开始就标记成“缺值”，用户不操作直接提交，表单拿到的是默认的有效状态，就放行了。同理，去掉 <code>required</code> 属性时 <code>attributeChangedCallback</code> 会重新同步，空值就能提交了。</p>
<h2>错误提示显示在哪里</h2>
<p>浏览器原生的错误气泡会指向 <code>setValidity</code> 的第三个参数，通常传 Shadow DOM 里一个可以聚焦的元素，比如第一颗星。</p>
<p>如果想自己显示错误文字，就监听 <code>invalid</code> 事件，从 <code>this.#internals.validationMessage</code> 读出提示写进错误区域，再调用 <code>event.preventDefault()</code> 关掉原生气泡。</p>
<h2>接上以后能获得哪些原生能力</h2>
<p><code>form.elements</code> 和 <code>new FormData(form)</code> 都能拿到它。放在 <code>&lt;fieldset disabled&gt;</code> 里时，浏览器会通过 <code>formDisabledCallback</code> 通知它被禁用了。表单的 <code>checkValidity()</code>、<code>reportValidity()</code>，以及元素的 <code>:invalid</code> 伪类，都会用到它的校验状态。浏览器前进后退和自动填充时，会通过 <code>formStateRestoreCallback</code> 把值恢复回来。</p>
<p>有一点不会自动获得：元素自己的 <code>checkValidity()</code> 方法。如果需要，在类上定义一个，转调 <code>internals.checkValidity()</code>。</p>
<h2>常见追问</h2>
<p><strong>不加 <code>formAssociated</code> 直接调用 <code>setFormValue</code> 会怎样？</strong></p>
<blockquote>
<p>不行。只有声明了 <code>static formAssociated = true</code> 的元素，<code>ElementInternals</code> 上的表单相关方法才能用，否则浏览器会抛错，表单也不会把它当控件。</p>
</blockquote>
<p><strong>为什么无障碍属性写在 internals 上，而不是宿主元素的 attribute 上？</strong></p>
<blockquote>
<p>写在 internals 上是组件内部的默认语义，不会出现在页面的 HTML 属性里，也不会被使用者误删。使用者如果自己在宿主元素上写了 <code>role</code>，以使用者写的为准。</p>
</blockquote>`};export{e as default};