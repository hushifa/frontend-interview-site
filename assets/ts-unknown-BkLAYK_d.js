var e={answerHtml:`<ul>
<li><code>any</code> 会绕过大量类型检查，适合迁移时的临时边界，但会削弱安全性。</li>
<li><code>unknown</code> 可以接收任意值，使用前必须做类型收窄，适合外部 JSON 等未知输入。</li>
<li><code>never</code> 表示不可能出现的值，常用于永不正常返回的函数和穷尽性检查。</li>
</ul>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">assertNever</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">never</span></span>): <span class="hljs-built_in">never</span> {
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未预期的值： <span class="hljs-subst">\${value}</span>\`</span>);
}
</code></pre></div>
<p>类型声明不会验证运行时数据。即使把接口响应断言为某个类型，仍需要在不可信边界进行实际校验。</p>`};export{e as default};