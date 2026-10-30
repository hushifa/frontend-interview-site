var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>一个注册表单有十几个字段，有的只是提交时才要值，有的要边输边校验，还有的会决定别的字段显不显示。组织这种表单，第一步是决定每个字段的值放在哪里。</p>
<p>只在提交时要值的字段，用非受控加 <code>FormData</code>，不用给每个字段建 state。要实时校验、格式化或联动的字段，才用受控。受控的字段多了，可以放进一个对象 state 里统一更新；像“按钮能不能点”“哪些字段报错”这种能从已有值算出来的结果，react.dev 建议在渲染时直接算，不要另存一份 state。</p>
<p>提交用 React 19 的 <code>&lt;form action&gt;</code>，函数直接收到 <code>FormData</code>。配合 <code>useActionState</code>，能拿到上一次提交返回的结果，比如服务端的错误信息，还有一个 <code>isPending</code> 表示正在提交。Action 里抛出的错误会交给最近的 Error Boundary。</p>
<p>还要注意中文输入法。拼音还没选字时，受控输入框的 <code>onChange</code> 也会触发，在里面截断、过滤，就可能把没打完的拼音改掉。</p>
</blockquote>
<h2>字段的值放在哪里</h2>
<p>受控和非受控的概念见<a href="/questions/react-controlled-uncontrolled/">《React 中的受控组件和非受控组件是什么？》</a>。到了复杂表单，问题变成每个字段该选哪种。判断方法是看什么时候需要这个值：</p>
<table><thead><tr><th>什么时候用到这个值</th><th>写法</th></tr></thead><tbody><tr><td>只在提交时</td><td>非受控，写 <code>name</code> 和 <code>defaultValue</code>，提交时从 <code>FormData</code> 取</td></tr><tr><td>输入时要实时校验或格式化</td><td>受控</td></tr><tr><td>会决定别的字段显示什么</td><td>受控</td></tr><tr><td>第三方组件只能操作 DOM</td><td>非受控加 ref</td></tr></tbody></table>
<p>为什么不全部写成受控？受控输入框每敲一个字，state 所在的组件就重新渲染一次。字段都放在表单顶层的话，敲一个字整个表单都要渲染，字段多了会卡。只把真正需要实时处理的字段做成受控，其他交给浏览器保管，渲染范围就小得多。</p>
<h2>受控字段多了怎样管理</h2>
<p>下面的表单有三个受控字段，放在一个对象里：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">SignupForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [values, setValues] = <span class="hljs-title function_">useState</span>({ <span class="hljs-attr">email</span>: <span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-attr">password</span>: <span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-attr">confirm</span>: <span class="hljs-string">&#x27;&#x27;</span> });

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleChange</span>(<span class="hljs-params">e</span>) {
    <span class="hljs-keyword">const</span> { name, value } = e.<span class="hljs-property">target</span>;
    <span class="hljs-title function_">setValues</span>({ ...values, [name]: value });
  }

  <span class="hljs-keyword">const</span> errors = {
    <span class="hljs-attr">email</span>: values.<span class="hljs-property">email</span> &amp;&amp; !values.<span class="hljs-property">email</span>.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;@&#x27;</span>) ? <span class="hljs-string">&#x27;邮箱格式不对&#x27;</span> : <span class="hljs-string">&#x27;&#x27;</span>,
    <span class="hljs-attr">confirm</span>: values.<span class="hljs-property">confirm</span> &amp;&amp; values.<span class="hljs-property">confirm</span> !== values.<span class="hljs-property">password</span> ? <span class="hljs-string">&#x27;两次密码不一致&#x27;</span> : <span class="hljs-string">&#x27;&#x27;</span>,
  };
  <span class="hljs-keyword">const</span> canSubmit = values.<span class="hljs-property">email</span> &amp;&amp; values.<span class="hljs-property">password</span> &amp;&amp; !errors.<span class="hljs-property">email</span> &amp;&amp; !errors.<span class="hljs-property">confirm</span>;

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{values.email}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{handleChange}</span> /&gt;</span>
      {errors.email &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{errors.email}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{values.password}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{handleChange}</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;confirm&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{values.confirm}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{handleChange}</span> /&gt;</span>
      {errors.confirm &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>{errors.confirm}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{!canSubmit}</span>&gt;</span>注册<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>一个 <code>handleChange</code> 按 <code>name</code> 更新对应的字段。更新对象时要写 <code>{ ...values, [name]: value }</code>，react.dev 提醒过，对象 state 不能只传改动的那一个字段，否则其他字段就丢了。</p>
<p><code>errors</code> 和 <code>canSubmit</code> 为什么不放进 state？它们完全由 <code>values</code> 决定。react.dev 的原则是，能在渲染时从 props 或已有 state 算出来的信息，就不要放进 state。另存一份的话，每次改 <code>values</code> 都要记得同步改它们，忘一次界面就不一致了。</p>
<h2>提交状态和服务端错误怎么处理</h2>
<p>提交时要做三件事：按钮显示“提交中”、防止重复点击、把服务端返回的错误显示出来。React 19 里用 <code>useActionState</code> 可以一起处理：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useActionState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">signup</span>(<span class="hljs-params">prevState, formData</span>) {
  <span class="hljs-keyword">const</span> response = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/signup&#x27;</span>, { <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>, <span class="hljs-attr">body</span>: formData });
  <span class="hljs-keyword">if</span> (!response.<span class="hljs-property">ok</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">error</span>: <span class="hljs-string">&#x27;注册失败，请稍后再试&#x27;</span> };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">error</span>: <span class="hljs-string">&#x27;&#x27;</span> };
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">SignupForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [state, formAction, isPending] = <span class="hljs-title function_">useActionState</span>(signup, { <span class="hljs-attr">error</span>: <span class="hljs-string">&#x27;&#x27;</span> });

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{formAction}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;password&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>
      {state.error &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>{state.error}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{isPending}</span>&gt;</span>{isPending ? &#x27;提交中…&#x27; : &#x27;注册&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p><code>useActionState</code> 返回三个值：当前状态、要传给 <code>action</code> 的函数、是否有提交还在进行的 <code>isPending</code>。按 react.dev 的说明，传给它的函数第一个参数是上一次的状态，第二个参数是表单的 <code>FormData</code>，返回值会成为新的状态，所以错误信息直接从 <code>state.error</code> 读。多次提交会按顺序排队执行，每次都拿到上一次的结果。</p>
<p>预期内的失败，比如账号已存在，用返回值表达。真正的异常，<code>action</code> 里抛出的错误会交给最近的 Error Boundary 显示后备界面。另外，Action 成功后，表单里的非受控字段会被自动重置。</p>
<h2>中文输入法会出什么问题</h2>
<p>用拼音打字时，字还没选定，输入框里是拼音字母，这个阶段叫组合输入。受控输入在组合过程中也会触发 <code>onChange</code>。</p>
<p>如果在 <code>onChange</code> 里做“去掉非数字”“截断长度”这类改写，就可能把还没打完的拼音改掉，打断输入。需要时监听 <code>compositionstart</code> 和 <code>compositionend</code>，组合期间先原样保存，等 <code>compositionend</code> 触发、文字选定后再处理。</p>
<h2>常见追问</h2>
<p><strong>字段很多时要不要用表单库？</strong></p>
<blockquote>
<p>可以。React Hook Form 这类库以非受控为主，用 ref 注册字段，输入时不触发整个表单渲染，校验规则也集中管理。思路和上面一样：只有需要实时处理的值才进 React 状态。</p>
</blockquote>
<p><strong>怎么重置表单？</strong></p>
<blockquote>
<p>非受控字段调用表单 DOM 的 <code>form.reset()</code>，或者给表单换一个 <code>key</code>，让 React 卸载后重新挂载。受控字段把 state 设回初始值。</p>
</blockquote>`};export{e as default};