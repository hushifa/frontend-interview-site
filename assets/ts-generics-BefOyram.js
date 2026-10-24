var e={answerHtml:`<p>泛型用类型参数表达输入与输出的关系，避免把类型信息丢失为 <code>any</code>。约束用于说明类型参数至少需要满足的条件。</p>
<div class="not-prose code-block"><div class="code-language">TypeScript</div><pre><code class="hljs language-ts"><span class="hljs-keyword">function</span> getProperty&lt;T, K <span class="hljs-keyword">extends</span> keyof T&gt;(<span class="hljs-attr">obj</span>: T, <span class="hljs-attr">key</span>: K): T[K] {
  <span class="hljs-keyword">return</span> obj[key];
}
<span class="hljs-keyword">const</span> user = { <span class="hljs-attr">name</span>: <span class="hljs-string">&quot;Lin&quot;</span>, <span class="hljs-attr">age</span>: <span class="hljs-number">24</span> };
<span class="hljs-title function_">getProperty</span>(user, <span class="hljs-string">&quot;age&quot;</span>); <span class="hljs-comment">// 返回值类型为 number</span>
<span class="hljs-comment">// getProperty(user, &quot;missing&quot;); // 类型错误</span>
</code></pre></div>
<p>设计泛型时，应让类型参数对应真实的类型关系。只有一次使用、无法表达关系的泛型，可能可以简化为具体类型或 <code>unknown</code>。</p>
<h3>复习提示</h3>
<p>回答时区分编译期类型检查与运行时 JavaScript 行为。类型体操或配置项要说明适用边界，公共类型还要关注错误提示、编译耗时和不同 TypeScript 版本的差异。建议用一个最小示例验证“泛型、keyof、约束”，再比较正常路径、失败路径和目标运行环境的差异。</p>`};export{e as default};