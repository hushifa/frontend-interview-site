var e={answerHtml:`<p><code>any</code>、<code>unknown</code> 和 <code>never</code> 都能出现在“类型很宽”或“类型很窄”的位置，但含义完全不同。<code>any</code> 相当于告诉编译器暂时不要检查，后续访问属性、调用方法和赋值都很容易把错误带到运行时；它适合迁移旧代码的临时边界，不适合当作接口的长期类型。</p>
<p><code>unknown</code> 表示“值存在，但现在还不知道它是什么”。它可以接收任意值，却不能直接读取属性或调用方法，必须先通过 <code>typeof</code>、<code>instanceof</code>、<code>in</code> 或自定义类型守卫收窄。接口响应、<code>JSON.parse</code>、<code>localStorage</code> 和用户输入都更适合从 <code>unknown</code> 开始处理。</p>
<p><code>never</code> 表示不可能得到一个正常值。一个总是抛出异常或永不结束的函数可以返回 <code>never</code>；在判别联合的 <code>switch</code> 中，它还能帮助检查是否漏掉了新的分支。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> <span class="hljs-title function_">assertNever</span>(<span class="hljs-params"><span class="hljs-attr">value</span>: <span class="hljs-built_in">never</span></span>): <span class="hljs-built_in">never</span> {
  <span class="hljs-keyword">throw</span> <span class="hljs-keyword">new</span> <span class="hljs-title class_">Error</span>(<span class="hljs-string">\`未预期的值： <span class="hljs-subst">\${value}</span>\`</span>);
}
</code></pre></div>
<p><code>assertNever</code> 一般放在所有已知分支之后：当联合类型增加了一个新成员，而 <code>switch</code> 没有处理它时，传入的值就不再是 <code>never</code>，编译器会在这里报错。这样检查的是代码分支是否完整，不是对运行时数据做验证。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">type</span> <span class="hljs-title class_">Result</span> = { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;ok&#x27;</span>; <span class="hljs-attr">value</span>: <span class="hljs-built_in">string</span> } | { <span class="hljs-attr">kind</span>: <span class="hljs-string">&#x27;error&#x27;</span>; <span class="hljs-attr">message</span>: <span class="hljs-built_in">string</span> };

<span class="hljs-keyword">function</span> <span class="hljs-title function_">read</span>(<span class="hljs-params"><span class="hljs-attr">result</span>: <span class="hljs-title class_">Result</span></span>) {
  <span class="hljs-keyword">switch</span> (result.<span class="hljs-property">kind</span>) {
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;ok&#x27;</span>:
      <span class="hljs-keyword">return</span> result.<span class="hljs-property">value</span>;
    <span class="hljs-keyword">case</span> <span class="hljs-string">&#x27;error&#x27;</span>:
      <span class="hljs-keyword">return</span> result.<span class="hljs-property">message</span>;
    <span class="hljs-attr">default</span>:
      <span class="hljs-keyword">return</span> <span class="hljs-title function_">assertNever</span>(result);
  }
}
</code></pre></div>
<p>类型声明不会改变运行时数据。即使写了 <code>value as User</code>，接口返回的字段仍可能缺失、类型错误或被恶意修改；真正的边界需要运行时校验。公共类型还要考虑调用方的错误提示、类型推导速度、模块发布方式和版本兼容，不要为了消除一个简单报错引入难以维护的类型技巧。 <code>any</code> 可以作为明确标记的临时逃生口，但应尽快把边界收窄回 <code>unknown</code> 或具体类型。</p>`};export{e as default};