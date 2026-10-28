var e={answerHtml:`<h2>简答</h2>
<p>useFormStatus 返回最近一个父级  的提交状态（pending、data、method、action），必须在 form 内部的子组件里调用，在 form 所在的组件里调用拿不到。适合封装通用的提交按钮，提交中自动禁用。它只反映提交是否进行中，提交结果和错误要用 useActionState 等方式处理。</p>
<p>表单中的提交按钮通常需要知道“所属表单是否正在处理”。如果每个深层按钮都要求父级层层传递 pending，重复组件会变得啰嗦。useFormStatus 可以让按钮直接读取最近父级 form 的状态。</p>
<p>它读取的是表单上下文，不是自动扫描页面上所有请求，也不会把任意 async onClick 都变成一个受跟踪的表单提交。</p>
<h2>提交按钮应当放在 form 的后代组件中</h2>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;
<span class="hljs-keyword">import</span> { useFormStatus } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react-dom&#x27;</span>;

<span class="hljs-keyword">function</span> <span class="hljs-title function_">SubmitButton</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { pending } = <span class="hljs-title function_">useFormStatus</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{pending}</span>&gt;</span>{pending ? &#x27;处理中&#x27; : &#x27;提交&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span></span>;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">SubmissionNotice</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> { pending, data } = <span class="hljs-title function_">useFormStatus</span>();
  <span class="hljs-keyword">if</span> (!pending) <span class="hljs-keyword">return</span> <span class="hljs-literal">null</span>;
  <span class="hljs-keyword">const</span> title = data?.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;title&#x27;</span>);
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>正在处理：{typeof title === &#x27;string&#x27; ? title : &#x27;&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">FormStatusDemo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [message, setMessage] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);

  <span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">submit</span>(<span class="hljs-params">formData</span>) {
    <span class="hljs-keyword">const</span> title = formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;title&#x27;</span>);
    <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">300</span>));
    <span class="hljs-title function_">setMessage</span>(<span class="hljs-string">\`已处理：<span class="hljs-subst">\${<span class="hljs-keyword">typeof</span> title === <span class="hljs-string">&#x27;string&#x27;</span> ? title : <span class="hljs-string">&#x27;&#x27;</span>}</span>\`</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{submit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>标题<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;title&quot;</span> <span class="hljs-attr">defaultValue</span>=<span class="hljs-string">&quot;学习计划&quot;</span> /&gt;</span><span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">SubmitButton</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">SubmissionNotice</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;处理结果&quot;</span>&gt;</span>{message}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>示例通过本地延迟展示 pending，没有向服务器发送数据。提交时按钮禁用，提示组件读取本次 FormData；处理完成后 pending 结束，结果由普通 state 显示。</p>
<p>两个子组件不需要从 FormStatusDemo 接收 pending prop，但必须实际位于 form 之下。如果把 useFormStatus 放进 FormStatusDemo 自己的函数顶部，它看到的是这个组件上方的表单，而不是稍后 return 出来的那一个。</p>
<h2>它返回哪些信息</h2>
<p>pending 表示父级表单是否正处于提交过程。data 提供正在提交的 FormData，没有活跃提交或没有父级 form 时为 null。</p>
<p>method 提供表单提交方法相关信息，action 提供父表单函数式 action 的引用；URL 形式的 action 等情况不会变成同样的函数引用。它们不代表 Hook 能追踪 Action 内部每一个 fetch 请求的真实网络方法和进度。</p>
<p>读取 data 时应按 FormData 规则处理同名多值、文件、未选中复选框和缺少 name 的控件。它不是一份自动符合业务类型的普通对象，不能未经检查就把所有字段当作字符串。</p>
<h2>提交快照与继续编辑的草稿不同</h2>
<p>data 描述本次提交的数据。用户如果仍然可以编辑某些字段，后续输入不应该被想当然地理解成已经修改了正在处理的那次请求。</p>
<p>需要禁用哪些字段、是否允许下一次编辑、取消后保留什么，都应由产品设计决定。只禁用提交按钮不会自动锁住整个表单，也不能防止其他代码或其他客户端重复提交。</p>
<p>示例使用 defaultValue，所以正常完成函数式 Action 后，React 对非受控字段执行重置，回到它的默认状态。处理结果 output 是 React 状态，不属于浏览器输入重置本身，不会因此自动清空。</p>
<h2>为什么 pending 有时一直是 false</h2>
<p>最常见原因是 Hook 没有放在对应 form 的后代，或者监控的工作并不是这个表单的 React Action。一个普通 onSubmit 中 preventDefault 后自行启动、又没有接入 Action 跟踪的请求，不会仅因函数是 async 就自然获得相同行为。</p>
<p>表单 action 返回得太早也会出问题。如果启动异步工作后不等待，函数已经结束，pending 也无法替你推断那项未连接的工作还在执行。应让 Action 返回的 Promise 覆盖真正需要跟踪的生命周期。</p>
<p>如果提交很快完成，pending 状态可能非常短，不一定能肉眼看到明显的中间画面。测试时可以使用可控制完成时间的任务，而不是人为在生产业务里强加等待时间。</p>
<h2>多个表单各有自己的范围</h2>
<p>同一页面的两个独立 form，后代按钮各自读取所属表单，不应因为其中一个提交就把另一个无关按钮也禁用。复用 SubmitButton 的优势正是它可以遵循自己的上下文。</p>
<p>不要通过嵌套 form 来创造复杂的提交层级，嵌套表单不符合正常 HTML 表单结构。若组件经过 Portal 等方式改变 DOM 位置，还需要同时确认 React 上下文与实际表单控件归属，不能只凭视觉位置判断。</p>
<h2>结果与错误不是 useFormStatus 的职责</h2>
<p>该 Hook 适合“正在提交”的界面反馈，不负责存储服务器返回值或每个字段的错误。需要把 Action 结果变成状态时，可以结合 useActionState；需要预期失败恢复，则在业务边界返回清楚的结果或采用错误处理。</p>
<p>取消、幂等、权限校验和网络重试也不会因为 pending 存在就自动实现。服务端功能与无 JavaScript 的渐进增强，还需要支持它们的框架和真实提交端点，纯客户端延迟示例不具备这些能力。</p>
<p>正确使用时，useFormStatus 能让通用表单后代组件少接一些状态参数；它的价值来自明确的表单边界，而不是把所有页面异步工作都收进一个 loading 标记。</p>`};export{e as default};