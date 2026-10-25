var e={answerHtml:`<p>Context 与 useReducer 解决的是两个不同问题。Context 让深层组件读取祖先提供的值，减少中间层只为转交而接收 props；useReducer 则把“收到什么动作，下一状态是什么”集中到一个纯函数中。</p>
<p>简单的主题、语言可以只用 Context 配合 state。更新动作多、多个字段需要保持关系时，reducer 更容易把规则组织清楚。它们组合后仍然是组件范围内的状态，不会自动成为跨页面永久存活的全局服务。</p>
<h3>用任务列表把数据与动作一起组织</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { createContext, useContext, useReducer, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">const</span> <span class="hljs-title class_">TasksContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);
<span class="hljs-keyword">const</span> <span class="hljs-title class_">TasksDispatchContext</span> = <span class="hljs-title function_">createContext</span>(<span class="hljs-literal">null</span>);

<span class="hljs-keyword">export</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">tasksReducer</span>(<span class="hljs-params">tasks, action</span>) {
  <span class="hljs-keyword">switch</span> (action.<span class="hljs-property">type</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;added&#x27;</span>:
      <span class="hljs-keyword">return</span> [...tasks, { <span class="hljs-attr">id</span>: action.<span class="hljs-property">id</span>, <span class="hljs-attr">title</span>: action.<span class="hljs-property">title</span>, <span class="hljs-attr">done</span>: <span class="hljs-literal">false</span> }];
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;toggled&#x27;</span>:
      <span class="hljs-keyword">return</span> tasks.<span class="hljs-title function_">map</span>(<span class="hljs-function"><span class="hljs-params">task</span> =&gt;</span> task.<span class="hljs-property">id</span> === action.<span class="hljs-property">id</span> ? { ...task, <span class="hljs-attr">done</span>: !task.<span class="hljs-property">done</span> } : task);
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;removed&#x27;</span>:
      <span class="hljs-keyword">return</span> tasks.<span class="hljs-title function_">filter</span>(<span class="hljs-function"><span class="hljs-params">task</span> =&gt;</span> task.<span class="hljs-property">id</span> !== action.<span class="hljs-property">id</span>);
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未知任务动作：<span class="hljs-subst">\${action.type}</span>\`</span>);
  }
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">TasksProvider</span>(<span class="hljs-params">{ children }</span>) {
  <span class="hljs-keyword">const</span> [tasks, dispatch] = <span class="hljs-title function_">useReducer</span>(tasksReducer, []);
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">TasksContext.Provider</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{tasks}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">TasksDispatchContext.Provider</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{dispatch}</span>&gt;</span>
        {children}
      <span class="hljs-tag">&lt;/<span class="hljs-name">TasksDispatchContext.Provider</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">TasksContext.Provider</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">useTasks</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> tasks = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">TasksContext</span>);
  <span class="hljs-keyword">if</span> (tasks === <span class="hljs-literal">null</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务组件需要 TasksProvider&#x27;</span>);
  <span class="hljs-keyword">return</span> tasks;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">useTasksDispatch</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> dispatch = <span class="hljs-title function_">useContext</span>(<span class="hljs-title class_">TasksDispatchContext</span>);
  <span class="hljs-keyword">if</span> (dispatch === <span class="hljs-literal">null</span>) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;任务组件需要 TasksProvider&#x27;</span>);
  <span class="hljs-keyword">return</span> dispatch;
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">AddTask</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [title, setTitle] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> dispatch = <span class="hljs-title function_">useTasksDispatch</span>();

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">submit</span>(<span class="hljs-params">event</span>) {
    event.<span class="hljs-title function_">preventDefault</span>();
    <span class="hljs-keyword">if</span> (!title.<span class="hljs-title function_">trim</span>()) <span class="hljs-keyword">return</span>;
    <span class="hljs-title function_">dispatch</span>({ <span class="hljs-attr">type</span>: <span class="hljs-string">&#x27;added&#x27;</span>, <span class="hljs-attr">id</span>: crypto.<span class="hljs-title function_">randomUUID</span>(), <span class="hljs-attr">title</span>: title.<span class="hljs-title function_">trim</span>() });
    <span class="hljs-title function_">setTitle</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">onSubmit</span>=<span class="hljs-string">{submit}</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>任务名称<span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">value</span>=<span class="hljs-string">{title}</span> <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setTitle(event.target.value)} /&gt;<span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;submit&quot;</span>&gt;</span>添加任务<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">TaskList</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> tasks = <span class="hljs-title function_">useTasks</span>();
  <span class="hljs-keyword">const</span> dispatch = <span class="hljs-title function_">useTasksDispatch</span>();
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
      {tasks.map(task =&gt; (
        <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{task.id}</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
            <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">checked</span>=<span class="hljs-string">{task.done}</span>
              <span class="hljs-attr">onChange</span>=<span class="hljs-string">{()</span> =&gt;</span> dispatch({ type: &#x27;toggled&#x27;, id: task.id })} /&gt;
            {task.title}
          <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
          <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{()</span> =&gt;</span> dispatch({ type: &#x27;removed&#x27;, id: task.id })}&gt;删除<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
        <span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
      ))}
    <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span></span>
  );
}

<span class="hljs-keyword">function</span> <span class="hljs-title function_">TaskSummary</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> tasks = <span class="hljs-title function_">useTasks</span>();
  <span class="hljs-keyword">return</span> <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>共 {tasks.length} 项，完成 {tasks.filter(task =&gt; task.done).length} 项<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span></span>;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">TasksApp</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">TasksProvider</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">AddTask</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">TaskSummary</span> /&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">TaskList</span> /&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">TasksProvider</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>任务名称的编辑草稿只属于 AddTask，因此仍放在局部 state。正式任务列表属于多个组件共同使用的状态，放在共同 Provider 中。完成数量能从 tasks 推导出来，就不再存一份需要手动保持一致的 count。</p>
<p>动作把新增、切换与删除的意图集中表达。ID 在用户提交的事件处理器里生成，reducer 只根据输入返回结果，不读取随机数、不发请求，也不修改原数组。</p>
<h3>reducer 是下一状态的计算器</h3>
<p>dispatch 把动作交给 React，reducer 计算下一状态。它不会同步改掉当前处理器中已经捕获的 tasks，也不返回一个等待渲染完成的 Promise。</p>
<p>返回下一状态时要保持完整契约。对象状态不能只返回一个零散字段就期待自动浅合并；数组中未修改的项可以共享引用，修改的项则建立新对象。直接 push 原数组再返回原引用，会破坏状态快照和更新判断。</p>
<p>开发检查可能再次调用 reducer 或初始化逻辑，因此它必须保持纯粹。需要服务端保存时，应在合适的事件、数据层或 Effect 中执行，再把结果转换成明确动作，而不是在 reducer 内直接产生副作用。</p>
<h3>Context 传递的是值，不是自动存储系统</h3>
<p>useContext 读取组件上方最近的对应 Provider。没有 Provider 时才使用 createContext 的默认值；Provider 明确传入 undefined，不会自动改用默认值。</p>
<p>例子用 null 作为缺少 Provider 的信号，让错误更早出现。也可以为主题等场景提供真正合理的默认值，但不应该用一个假的空 dispatch 掩盖 Provider 配置遗漏。</p>
<p>Provider 位于哪里，就决定这份状态能活多久、谁能共享。两个独立 TasksProvider 会有两份任务列表；Provider 卸载后，本地 reducer 状态也不会只因为使用了 Context 就永久保存。</p>
<h3>Context 更新与普通父级更新要分别理解</h3>
<p>Provider 的 value 通过 Object.is 比较。值发生变化时，读取这个 Context 的消费者需要接收新值，memo 不能阻止它们获得更新的 Context。</p>
<p>把所有状态塞进一个巨大 value 对象，会让只需要一小部分数据的消费者也受到这个 Context 的变化影响。每次渲染都创建新的对象 value，也可能造成不必要的身份变化。可以按职责与变化频率拆分，或者在确有需要时稳定值的引用。</p>
<p>示例把 tasks 与 dispatch 分成两个 Context。dispatch 身份稳定，只派发动作的组件不必订阅 tasks Context 的变化；但这不保证它永远不会因父组件、自己的 state 或其他依赖而渲染。拆分减少的是一类通知来源，不是万能的渲染屏障。</p>
<h3>什么情况下不必使用这套组合</h3>
<p>只有一两个直接子组件需要的状态，普通 props 通常更清楚。仅为了减少一层传参就引入多个 Context，会增加隐含依赖与测试准备成本。</p>
<p>服务端请求缓存涉及失效、去重、重试和后台刷新；跨标签页同步需要通信和冲突处理；高频外部数据可能需要更细粒度订阅。这些并不由 Context 或 useReducer 自动实现，专门的数据层或外部 store 可能更合适。</p>
<p>选择前先确定数据属于谁、谁需要读取、谁可以发起变化、何时清理或持久化。Context 负责把这份关系提供出去，reducer 负责让更新规则可解释；二者都应服务这个边界，而不是把所有状态一概提升成全局状态。</p>
<p>补充参考：<a href="https://react.dev/reference/react/useContext">React · useContext</a>、<a href="https://react.dev/reference/react/useReducer">React · useReducer</a>。</p>`};export{e as default};