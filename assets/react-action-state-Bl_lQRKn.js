var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>写表单时，经常要处理“提交 → 等接口返回 → 显示成功或失败”。<code>useActionState</code> 就是干这个的：你给它一个处理函数和初始状态，它返回当前状态、一个可以直接传给 <code>&lt;form action&gt;</code> 的 <code>dispatch</code> 函数，以及表示是否在提交中的 <code>isPending</code>。</p>
<p>处理函数叫 Action，它收到两个参数：上一次的状态和本次提交的数据。它返回什么，新状态就是什么，返回 Promise 也可以。多次提交会按顺序排队，后一次拿到的是前一次的结果。</p>
<p>它的用处是把“提交结果”直接变成组件状态，不用自己写 <code>loading</code>、<code>error</code> 两三个 state。React 19 里它取代了早期的 <code>useFormState</code>。</p>
<p>要注意两点。第一，表单 Action 只要没有抛错，React 就会重置非受控的输入框，哪怕返回的是“失败”，所以要把用户输入放进返回值再回填。第二，可预期的错误应该返回，不要 <code>throw</code>，抛出的错误会交给 Error Boundary，还会取消后面排队的调用。</p>
</blockquote>
<h2>先看一个订阅表单</h2>
<p>下面这个表单提交邮箱。<code>subscribe</code> 是 Action，它返回的对象就是新的 <code>state</code>。</p>
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
<p>完整的签名是 <code>useActionState(action, initialState, permalink?)</code>。<code>dispatch</code> 传给 <code>&lt;form action&gt;</code> 时，Action 的第二个参数就是表单的 <code>FormData</code>。React 会把这次调用放在 Transition 里执行（Transition 就是“不着急、可以在后台进行的更新”），所以执行期间 <code>isPending</code> 是 <code>true</code>，按钮可以显示“提交中”。</p>
<p>看代码时你可能会问：失败了为什么还要把 <code>email</code> 放进返回值？因为 Action 只要没有抛错，React 就认为它完成了，会重置非受控字段，输入框会被清空。把用户输入带回来，再用 <code>defaultValue</code> 填回去，用户就不用重新输入。</p>
<h2>失败为什么要返回，不要 throw</h2>
<p>“邮箱格式不对”“接口返回失败”都是能预料的情况，返回一个带错误信息的对象，界面直接显示就行。</p>
<p>如果在 Action 里 <code>throw</code>，这个错误会交给最近的 Error Boundary，整块区域变成错误界面。而且排在后面的调用会被取消。所以 <code>throw</code> 只留给真正意料之外的错误。</p>
<h2>多次提交是怎么排队的</h2>
<p>用户连续点了几次，React 不会让几次调用同时跑，而是一个接一个执行。后一次调用拿到的 <code>prevState</code>，就是前一次的返回值。这样状态的变化顺序跟提交顺序一致，不会出现后发的请求先回来、把结果覆盖掉的情况。</p>
<h2>不用表单也能调用</h2>
<p><code>dispatch</code> 也可以在按钮点击里手动调用，但要放进 <code>startTransition</code>，否则 <code>isPending</code> 不会更新：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { startTransition } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">onClick</span>(<span class="hljs-params"></span>) {
  <span class="hljs-title function_">startTransition</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;increment&#x27;</span> }));
}
</code></pre></div>
<p>这时 Action 收到的第二个参数就是你传的 <code>{ type: &#x27;increment&#x27; }</code>。</p>
<h2>和 Server Functions 一起用</h2>
<p>在支持 React Server Components 的框架里，Action 可以是标了 <code>&#x27;use server&#x27;</code> 的 Server Function，也就是在服务端执行的函数。</p>
<p>第三个参数 <code>permalink</code> 是给“JavaScript 还没加载完”准备的。这时用户提交表单，浏览器会按普通表单跳转到这个 URL，由服务端处理后返回页面。这种“没有 JS 也能用、有了 JS 体验更好”的做法叫渐进增强。</p>
<h2>常见追问</h2>
<p><strong>和 <code>useFormStatus</code> 有什么区别？</strong></p>
<blockquote>
<p><code>useActionState</code> 管的是 Action 的结果，在渲染表单的组件里用。<code>useFormStatus</code> 只让表单里面的子组件知道父表单是不是在提交，拿不到结果。详见<a href="/questions/react-use-form-status/">《React useFormStatus 适合管理什么表单状态？》</a>。</p>
</blockquote>
<p><strong>想让结果立刻显示，不等接口返回怎么办？</strong></p>
<blockquote>
<p>配合 <code>useOptimistic</code> 先显示一个临时状态，接口返回后再换成真实结果。详见<a href="/questions/react-optimistic/">《useOptimistic 的临时状态怎样与真实结果收敛？》</a>。</p>
</blockquote>
<p><strong>校验和权限检查它会帮我做吗？</strong></p>
<blockquote>
<p>不会。它只负责把返回值变成状态，校验、权限、错误信息都要在 Action 里自己写。</p>
</blockquote>`};export{e as default};