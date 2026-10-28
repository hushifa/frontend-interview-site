var e={answerHtml:`<h2>简答</h2>
<p>useActionState(action, initialState) 返回 [state, dispatch, isPending]。action 接收上一次结果和本次载荷，返回值成为新的 state。多次提交按队列依次执行，适合把表单提交结果（成功信息、校验错误）直接变成状态。它不负责校验、鉴权和取消请求，这些仍要在 action 里自己实现。</p>
<p>表单提交常常需要同时维护结果、错误消息和是否正在处理。useActionState 提供一条直接的数据流：触发 Action，把载荷交给处理函数，处理函数返回的新结果成为组件状态，React 跟踪相关的 pending 过程。</p>
<p>它与 useReducer 的外形相似，但处理函数可以异步等待并执行提交等副作用，而普通 reducer 必须保持纯计算。Action 也不天然等于 Server Function，客户端函数同样可以参与。</p>
<h2>一个完整的客户端示例</h2>
<p>下面仅通过本地延迟演示异步过程，不向服务器保存数据。输入草稿由普通 state 控制，上一次处理结果由 useActionState 保存。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useActionState, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> initialResult = { <span class="hljs-attr">name</span>: <span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;&#x27;</span>, <span class="hljs-attr">completed</span>: <span class="hljs-number">0</span> };

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">processName</span>(<span class="hljs-params">previousResult, formData</span>) {
  <span class="hljs-keyword">const</span> rawName = formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;name&#x27;</span>);
  <span class="hljs-keyword">const</span> name = <span class="hljs-keyword">typeof</span> rawName === <span class="hljs-string">&#x27;string&#x27;</span> ? rawName.<span class="hljs-title function_">trim</span>() : <span class="hljs-string">&#x27;&#x27;</span>;
  <span class="hljs-keyword">if</span> (name === <span class="hljs-string">&#x27;&#x27;</span>) {
    <span class="hljs-keyword">return</span> { ...previousResult, <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;请输入姓名。&#x27;</span> };
  }

  <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">300</span>));
  <span class="hljs-keyword">return</span> {
    name,
    <span class="hljs-attr">message</span>: <span class="hljs-string">&#x27;本次姓名已处理。&#x27;</span>,
    <span class="hljs-attr">completed</span>: previousResult.<span class="hljs-property">completed</span> + <span class="hljs-number">1</span>,
  };
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">NameForm</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [draft, setDraft] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [result, formAction, isPending] = <span class="hljs-title function_">useActionState</span>(processName, initialResult);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{formAction}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
        姓名
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;name&quot;</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{draft}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setDraft(event.target.value)} /&gt;
      <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{isPending}</span>&gt;</span>
        {isPending ? &#x27;处理中&#x27; : &#x27;处理姓名&#x27;}
      <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;status&quot;</span>&gt;</span>{result.message}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>上次成功处理：{result.name || &#x27;暂无&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;成功次数&quot;</span>&gt;</span>{result.completed}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>返回数组的三个位置分别是当前结果状态、触发函数和 pending 标记。处理函数的第一个参数是上一次结果，第二个参数才是本次提交的 FormData，这与直接写 <code>&lt;form action={普通表单函数}&gt;</code> 时的单参数习惯不同。</p>
<p>校验失败时返回消息，但保留之前成功的姓名与计数；成功时返回新的完整结果。这里不会像某种对象补丁 API 一样自动合并字段，所以应把需要保留的字段明确带回来。</p>
<h2>草稿与提交结果为什么分开</h2>
<p>用户正在编辑的 draft 和已经成功处理的 result.name 代表不同时间点。提交后继续编辑，不应该立刻改写“上次成功处理”的结果；一次失败也不一定意味着要清空草稿。</p>
<p>函数式 form Action 正常完成后，React 会对非受控表单字段执行重置。返回一个含 error 或 message 的对象，仍然可能是函数正常完成，因此不能只凭这个字段名推断输入一定不会被重置。</p>
<p>本例采用受控草稿，重置不会自动替 React 把 draft 清空。若业务希望成功后清空、失败后保留，需要明确设计这套行为，不能把结果状态与输入当前值混成同一份含义。</p>
<h2>触发函数需要在 Action 上下文中使用</h2>
<p>把 formAction 传给 form 的 action 属性，React 会提供相关提交上下文。需要从其他交互手动触发时，可以按规则在 startTransition 等 Action 上下文中调用。</p>
<p>普通 onClick 中直接调用异步触发函数，不等于已经建立相同的 pending 跟踪；在不符合约束的环境中，React 会给出诊断。也不要在渲染期间调用它，那会把状态更新放到不合适的阶段。</p>
<p>触发函数不是把业务结果直接返回给调用方的普通 async 包装，不能依赖 <code>await formAction(...)</code> 读取最终状态。应从 Hook 提供的结果和相关边界组织界面。</p>
<h2>多次触发的语义不是任意并发竞速</h2>
<p>同一个 useActionState 的正常多次触发会按队列执行，后一次处理函数接收前一次返回的状态，因此可以表达连续修改、累计结果等流程。</p>
<p>这不是把一组请求交给 Promise.all，也不应该被当作所有服务端并发冲突的解决方案。多个组件、多个标签页或其他客户端仍可能同时提交，后端的幂等性和并发控制仍需独立设计。</p>
<p>禁用按钮能减少当前界面的重复触发，但不能作为唯一防重措施。初始状态也只负责初始化，父组件后来传来一个不同的 initialState，并不自然表示应重置当前 Action 状态；需要明确的重置动作或组件身份设计。</p>
<h2>返回业务错误与抛出异常有什么区别</h2>
<p>可预期的字段校验失败通常适合作为结构化结果返回，让表单保留输入并显示可修复提示。网络和服务端返回的数据也需要按业务规则解析，不应无条件相信 FormData 或响应类型。</p>
<p>处理函数抛出异常时，React 会按 Action 的错误机制交给 Error Boundary，等待中的后续动作也可能被取消。不是在任意位置包一个同步 try/catch，就能把未来的 Action 错误全部留在当前表单里。</p>
<p>如果决定在处理函数内部捕获某类错误并转成结果，应保留有用的诊断信息，并只对符合业务预期的失败这样做。不要把所有程序错误都伪装成“提交成功但没有内容”。</p>
<h2>服务器与渐进增强需要额外环境支持</h2>
<p>客户端 Action 可以只操作浏览器状态，也可以调用普通 API。它不会因为使用 useActionState 就自动在服务端运行，纯静态站点也不会因此获得服务器写入能力。</p>
<p>配合 Server Function 与支持的框架时，可以利用表单集成和 permalink 等能力处理尚未完成客户端增强的提交。但这依赖相同表单与服务端函数在目标页面中的对应关系，不是给任意 SPA 加一个字符串参数就自动获得渐进增强。</p>
<p>把处理函数的载荷、返回状态、错误策略和生命周期定义清楚之后，useActionState 才能减少重复状态代码，而不是把所有异步工作隐含地塞进一个 Hook。</p>`};export{e as default};