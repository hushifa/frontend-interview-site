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
<p><strong>面试追问</strong>：闭包不会必然导致内存泄漏；问题是长期存活的回调可能使其捕获的对象持续可达。应及时移除无用的事件监听、计时器和订阅。</p>
<p>理解这类问题时，可以把过程拆成表达式求值、函数调用、任务排队和副作用清理四步。先写一个只包含关键变量的最小例子，再逐步加入闭包、异常或异步操作，能更容易看出结果是在哪一步产生的。</p>
<p>如果几个写法都能得到同样输出，还要比较可读性、执行时机、内存占用和取消方式。涉及 Promise、事件或资源时，完成结果和清理结果要分别验证。</p>
<p>实际项目里，搜索框、定时器、事件监听和请求经常同时存在。先写出每一步的触发顺序，再决定在哪里更新状态、在哪里清理资源，能避免“结果看起来对，但偶尔重复、过期或无法取消”的问题。</p>`};export{e as default};