var e={answerHtml:`<h2>简答</h2>
<ul>
<li>从 <code>react-dom</code> 导入，返回 <code>{ pending, data, method, action }</code>，描述最近一个父级 <code>&lt;form&gt;</code> 的当前提交。</li>
<li>必须在 <code>&lt;form&gt;</code> 内部渲染的组件中调用；在渲染 <code>&lt;form&gt;</code> 的同一个组件里调用，读不到这个表单的状态。</li>
<li>只对使用 <code>action</code> 属性提交的表单生效，即 <code>&lt;form action={fn}&gt;</code>。</li>
<li>只告诉你&quot;是否正在提交、提交了什么&quot;；提交结果、校验错误要用 <code>useActionState</code> 管理。</li>
<li>典型用途：可复用的提交按钮，自动在提交期间禁用并显示加载文字。</li>
</ul>
<h2>通用提交按钮</h2>
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
<p><code>SubmitButton</code> 不需要任何 props 就知道表单状态，可以放进任意表单。</p>
<h2>常见错误：在表单组件自身调用</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">CommentForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { pending } = <span class="hljs-title function_">useFormStatus</span>(); <span class="hljs-comment">// 永远是 false</span>
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{addComment}</span>&gt;</span>...<span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>;
}
</code></pre></div>
<p><code>useFormStatus</code> 只查找父级的 <code>&lt;form&gt;</code>，这里的 <code>&lt;form&gt;</code> 是当前组件渲染出来的子元素。需要在同一层读取，改用 <code>useActionState</code> 返回的 <code>isPending</code>。</p>
<h2>读取正在提交的数据</h2>
<p><code>data</code> 是本次提交的 <code>FormData</code>，可以用来显示&quot;正在保存《标题》…&quot;：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">function</span> <span class="hljs-title function_">SavingHint</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { pending, data } = <span class="hljs-title function_">useFormStatus</span>();
  <span class="hljs-keyword">if</span> (!pending) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>正在保存《{data.get(&#x27;title&#x27;)}》…<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}
</code></pre></div>
<h2>和 useActionState 的分工</h2>
<table><thead><tr><th></th><th>useFormStatus</th><th>useActionState</th></tr></thead><tbody><tr><td>调用位置</td><td>form 的子组件</td><td>渲染 form 的组件</td></tr><tr><td>提供</td><td>提交中、提交的数据</td><td>Action 返回的状态、isPending</td></tr><tr><td>适合</td><td>通用按钮、提示组件</td><td>显示结果和错误</td></tr></tbody></table>
<p>两者经常一起使用，见<a href="/questions/react-action-state/">《useActionState 如何把异步 Action 的结果变成组件状态？》</a>。</p>
<h2>常见追问</h2>
<ul>
<li>支持普通 <code>onSubmit</code> 吗？不支持，只追踪通过 <code>action</code> 发起的提交。</li>
<li>页面上有多个表单怎么办？每个子组件只读取自己所在的那个表单，互不影响。</li>
</ul>`};export{e as default};