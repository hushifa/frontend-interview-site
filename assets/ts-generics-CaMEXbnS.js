var e={answerHtml:`<p>泛型用类型参数表达输入与输出的关系，避免把类型信息丢失为 <code>any</code>。约束用于说明类型参数至少需要满足的条件。</p>
<p>TypeScript 的类型检查发生在编译期，运行时仍然执行生成的 JavaScript；类型声明不会自动校验接口返回值、用户输入或第三方数据。回答类型题时应明确哪些保证来自编译器，哪些需要运行时校验或测试补上。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> getProperty&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt;(<span class="hljs-attr">obj</span>: T, <span class="hljs-attr">key</span>: K): T[K] {
  <span class="hljs-keyword">return</span> obj[key];
}
<span class="hljs-keyword">const</span> user = { <span class="hljs-attr">name</span>: <span class="hljs-string">&quot;Lin&quot;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">24</span> };
<span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&quot;age&quot;</span>); <span class="hljs-comment">// 返回值类型为 number</span>
<span class="hljs-comment">// getProperty(user, &quot;missing&quot;); // 类型错误</span>
</code></pre></div>
<p>设计泛型时，应让类型参数对应真实的类型关系。只有一次使用、无法表达关系的泛型，可能可以简化为具体类型或 <code>unknown</code>。</p>
<p>公共类型还要考虑调用方的错误提示、类型推导速度、模块发布方式和版本兼容。复杂类型可以用类型测试验证，但不要为了表达一个简单约束引入难以维护的递归类型。</p>
<p>在实际项目中，类型最容易在接口边界失效：后端返回、localStorage、URL 参数和第三方库都不是编译器可以直接信任的输入。把类型声明、运行时校验和错误处理放在同一条数据流上，类型才真正能降低维护成本。</p>`};export{e as default};