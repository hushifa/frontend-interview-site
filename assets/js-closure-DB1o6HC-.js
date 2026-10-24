var e={answerHtml:`<p>闭包是函数与其创建时的词法环境的组合。函数在外部执行时，仍然可以访问定义位置的变量。</p>
<div class="not-prose code-block"><div class="code-language">JavaScript</div><pre><code class="hljs language-js"><span class="hljs-keyword">function</span> <span class="hljs-title function_">createCounter</span>(<span class="hljs-params"></span>) {
  <span class="hljs-keyword">let</span> count = <span class="hljs-number">0</span>;
  <span class="hljs-keyword">return</span> <span class="hljs-function">() =&gt;</span> ++count;
}
<span class="hljs-keyword">const</span> next = <span class="hljs-title function_">createCounter</span>();
<span class="hljs-title function_">next</span>(); <span class="hljs-comment">// 输出：1</span>
<span class="hljs-title function_">next</span>(); <span class="hljs-comment">// 输出：2</span>
</code></pre></div>
<p><strong>常见应用</strong>：封装私有状态、函数柯里化，以及保存回调所需的上下文。</p>
<p><strong>面试追问</strong>：闭包不会必然导致内存泄漏；问题是长期存活的回调可能使其捕获的对象持续可达。应及时移除无用的事件监听、计时器和订阅。</p>`};export{e as default};