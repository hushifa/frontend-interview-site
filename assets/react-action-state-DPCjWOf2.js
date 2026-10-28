var e={answerHtml:`<h2>简答</h2>
<ul>
<li>签名：<code>const [state, dispatch, isPending] = useActionState(action, initialState, permalink?)</code>。</li>
<li><code>action(prevState, payload)</code> 的返回值（可以是 Promise）成为新的 <code>state</code>。</li>
<li>把 <code>dispatch</code> 传给 <code>&lt;form action={dispatch}&gt;</code> 时，payload 是 <code>FormData</code>；React 会在 Transition 中执行它，并在成功后重置非受控表单字段。</li>
<li>多次触发的调用按顺序排队，后一次拿到的 <code>prevState</code> 是前一次的结果。</li>
<li>React 19 中它取代了 canary 时期的 <code>useFormState</code>；校验、权限、错误信息仍要在 Action 里自己实现。</li>
</ul>
<h2>表单示例</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useActionState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">subscribe</span>(<span class="hljs-params">prevState, formData</span>) {
  <span class="hljs-keyword">const</span> email = <span class="hljs-title class_">String</span>(formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;email&#x27;</span>) ?? <span class="hljs-string">&#x27;&#x27;</span>).<span class="hljs-title function_">trim</span>();
  <span class="hljs-keyword">if</span> (!email.<span class="hljs-title function_">includes</span>(<span class="hljs-string">&#x27;@&#x27;</span>)) {
    <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;邮箱格式不正确&#x27;</span>, email };
  }
  <span class="hljs-keyword">const</span> res = <span class="hljs-keyword">await</span> <span class="hljs-title function_">fetch</span>(<span class="hljs-string">&#x27;/api/subscribe&#x27;</span>, {
    <span class="hljs-attr">method</span>: <span class="hljs-string">&#x27;POST&#x27;</span>,
    <span class="hljs-attr">body</span>: <span class="hljs-title class_">JSON</span>.<span class="hljs-title function_">stringify</span>({ email }),
    <span class="hljs-attr">headers</span>: { <span class="hljs-string">&#x27;Content-Type&#x27;</span>: <span class="hljs-string">&#x27;application/json&#x27;</span> },
  });
  <span class="hljs-keyword">if</span> (!res.<span class="hljs-property">ok</span>) <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;订阅失败，请稍后重试&#x27;</span>, email };
  <span class="hljs-keyword">return</span> { <span class="hljs-attr">ok</span>: <span class="hljs-literal">true</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;订阅成功&#x27;</span>, <span class="hljs-attr">email</span>: <span class="hljs-string">&#x27;&#x27;</span> };
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">SubscribeForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [state, formAction, isPending] = <span class="hljs-title function_">useActionState</span>(subscribe, {
    <span class="hljs-attr">ok</span>: <span class="hljs-literal">false</span>,
    <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;&#x27;</span>,
    <span class="hljs-attr">email</span>: <span class="hljs-string">&#x27;&#x27;</span>,
  });

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{formAction}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;email&quot;</span> <span class="hljs-attr">defaultValue</span>=<span class="hljs-string">{state.email}</span> <span class="hljs-attr">aria-describedby</span>=<span class="hljs-string">&quot;msg&quot;</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{isPending}</span>&gt;</span>{isPending ? &#x27;提交中…&#x27; : &#x27;订阅&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">id</span>=<span class="hljs-string">&quot;msg&quot;</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>{state.message}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<ul>
<li>失败时把用户输入放进返回值，再用 <code>defaultValue</code> 回填，因为表单提交成功前后 React 会重置非受控字段。</li>
<li>把可预期的错误作为返回值，而不是 <code>throw</code>。Action 中抛出的错误会交给最近的 Error Boundary，并且会取消队列中排在后面的调用。</li>
</ul>
<h2>在表单之外调用</h2>
<p><code>dispatch</code> 也可以手动调用，但必须放在 Transition 里，<code>isPending</code> 才会更新：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { startTransition } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">onClick</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title function_">startTransition</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;increment&#x27;</span> }));
}
</code></pre></div>
<h2>和 Server Functions 配合</h2>
<p>在支持 RSC 的框架中，<code>action</code> 可以是 <code>&#x27;use server&#x27;</code> 标记的 Server Function。第三个参数 <code>permalink</code> 用于渐进增强：JavaScript 加载前提交表单时，浏览器跳转到这个 URL，由服务端处理后返回页面。</p>
<h2>常见追问</h2>
<ul>
<li>和 <code>useFormStatus</code> 的区别？<code>useActionState</code> 管理 Action 的结果，<code>useFormStatus</code> 只让表单内部的子组件读取父表单是否在提交，见《React useFormStatus 适合管理什么表单状态？》。</li>
<li>想立即显示结果怎么办？配合 <code>useOptimistic</code> 显示临时状态，见《useOptimistic 的临时状态怎样与真实结果收敛？》。</li>
</ul>`};export{e as default};