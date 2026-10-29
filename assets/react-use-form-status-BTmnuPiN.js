var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>很多表单都要一个“提交中就禁用”的按钮。以前得把 <code>isPending</code> 从表单组件一层层传给按钮。<code>useFormStatus</code> 让按钮自己去问：“我所在的那个表单，现在是不是在提交？”</p>
<p>它从 <code>react-dom</code> 导入，返回 <code>{ pending, data, method, action }</code>，描述的是最近一个父级 <code>&lt;form&gt;</code> 的当前提交。<code>pending</code> 表示是否在提交，<code>data</code> 是这次提交的 <code>FormData</code>。</p>
<p>它最适合做可复用的提交按钮和提交提示，放进哪个表单就自动跟哪个表单走，不用传任何 props。</p>
<p>要注意，它必须在 <code>&lt;form&gt;</code> 里面渲染的组件中调用，在渲染 <code>&lt;form&gt;</code> 的那个组件里调用读不到。它只对用 <code>action</code> 属性提交的表单生效。它也只告诉你“是不是在提交、提交了什么”，提交结果和校验错误要用 <code>useActionState</code> 管理。</p>
</blockquote>
<h2>写一个通用提交按钮</h2>
<p>按钮自己读表单状态，提交期间禁用并换文字：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useFormStatus } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">SubmitButton</span>(<span class="hljs-params">{ children, pendingText = <span class="hljs-string">&#x27;提交中…&#x27;</span> }</span>) {
  <span class="hljs-keyword">const</span> { pending } = <span class="hljs-title function_">useFormStatus</span>();
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{pending}</span> <span class="hljs-attr">aria-busy</span>=<span class="hljs-string">{pending}</span>&gt;</span>
      {pending ? pendingText : children}
    <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>用的时候直接放进表单就行：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">CommentForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">addComment</span>(<span class="hljs-params">formData</span>) {
    <span class="hljs-keyword">await</span> <span class="hljs-title function_">postComment</span>(formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;text&#x27;</span>));
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{addComment}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">textarea</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;text&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">SubmitButton</span>&gt;</span>发表评论<span class="hljs-tag">&lt;/<span class="hljs-name">SubmitButton</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p><code>CommentForm</code> 没给 <code>SubmitButton</code> 传任何状态。用户提交时，<code>addComment</code> 还没执行完，按钮读到 <code>pending</code> 为 <code>true</code>，就显示“提交中…”并禁用。换一个表单用它，它读的就是新表单的状态。</p>
<h2>为什么在表单组件里调用永远是 false</h2>
<p>很多人第一次会这样写：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">CommentForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { pending } = <span class="hljs-title function_">useFormStatus</span>(); <span class="hljs-comment">// 永远是 false</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{addComment}</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>;
}
</code></pre></div>
<p><code>useFormStatus</code> 是往上找父级的 <code>&lt;form&gt;</code>。可这里的 <code>&lt;form&gt;</code> 是 <code>CommentForm</code> 自己渲染出来的，在它下面，不在它上面，所以它什么也找不到。</p>
<p>所以要么把读状态的部分拆成子组件放进表单里，要么在同一层改用 <code>useActionState</code> 返回的 <code>isPending</code>。</p>
<h2>显示正在提交的内容</h2>
<p><code>data</code> 就是这次提交的 <code>FormData</code>，可以拿来做更具体的提示：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">SavingHint</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { pending, data } = <span class="hljs-title function_">useFormStatus</span>();
  <span class="hljs-keyword">if</span> (!pending) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>正在保存《{data.get(&#x27;title&#x27;)}》…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}
</code></pre></div>
<h2>和 useActionState 怎么分工</h2>
<p><code>useFormStatus</code> 在表单的子组件里调用，提供“是否在提交”和“提交了什么数据”，适合通用按钮和提示组件。<code>useActionState</code> 在渲染表单的组件里调用，提供 Action 返回的状态和 <code>isPending</code>，适合显示提交结果和错误。</p>
<p>两者经常一起用：外层用 <code>useActionState</code> 显示结果，里面的按钮用 <code>useFormStatus</code> 控制禁用。详见<a href="/questions/react-action-state/">《useActionState 如何把异步 Action 的结果变成组件状态？》</a>。</p>
<h2>常见追问</h2>
<p><strong>普通的 <code>onSubmit</code> 提交也能用吗？</strong></p>
<blockquote>
<p>不能。它只追踪通过 <code>action</code> 属性发起的提交。</p>
</blockquote>
<p><strong>页面上有好几个表单，会不会串？</strong></p>
<blockquote>
<p>不会。每个子组件只读它自己所在的那个表单，互不影响。</p>
</blockquote>`};export{e as default};