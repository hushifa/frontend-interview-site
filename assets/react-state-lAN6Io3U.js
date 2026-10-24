var e={answerHtml:`<p>一次渲染中的状态是快照。调用状态更新函数会请求后续渲染，不会修改当前闭包里的变量。React 会在适当时机批处理更新。</p>
<div class="not-prose code-block"><div class="code-language">JSX</div><pre><code class="hljs language-jsx"><span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-title function_">setCount</span>(<span class="hljs-function"><span class="hljs-params">c</span> =&gt;</span> c + <span class="hljs-number">1</span>);
<span class="hljs-comment">// 连续应用更新函数，增加 3</span>
</code></pre></div>
<p>如果连续三次执行 <code>setCount(count + 1)</code>，这三次读取的是同一个渲染快照，通常只增加 1。新状态依赖前一个状态时，使用函数式更新。</p>`};export{e as default};