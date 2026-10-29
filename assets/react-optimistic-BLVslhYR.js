var e={answerHtml:`<h2>简答</h2>
<blockquote>
<p>发消息、点赞这种操作，如果等服务器返回才显示，用户会觉得卡。乐观更新的意思是先假定会成功，立刻把结果显示出来。<code>useOptimistic(state, updateFn)</code> 就是做这个的，它返回一个用来显示的 <code>optimisticState</code> 和一个 <code>addOptimistic</code> 函数。</p>
<p>调用 <code>addOptimistic(value)</code> 时，React 用 <code>updateFn(currentState, value)</code> 算出临时状态，叠在真实的 <code>state</code> 上显示。这个临时状态只在当前这次 Action 进行期间存在。Action 一结束，React 就把它丢掉，重新显示传进来的 <code>state</code>。</p>
<p>所以收敛的方式很简单：成功时把真实结果写进 <code>state</code>，临时状态消失后正好被真实数据替换；失败时什么都不用回滚，临时状态自己就没了，只需提示错误。</p>
<p>要注意，<code>addOptimistic</code> 必须在 Action 或 <code>startTransition</code> 里调用。它适合成功率高、失败可以撤回的操作，支付、扣库存这类还是应该等服务端确认。</p>
</blockquote>
<h2>先看一个发消息的例子</h2>
<p>下面的聊天框点了发送，消息会立刻以半透明显示，等服务器返回后变成正常的消息。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-keyword">import</span> { useOptimistic, useState, startTransition } <span class="hljs-keyword">from</span> <span class="hljs-string">&#x27;react&#x27;</span>;

<span class="hljs-keyword">export</span> <span class="hljs-keyword">default</span> <span class="hljs-keyword">function</span> <span class="hljs-title function_">Chat</span>(<span class="hljs-params">{ initialMessages }</span>) {
  <span class="hljs-keyword">const</span> [messages, setMessages] = <span class="hljs-title function_">useState</span>(initialMessages);
  <span class="hljs-keyword">const</span> [error, setError] = <span class="hljs-title function_">useState</span>(<span class="hljs-string">&#x27;&#x27;</span>);
  <span class="hljs-keyword">const</span> [optimisticMessages, addOptimistic] = <span class="hljs-title function_">useOptimistic</span>(
    messages,
    <span class="hljs-function">(<span class="hljs-params">current, text</span>) =&gt;</span> [...current, { <span class="hljs-attr">id</span>: <span class="hljs-string">\`temp-<span class="hljs-subst">\${<span class="hljs-built_in">Date</span>.now()}</span>\`</span>, text, <span class="hljs-attr">sending</span>: <span class="hljs-literal">true</span> }],
  );

  <span class="hljs-keyword">function</span> <span class="hljs-title function_">send</span>(<span class="hljs-params">formData</span>) {
    <span class="hljs-keyword">const</span> text = <span class="hljs-title class_">String</span>(formData.<span class="hljs-title function_">get</span>(<span class="hljs-string">&#x27;text&#x27;</span>));
    <span class="hljs-title function_">setError</span>(<span class="hljs-string">&#x27;&#x27;</span>);
    <span class="hljs-title function_">startTransition</span>(<span class="hljs-title function_">async</span> () =&gt; {
      <span class="hljs-title function_">addOptimistic</span>(text);
      <span class="hljs-keyword">try</span> {
        <span class="hljs-keyword">const</span> saved = <span class="hljs-keyword">await</span> <span class="hljs-title function_">postMessage</span>(text); <span class="hljs-comment">// 返回 { id, text }</span>
        <span class="hljs-title function_">startTransition</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-title function_">setMessages</span>(<span class="hljs-function">(<span class="hljs-params">list</span>) =&gt;</span> [...list, saved]));
      } <span class="hljs-keyword">catch</span> {
        <span class="hljs-title function_">setError</span>(<span class="hljs-string">&#x27;发送失败，请重试&#x27;</span>);
      }
    });
  }

  <span class="hljs-keyword">return</span> (
    <span class="xml"><span class="hljs-tag">&lt;&gt;</span>
      <span class="hljs-tag">&lt;<span class="hljs-name">ul</span>&gt;</span>
        {optimisticMessages.map((m) =&gt; (
          <span class="hljs-tag">&lt;<span class="hljs-name">li</span> <span class="hljs-attr">key</span>=<span class="hljs-string">{m.id}</span> <span class="hljs-attr">style</span>=<span class="hljs-string">{{</span> <span class="hljs-attr">opacity:</span> <span class="hljs-attr">m.sending</span> ? <span class="hljs-attr">0.5</span> <span class="hljs-attr">:</span> <span class="hljs-attr">1</span> }}&gt;</span>{m.text}<span class="hljs-tag">&lt;/<span class="hljs-name">li</span>&gt;</span>
        ))}
      <span class="hljs-tag">&lt;/<span class="hljs-name">ul</span>&gt;</span>
      {error &amp;&amp; <span class="hljs-tag">&lt;<span class="hljs-name">p</span> <span class="hljs-attr">role</span>=<span class="hljs-string">&quot;alert&quot;</span>&gt;</span>{error}<span class="hljs-tag">&lt;/<span class="hljs-name">p</span>&gt;</span>}
      <span class="hljs-tag">&lt;<span class="hljs-name">form</span> <span class="hljs-attr">action</span>=<span class="hljs-string">{send}</span>&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">input</span> <span class="hljs-attr">name</span>=<span class="hljs-string">&quot;text&quot;</span> <span class="hljs-attr">required</span> /&gt;</span>
        <span class="hljs-tag">&lt;<span class="hljs-name">button</span>&gt;</span>发送<span class="hljs-tag">&lt;/<span class="hljs-name">button</span>&gt;</span>
      <span class="hljs-tag">&lt;/<span class="hljs-name">form</span>&gt;</span>
    <span class="hljs-tag">&lt;/&gt;</span></span>
  );
}
</code></pre></div>
<p>页面上显示的是 <code>optimisticMessages</code>，不是 <code>messages</code>。点发送后，<code>addOptimistic(text)</code> 让列表末尾多出一条 <code>sending: true</code> 的临时消息。</p>
<p>成功的话，<code>setMessages</code> 把服务器返回的消息写进真实状态。Action 结束时临时消息被丢掉，列表里留下的是真实那条，看起来就是“半透明变成了不透明”。</p>
<p>失败的话，没有人改 <code>messages</code>。Action 结束，临时消息消失，列表回到发送前的样子，再显示错误提示。</p>
<p>注意 <code>await</code> 之后的 <code>setMessages</code> 又包了一层 <code>startTransition</code>。这是目前的要求：Action 里 <code>await</code> 之后的状态更新，要再包一次才会算在这个 Transition 里。</p>
<h2>为什么成功了也必须更新真实状态</h2>
<p>很多人第一次用会漏掉 <code>setMessages</code>，结果消息先出现，过一会儿又消失了。</p>
<p>原因是临时状态只活到 Action 结束。它从来没有写进 <code>messages</code>，Action 一结束，React 显示的就是没变过的 <code>messages</code>。所以 <code>useOptimistic</code> 只负责“等待期间显示什么”，真正的数据还得你自己存。</p>
<h2>还有哪些细节要注意</h2>
<p>临时消息的 <code>id</code> 是 <code>temp-...</code>，真实消息的 <code>id</code> 是服务器给的，两者不同。用它当 <code>key</code> 时，成功后这一行会被重新挂载。如果这一行有自己的状态要保留，可以由客户端生成 ID，一起提交给服务器使用。</p>
<p>几个请求同时进行时，每个 <code>addOptimistic</code> 都叠加在最新的真实状态上，不会互相覆盖。</p>
<p>乐观更新只是一种显示策略。服务端照样要做校验、幂等和冲突处理。</p>
<h2>常见追问</h2>
<p><strong>跟自己 <code>setState</code> 再手动回滚比，好在哪里？</strong></p>
<blockquote>
<p>不用自己记旧值、写回滚逻辑。手动回滚还可能把这期间别的更新也一起覆盖掉，<code>useOptimistic</code> 没有这个问题，因为临时状态始终是叠在真实状态上的。</p>
</blockquote>
<p><strong>能在表单之外用吗？</strong></p>
<blockquote>
<p>可以，只要在 <code>startTransition</code> 里调用 <code>addOptimistic</code> 就行。</p>
</blockquote>`};export{e as default};