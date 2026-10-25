var e={answerHtml:`<p>用户点击收藏后，可以先让按钮呈现正在收藏的样子，而不必等网络全部完成才给予反馈。但这时有两种状态：暂时希望达到的状态，以及已经确认成功的状态。</p>
<p>useOptimistic 让这两层关系更容易表达。它在 Action 期间提供临时视图，Action 结束后再根据传给 Hook 的确认值收敛；它并不替应用执行真正保存，也不会把临时结果自动变成持久数据。</p>
<h3>用可失败的本地演示观察收敛过程</h3>
<p>下面通过延迟模拟保存，没有服务器请求。勾选失败选项后，可以观察乐观状态如何回退。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useOptimistic, useState, useTransition } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">async</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">simulateSave</span>(<span class="hljs-params">value, shouldFail</span>) {
  <span class="hljs-keyword">await</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Promise</span>(<span class="hljs-function"><span class="hljs-params">resolve</span> =&gt;</span> <span class="hljs-built_in">setTimeout</span>(resolve, <span class="hljs-number">300</span>));
  <span class="hljs-keyword">if</span> (shouldFail) <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">&#x27;模拟保存失败，请重试。&#x27;</span>);
  <span class="hljs-keyword">return</span> value;
}

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">FavoriteDemo</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">const</span> [confirmed, setConfirmed] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-keyword">const</span> [simulateFailure, setSimulateFailure] = <span class="hljs-title function_">useState</span>(<span class="hljs-literal">false</span>);
  <span class="hljs-keyword">const</span> [error, setError] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [isPending, startTransition] = <span class="hljs-title function_">useTransition</span>();
  <span class="hljs-keyword">const</span> [optimistic, setOptimistic] = <span class="hljs-title function_">useOptimistic</span>(confirmed, <span class="hljs-function">(<span class="hljs-params">_current, next</span>) =&gt;</span> next);

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">changeFavorite</span>(<span class="hljs-params"></span>) {
    <span class="hljs-keyword">const</span> next = !confirmed;
    <span class="hljs-title function_">startTransition</span>(<span class="hljs-title function_">async</span> () =&gt; {
      <span class="hljs-title function_">setError</span>(<span class="hljs-string">&#x27;&#x27;</span>);
      <span class="hljs-title function_">setOptimistic</span>(next);
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> saved = <span class="hljs-keyword">await</span> <span class="hljs-title function_">simulateSave</span>(next, simulateFailure);
        <span class="hljs-title function_">startTransition</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setConfirmed</span>(saved));
      } <span class="hljs-keyword">catch</span> (failure) {
        <span class="hljs-title function_">setError</span>(failure <span class="hljs-keyword">instanceof</span> <span class="hljs-title class_">Error</span> ? failure.<span class="hljs-property">message</span> : <span class="hljs-string">&#x27;保存失败&#x27;</span>);
      }
    });
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;<span class="hljs-name">section</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">label</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;checkbox&quot;</span> <span class="hljs-attr">checked</span>=<span class="hljs-string">{simulateFailure}</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{isPending}</span>
          <span class="hljs-attr">onChange</span>=<span class="hljs-string">{event</span> =&gt;</span> setSimulateFailure(event.target.checked)} /&gt;
        模拟失败
      <span class="hljs-tag">&lt;/<span class="hljs-name">label</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">button</span> <span class="hljs-attr">type</span>=<span class="hljs-string">&quot;button&quot;</span> <span class="hljs-attr">aria-pressed</span>=<span class="hljs-string">{optimistic}</span> <span class="hljs-attr">disabled</span>=<span class="hljs-string">{isPending}</span> <span class="hljs-attr">onClick</span>=<span class="hljs-string">{changeFavorite}</span>&gt;</span>
        {isPending ? (optimistic ? &#x27;正在收藏&#x27; : &#x27;正在取消&#x27;) : (optimistic ? &#x27;已收藏&#x27; : &#x27;收藏&#x27;)}
      <span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">p</span>&gt;</span>已确认状态：{confirmed ? &#x27;已收藏&#x27; : &#x27;未收藏&#x27;}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>
      {error &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>{error}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
    <span class="hljs-tag">&lt;/<span class="hljs-name">section</span>&gt;</span></span>
  );
}
</code></pre></div>
<p>初始确认值为 false。点击后，乐观值先变成 true，按钮明确显示“正在收藏”，而确认值仍是 false。成功后更新 confirmed，Action 完成时临时层撤下，真实值已经是 true，所以界面不会跳回未收藏。</p>
<p>失败时没有写入新的确认值，Action 结束后展示回到原确认状态，并显示错误。这里只针对一次正在处理的切换禁用按钮，避免把并发冲突问题混进最小例子。</p>
<h3>为什么必须更新真实数据</h3>
<p>如果只调用 setOptimistic，却在成功后不更新 confirmed 或其他真实数据来源，那么 Action 完成后 Hook 仍会回到旧确认值。用户会看到“刚变成收藏，马上又恢复”，这不是 Hook 丢失了成功结果，而是应用从未提交那份结果。</p>
<p>确认数据可以来自本地 state，也可以来自框架刷新后的服务端数据或外部缓存。关键是明确谁拥有最终事实，以及结果何时进入那份数据来源。</p>
<p>示例在 await 之后再次使用 startTransition 标记确认状态更新，遵循当前 Transition 对异步边界后更新的要求。它不是再发一次保存请求，而是标记这次 React 状态更新。</p>
<h3>reducer 合成临时状态时必须保持纯粹</h3>
<p>useOptimistic 可以使用 reducer 根据当前基础状态与本次乐观载荷计算临时状态。本例只切换布尔值，所以直接返回 next；列表增加、删除或编辑则可能需要按 ID 合并。</p>
<p>reducer 不应发送请求、生成随机 ID、修改传入数组或写外部对象。基础值变化时，React 可能需要在新的基础上重新应用相应乐观更新，依赖旧闭包或产生副作用会让重算结果不可靠。</p>
<p>当前 API 也支持省略 reducer 的相应设置形式，但应按项目实际 React 版本使用。两种写法都不改变“临时层最终依赖基础值”的原则。</p>
<h3>更新必须属于相应的 Action 生命周期</h3>
<p>乐观更新应在 Action 或 Transition 中触发，而不是渲染期间或任意脱离上下文的回调里调用。React 需要知道这份临时更新关联的工作何时结束，才能正确收敛。</p>
<p>useOptimistic 本身不返回一个通用的 pending 状态。示例使用 useTransition 跟踪这次动作，表单场景也可以结合相应的 Action 和提交状态接口。</p>
<p>如果 Action 启动工作后立刻返回，却没有等待真正的异步过程，临时状态也可能过早结束。不要把一个长任务藏到没有返回的 Promise 里，再期待框架自动知道它尚未完成。</p>
<h3>失败恢复不只是把一个数字改回去</h3>
<p>消息列表中，失败后可能需要保留输入草稿、标明失败消息并提供重试，而不是静默删除一条刚显示的内容。收藏切换可以回到原值，但也应让用户知道没有保存成功。</p>
<p>临时记录通常需要稳定的客户端标识，以便与服务器返回的真实记录关联。否则成功刷新数据后，可能出现临时项与真实项同时存在、顺序错乱或重复追加。</p>
<p>如果允许多个动作同时进行，还需要判断基础值变化时怎样合并、旧响应是否还能覆盖新结果，以及重试是否会重复执行。useOptimistic 不自动提供幂等键、冲突解决或离线同步协议。</p>
<h3>乐观界面不等于业务已经完成</h3>
<p>适合快速反馈且失败可解释、可恢复的操作，可以考虑乐观更新。对于付款、权限改变或库存确认等场景，更应明确“处理中”与“已确认”，不能把尚未得到保证的结果直接当作最终事实。</p>
<p>即使界面回滚了，已经到达服务器的操作也不一定被撤销。网络超时、客户端取消和服务器成功之间可能存在不确定性，需要查询状态或依靠后端协议解决。</p>
<p>设计时先确定基础数据、临时载荷、成功提交、失败反馈四个环节。它们都清楚后，useOptimistic 才能改善反馈速度，而不会把一个不一致的数据流程藏在更快的动画后面。</p>`};export{e as default};