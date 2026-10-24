var e={answerHtml:`<p>一次渲染中的状态是快照。组件函数执行时，<code>count</code> 是这一轮渲染看到的值；调用状态更新函数只是把“下一轮应该使用什么状态”提交给 React，不会修改当前闭包里的变量。React 会在适当时机合并更新，再用新状态重新调用组件。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-comment">// 连续应用更新函数，增加 3</span>
</code></pre></div>
<p>如果连续三次执行 <code>setCount(count + 1)</code>，这三次读取的是同一个渲染快照，通常只增加 1。新状态依赖前一个状态时，使用函数式更新。</p>
<p>React 可能批处理同一事件中的多次更新，因此不能把 setter 当成同步赋值函数。Effect、定时器和事件回调还可能捕获创建它们时的旧闭包；需要读取最新值时，应重新设计依赖、使用函数式更新，或者用 ref 保存不参与渲染但需要持续读取的值。</p>
<p>状态放在哪里也很重要：组件临时状态、表单草稿、服务器缓存和跨页面状态应分别考虑生命周期。更新对象时要保持不可变语义，避免直接修改后仍传入相同引用，导致依赖比较和子组件优化失效。</p>
<p>例如点击按钮时，下面的三次调用通常都读取同一个快照：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(count + <span class="hljs-number">1</span>);
</code></pre></div>
<p>它们都在表达“把 count 设置成同一个新值”。函数式更新则把每次更新连接起来，React 会依次把上一次结果传给下一次：</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">current</span> =&gt;</span> current + <span class="hljs-number">1</span>);
</code></pre></div>
<p>实际设计时先确定状态的唯一来源，再决定是局部状态、Context、外部 store 还是服务端数据。把服务端数据、用户输入和派生显示值分开，清理订阅、请求和定时器；否则即使单次点击结果正确，重新渲染或快速连续操作仍可能出现重复请求和过期结果。</p>`};export{e as default};