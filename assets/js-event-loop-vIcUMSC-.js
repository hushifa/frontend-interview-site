var e={answerHtml:`<p>在常见的浏览器场景中，先执行当前任务中的同步代码。到达微任务检查点后，清空微任务队列，包括处理中新增的微任务。浏览器之后有机会更新渲染，再处理后续任务。渲染并不保证发生在每个任务之后。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&quot;A&quot;</span>);
<span class="hljs-built_in">setTimeout</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&quot;B&quot;</span>), <span class="hljs-number">0</span>);
<span class="hljs-title class_">Promise</span>.<span class="hljs-title function_">resolve</span>().<span class="hljs-title function_">then</span>(<span class="hljs-function">() =&gt;</span> <span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&quot;C&quot;</span>));
<span class="hljs-variable language_">console</span>.<span class="hljs-title function_">log</span>(<span class="hljs-string">&quot;D&quot;</span>);
<span class="hljs-comment">// 输出顺序：A → D → C → B</span>
</code></pre></div>
<p><code>setTimeout(fn, 0)</code> 表示满足延迟后可以调度，无法保证立即执行。持续递归排入微任务可能阻塞渲染。Node.js 的调度阶段与浏览器不同，需要分场景讨论。</p>
<h3>推导路径</h3>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>`};export{e as default};