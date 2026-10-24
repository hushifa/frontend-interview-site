var e={answerHtml:`<p>一次渲染中的状态是快照。调用状态更新函数会请求后续渲染，不会修改当前闭包里的变量。React 会在适当时机批处理更新。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-comment">// 连续应用更新函数，增加 3</span>
</code></pre></div>
<p>如果连续三次执行 <code>setCount(count + 1)</code>，这三次读取的是同一个渲染快照，通常只增加 1。新状态依赖前一个状态时，使用函数式更新。</p>
<p>React 可能批处理同一事件中的多次更新，因此不能把 setter 当成同步赋值函数。Effect、定时器和事件回调还可能捕获旧闭包；需要读取最新值时，应重新设计依赖、使用函数式更新或使用 ref 保存不参与渲染的状态。</p>
<p>状态放在哪里也很重要：组件临时状态、表单草稿、服务器缓存和跨页面状态应分别考虑生命周期。更新对象时要保持不可变语义，避免直接修改后仍传入相同引用，导致依赖比较和子组件优化失效。</p>`};export{e as default};