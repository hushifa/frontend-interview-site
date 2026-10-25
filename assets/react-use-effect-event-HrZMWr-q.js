var e={answerHtml:`<p>一个 Effect 订阅窗口变化，订阅是否存在由 enabled 决定；回调发生时，又需要使用最新的 label 写一条记录。label 改变并不意味着应该重建窗口监听，但长期保存普通旧回调又可能读到旧 label。</p>
<p>useEffectEvent 用来表达这种区别：外部同步关系有自己的依赖，事件发生时需要读取的最新值不一定都应该成为重建关系的原因。</p>
<h3>保留监听，同时在事件发生时读取最新标签</h3>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useEffect, useEffectEvent, useState } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">ResizeRecord</span>(<span class="hljs-params">{ label, enabled = <span class="hljs-literal">true</span> }</span>) {
  <span class="hljs-keyword">const</span> [lastRecord, setLastRecord] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;尚无记录&#x27;</span>);

  <span class="hljs-keyword">const</span> onResize = <span class="hljs-title function_">useEffectEvent</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-title function_">setLastRecord</span>(<span class="hljs-string">\`<span class="hljs-subst">\${label}</span>:<span class="hljs-subst">\${<span class="hljs-variable language_">window</span>.innerWidth}</span>\`</span>);
  });

  <span class="hljs-title function_">useEffect</span>(<span class="hljs-function">() =&gt;</span> {
    <span class="hljs-keyword">if</span> (!enabled) <span class="hljs-keyword">return</span>;
    <span class="hljs-keyword">function</span> <span class="hljs-title function_">handleResize</span>(<span class="hljs-params"></span>) {
      <span class="hljs-title function_">onResize</span>();
    }
    <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">addEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, handleResize);
    <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">window</span>.<span class="hljs-title function_">removeEventListener</span>(<span class="hljs-string">&#x27;resize&#x27;</span>, handleResize);
  }, [enabled]);

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>当前标签：{label}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">output</span> <span class="hljs-attr">aria-label</span>=<span class="hljs-string">&quot;最后一次尺寸记录&quot;</span>&gt;</span>{lastRecord}<span class="hljs-tag">&lt;/<span class="hljs-name">output</span>&gt;</span>
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>enabled 为 true 时建立监听，为 false 时清理。label 变化后，界面可以显示新标签，但不会仅因 label 改变重新注册这份监听；下一次 resize 到来，Effect Event 使用最新标签记录尺寸。</p>
<p>lastRecord 保存的是上一次事件发生时生成的记录，因此改变 label 不会立刻改写历史记录。这正是“事件时读取”与“依赖变化后重新同步”的区别，而不是漏掉了一次更新。</p>
<h3>为什么普通闭包和 useCallback 不能直接替代</h3>
<p>如果把读取 label 的普通回调永久留在空依赖 Effect 中，它会保留创建时的渲染环境，可能一直记录旧标签。把 label 加进依赖可以让它更新，但代价是重新建立订阅，这是否合理取决于外部系统。</p>
<p>useCallback 只缓存函数身份，仍然按依赖保存相应闭包。空依赖不会让函数自动读取最新状态，有 label 依赖则会在 label 改变时生成新的函数身份，也不等于这题所表达的分离方式。</p>
<p>Effect Event 则专门服务 Effect 内的事件逻辑。它不是通用缓存函数，也不应把返回函数的身份当作长期稳定的性能契约。</p>
<h3>哪些值仍然必须放在 Effect 依赖中</h3>
<p>如果 roomId 改变意味着要离开旧聊天室、连接新聊天室，roomId 就是外部连接的真实同步条件。把它藏到 Effect Event 中，然后继续保留旧连接，会得到逻辑错误，即使通知文字能读到最新 roomId 也没有用。</p>
<p>类似地，订阅对象、启用状态、请求地址或真正影响外部配置的值，都应根据实际关系决定是否重新同步。Effect Event 不能用来绕过依赖 lint 规则，也不会证明原先的依赖是不必要的。</p>
<p>一个 Effect 混合了多种不同生命周期时，优先考虑拆分 Effect，把各自需要的依赖与清理讲清楚，再决定是否存在适合提取的事件逻辑。</p>
<h3>调用范围是这个 API 的重要限制</h3>
<p>Effect Event 应从 Effect 逻辑调用，包括由相应 Effect 建立的监听器或计时器回调。不能在渲染期间执行，也不应把它直接用作普通 UI 的 onClick 处理器，或传给其他组件、其他 Hook 当成通用回调。</p>
<p>在自定义 Hook 中使用时，也应让它留在管理该 Effect 的局部逻辑内。给用户交互的回调需要普通事件处理器或其他恰当设计，而不是因为“能读最新值”就统一替换成 Effect Event。</p>
<p>官方 Hooks lint 规则可以帮助检查这些使用边界。项目还需要实际安装支持 useEffectEvent 的 React 版本与匹配工具，不是加一个同名函数或把旧代码断言过去就具有相同语义。</p>
<h3>为什么依赖数组中不写 onResize</h3>
<p>Effect Event 按设计属于非响应式的事件逻辑，不应该列入外层 Effect 的依赖数组。这里应让 React 和配套规则按该 API 的语义处理，而不是因为一般函数经常要写进依赖，就机械添加它。</p>
<p>这条特殊规则不适用于所有名字叫 onResize 的普通函数。普通组件内函数的依赖关系仍需要正常分析，不能靠变量名或人为注释获得同样行为。</p>
<h3>最新值也不替代任务身份和清理</h3>
<p>回调调用时使用最新渲染值，不代表所有已经发出的异步操作都变成最新任务。旧请求晚到、多个事件并发或用户已经离开页面，仍然需要取消、请求标识或生命周期检查。</p>
<p>异步函数一旦开始执行，也有自己的局部值和等待过程；不要把“调用时读取最新值”理解成它在任意 await 之后自动重新定义所有已经计算过的变量。</p>
<p>示例仍然返回 removeEventListener 清理函数。Effect Event 不会帮你自动移除监听或停止计时器，也不改变后台事件的调度规律。</p>
<h3>先确定是不是 Effect 的问题</h3>
<p>用户点击保存时提交当前表单，通常直接在事件处理器中使用对应状态即可。仅根据 props 计算显示内容，则在渲染中计算。只有确实在维护外部同步关系、又需要把部分事件读取从重建条件中分离时，Effect Event 才体现出价值。</p>
<p>判断标准可以很具体：这个值变化时，外部连接是否应该重建？还是只要求下一次外部事件发生时采用新值？先回答这个问题，比把 useEffectEvent 当成“消除依赖数组的工具”更可靠。</p>`};export{e as default};