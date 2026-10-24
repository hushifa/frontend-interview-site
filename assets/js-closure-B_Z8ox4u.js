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
<h3>复习提示</h3>
<p>回答时先把同步执行、异步执行和数据变更分开，再用最小示例验证结果。需要比较方案时说明副作用、可读性和运行成本，不为了使用某个 API 牺牲代码清晰度。建议用一个最小示例验证“作用域、闭包、内存”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};