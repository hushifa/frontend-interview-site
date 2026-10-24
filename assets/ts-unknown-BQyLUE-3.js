var e={answerHtml:`<ul>
<li><code>any</code> 会绕过大量类型检查，适合迁移时的临时边界，但会削弱安全性。</li>
<li><code>unknown</code> 可以接收任意值，使用前必须做类型收窄，适合外部 JSON 等未知输入。</li>
<li><code>never</code> 表示不可能出现的值，常用于永不正常返回的函数和穷尽性检查。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">assertNever</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">never</span></span>): <span class="hljs-built_in">never</span> {
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未预期的值： <span class="hljs-subst">\${value}</span>\`</span>);
}
</code></pre></div>
<p>类型声明不会验证运行时数据。即使把接口响应断言为某个类型，仍需要在不可信边界进行实际校验。</p>
<h3>类型与运行时边界</h3>
<p>TypeScript 的类型检查发生在编译期，运行时仍然执行生成的 JavaScript；类型声明不会自动校验接口返回值、用户输入或第三方数据。回答类型题时应明确哪些保证来自编译器，哪些需要运行时校验或测试补上。</p>
<p>公共类型还要考虑调用方的错误提示、类型推导速度、模块发布方式和版本兼容。复杂类型可以用类型测试验证，但不要为了表达一个简单约束引入难以维护的递归类型。</p>`};export{e as default};