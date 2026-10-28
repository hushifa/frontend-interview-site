var e={answerHtml:`<h2>简答</h2>
<ul>
<li>受控：传 <code>value</code>（或 <code>checked</code>）和 <code>onChange</code>，React state 是唯一数据源，输入框显示的永远是 state。</li>
<li>非受控：传 <code>defaultValue</code>（或 <code>defaultChecked</code>），浏览器维护当前值，通过 <code>ref</code> 或提交时的 <code>FormData</code> 读取。</li>
<li>传了 <code>value</code> 却没有 <code>onChange</code>，输入框会变成只读，React 会给出警告。</li>
<li>同一个输入框不要在受控和非受控之间切换，例如 <code>value</code> 从 <code>undefined</code> 变成字符串；初值用 <code>&#x27;&#x27;</code> 而不是 <code>undefined</code>。</li>
<li><code>&lt;input type=&quot;file&quot;&gt;</code> 只能是非受控的，因为出于安全原因脚本不能设置它的值。</li>
</ul>
<h2>受控：实时格式化与联动</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">PhoneInput</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [phone, setPhone] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> digits = phone.<span class="hljs-title function_">replace</span>(<span class="hljs-regexp">/\\D/g</span>, <span class="hljs-string">&#x27;&#x27;</span>);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span>
        <span class="hljs-attr">value</span>=<span class="hljs-string">{phone}</span>
        <span class="hljs-attr">inputMode</span>=<span class="hljs-string">&quot;numeric&quot;</span>
        <span class="hljs-attr">onChange</span>=<span class="hljs-string">{(e)</span> =&gt;</span> setPhone(e.target.value.replace(/[^\\d ]/g, &#x27;&#x27;))}
      /&gt;
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{digits.length</span> !== <span class="hljs-string">11}</span>&gt;</span>发送验证码<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>每次输入都经过 <code>onChange</code> 过滤，按钮状态由同一个 state 推导，不会和输入框不一致。</p>
<h2>非受控：提交时一次读取</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">FeedbackForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">submit</span>(<span class="hljs-params">formData</span>) {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/feedback&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, <span class="hljs-attr">body</span>: formData });
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{submit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;title&quot;</span> <span class="hljs-attr">defaultValue</span>=<span class="hljs-string">&quot;&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">textarea</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;content&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>提交<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>React 19 的 <code>&lt;form action&gt;</code> 直接把 <code>FormData</code> 交给函数，字段不需要各自的 state；Action 成功后 React 会重置非受控字段。</p>
<h2>选择依据</h2>
<table><thead><tr><th>需求</th><th>推荐</th></tr></thead><tbody><tr><td>输入时实时校验、格式化、联动其他字段</td><td>受控</td></tr><tr><td>只在提交时需要值</td><td>非受控 + <code>FormData</code></td></tr><tr><td>大型表单、性能敏感</td><td>非受控为主，或 React Hook Form 这类库</td></tr><tr><td>接入只操作 DOM 的第三方输入组件</td><td>非受控 + ref</td></tr></tbody></table>
<h2>中文输入法</h2>
<p>受控输入在拼音组合过程中也会触发 <code>onChange</code>。如果在 <code>onChange</code> 里做&quot;去掉非数字&quot;&quot;截断长度&quot;这类改写，可能打断组合输入。需要时监听 <code>compositionstart</code> / <code>compositionend</code>，组合结束后再处理。</p>
<h2>常见追问</h2>
<ul>
<li>怎么重置非受控表单？调用 <code>form.reset()</code>，或者给表单换 <code>key</code> 让它重新挂载。</li>
<li><code>defaultValue</code> 改了为什么输入框不变？它只在首次挂载时生效，之后的值由 DOM 维护。</li>
</ul>`};export{e as default};