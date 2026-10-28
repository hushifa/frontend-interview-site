var e={answerHtml:`<h2>简答</h2>
<ul>
<li>签名：<code>const [optimisticState, addOptimistic] = useOptimistic(state, updateFn)</code>，<code>updateFn(currentState, optimisticValue)</code> 计算临时状态。</li>
<li><code>addOptimistic</code> 必须在 Action 或 <code>startTransition</code> 里调用，临时状态只在这次 Action 进行期间存在。</li>
<li>Action 结束后 React 丢弃临时状态，显示传入的 <code>state</code>。所以成功时必须把真实结果写进 <code>state</code>，否则界面会回退。</li>
<li>失败时不需要手动回滚，临时状态自动消失；只需提示错误。</li>
<li>适合点赞、发送消息这类成功率高、失败可以撤回的操作；涉及支付、库存等操作仍应等服务端确认。</li>
</ul>
<h2>发送消息</h2>
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
<ul>
<li>点击发送后，消息立即以半透明显示。</li>
<li>成功：<code>setMessages</code> 写入服务端返回的消息，Action 结束后临时消息被替换为真实消息。</li>
<li>失败：Action 结束，临时消息自动消失，显示错误提示。</li>
<li><code>await</code> 之后的 <code>setMessages</code> 需要再包一层 <code>startTransition</code>，这是目前 Action 中 await 之后更新状态的要求。</li>
</ul>
<h2>注意点</h2>
<ul>
<li>临时条目的 <code>id</code> 和真实 <code>id</code> 不同，用作 <code>key</code> 时，成功后该行会重新挂载。需要保留行内状态时，可以由客户端生成 ID 一起提交给服务端。</li>
<li>多个请求并发时，每个 <code>addOptimistic</code> 都叠加在最新的真实状态上。</li>
<li>乐观更新只是显示策略，服务端仍要做校验、幂等和冲突处理。</li>
</ul>
<h2>常见追问</h2>
<ul>
<li>和手动 <code>setState</code> 再回滚相比有什么好处？不需要自己记录旧值和写回滚逻辑，也不会出现回滚覆盖了期间其他更新的问题。</li>
<li>能在表单之外使用吗？可以，只要在 <code>startTransition</code> 中调用。</li>
</ul>`};export{e as default};